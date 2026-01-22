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

const dynamicImport = new Function(
	'modulePath',
	'return import(modulePath)'
) as (modulePath: string) => Promise<any>

type NodeCanvasBackend = Readonly<{
	ctx: any
	dpr: number
	pixelWidth: number
	pixelHeight: number
	toPng(): Promise<Uint8Array>
}>

type CreateNodeCanvas = (options: {
	width: number
	height: number
	dpr?: number
	clearColor?: string
}) => Promise<NodeCanvasBackend>

export type WeaveNodeAppOptions = Readonly<{
	width: number
	height: number
	dpr?: number
	clearColor?: string
	scene?: SceneNode
}>

export type WeaveNodeApp = Readonly<{
	kind: 'node'
	setScene(scene: SceneNode): void
	applyPatches(patches: readonly ScenePatch[]): void
	renderToPng(): Promise<Uint8Array>
	dispose(): void
}>

const toCanvasFont = (style: TextStyle): string => {
	const fontStyle = style.fontStyle ?? 'normal'
	const fontWeight = style.fontWeight ?? 'normal'
	const fontSize = `${style.fontSize}px`
	const fontFamily = style.fontFamily ?? 'sans-serif'
	return `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`
}

const measureLineWidth = (
	ctx2d: any,
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
	ctx2d: any,
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

const createTextMeasurer = (ctx2d: any): TextMeasurer => {
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

export function createWeaveApp(options: WeaveNodeAppOptions): WeaveNodeApp {
	let disposed = false
	let pendingScene: SceneNode | null = options.scene ?? null
	let pendingPatches: ScenePatch[] = []
	let enginePromise: Promise<Awaited<ReturnType<typeof createEngine>>> | null =
		null
	let canvasPromise: Promise<NodeCanvasBackend> | null = null
	let createNodeCanvasPromise: Promise<CreateNodeCanvas> | null = null

	const getCreateNodeCanvas = async (): Promise<CreateNodeCanvas> => {
		if (!createNodeCanvasPromise) {
			createNodeCanvasPromise = dynamicImport(
				'@jiujue/weave-adapter-node'
			).then(mod => mod.createNodeCanvas as CreateNodeCanvas)
		}
		return createNodeCanvasPromise
	}

	const ensure = async () => {
		if (disposed) throw new Error('Weave app disposed')
		if (!canvasPromise) {
			const createNodeCanvas = await getCreateNodeCanvas()
			canvasPromise = createNodeCanvas({
				width: options.width,
				height: options.height,
				dpr: options.dpr,
				clearColor: options.clearColor
			})
		}
		const backend = await canvasPromise
		if (!enginePromise)
			enginePromise = createEngine({
				textMeasurer: createTextMeasurer(backend.ctx)
			})
		const engine = await enginePromise

		if (pendingScene) {
			engine.setRoot(pendingScene)
			pendingScene = null
			pendingPatches = []
		}
		if (pendingPatches.length) {
			engine.applyPatches(pendingPatches)
			pendingPatches = []
		}

		return { engine, backend }
	}

	const clear = (
		ctx2d: any,
		pixelWidth: number,
		pixelHeight: number,
		color: string
	) => {
		ctx2d.save()
		if (typeof ctx2d.setTransform === 'function')
			ctx2d.setTransform(1, 0, 0, 1, 0, 0)
		ctx2d.globalAlpha = 1
		ctx2d.fillStyle = color
		ctx2d.fillRect(0, 0, pixelWidth, pixelHeight)
		ctx2d.restore()
	}

	return {
		kind: 'node',
		setScene(scene) {
			pendingScene = scene
		},
		applyPatches(patches) {
			pendingPatches.push(...patches)
		},
		async renderToPng() {
			const { engine, backend } = await ensure()
			const displayList = engine.render({
				width: options.width,
				height: options.height
			})
			clear(
				backend.ctx,
				backend.pixelWidth,
				backend.pixelHeight,
				options.clearColor ?? '#000000'
			)
			replayDisplayList(backend.ctx, displayList, { dpr: backend.dpr })
			return backend.toPng()
		},
		dispose() {
			disposed = true
		}
	}
}
