import type {
	Context2DLike,
	FillStyle,
	PathCmd,
	Rect,
	StrokeStyle,
	TextStyle,
} from '@jiujue/weave-types'

export type DrawOp =
	| Readonly<{ op: 'save' }>
	| Readonly<{ op: 'restore' }>
	| Readonly<{ op: 'translate'; x: number; y: number }>
	| Readonly<{ op: 'clipRect'; rect: Rect }>
	| Readonly<{ op: 'fillRect'; rect: Rect; style: FillStyle }>
	| Readonly<{ op: 'strokeRect'; rect: Rect; style: StrokeStyle }>
	| Readonly<{
			op: 'drawText'
			text: string
			x: number
			y: number
			style: TextStyle
	  }>
	| Readonly<{
			op: 'drawPath'
			path: readonly PathCmd[]
			fill?: FillStyle
			stroke?: StrokeStyle
	  }>

export type DisplayList = readonly DrawOp[]

export type ReplayOptions = Readonly<{
	dpr?: number
	scale?: number
}>

export function serializeDisplayList(displayList: DisplayList): string {
	return JSON.stringify(displayList)
}

export function deserializeDisplayList(json: string): DisplayList {
	return JSON.parse(json) as DisplayList
}

function applyFillStyle(ctx: Context2DLike, style: FillStyle): void {
	ctx.globalAlpha = style.alpha ?? 1
	ctx.fillStyle = style.color
}

function applyStrokeStyle(ctx: Context2DLike, style: StrokeStyle): void {
	ctx.globalAlpha = style.alpha ?? 1
	ctx.strokeStyle = style.color
	ctx.lineWidth = style.width
}

function toCanvasFont(style: TextStyle): string {
	const fontStyle = style.fontStyle ?? 'normal'
	const fontWeight = style.fontWeight ?? 'normal'
	const fontSize = `${style.fontSize}px`
	const fontFamily = style.fontFamily ?? 'sans-serif'
	return `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`
}

function applyTextStyle(ctx: Context2DLike, style: TextStyle): void {
	ctx.globalAlpha = style.alpha ?? 1
	ctx.fillStyle = style.color
	ctx.font = toCanvasFont(style)
	ctx.textAlign = (style.textAlign ?? 'left') as CanvasTextAlign
	ctx.textBaseline = (style.textBaseline ?? 'alphabetic') as CanvasTextBaseline
}

export function replayDisplayList(
	ctx: Context2DLike,
	displayList: DisplayList,
	options?: ReplayOptions,
): void {
	const dpr = options?.dpr ?? 1
	const scale = options?.scale ?? 1
	ctx.save()
	if (typeof ctx.setTransform === 'function') {
		const s = dpr * scale
		if (s !== 1) ctx.setTransform(s, 0, 0, s, 0, 0)
	} else if (typeof ctx.scale === 'function') {
		if (dpr !== 1) ctx.scale(dpr, dpr)
		if (scale !== 1) ctx.scale(scale, scale)
	}

	for (const op of displayList) {
		switch (op.op) {
			case 'save':
				ctx.save()
				break
			case 'restore':
				ctx.restore()
				break
			case 'translate':
				ctx.translate(op.x, op.y)
				break
			case 'clipRect':
				ctx.beginPath()
				ctx.moveTo(op.rect.x, op.rect.y)
				ctx.lineTo(op.rect.x + op.rect.width, op.rect.y)
				ctx.lineTo(op.rect.x + op.rect.width, op.rect.y + op.rect.height)
				ctx.lineTo(op.rect.x, op.rect.y + op.rect.height)
				ctx.closePath()
				ctx.clip()
				break
			case 'fillRect':
				applyFillStyle(ctx, op.style)
				ctx.fillRect(op.rect.x, op.rect.y, op.rect.width, op.rect.height)
				break
			case 'strokeRect':
				applyStrokeStyle(ctx, op.style)
				ctx.strokeRect(op.rect.x, op.rect.y, op.rect.width, op.rect.height)
				break
			case 'drawText':
				applyTextStyle(ctx, op.style)
				ctx.fillText(op.text, op.x, op.y)
				break
			case 'drawPath': {
				ctx.beginPath()
				for (const cmd of op.path) {
					if (cmd.op === 'moveTo') ctx.moveTo(cmd.x, cmd.y)
					else if (cmd.op === 'lineTo') ctx.lineTo(cmd.x, cmd.y)
					else ctx.closePath()
				}
				if (op.fill) {
					applyFillStyle(ctx, op.fill)
					ctx.fill()
				}
				if (op.stroke) {
					applyStrokeStyle(ctx, op.stroke)
					ctx.stroke()
				}
				break
			}
			default: {
				const _exhaustive: never = op
				throw new Error(`Unknown op: ${(op as { op: string }).op}`)
			}
		}
	}

	ctx.restore()
}
