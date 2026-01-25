import { replayDisplayList } from '@jiujue/weave-displaylist'
import type { DisplayList } from '@jiujue/weave-displaylist'

export type NodeRenderOptions = Readonly<{
	width: number
	height: number
	dpr?: number
	clearColor?: string
}>

type CanvasFactory = (width: number, height: number) => any

async function loadCanvasFactory(): Promise<CanvasFactory> {
	try {
		const mod = await import('@napi-rs/canvas')
		const createCanvas = (mod as any).createCanvas as CanvasFactory | undefined
		if (typeof createCanvas === 'function') return createCanvas
	} catch {}

	const mod = await import('canvas')
	const createCanvas = (mod as any).createCanvas as CanvasFactory | undefined
	if (typeof createCanvas === 'function') return createCanvas
	throw new Error('No supported canvas backend found. Install @napi-rs/canvas or canvas.')
}

export type NodeCanvasBackend = Readonly<{
	canvas: any
	ctx: any
	dpr: number
	pixelWidth: number
	pixelHeight: number
	toPng(): Promise<Uint8Array>
}>

export async function createNodeCanvas(options: NodeRenderOptions): Promise<NodeCanvasBackend> {
	const dpr = options.dpr ?? 1
	const pixelWidth = Math.max(1, Math.floor(options.width * dpr))
	const pixelHeight = Math.max(1, Math.floor(options.height * dpr))

	const createCanvas = await loadCanvasFactory()
	const canvas = createCanvas(pixelWidth, pixelHeight)
	const ctx = canvas.getContext('2d')

	const toPng = async (): Promise<Uint8Array> => {
		if (typeof canvas.toBuffer === 'function') {
			return canvas.toBuffer('image/png') as Uint8Array
		}
		if (typeof canvas.encode === 'function') {
			return (await canvas.encode('png')) as Uint8Array
		}
		throw new Error('Canvas backend does not support PNG export.')
	}

	return { canvas, ctx, dpr, pixelWidth, pixelHeight, toPng }
}

export async function renderDisplayListToPng(
	displayList: DisplayList,
	options: NodeRenderOptions,
): Promise<Uint8Array> {
	const backend = await createNodeCanvas(options)
	const { ctx, pixelWidth, pixelHeight, dpr } = backend

	ctx.save()
	if (typeof ctx.setTransform === 'function') ctx.setTransform(1, 0, 0, 1, 0, 0)
	ctx.globalAlpha = 1
	ctx.fillStyle = options.clearColor ?? '#000000'
	ctx.fillRect(0, 0, pixelWidth, pixelHeight)
	ctx.restore()

	replayDisplayList(ctx, displayList, { dpr })
	return backend.toPng()
}
