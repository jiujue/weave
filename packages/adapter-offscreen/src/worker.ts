import { createEngine } from '@jiujue/weave-core'
import { replayDisplayList } from '@jiujue/weave-displaylist'
import type {
	SceneNode,
	ScenePatch,
	TextMeasureInput,
	TextMeasureOutput,
	TextMeasurer,
	TextStyle
} from '@jiujue/weave-types'
import type { WeaveWorkerToWorkerMessage } from './index.js'

type ReadyState = 'INIT' | 'READY' | 'DISPOSED'

let state: ReadyState = 'INIT'
let canvas: OffscreenCanvas | null = null
let ctx: OffscreenCanvasRenderingContext2D | null = null
let width = 0
let height = 0
let dpr = 1
let scale = 1
let clearColor = '#000000'
let pendingRender = false

const toCanvasFont = (style: TextStyle): string => {
	const fontStyle = style.fontStyle ?? 'normal'
	const fontWeight = style.fontWeight ?? 'normal'
	const fontSize = `${style.fontSize}px`
	const fontFamily = style.fontFamily ?? 'sans-serif'
	return `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`
}

const measureLineWidth = (
	ctx2d: OffscreenCanvasRenderingContext2D,
	text: string,
	style: TextStyle
): number => {
	ctx2d.font = toCanvasFont(style)
	const base = ctx2d.measureText(text).width
	const letterSpacing = style.letterSpacing ?? 0
	if (!letterSpacing) return base
	const count = Math.max(0, text.length - 1)
	return base + count * letterSpacing
}

const breakLines = (
	ctx2d: OffscreenCanvasRenderingContext2D,
	input: TextMeasureInput
): { lines: { text: string; width: number }[]; maxWidth: number } => {
	const { text, style, maxWidth } = input
	const whiteSpace = style.whiteSpace ?? 'nowrap'
	if (whiteSpace === 'nowrap' || maxWidth == null) {
		const w = measureLineWidth(ctx2d, text, style)
		return { lines: [{ text, width: w }], maxWidth: w }
	}

	const lines: { text: string; width: number }[] = []
	let current = ''
	let currentWidth = 0
	let maxLine = 0

	const pushLine = () => {
		const lineText = current
		const w = currentWidth
		lines.push({ text: lineText, width: w })
		if (w > maxLine) maxLine = w
		current = ''
		currentWidth = 0
	}

	for (let i = 0; i < text.length; i++) {
		const ch = text[i]
		if (ch === '\n') {
			pushLine()
			continue
		}

		const nextText = current + ch
		const nextWidth = measureLineWidth(ctx2d, nextText, style)
		if (nextWidth <= maxWidth || current.length === 0) {
			current = nextText
			currentWidth = nextWidth
			continue
		}

		pushLine()
		current = ch
		currentWidth = measureLineWidth(ctx2d, current, style)
	}

	pushLine()
	return { lines, maxWidth: maxLine }
}

const createTextMeasurer = (
	ctx2d: OffscreenCanvasRenderingContext2D
): TextMeasurer => {
	return {
		measure(input): TextMeasureOutput {
			const lineHeight =
				input.style.lineHeight ?? Math.ceil(input.style.fontSize * 1.2)
			const { lines, maxWidth } = breakLines(ctx2d, input)
			return {
				width: maxWidth,
				height: lines.length * lineHeight,
				lines,
				lineHeight
			}
		}
	}
}

let enginePromise: ReturnType<typeof createEngine> | null = null
let pendingPatches: ScenePatch[] = []
let pendingScene: SceneNode | null = null

const ensureEngine = async (): Promise<
	Awaited<ReturnType<typeof createEngine>>
> => {
	if (!ctx) throw new Error('Missing 2D context')
	// TextMeasurer 在 worker 内由真实 2D ctx 实现；core 只依赖接口，不绑定具体平台。
	if (!enginePromise)
		enginePromise = createEngine({ textMeasurer: createTextMeasurer(ctx) })
	return enginePromise
}

const resizeCanvas = () => {
	if (!canvas) return
	canvas.width = Math.max(1, Math.floor(width * dpr))
	canvas.height = Math.max(1, Math.floor(height * dpr))
}

const clear = () => {
	if (!ctx || !canvas) return
	if (typeof (ctx as any).setTransform === 'function')
		(ctx as any).setTransform(1, 0, 0, 1, 0, 0)
	ctx.globalAlpha = 1
	ctx.fillStyle = clearColor
	ctx.fillRect(0, 0, canvas.width, canvas.height)
}

const render = async () => {
	const engine = await ensureEngine()

	if (pendingScene) {
		// setRoot 会替换整棵 scene tree；发生时丢弃未应用的 patches，避免顺序歧义。
		engine.setRoot(pendingScene)
		pendingScene = null
		pendingPatches = []
	}

	if (pendingPatches.length) {
		engine.applyPatches(pendingPatches)
		pendingPatches = []
	}

	const displayList = engine.render({ width, height })
	clear()
	// DPR 在 replay 阶段统一处理：engine/render 只输出逻辑像素坐标的 DisplayList。
	replayDisplayList(ctx as any, displayList, { dpr, scale })
}

self.onmessage = async (event: MessageEvent<WeaveWorkerToWorkerMessage>) => {
	const msg = event.data
	try {
		if (msg.type === 'WEAVE_INIT') {
			if (state !== 'INIT') return
			canvas = msg.canvas
			width = msg.width
			height = msg.height
			dpr = msg.dpr
			scale = msg.scale ?? 1
			clearColor = msg.clearColor ?? clearColor
			ctx = canvas.getContext('2d')
			if (!ctx) throw new Error('Failed to get 2D context from OffscreenCanvas')
			resizeCanvas()
			await ensureEngine()
			if (msg.scene) pendingScene = msg.scene
			state = 'READY'
			self.postMessage({ type: 'WEAVE_READY' })
			if (pendingRender) {
				pendingRender = false
				await render()
			}
			return
		}

		if (msg.type === 'WEAVE_DISPOSE') {
			state = 'DISPOSED'
			return
		}

		if (msg.type === 'WEAVE_PATCH') {
			pendingPatches.push(...msg.patches)
			return
		}

		if (msg.type === 'WEAVE_SET_SCENE') {
			pendingScene = msg.scene
			return
		}

		if (msg.type === 'WEAVE_SET_CLEAR_COLOR') {
			clearColor = msg.color
			return
		}

		if (msg.type === 'WEAVE_RESIZE') {
			width = msg.width
			height = msg.height
			dpr = msg.dpr
			scale = msg.scale ?? scale
			resizeCanvas()
			return
		}

		if (msg.type === 'WEAVE_RENDER') {
			if (state !== 'READY') {
				pendingRender = true
				return
			}
			await render()
			return
		}

		if (msg.type === 'WEAVE_HIT_TEST') {
			const engine = await ensureEngine()
			// 如果有 pending updates，先应用以确保 hitTest 准确
			if (pendingScene) {
				engine.setRoot(pendingScene)
				pendingScene = null
				pendingPatches = []
			}
			if (pendingPatches.length) {
				engine.applyPatches(pendingPatches)
				pendingPatches = []
			}

			// 确保 layout 数据是最新的 (hitTest 依赖 layout frames)
			engine.layout({ width, height })

			const result = engine.hitTest({ x: msg.x, y: msg.y })
			self.postMessage({
				type: 'WEAVE_HIT_TEST_RESULT',
				requestId: msg.requestId,
				result
			})
			return
		}

		if (msg.type === 'WEAVE_GET_NODE_INFO') {
			const engine = await ensureEngine()
			// 确保 layout 是最新的
			// 注意：这里假设 render 循环会定期调用 layout，或者之前的操作已经触发了 layout。
			// 如果没有，可能需要先调用 layout。为了保险，如果 dirty 可以重新 layout。
			// 但 layout 需要宽高约束，这里暂时假设上一帧的 layout 结果是有效的。
			// 如果必须要最新，可以使用上次的 width/height。
			engine.layout({ width, height })

			const result = engine.getNodeInfo(msg.nodeId)
			self.postMessage({
				type: 'WEAVE_GET_NODE_INFO_RESULT',
				requestId: msg.requestId,
				result
			})
			return
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)
		self.postMessage({ type: 'WEAVE_ERROR', message })
	}
}
