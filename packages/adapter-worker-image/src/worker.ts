import { createEngine } from '@jiujue/weave-core'
import { replayDisplayList } from '@jiujue/weave-displaylist'
import type {
	SceneNode,
	ScenePatch,
	TextMeasureInput,
	TextMeasureOutput,
	TextMeasurer,
	TextStyle,
} from '@jiujue/weave-types'
import type { WeaveImageWorkerToMainMessage, WeaveImageWorkerToWorkerMessage } from './index.js'

type ReadyState = 'INIT' | 'READY' | 'DISPOSED'

let state: ReadyState = 'INIT'
let canvas: OffscreenCanvas | null = null
let ctx: OffscreenCanvasRenderingContext2D | null = null
let width = 0
let height = 0
let dpr = 1
let clearColor = '#000000'
let pendingRenderRequestId: number | null = null

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
	style: TextStyle,
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
	input: TextMeasureInput,
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

const createTextMeasurer = (ctx2d: OffscreenCanvasRenderingContext2D): TextMeasurer => {
	return {
		measure(input): TextMeasureOutput {
			const lineHeight = input.style.lineHeight ?? Math.ceil(input.style.fontSize * 1.2)
			const { lines, maxWidth } = breakLines(ctx2d, input)
			return {
				width: maxWidth,
				height: lines.length * lineHeight,
				lines,
				lineHeight,
			}
		},
	}
}

let enginePromise: ReturnType<typeof createEngine> | null = null
let pendingPatches: ScenePatch[] = []
let pendingScene: SceneNode | null = null

const ensureEngine = async (): Promise<Awaited<ReturnType<typeof createEngine>>> => {
	if (!ctx) throw new Error('Missing 2D context')
	if (!enginePromise) enginePromise = createEngine({ textMeasurer: createTextMeasurer(ctx) })
	return enginePromise
}

const resizeCanvas = () => {
	if (!canvas) return
	canvas.width = Math.max(1, Math.floor(width * dpr))
	canvas.height = Math.max(1, Math.floor(height * dpr))
}

const clear = () => {
	if (!ctx || !canvas) return
	if (typeof (ctx as any).setTransform === 'function') {
		;(ctx as any).setTransform(1, 0, 0, 1, 0, 0)
	}
	ctx.globalAlpha = 1
	ctx.fillStyle = clearColor
	ctx.fillRect(0, 0, canvas.width, canvas.height)
}

const renderToPng = async (): Promise<ArrayBuffer> => {
	const engine = await ensureEngine()

	if (pendingScene) {
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
	replayDisplayList(ctx as any, displayList, { dpr })

	const blob = await canvas!.convertToBlob({ type: 'image/png' })
	return blob.arrayBuffer()
}

self.onmessage = async (event: MessageEvent<WeaveImageWorkerToWorkerMessage>) => {
	const msg = event.data
	try {
		if (msg.type === 'WEAVE_IMAGE_INIT') {
			if (state !== 'INIT') return
			width = msg.width
			height = msg.height
			dpr = msg.dpr
			clearColor = msg.clearColor ?? clearColor
			canvas = new OffscreenCanvas(Math.max(1, width), Math.max(1, height))
			ctx = canvas.getContext('2d')
			if (!ctx) throw new Error('Failed to get 2D context from OffscreenCanvas')
			resizeCanvas()
			await ensureEngine()
			if (msg.scene) pendingScene = msg.scene
			state = 'READY'
			;(self as any).postMessage({
				type: 'WEAVE_IMAGE_READY',
			} satisfies WeaveImageWorkerToMainMessage)
			if (pendingRenderRequestId != null) {
				const requestId = pendingRenderRequestId
				pendingRenderRequestId = null
				const data = await renderToPng()
				;(self as any).postMessage(
					{
						type: 'WEAVE_IMAGE_RESULT',
						requestId,
						width,
						height,
						mime: 'image/png',
						data,
					} satisfies WeaveImageWorkerToMainMessage,
					[data],
				)
			}
			return
		}

		if (msg.type === 'WEAVE_IMAGE_DISPOSE') {
			state = 'DISPOSED'
			return
		}

		if (msg.type === 'WEAVE_IMAGE_PATCH') {
			pendingPatches.push(...msg.patches)
			return
		}

		if (msg.type === 'WEAVE_IMAGE_SET_SCENE') {
			pendingScene = msg.scene
			return
		}

		if (msg.type === 'WEAVE_IMAGE_RESIZE') {
			width = msg.width
			height = msg.height
			dpr = msg.dpr
			resizeCanvas()
			return
		}

		if (msg.type === 'WEAVE_IMAGE_RENDER') {
			if (state !== 'READY') {
				pendingRenderRequestId = msg.requestId
				return
			}
			const data = await renderToPng()
			;(self as any).postMessage(
				{
					type: 'WEAVE_IMAGE_RESULT',
					requestId: msg.requestId,
					width,
					height,
					mime: 'image/png',
					data,
				} satisfies WeaveImageWorkerToMainMessage,
				[data],
			)
			return
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)
		;(self as any).postMessage({
			type: 'WEAVE_IMAGE_ERROR',
			message,
		} satisfies WeaveImageWorkerToMainMessage)
	}
}
