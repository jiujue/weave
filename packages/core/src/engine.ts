import { replayDisplayList } from '@jiujue/weave-displaylist'
import type { DisplayList } from '@jiujue/weave-displaylist'
import type {
	Context2DLike,
	FillStyle,
	LayoutFrame,
	LayoutStyle,
	PolygonNode,
	SceneNode,
	ScenePatch,
	StrokeStyle,
	TableColumn,
	TableHeaderGroup,
	TableNode,
	TableRow,
	TableStyle,
	TextMeasureOutput,
	TextMeasurer,
	TextNode,
	TextStyle
} from '@jiujue/weave-types'
import { loadYoga } from 'yoga-layout/load'

type Yoga = any

type NodeRecord = {
	node: SceneNode
	parentId: string | null
	children: string[]
}

type LayoutRecord = {
	yogaNode: any
	dirtyStyle: boolean
	dirtyMeasure: boolean
	measureResult?: { width: number; height: number }
}

export type LayoutConstraints = Readonly<{
	width: number
	height: number
}>

export type EngineCreateOptions = Readonly<{
	root?: SceneNode
	textMeasurer: TextMeasurer
	textMeasureCacheSize?: number
}>

export type Engine = Readonly<{
	applyPatches(patches: readonly ScenePatch[]): void
	setRoot(root: SceneNode): void
	layout(constraints: LayoutConstraints): readonly LayoutFrame[]
	paint(): DisplayList
	render(constraints: LayoutConstraints): DisplayList
	replay(ctx: Context2DLike, options?: { dpr?: number }): void
	getScrollMetrics(id: string): ScrollMetrics | null
	hitTest(point: { x: number; y: number }): {
		id: string | null
		path: readonly string[]
	}
	getNodeInfo(
		id: string
	): { x: number; y: number; width: number; height: number } | null
	dispose(): void
}>

type TextMeasureCacheKey = string

export type ScrollMetrics = Readonly<{
	viewportWidth: number
	viewportHeight: number
	contentWidth: number
	contentHeight: number
	scrollX: number
	scrollY: number
	maxScrollX: number
	maxScrollY: number
}>

class TextMeasureCache {
	private readonly maxSize: number
	private readonly map = new Map<TextMeasureCacheKey, TextMeasureOutput>()

	constructor(maxSize: number) {
		this.maxSize = maxSize
	}

	get(key: TextMeasureCacheKey): TextMeasureOutput | undefined {
		const value = this.map.get(key)
		if (!value) return undefined
		this.map.delete(key)
		this.map.set(key, value)
		return value
	}

	set(key: TextMeasureCacheKey, value: TextMeasureOutput): void {
		if (this.map.has(key)) this.map.delete(key)
		this.map.set(key, value)
		if (this.map.size <= this.maxSize) return
		const firstKey = this.map.keys().next().value as
			| TextMeasureCacheKey
			| undefined
		if (firstKey) this.map.delete(firstKey)
	}
}

function normalizeChildren(node: SceneNode): SceneNode[] {
	if ('children' in node && Array.isArray((node as any).children))
		return [...((node as any).children as SceneNode[])]
	return []
}

function cloneNodeWithChildren(
	node: SceneNode,
	children: SceneNode[]
): SceneNode {
	if (node.type === 'container') return { ...node, children }
	if (node.type === 'relative') return { ...node, children }
	if (node.type === 'text') return { ...node, children }
	if (node.type === 'polygon') return { ...node, children }
	return node
}

function createDefaultRoot(): SceneNode {
	return { id: 'root', type: 'container', children: [] }
}

function makeTextCacheKey(
	text: string,
	style: TextStyle,
	maxWidth?: number
): string {
	return [
		text,
		style.fontFamily ?? '',
		style.fontSize,
		style.fontWeight ?? '',
		style.fontStyle ?? '',
		style.letterSpacing ?? '',
		style.lineHeight ?? '',
		style.whiteSpace ?? '',
		maxWidth ?? ''
	].join('|')
}

function applyLayoutStyle(
	Yoga: Yoga,
	yogaNode: any,
	style: LayoutStyle | undefined
): void {
	yogaNode.setFlexDirection(
		style?.flexDirection === 'row'
			? Yoga.FLEX_DIRECTION_ROW
			: style?.flexDirection === 'row-reverse'
				? Yoga.FLEX_DIRECTION_ROW_REVERSE
				: style?.flexDirection === 'column-reverse'
					? Yoga.FLEX_DIRECTION_COLUMN_REVERSE
					: Yoga.FLEX_DIRECTION_COLUMN
	)

	yogaNode.setJustifyContent(
		style?.justifyContent === 'center'
			? Yoga.JUSTIFY_CENTER
			: style?.justifyContent === 'flex-end'
				? Yoga.JUSTIFY_FLEX_END
				: style?.justifyContent === 'space-between'
					? Yoga.JUSTIFY_SPACE_BETWEEN
					: style?.justifyContent === 'space-around'
						? Yoga.JUSTIFY_SPACE_AROUND
						: style?.justifyContent === 'space-evenly'
							? Yoga.JUSTIFY_SPACE_EVENLY
							: Yoga.JUSTIFY_FLEX_START
	)

	yogaNode.setAlignItems(
		style?.alignItems === 'center'
			? Yoga.ALIGN_CENTER
			: style?.alignItems === 'flex-end'
				? Yoga.ALIGN_FLEX_END
				: style?.alignItems === 'baseline'
					? Yoga.ALIGN_BASELINE
					: style?.alignItems === 'flex-start'
						? Yoga.ALIGN_FLEX_START
						: Yoga.ALIGN_STRETCH
	)

	yogaNode.setFlexWrap(
		style?.flexWrap === 'wrap'
			? Yoga.WRAP_WRAP
			: style?.flexWrap === 'wrap-reverse'
				? Yoga.WRAP_WRAP_REVERSE
				: Yoga.WRAP_NO_WRAP
	)

	if (style?.flex != null) yogaNode.setFlex(style.flex)
	if (style?.flexGrow != null) yogaNode.setFlexGrow(style.flexGrow)
	if (style?.flexShrink != null) yogaNode.setFlexShrink(style.flexShrink)

	if (style?.flexBasis != null) {
		if (typeof style.flexBasis === 'string' && style.flexBasis.endsWith('%')) {
			yogaNode.setFlexBasisPercent(parseFloat(style.flexBasis))
		} else {
			yogaNode.setFlexBasis(style.flexBasis)
		}
	}

	const setDim = (
		method: string,
		val: number | string | undefined,
		autoMethod: string
	) => {
		if (val != null) {
			if (typeof val === 'string' && val.endsWith('%')) {
				yogaNode[method + 'Percent'](parseFloat(val))
			} else {
				yogaNode[method](val)
			}
		} else {
			yogaNode[autoMethod]()
		}
	}

	setDim('setWidth', style?.width, 'setWidthAuto')
	setDim('setHeight', style?.height, 'setHeightAuto')

	const setMinMax = (method: string, val: number | string | undefined) => {
		if (val != null) {
			if (typeof val === 'string' && val.endsWith('%')) {
				yogaNode[method + 'Percent'](parseFloat(val))
			} else {
				yogaNode[method](val)
			}
		}
	}

	setMinMax('setMinWidth', style?.minWidth)
	setMinMax('setMinHeight', style?.minHeight)
	setMinMax('setMaxWidth', style?.maxWidth)
	setMinMax('setMaxHeight', style?.maxHeight)

	const setEdge = (
		method: string,
		edge: any,
		val: number | string | undefined,
		fallback?: number | string | undefined
	) => {
		const v = val ?? fallback
		if (v != null) {
			if (typeof v === 'string' && v.endsWith('%')) {
				yogaNode[method + 'Percent'](edge, parseFloat(v))
			} else {
				yogaNode[method](edge, v)
			}
		}
	}

	if (style?.padding != null) {
		setEdge('setPadding', Yoga.EDGE_ALL, style.padding)
	} else {
		setEdge(
			'setPadding',
			Yoga.EDGE_LEFT,
			style?.paddingLeft,
			style?.paddingHorizontal
		)
		setEdge(
			'setPadding',
			Yoga.EDGE_RIGHT,
			style?.paddingRight,
			style?.paddingHorizontal
		)
		setEdge(
			'setPadding',
			Yoga.EDGE_TOP,
			style?.paddingTop,
			style?.paddingVertical
		)
		setEdge(
			'setPadding',
			Yoga.EDGE_BOTTOM,
			style?.paddingBottom,
			style?.paddingVertical
		)
	}

	if (style?.margin != null) {
		setEdge('setMargin', Yoga.EDGE_ALL, style.margin)
	} else {
		setEdge(
			'setMargin',
			Yoga.EDGE_LEFT,
			style?.marginLeft,
			style?.marginHorizontal
		)
		setEdge(
			'setMargin',
			Yoga.EDGE_RIGHT,
			style?.marginRight,
			style?.marginHorizontal
		)
		setEdge('setMargin', Yoga.EDGE_TOP, style?.marginTop, style?.marginVertical)
		setEdge(
			'setMargin',
			Yoga.EDGE_BOTTOM,
			style?.marginBottom,
			style?.marginVertical
		)
	}

	yogaNode.setPositionType(
		style?.position === 'absolute'
			? Yoga.POSITION_TYPE_ABSOLUTE
			: Yoga.POSITION_TYPE_RELATIVE
	)
	setEdge('setPosition', Yoga.EDGE_LEFT, style?.left)
	setEdge('setPosition', Yoga.EDGE_RIGHT, style?.right)
	setEdge('setPosition', Yoga.EDGE_TOP, style?.top)
	setEdge('setPosition', Yoga.EDGE_BOTTOM, style?.bottom)

	const setGapIfSupported = (axis: 'row' | 'column', value?: number) => {
		const method = (yogaNode as any)[axis === 'row' ? 'setGap' : 'setGap']
		if (typeof method !== 'function') return
		const gapAxis =
			axis === 'row' ? (Yoga as any).GUTTER_ROW : (Yoga as any).GUTTER_COLUMN
		if (gapAxis == null) return
		if (value != null) method.call(yogaNode, gapAxis, value)
	}

	if (style?.gap != null) {
		setGapIfSupported('row', style.gap)
		setGapIfSupported('column', style.gap)
	} else {
		setGapIfSupported('row', style?.rowGap)
		setGapIfSupported('column', style?.columnGap)
	}
}

function computePolygonBounds(node: PolygonNode): Readonly<{
	width: number
	height: number
}> {
	let minX = Infinity
	let minY = Infinity
	let maxX = -Infinity
	let maxY = -Infinity
	for (const p of node.points) {
		if (p.x < minX) minX = p.x
		if (p.y < minY) minY = p.y
		if (p.x > maxX) maxX = p.x
		if (p.y > maxY) maxY = p.y
	}
	if (
		!Number.isFinite(minX) ||
		!Number.isFinite(minY) ||
		!Number.isFinite(maxX) ||
		!Number.isFinite(maxY)
	) {
		return { width: 0, height: 0 }
	}
	return { width: Math.max(0, maxX - minX), height: Math.max(0, maxY - minY) }
}

type TablePadding = Readonly<{
	left: number
	right: number
	top: number
	bottom: number
}>

function resolveTablePadding(style: TableStyle | undefined): TablePadding {
	const p = style?.cellPadding
	const ph = style?.cellPaddingHorizontal ?? p
	const pv = style?.cellPaddingVertical ?? p
	return {
		left: style?.cellPaddingLeft ?? ph ?? 8,
		right: style?.cellPaddingRight ?? ph ?? 8,
		top: style?.cellPaddingTop ?? pv ?? 6,
		bottom: style?.cellPaddingBottom ?? pv ?? 6
	}
}

function normalizeHeader(
	columns: readonly TableColumn[],
	header: readonly TableHeaderGroup[] | undefined
): readonly TableHeaderGroup[] {
	if (header && header.length) return header
	return [
		{
			id: 'header',
			label: '',
			children: columns.map(c => ({ type: 'col', colId: c.id }) as const)
		}
	]
}

type HeaderCellLayout = Readonly<{
	id: string
	text: string
	align?: 'left' | 'center' | 'right'
	vAlign?: 'top' | 'middle' | 'bottom'
	textStyle?: TextStyle
	level: number
	colStart: number
	colSpan: number
	rowSpan: number
}>

function computeHeaderLayout(
	columns: readonly TableColumn[],
	header: readonly TableHeaderGroup[] | undefined
): Readonly<{ depth: number; cells: readonly HeaderCellLayout[] }> {
	const colIndex = new Map(columns.map((c, i) => [c.id, i] as const))
	const root = normalizeHeader(columns, header)

	type Node = TableHeaderGroup | { type: 'col'; colId: string }

	const maxDepth = (node: Node, level: number): number => {
		if ((node as any).type === 'col') return level + 1
		let d = level + 1
		for (const ch of (node as TableHeaderGroup).children)
			d = Math.max(d, maxDepth(ch as any, level + 1))
		return d
	}

	let depth = 1
	for (const n of root as unknown as Node[])
		depth = Math.max(depth, maxDepth(n, 0))

	const leafRange = (node: Node): Readonly<{ start: number; end: number }> => {
		if ((node as any).type === 'col') {
			const idx = colIndex.get((node as any).colId)
			if (idx == null)
				throw new Error(`Unknown column id: ${(node as any).colId}`)
			return { start: idx, end: idx }
		}
		let start = Infinity
		let end = -Infinity
		for (const ch of (node as TableHeaderGroup).children) {
			const r = leafRange(ch as any)
			start = Math.min(start, r.start)
			end = Math.max(end, r.end)
		}
		if (!Number.isFinite(start) || !Number.isFinite(end))
			return { start: 0, end: -1 }
		return { start, end }
	}

	const cells: HeaderCellLayout[] = []
	const visit = (node: Node, level: number): void => {
		if ((node as any).type === 'col') {
			const idx = colIndex.get((node as any).colId)!
			cells.push({
				id: String((node as any).colId),
				text: columns[idx]?.title ?? String((node as any).colId),
				level,
				colStart: idx,
				colSpan: 1,
				rowSpan: Math.max(1, depth - level)
			})
			return
		}
		const grp = node as TableHeaderGroup
		const range = leafRange(grp as any)
		cells.push({
			id: grp.id,
			text: grp.label,
			align: grp.align,
			vAlign: grp.vAlign,
			textStyle: grp.textStyle,
			level,
			colStart: range.start,
			colSpan: Math.max(0, range.end - range.start + 1),
			rowSpan: 1
		})
		for (const ch of grp.children) visit(ch as any, level + 1)
	}

	for (const n of root as unknown as Node[]) visit(n, 0)
	return { depth, cells }
}

function defaultHeaderTextStyle(): TextStyle {
	return {
		color: '#e5e7eb',
		fontSize: 13,
		fontWeight: 600,
		whiteSpace: 'nowrap',
		textBaseline: 'top'
	}
}

function defaultCellTextStyle(): TextStyle {
	return {
		color: '#cbd5e1',
		fontSize: 13,
		whiteSpace: 'nowrap',
		textBaseline: 'top'
	}
}

function textWidth(
	textMeasurer: TextMeasurer,
	text: string,
	style: TextStyle
): number {
	return textMeasurer.measure({ text, style, maxWidth: undefined }).width
}

function computeTableColumnWidths(
	textMeasurer: TextMeasurer,
	table: TableNode,
	maxWidth: number | undefined
): Readonly<{ widths: readonly number[]; total: number }> {
	const pad = resolveTablePadding(table.tableStyle)
	const padX = pad.left + pad.right
	const headerStyle: TextStyle = {
		...defaultHeaderTextStyle(),
		...table.tableStyle?.headerTextStyle
	}
	const cellDefault: TextStyle = {
		...defaultCellTextStyle(),
		...table.tableStyle?.cellTextStyle
	}
	const headerLayout = computeHeaderLayout(table.columns, table.header)
	const headerLabels: string[] = []
	for (const c of headerLayout.cells) {
		if (c.level === headerLayout.depth - 1 && c.colSpan === 1)
			headerLabels[c.colStart] = c.text
	}

	const fixed: number[] = new Array(table.columns.length).fill(0)
	const flexWeights: number[] = new Array(table.columns.length).fill(0)
	const isFixed: boolean[] = new Array(table.columns.length).fill(false)

	const sampleCount = table.tableStyle?.autoMeasureRowCount ?? 50
	const rows = table.rows.slice(0, Math.max(0, sampleCount))

	for (let i = 0; i < table.columns.length; i++) {
		const col = table.columns[i]
		const minW = col.minWidth ?? 0
		const maxW = col.maxWidth ?? Infinity
		if (typeof col.width === 'number') {
			fixed[i] = Math.max(minW, Math.min(maxW, col.width))
			isFixed[i] = true
			continue
		}
		if (
			col.width &&
			typeof col.width === 'object' &&
			(col.width as any).type === 'flex'
		) {
			flexWeights[i] = Math.max(0, (col.width as any).weight ?? 1)
		}
		const hs = col.headerTextStyle ?? headerStyle
		const cs = col.cellTextStyle ?? cellDefault
		let w = textWidth(textMeasurer, headerLabels[i] ?? col.title ?? col.id, hs)
		for (const r of rows) {
			const t = r.cells[col.id]
			if (typeof t === 'string') w = Math.max(w, textWidth(textMeasurer, t, cs))
		}
		w += padX
		w = Math.max(minW, Math.min(maxW, w))
		fixed[i] = w
	}

	let total = fixed.reduce((a, b) => a + b, 0)
	if (maxWidth != null) {
		const flexTotal = flexWeights.reduce((a, b) => a + b, 0)
		if (flexTotal > 0) {
			const remaining = Math.max(0, maxWidth - total)
			for (let i = 0; i < table.columns.length; i++) {
				if (flexWeights[i] <= 0) continue
				const col = table.columns[i]
				const minW = col.minWidth ?? 0
				const maxW = col.maxWidth ?? Infinity
				const add = (remaining * flexWeights[i]) / flexTotal
				const next = Math.max(minW, Math.min(maxW, fixed[i] + add))
				fixed[i] = next
			}
			total = fixed.reduce((a, b) => a + b, 0)
		}

		if (total > maxWidth) {
			let excess = total - maxWidth
			const mins = table.columns.map(
				(c, i) => c.minWidth ?? (isFixed[i] ? fixed[i] : 0)
			)
			while (excess > 0.5) {
				let capacity = 0
				for (let i = 0; i < fixed.length; i++)
					capacity += Math.max(0, fixed[i] - mins[i])
				if (capacity <= 0.5) break
				for (let i = 0; i < fixed.length; i++) {
					const cap = Math.max(0, fixed[i] - mins[i])
					if (cap <= 0) continue
					const delta = (excess * cap) / capacity
					const next = Math.max(mins[i], fixed[i] - delta)
					excess -= fixed[i] - next
					fixed[i] = next
				}
			}
			total = fixed.reduce((a, b) => a + b, 0)
		}
	}

	return { widths: fixed, total }
}

function resolveRowHeight(
	style: TextStyle,
	padding: TablePadding,
	override: number | undefined
): number {
	if (override != null) return override
	const line = style.lineHeight ?? Math.ceil(style.fontSize * 1.2)
	return padding.top + line + padding.bottom
}

function resolveFill(style: FillStyle | undefined): FillStyle | undefined {
	return style
}

function resolveStroke(
	style: StrokeStyle | undefined
): StrokeStyle | undefined {
	return style
}

function resolveAlign(
	align: 'left' | 'center' | 'right' | undefined,
	styleAlign: TextStyle['textAlign'] | undefined,
	fallback: 'left' | 'center' | 'right'
): 'left' | 'center' | 'right' {
	const a = align ?? styleAlign ?? fallback
	if (a === 'center' || a === 'right') return a
	return 'left'
}

function resolveVAlign(
	align: 'top' | 'middle' | 'bottom' | undefined,
	fallback: 'top' | 'middle' | 'bottom'
): 'top' | 'middle' | 'bottom' {
	const a = align ?? fallback
	if (a === 'top' || a === 'bottom') return a
	return 'middle'
}

function textLineHeight(style: TextStyle): number {
	return style.lineHeight ?? Math.ceil(style.fontSize * 1.2)
}

function computeTextY(
	cellY: number,
	cellHeight: number,
	padding: TablePadding,
	textStyle: TextStyle,
	vAlign: 'top' | 'middle' | 'bottom'
): number {
	const innerH = Math.max(0, cellHeight - padding.top - padding.bottom)
	const lineH = textLineHeight(textStyle)
	const extra = Math.max(0, innerH - lineH)
	const dy = vAlign === 'bottom' ? extra : vAlign === 'middle' ? extra / 2 : 0
	return cellY + padding.top + dy
}

export async function createEngine(
	options: EngineCreateOptions
): Promise<Engine> {
	// Engine 的职责：维护 scene tree（纯数据）→ Yoga layout（几何）→ DisplayList（绘制指令）。
	// 所有布局与绘制坐标均以“逻辑像素”为单位；DPR 由上层 replay 阶段统一处理。
	const Yoga: Yoga = await loadYoga()

	const textMeasurer = options.textMeasurer
	const textCache = new TextMeasureCache(options.textMeasureCacheSize ?? 2048)

	const records = new Map<string, NodeRecord>()
	const layoutRecords = new Map<string, LayoutRecord>()
	const frames = new Map<string, LayoutFrame>()
	const scrollMetas = new Map<string, ScrollMetrics>()
	let rootId = 'root'
	let structureDirty = true
	let lastDisplayList: DisplayList = []

	const ensureLayoutRecord = (id: string): LayoutRecord => {
		const existing = layoutRecords.get(id)
		if (existing) return existing
		const yogaNode = Yoga.Node.create()
		const record: LayoutRecord = {
			yogaNode,
			dirtyStyle: true,
			dirtyMeasure: true,
			measureResult: { width: 0, height: 0 }
		}
		layoutRecords.set(id, record)
		return record
	}

	const freeYogaNodes = (): void => {
		for (const layoutRec of layoutRecords.values()) layoutRec.yogaNode.free()
	}

	const upsertTree = (node: SceneNode, parentId: string | null): void => {
		const children = normalizeChildren(node)
		records.set(node.id, {
			node,
			parentId,
			children: children.map(c => c.id)
		})
		ensureLayoutRecord(node.id)
		for (const child of children) upsertTree(child, node.id)
	}

	const replaceRoot = (root: SceneNode): void => {
		freeYogaNodes()
		records.clear()
		layoutRecords.clear()
		frames.clear()
		rootId = root.id
		upsertTree(root, null)
		structureDirty = true
	}

	replaceRoot(options.root ?? createDefaultRoot())

	const removeSubtree = (id: string): void => {
		const rec = records.get(id)
		if (!rec) return
		for (const childId of rec.children) removeSubtree(childId)
		const layout = layoutRecords.get(id)
		if (layout) {
			layout.yogaNode.free()
			layoutRecords.delete(id)
		}
		frames.delete(id)
		records.delete(id)
	}

	const detachFromParent = (id: string): void => {
		const rec = records.get(id)
		if (!rec?.parentId) return
		const parent = records.get(rec.parentId)
		if (!parent) return
		parent.children = parent.children.filter(cid => cid !== id)
		const parentNode = cloneNodeWithChildren(
			parent.node,
			parent.children.map(cid => records.get(cid)!.node)
		)
		parent.node = parentNode
	}

	const markDirty = (id: string, kind: 'style' | 'measure'): void => {
		const layout = ensureLayoutRecord(id)
		if (kind === 'style') layout.dirtyStyle = true
		else layout.dirtyMeasure = true
	}

	const applyPatch = (patch: ScenePatch): void => {
		if (patch.op === 'addNode') {
			const parent = records.get(patch.parentId)
			if (!parent) return
			if (parent.node.type === 'table') return
			const newNode = patch.node
			upsertTree(newNode, patch.parentId)
			const idx = patch.index ?? parent.children.length
			parent.children.splice(
				Math.max(0, Math.min(idx, parent.children.length)),
				0,
				newNode.id
			)
			parent.node = cloneNodeWithChildren(
				parent.node,
				parent.children.map(cid => records.get(cid)!.node)
			)
			structureDirty = true
			return
		}

		if (patch.op === 'removeNode') {
			if (patch.id === rootId) return
			detachFromParent(patch.id)
			removeSubtree(patch.id)
			structureDirty = true
			return
		}

		if (patch.op === 'updateStyle') {
			const rec = records.get(patch.id)
			if (!rec) return
			rec.node = { ...rec.node, style: patch.style } as any
			markDirty(patch.id, 'style')
			return
		}

		if (patch.op === 'updateScroll') {
			const rec = records.get(patch.id)
			if (!rec || (rec.node.type !== 'container' && rec.node.type !== 'table'))
				return
			rec.node = { ...rec.node, scroll: patch.scroll } as any
			return
		}

		if (patch.op === 'updateText') {
			const rec = records.get(patch.id)
			if (!rec || rec.node.type !== 'text') return
			rec.node = { ...rec.node, text: patch.text } as any
			markDirty(patch.id, 'measure')
			return
		}

		if (patch.op === 'updateTextStyle') {
			const rec = records.get(patch.id)
			if (!rec || rec.node.type !== 'text') return
			rec.node = { ...rec.node, textStyle: patch.textStyle } as any
			markDirty(patch.id, 'measure')
			markDirty(patch.id, 'style')
			return
		}

		if (patch.op === 'replacePoints') {
			const rec = records.get(patch.id)
			if (!rec || rec.node.type !== 'polygon') return
			rec.node = { ...rec.node, points: patch.points } as any
			markDirty(patch.id, 'measure')
			return
		}

		if (patch.op === 'updateTableData') {
			const rec = records.get(patch.id)
			if (!rec || rec.node.type !== 'table') return
			rec.node = { ...rec.node, rows: patch.rows } as any
			markDirty(patch.id, 'measure')
			return
		}

		if (patch.op === 'updateTableColumns') {
			const rec = records.get(patch.id)
			if (!rec || rec.node.type !== 'table') return
			rec.node = {
				...rec.node,
				columns: patch.columns,
				header: patch.header
			} as any
			markDirty(patch.id, 'measure')
			return
		}

		if (patch.op === 'updateTableStyle') {
			const rec = records.get(patch.id)
			if (!rec || rec.node.type !== 'table') return
			rec.node = { ...rec.node, tableStyle: patch.tableStyle } as any
			markDirty(patch.id, 'measure')
			return
		}

		const _exhaustive: never = patch as never
		throw new Error(`Unknown patch op: ${(patch as { op: string }).op}`)
	}

	const syncStructure = (): void => {
		const visit = (id: string): void => {
			const rec = records.get(id)
			if (!rec) return
			const layout = ensureLayoutRecord(id)
			while (layout.yogaNode.getChildCount() > 0) {
				layout.yogaNode.removeChild(layout.yogaNode.getChild(0))
			}
			for (const childId of rec.children) {
				const childLayout = ensureLayoutRecord(childId)
				layout.yogaNode.insertChild(
					childLayout.yogaNode,
					layout.yogaNode.getChildCount()
				)
			}
			for (const childId of rec.children) visit(childId)
		}
		visit(rootId)
		structureDirty = false
	}

	const syncDirty = (): void => {
		for (const [id, rec] of records) {
			const layout = ensureLayoutRecord(id)
			if (layout.dirtyStyle) {
				applyLayoutStyle(Yoga, layout.yogaNode, rec.node.style)
				const parent =
					rec.parentId != null ? records.get(rec.parentId)?.node : null
				const hasInset =
					rec.node.style?.left != null ||
					rec.node.style?.right != null ||
					rec.node.style?.top != null ||
					rec.node.style?.bottom != null
				if (
					parent?.type === 'relative' &&
					(rec.node.style?.position == null || hasInset)
				) {
					layout.yogaNode.setPositionType((Yoga as any).POSITION_TYPE_ABSOLUTE)
				}
				layout.dirtyStyle = false
			}

			if (layout.dirtyMeasure) {
				if (rec.node.type === 'text') {
					const textNode = rec.node as TextNode
					const measureResult = layout.measureResult!
					layout.yogaNode.setMeasureFunc(
						(
							width: number,
							widthMode: number,
							height: number,
							heightMode: number
						) => {
							const nowrap = textNode.textStyle.whiteSpace === 'nowrap'
							const maxWidth =
								widthMode === (Yoga as any).MEASURE_MODE_AT_MOST ||
								widthMode === (Yoga as any).MEASURE_MODE_EXACTLY
									? nowrap
										? undefined
										: width
									: undefined
							const key = makeTextCacheKey(
								textNode.text,
								textNode.textStyle,
								maxWidth
							)
							const cached = textCache.get(key)
							const measured =
								cached ??
								textMeasurer.measure({
									text: textNode.text,
									style: textNode.textStyle,
									maxWidth
								})
							if (!cached) textCache.set(key, measured)
							const w =
								widthMode === (Yoga as any).MEASURE_MODE_EXACTLY
									? width
									: widthMode === (Yoga as any).MEASURE_MODE_AT_MOST
										? nowrap
											? measured.width
											: Math.min(measured.width, width)
										: measured.width
							const h =
								heightMode === (Yoga as any).MEASURE_MODE_EXACTLY
									? height
									: heightMode === (Yoga as any).MEASURE_MODE_AT_MOST
										? Math.min(measured.height, height)
										: measured.height
							measureResult.width = w
							measureResult.height = h
							return measureResult
						}
					)
				} else if (rec.node.type === 'polygon') {
					const polygonNode = rec.node as PolygonNode
					const measureResult = layout.measureResult!
					const bounds = computePolygonBounds(polygonNode)
					layout.yogaNode.setMeasureFunc(
						(
							width: number,
							widthMode: number,
							height: number,
							heightMode: number
						) => {
							const w =
								widthMode === (Yoga as any).MEASURE_MODE_EXACTLY
									? width
									: widthMode === (Yoga as any).MEASURE_MODE_AT_MOST
										? Math.min(bounds.width, width)
										: bounds.width
							const h =
								heightMode === (Yoga as any).MEASURE_MODE_EXACTLY
									? height
									: heightMode === (Yoga as any).MEASURE_MODE_AT_MOST
										? Math.min(bounds.height, height)
										: bounds.height
							measureResult.width = w
							measureResult.height = h
							return measureResult
						}
					)
				} else if (rec.node.type === 'table') {
					const tableNode = rec.node as TableNode
					const measureResult = layout.measureResult!
					layout.yogaNode.setMeasureFunc(
						(
							width: number,
							widthMode: number,
							height: number,
							heightMode: number
						) => {
							const maxWidth =
								widthMode === (Yoga as any).MEASURE_MODE_AT_MOST ||
								widthMode === (Yoga as any).MEASURE_MODE_EXACTLY
									? width
									: undefined
							const cols = computeTableColumnWidths(
								textMeasurer,
								tableNode,
								maxWidth
							)
							const pad = resolveTablePadding(tableNode.tableStyle)
							const headerLayout = computeHeaderLayout(
								tableNode.columns,
								tableNode.header
							)

							let headerFontSize = defaultHeaderTextStyle().fontSize
							for (const c of tableNode.columns) {
								const s = c.headerTextStyle
								if (s?.fontSize != null)
									headerFontSize = Math.max(headerFontSize, s.fontSize)
							}
							const headerStyle: TextStyle = {
								...defaultHeaderTextStyle(),
								fontSize: headerFontSize
							}
							const headerRowHeight = resolveRowHeight(
								headerStyle,
								pad,
								tableNode.tableStyle?.headerRowHeight
							)

							let cellFontSize = defaultCellTextStyle().fontSize
							for (const c of tableNode.columns) {
								const s = c.cellTextStyle
								if (s?.fontSize != null)
									cellFontSize = Math.max(cellFontSize, s.fontSize)
							}
							const cellStyle: TextStyle = {
								...defaultCellTextStyle(),
								fontSize: cellFontSize
							}
							const rowHeight = resolveRowHeight(
								cellStyle,
								pad,
								tableNode.tableStyle?.rowHeight
							)

							const intrinsicW = cols.total
							const intrinsicH =
								headerLayout.depth * headerRowHeight +
								tableNode.rows.length * rowHeight

							const w =
								widthMode === (Yoga as any).MEASURE_MODE_EXACTLY
									? width
									: widthMode === (Yoga as any).MEASURE_MODE_AT_MOST
										? Math.min(intrinsicW, width)
										: intrinsicW
							const h =
								heightMode === (Yoga as any).MEASURE_MODE_EXACTLY
									? height
									: heightMode === (Yoga as any).MEASURE_MODE_AT_MOST
										? Math.min(intrinsicH, height)
										: intrinsicH
							measureResult.width = w
							measureResult.height = h
							return measureResult
						}
					)
				} else {
					layout.yogaNode.setMeasureFunc(null)
				}
				layout.dirtyMeasure = false
			}
		}
	}

	const computeFrames = (): LayoutFrame[] => {
		frames.clear()
		scrollMetas.clear()
		const out: LayoutFrame[] = []
		const visit = (id: string): void => {
			const layout = ensureLayoutRecord(id).yogaNode
			const frame: LayoutFrame = {
				id,
				rect: {
					left: layout.getComputedLeft(),
					top: layout.getComputedTop(),
					width: layout.getComputedWidth(),
					height: layout.getComputedHeight()
				}
			}
			frames.set(id, frame)
			out.push(frame)
			const rec = records.get(id)
			if (!rec) return
			for (const childId of rec.children) visit(childId)
		}
		visit(rootId)
		return out
	}

	const computeScrollMetas = (): void => {
		scrollMetas.clear()
		const clamp = (v: number, min: number, max: number): number =>
			Math.max(min, Math.min(max, v))

		for (const [id, rec] of records) {
			const frame = frames.get(id)
			if (!frame) continue
			if (
				rec.node.type !== 'container' &&
				rec.node.type !== 'relative' &&
				rec.node.type !== 'table'
			)
				continue

			const viewportWidth = frame.rect.width
			const viewportHeight = frame.rect.height

			if (rec.node.type === 'container' || rec.node.type === 'relative') {
				let minLeft = 0
				let minTop = 0
				let maxRight = 0
				let maxBottom = 0
				for (const childId of rec.children) {
					const child = frames.get(childId)
					if (!child) continue
					const childRec = records.get(childId)
					let extraW = 0
					let extraH = 0
					if (childRec?.node.type === 'text') {
						const textNode = childRec.node as TextNode
						if (textNode.textStyle.whiteSpace === 'nowrap') {
							const key = makeTextCacheKey(
								textNode.text,
								textNode.textStyle,
								undefined
							)
							const cached = textCache.get(key)
							const measured =
								cached ??
								textMeasurer.measure({
									text: textNode.text,
									style: textNode.textStyle,
									maxWidth: undefined
								})
							if (!cached) textCache.set(key, measured)
							extraW = Math.max(0, measured.width - child.rect.width)
							extraH = Math.max(0, measured.height - child.rect.height)
						}
					}
					minLeft = Math.min(minLeft, child.rect.left)
					minTop = Math.min(minTop, child.rect.top)
					maxRight = Math.max(
						maxRight,
						child.rect.left + child.rect.width + extraW
					)
					maxBottom = Math.max(
						maxBottom,
						child.rect.top + child.rect.height + extraH
					)
				}
				const contentWidth = Math.max(0, maxRight - minLeft)
				const contentHeight = Math.max(0, maxBottom - minTop)

				const maxScrollX = Math.max(0, contentWidth - viewportWidth)
				const maxScrollY = Math.max(0, contentHeight - viewportHeight)

				const rawX = (rec.node as any).scroll?.x ?? 0
				const rawY = (rec.node as any).scroll?.y ?? 0
				const scrollX = clamp(rawX, 0, maxScrollX)
				const scrollY = clamp(rawY, 0, maxScrollY)

				if (scrollX !== rawX || scrollY !== rawY) {
					rec.node = {
						...rec.node,
						scroll: { x: scrollX, y: scrollY }
					} as any
				}

				scrollMetas.set(id, {
					viewportWidth,
					viewportHeight,
					contentWidth,
					contentHeight,
					scrollX,
					scrollY,
					maxScrollX,
					maxScrollY
				})
			}

			if (rec.node.type === 'table') {
				const tableNode = rec.node as TableNode
				const overflowX = tableNode.style?.overflowX ?? 'visible'
				const overflowY = tableNode.style?.overflowY ?? 'visible'
				const shouldScrollX = overflowX === 'scroll' || overflowX === 'auto'
				const shouldScrollY = overflowY === 'scroll' || overflowY === 'auto'

				const pad = resolveTablePadding(tableNode.tableStyle)
				const headerLayout = computeHeaderLayout(
					tableNode.columns,
					tableNode.header
				)
				const col = computeTableColumnWidths(
					textMeasurer,
					tableNode,
					viewportWidth
				)
				const widths = col.widths
				const totalW = widths.reduce((a, b) => a + b, 0)

				let headerFontSize =
					tableNode.tableStyle?.headerTextStyle?.fontSize ??
					defaultHeaderTextStyle().fontSize
				for (const c of headerLayout.cells) {
					const s = c.textStyle
					if (s?.fontSize != null)
						headerFontSize = Math.max(headerFontSize, s.fontSize)
				}
				for (const c of tableNode.columns) {
					const s = c.headerTextStyle
					if (s?.fontSize != null)
						headerFontSize = Math.max(headerFontSize, s.fontSize)
				}
				const headerStyleBase: TextStyle = {
					...defaultHeaderTextStyle(),
					...tableNode.tableStyle?.headerTextStyle,
					fontSize: headerFontSize
				}
				const headerRowHeight = resolveRowHeight(
					headerStyleBase,
					pad,
					tableNode.tableStyle?.headerRowHeight
				)

				let cellFontSize =
					tableNode.tableStyle?.cellTextStyle?.fontSize ??
					defaultCellTextStyle().fontSize
				for (const c of tableNode.columns) {
					const s = c.cellTextStyle
					if (s?.fontSize != null)
						cellFontSize = Math.max(cellFontSize, s.fontSize)
				}
				const cellStyleBase: TextStyle = {
					...defaultCellTextStyle(),
					...tableNode.tableStyle?.cellTextStyle,
					fontSize: cellFontSize
				}
				const rowHeight = resolveRowHeight(
					cellStyleBase,
					pad,
					tableNode.tableStyle?.rowHeight
				)

				const headerH = headerLayout.depth * headerRowHeight
				const bodyViewportH = Math.max(0, viewportHeight - headerH)
				const bodyTotalH = Math.max(0, tableNode.rows.length * rowHeight)

				const contentWidth = totalW
				const contentHeight = headerH + bodyTotalH

				const maxScrollX = shouldScrollX
					? Math.max(0, contentWidth - viewportWidth)
					: 0
				const maxScrollY = shouldScrollY
					? Math.max(0, bodyTotalH - bodyViewportH)
					: 0

				const rawX = (rec.node as any).scroll?.x ?? 0
				const rawY = (rec.node as any).scroll?.y ?? 0
				const scrollX = clamp(rawX, 0, maxScrollX)
				const scrollY = clamp(rawY, 0, maxScrollY)
				if (scrollX !== rawX || scrollY !== rawY) {
					rec.node = { ...tableNode, scroll: { x: scrollX, y: scrollY } } as any
				}

				scrollMetas.set(id, {
					viewportWidth,
					viewportHeight,
					contentWidth,
					contentHeight,
					scrollX,
					scrollY,
					maxScrollX,
					maxScrollY
				})
			}
		}
	}

	const buildDisplayList = (): DisplayList => {
		const ops: any[] = []
		const clamp = (v: number, min: number, max: number): number =>
			Math.max(min, Math.min(max, v))

		const pushScrollbar = (input: {
			trackX: number
			trackY: number
			trackW: number
			trackH: number
			thumbX: number
			thumbY: number
			thumbW: number
			thumbH: number
		}): void => {
			const track: FillStyle = { color: '#000000', alpha: 0.25 }
			const thumb: FillStyle = { color: '#94a3b8', alpha: 0.6 }
			ops.push({
				op: 'fillRect',
				rect: {
					x: input.trackX,
					y: input.trackY,
					width: input.trackW,
					height: input.trackH
				},
				style: track
			})
			ops.push({
				op: 'fillRect',
				rect: {
					x: input.thumbX,
					y: input.thumbY,
					width: input.thumbW,
					height: input.thumbH
				},
				style: thumb
			})
		}

		const pushContainerScrollbars = (
			viewportW: number,
			viewportH: number,
			meta: ScrollMetrics,
			overflowX: string,
			overflowY: string
		): void => {
			const inset = 2
			const thickness = 8
			const minThumb = 18

			const showY =
				(overflowY === 'scroll' || overflowY === 'auto') && meta.maxScrollY > 0
			if (showY) {
				const trackX = viewportW - thickness - inset
				const trackY = inset
				const trackW = thickness
				const trackH = Math.max(0, viewportH - inset * 2)
				const thumbH = Math.max(
					minThumb,
					(trackH * meta.viewportHeight) / Math.max(1, meta.contentHeight)
				)
				const thumbY =
					trackY +
					(clamp(meta.scrollY, 0, meta.maxScrollY) / meta.maxScrollY) *
						(trackH - thumbH)
				pushScrollbar({
					trackX,
					trackY,
					trackW,
					trackH,
					thumbX: trackX,
					thumbY,
					thumbW: trackW,
					thumbH
				})
			}

			const showX =
				(overflowX === 'scroll' || overflowX === 'auto') && meta.maxScrollX > 0
			if (showX) {
				const trackX = inset
				const trackY = viewportH - thickness - inset
				const trackW = Math.max(0, viewportW - inset * 2)
				const trackH = thickness
				const thumbW = Math.max(
					minThumb,
					(trackW * meta.viewportWidth) / Math.max(1, meta.contentWidth)
				)
				const thumbX =
					trackX +
					(clamp(meta.scrollX, 0, meta.maxScrollX) / meta.maxScrollX) *
						(trackW - thumbW)
				pushScrollbar({
					trackX,
					trackY,
					trackW,
					trackH,
					thumbX,
					thumbY: trackY,
					thumbW,
					thumbH: trackH
				})
			}
		}

		const visit = (id: string): void => {
			const rec = records.get(id)
			const frame = frames.get(id)
			if (!rec || !frame) return
			let childrenHandled = false
			ops.push({ op: 'save' })
			ops.push({ op: 'translate', x: frame.rect.left, y: frame.rect.top })

			if (rec.node.type === 'container' || rec.node.type === 'relative') {
				const paint = rec.node.paint
				if (paint?.background) {
					ops.push({
						op: 'fillRect',
						rect: {
							x: 0,
							y: 0,
							width: frame.rect.width,
							height: frame.rect.height
						},
						style: paint.background
					})
				}
				if (paint?.border) {
					ops.push({
						op: 'strokeRect',
						rect: {
							x: 0,
							y: 0,
							width: frame.rect.width,
							height: frame.rect.height
						},
						style: paint.border
					})
				}

				const overflowX = rec.node.style?.overflowX ?? 'visible'
				const overflowY = rec.node.style?.overflowY ?? 'visible'
				const shouldClip = overflowX !== 'visible' || overflowY !== 'visible'
				if (shouldClip) {
					ops.push({
						op: 'clipRect',
						rect: {
							x: 0,
							y: 0,
							width: frame.rect.width,
							height: frame.rect.height
						}
					})
				}

				const meta = scrollMetas.get(id)
				const shouldScrollX = overflowX === 'scroll' || overflowX === 'auto'
				const shouldScrollY = overflowY === 'scroll' || overflowY === 'auto'
				const sx = shouldScrollX ? (meta?.scrollX ?? 0) : 0
				const sy = shouldScrollY ? (meta?.scrollY ?? 0) : 0
				if (sx !== 0 || sy !== 0) {
					ops.push({ op: 'save' })
					ops.push({ op: 'translate', x: -sx, y: -sy })
					for (const childId of rec.children) visit(childId)
					ops.push({ op: 'restore' })
					childrenHandled = true
				} else {
					for (const childId of rec.children) visit(childId)
					childrenHandled = true
				}

				if (meta)
					pushContainerScrollbars(
						frame.rect.width,
						frame.rect.height,
						meta,
						overflowX,
						overflowY
					)
			} else if (rec.node.type === 'text') {
				const textNode = rec.node as TextNode
				const maxWidth =
					typeof textNode.style?.width === 'number'
						? textNode.style.width
						: frame.rect.width
				const key = makeTextCacheKey(
					textNode.text,
					textNode.textStyle,
					maxWidth
				)
				const measured =
					textCache.get(key) ??
					textMeasurer.measure({
						text: textNode.text,
						style: textNode.textStyle,
						maxWidth
					})
				if (!textCache.get(key)) textCache.set(key, measured)
				const baselineStyle: TextStyle = {
					...textNode.textStyle,
					textBaseline: textNode.textStyle.textBaseline ?? 'top'
				}
				const lineHeight =
					measured.lineHeight ??
					textNode.textStyle.lineHeight ??
					Math.ceil(textNode.textStyle.fontSize * 1.2)
				if (measured.lines && measured.lines.length > 0) {
					let y = 0
					for (const line of measured.lines) {
						if (y + lineHeight > frame.rect.height + 1e-6) break
						ops.push({
							op: 'drawText',
							text: line.text,
							x: 0,
							y,
							style: baselineStyle
						})
						y += lineHeight
					}
				} else {
					ops.push({
						op: 'drawText',
						text: textNode.text,
						x: 0,
						y: 0,
						style: baselineStyle
					})
				}
			} else if (rec.node.type === 'polygon') {
				const polygonNode = rec.node as PolygonNode
				const path = polygonNode.points.map((p, idx) =>
					idx === 0
						? { op: 'moveTo', x: p.x, y: p.y }
						: { op: 'lineTo', x: p.x, y: p.y }
				)
				ops.push({
					op: 'drawPath',
					path: [...path, { op: 'closePath' }],
					fill: polygonNode.paint?.fill,
					stroke: polygonNode.paint?.stroke
				})
			} else if (rec.node.type === 'table') {
				const tableNode = rec.node as TableNode
				const overflowX = tableNode.style?.overflowX ?? 'visible'
				const overflowY = tableNode.style?.overflowY ?? 'visible'
				const shouldScrollX = overflowX === 'scroll' || overflowX === 'auto'
				const shouldScrollY = overflowY === 'scroll' || overflowY === 'auto'
				const viewportW = frame.rect.width
				const viewportH = frame.rect.height

				const pad = resolveTablePadding(tableNode.tableStyle)
				const headerLayout = computeHeaderLayout(
					tableNode.columns,
					tableNode.header
				)
				const col = computeTableColumnWidths(
					textMeasurer,
					tableNode,
					frame.rect.width
				)
				const widths = col.widths
				const totalW = widths.reduce((a, b) => a + b, 0)

				let headerFontSize =
					tableNode.tableStyle?.headerTextStyle?.fontSize ??
					defaultHeaderTextStyle().fontSize
				for (const c of headerLayout.cells) {
					const s = c.textStyle
					if (s?.fontSize != null)
						headerFontSize = Math.max(headerFontSize, s.fontSize)
				}
				for (const c of tableNode.columns) {
					const s = c.headerTextStyle
					if (s?.fontSize != null)
						headerFontSize = Math.max(headerFontSize, s.fontSize)
				}
				const headerStyleBase: TextStyle = {
					...defaultHeaderTextStyle(),
					...tableNode.tableStyle?.headerTextStyle,
					fontSize: headerFontSize
				}
				const headerRowHeight = resolveRowHeight(
					headerStyleBase,
					pad,
					tableNode.tableStyle?.headerRowHeight
				)

				let cellFontSize =
					tableNode.tableStyle?.cellTextStyle?.fontSize ??
					defaultCellTextStyle().fontSize
				for (const c of tableNode.columns) {
					const s = c.cellTextStyle
					if (s?.fontSize != null)
						cellFontSize = Math.max(cellFontSize, s.fontSize)
				}
				const cellStyleBase: TextStyle = {
					...defaultCellTextStyle(),
					...tableNode.tableStyle?.cellTextStyle,
					fontSize: cellFontSize
				}
				const rowHeight = resolveRowHeight(
					cellStyleBase,
					pad,
					tableNode.tableStyle?.rowHeight
				)

				const headerH = headerLayout.depth * headerRowHeight
				const bodyViewportH = Math.max(0, viewportH - headerH)
				const bodyTotalH = Math.max(0, tableNode.rows.length * rowHeight)
				const maxScrollY = shouldScrollY
					? Math.max(0, bodyTotalH - bodyViewportH)
					: 0
				const maxScrollX = shouldScrollX ? Math.max(0, totalW - viewportW) : 0
				const meta = scrollMetas.get(id)
				const scrollX = meta?.scrollX ?? tableNode.scroll?.x ?? 0
				const scrollY = meta?.scrollY ?? tableNode.scroll?.y ?? 0

				const background = resolveFill(tableNode.tableStyle?.background)
				const headerBackground = resolveFill(
					tableNode.tableStyle?.headerBackground ?? {
						color: '#111827',
						alpha: 0.9
					}
				)
				const rowBackground = resolveFill(tableNode.tableStyle?.rowBackground)
				const altRowBackground = resolveFill(
					tableNode.tableStyle?.altRowBackground ?? {
						color: '#0f172a',
						alpha: 0.65
					}
				)
				const grid = resolveStroke(
					tableNode.tableStyle?.grid ?? {
						color: '#334155',
						width: 1,
						alpha: 0.9
					}
				)
				const headerGrid = resolveStroke(
					tableNode.tableStyle?.headerGrid ?? grid
				)

				ops.push({
					op: 'clipRect',
					rect: {
						x: 0,
						y: 0,
						width: viewportW,
						height: viewportH
					}
				})

				if (background) {
					ops.push({
						op: 'fillRect',
						rect: {
							x: 0,
							y: 0,
							width: viewportW,
							height: viewportH
						},
						style: background
					})
				}

				const xStarts: number[] = [0]
				for (let i = 0; i < widths.length; i++)
					xStarts.push(xStarts[i] + widths[i])

				const headerClipH = Math.min(headerH, viewportH)
				if (headerClipH > 0) {
					ops.push({ op: 'save' })
					ops.push({
						op: 'clipRect',
						rect: { x: 0, y: 0, width: viewportW, height: headerClipH }
					})
					if (scrollX !== 0) ops.push({ op: 'translate', x: -scrollX, y: 0 })
					if (headerBackground && headerH > 0) {
						ops.push({
							op: 'fillRect',
							rect: { x: 0, y: 0, width: totalW, height: headerH },
							style: headerBackground
						})
					}

					for (const cell of headerLayout.cells) {
						if (cell.colSpan <= 0 || cell.rowSpan <= 0) continue
						const x = xStarts[cell.colStart] ?? 0
						let w = 0
						for (let i = 0; i < cell.colSpan; i++)
							w += widths[cell.colStart + i] ?? 0
						const y = cell.level * headerRowHeight
						const h = cell.rowSpan * headerRowHeight

						const isLeaf = tableNode.columns[cell.colStart]?.id === cell.id
						const colDef = isLeaf ? tableNode.columns[cell.colStart] : undefined
						const override = (
							isLeaf ? colDef?.headerTextStyle : cell.textStyle
						) as TextStyle | undefined

						const defaultHeaderAlign = resolveAlign(
							tableNode.tableStyle?.headerAlign,
							tableNode.tableStyle?.headerTextStyle?.textAlign ??
								headerStyleBase.textAlign,
							'left'
						)
						const align = isLeaf
							? resolveAlign(
									colDef?.align,
									override?.textAlign ?? headerStyleBase.textAlign,
									defaultHeaderAlign
								)
							: resolveAlign(
									cell.align,
									override?.textAlign ?? headerStyleBase.textAlign,
									defaultHeaderAlign
								)

						const styleWithAlign: TextStyle = {
							...headerStyleBase,
							...override,
							textBaseline: 'top',
							textAlign: align
						}

						const vAlign = resolveVAlign(
							isLeaf ? colDef?.vAlign : cell.vAlign,
							resolveVAlign(tableNode.tableStyle?.headerVAlign, 'middle')
						)

						const tx =
							align === 'center'
								? x + w / 2
								: align === 'right'
									? x + Math.max(0, w - pad.right)
									: x + pad.left

						ops.push({
							op: 'drawText',
							text: cell.text,
							x: tx,
							y: computeTextY(y, h, pad, styleWithAlign, vAlign),
							style: styleWithAlign
						})

						if (headerGrid) {
							ops.push({
								op: 'strokeRect',
								rect: { x, y, width: w, height: h },
								style: headerGrid
							})
						}
					}
					ops.push({ op: 'restore' })
				}

				const defaultCellAlign = resolveAlign(
					tableNode.tableStyle?.cellAlign,
					tableNode.tableStyle?.cellTextStyle?.textAlign ??
						cellStyleBase.textAlign,
					'left'
				)
				const defaultCellVAlign = resolveVAlign(
					tableNode.tableStyle?.cellVAlign,
					'middle'
				)

				if (bodyViewportH > 0) {
					ops.push({ op: 'save' })
					ops.push({
						op: 'clipRect',
						rect: { x: 0, y: headerH, width: viewportW, height: bodyViewportH }
					})
					if (scrollX !== 0 || scrollY !== 0)
						ops.push({ op: 'translate', x: -scrollX, y: -scrollY })

					const startRow =
						rowHeight > 0 ? Math.max(0, Math.floor(scrollY / rowHeight)) : 0
					const visibleRowCount =
						rowHeight > 0 ? Math.ceil(bodyViewportH / rowHeight) + 1 : 0
					const endRow = Math.min(
						tableNode.rows.length,
						startRow + visibleRowCount
					)

					for (let r = startRow; r < endRow; r++) {
						const row = tableNode.rows[r]
						const y = headerH + r * rowHeight
						const bg = r % 2 === 0 ? rowBackground : altRowBackground
						if (bg) {
							ops.push({
								op: 'fillRect',
								rect: { x: 0, y, width: totalW, height: rowHeight },
								style: bg
							})
						}
						for (let c = 0; c < tableNode.columns.length; c++) {
							const colDef = tableNode.columns[c]
							const x = xStarts[c] ?? 0
							const w = widths[c] ?? 0
							const text = row.cells[colDef.id] ?? ''

							const override = colDef.cellTextStyle
							const align = resolveAlign(
								colDef.align,
								override?.textAlign ?? cellStyleBase.textAlign,
								defaultCellAlign
							)
							const styleWithAlign: TextStyle = {
								...cellStyleBase,
								...override,
								textBaseline: 'top',
								textAlign: align
							}
							const tx =
								align === 'center'
									? x + w / 2
									: align === 'right'
										? x + Math.max(0, w - pad.right)
										: x + pad.left
							ops.push({
								op: 'drawText',
								text,
								x: tx,
								y: computeTextY(
									y,
									rowHeight,
									pad,
									styleWithAlign,
									resolveVAlign(colDef.vAlign, defaultCellVAlign)
								),
								style: styleWithAlign
							})
						}
					}

					if (grid) {
						const path: any[] = []
						const y0 = headerH + startRow * rowHeight
						const y1 = headerH + endRow * rowHeight
						for (const x of xStarts) {
							path.push({ op: 'moveTo', x, y: y0 })
							path.push({ op: 'lineTo', x, y: y1 })
						}
						for (let i = startRow; i <= endRow; i++) {
							const y = headerH + i * rowHeight
							path.push({ op: 'moveTo', x: 0, y })
							path.push({ op: 'lineTo', x: totalW, y })
						}
						ops.push({ op: 'drawPath', path, stroke: grid })
					}
					ops.push({ op: 'restore' })
				}

				const inset = 2
				const thickness = 8
				const minThumb = 18
				const showY = shouldScrollY && maxScrollY > 0 && bodyViewportH > 0
				if (showY) {
					const trackX = viewportW - thickness - inset
					const trackY = headerH + inset
					const trackW = thickness
					const trackH = Math.max(0, bodyViewportH - inset * 2)
					const thumbH = Math.max(
						minThumb,
						(trackH * bodyViewportH) / Math.max(1, bodyTotalH)
					)
					const thumbY =
						trackY + (scrollY / maxScrollY) * Math.max(0, trackH - thumbH)
					pushScrollbar({
						trackX,
						trackY,
						trackW,
						trackH,
						thumbX: trackX,
						thumbY,
						thumbW: trackW,
						thumbH
					})
				}

				const showX = shouldScrollX && maxScrollX > 0
				if (showX) {
					const rightPad = showY ? thickness + inset : 0
					const trackX = inset
					const trackY = viewportH - thickness - inset
					const trackW = Math.max(0, viewportW - inset * 2 - rightPad)
					const trackH = thickness
					const thumbW = Math.max(
						minThumb,
						(trackW * viewportW) / Math.max(1, totalW)
					)
					const thumbX =
						trackX + (scrollX / maxScrollX) * Math.max(0, trackW - thumbW)
					pushScrollbar({
						trackX,
						trackY,
						trackW,
						trackH,
						thumbX,
						thumbY: trackY,
						thumbW,
						thumbH: trackH
					})
				}
			}

			if (!childrenHandled) for (const childId of rec.children) visit(childId)
			ops.push({ op: 'restore' })
		}
		visit(rootId)
		return ops as DisplayList
	}

	const layout = (constraints: LayoutConstraints): LayoutFrame[] => {
		// layout 阶段只做几何计算，不产生绘制指令；结果写入 frames。
		if (structureDirty) syncStructure()
		syncDirty()
		const rootLayout = ensureLayoutRecord(rootId).yogaNode
		rootLayout.calculateLayout(
			constraints.width,
			constraints.height,
			(Yoga as any).DIRECTION_LTR
		)
		const out = computeFrames()
		computeScrollMetas()
		return out
	}

	const paint = (): DisplayList => {
		// paint 阶段把 (scene + frames) 转为 DisplayList，便于序列化与跨平台复用。
		lastDisplayList = buildDisplayList()
		return lastDisplayList
	}

	const render = (constraints: LayoutConstraints): DisplayList => {
		// render 是 layout + paint 的组合入口，适合“一帧内完成布局与绘制”。
		layout(constraints)
		return paint()
	}

	const getScrollMetrics = (id: string): ScrollMetrics | null =>
		scrollMetas.get(id) ?? null

	const hitTest = (point: {
		x: number
		y: number
	}): { id: string | null; path: readonly string[] } => {
		const isInRect = (x: number, y: number, w: number, h: number): boolean =>
			x >= 0 && y >= 0 && x <= w && y <= h

		const pointInPolygon = (
			x: number,
			y: number,
			points: readonly { x: number; y: number }[]
		): boolean => {
			let inside = false
			for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
				const xi = points[i]?.x ?? 0
				const yi = points[i]?.y ?? 0
				const xj = points[j]?.x ?? 0
				const yj = points[j]?.y ?? 0
				const intersect =
					yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
				if (intersect) inside = !inside
			}
			return inside
		}

		const visit = (
			id: string,
			localX: number,
			localY: number
		): { id: string; path: readonly string[] } | null => {
			const rec = records.get(id)
			const frame = frames.get(id)
			if (!rec || !frame) return null

			if (rec.node.type === 'container' || rec.node.type === 'relative') {
				const overflowX = rec.node.style?.overflowX ?? 'visible'
				const overflowY = rec.node.style?.overflowY ?? 'visible'
				const shouldClip = overflowX !== 'visible' || overflowY !== 'visible'

				const viewportW = frame.rect.width
				const viewportH = frame.rect.height
				if (shouldClip && !isInRect(localX, localY, viewportW, viewportH))
					return null

				const meta = scrollMetas.get(id)
				const shouldScrollX = overflowX === 'scroll' || overflowX === 'auto'
				const shouldScrollY = overflowY === 'scroll' || overflowY === 'auto'
				const sx = shouldScrollX ? (meta?.scrollX ?? 0) : 0
				const sy = shouldScrollY ? (meta?.scrollY ?? 0) : 0
				const contentX = localX + sx
				const contentY = localY + sy

				for (let i = rec.children.length - 1; i >= 0; i--) {
					const childId = rec.children[i]
					const childFrame = frames.get(childId)
					if (!childFrame) continue
					const hit = visit(
						childId,
						contentX - childFrame.rect.left,
						contentY - childFrame.rect.top
					)
					if (hit) return { id: hit.id, path: [...hit.path, id] }
				}

				if (isInRect(localX, localY, viewportW, viewportH))
					return { id, path: [id] }
				return null
			}

			const w = frame.rect.width
			const h = frame.rect.height
			if (!isInRect(localX, localY, w, h)) return null

			if (rec.node.type === 'polygon') {
				const polygonNode = rec.node as any
				const pts = (polygonNode.points ?? []) as readonly {
					x: number
					y: number
				}[]
				if (pts.length >= 3 && !pointInPolygon(localX, localY, pts)) return null
			}

			return { id, path: [id] }
		}

		const rootFrame = frames.get(rootId)
		if (!rootFrame) return { id: null, path: [] }
		const hit = visit(
			rootId,
			point.x - rootFrame.rect.left,
			point.y - rootFrame.rect.top
		)
		return hit ? { id: hit.id, path: hit.path } : { id: null, path: [] }
	}

	const getNodeInfo = (
		id: string
	): { x: number; y: number; width: number; height: number } | null => {
		const frame = frames.get(id)
		if (!frame) return null

		// Need to calculate absolute position by traversing up to root
		let x = frame.rect.left
		let y = frame.rect.top

		let curr = id
		while (true) {
			const rec = records.get(curr)
			if (!rec || !rec.parentId) break

			const parentId = rec.parentId
			const parentFrame = frames.get(parentId)
			if (!parentFrame) break

			x += parentFrame.rect.left
			y += parentFrame.rect.top

			// Handle scroll offset
			const meta = scrollMetas.get(parentId)
			if (meta) {
				const parentRec = records.get(parentId)
				const overflowX = parentRec?.node.style?.overflowX ?? 'visible'
				const overflowY = parentRec?.node.style?.overflowY ?? 'visible'
				if (overflowX === 'scroll' || overflowX === 'auto') x -= meta.scrollX
				if (overflowY === 'scroll' || overflowY === 'auto') y -= meta.scrollY
			}

			curr = parentId
		}

		return {
			x,
			y,
			width: frame.rect.width,
			height: frame.rect.height
		}
	}

	const replay = (ctx: Context2DLike, options?: { dpr?: number }): void => {
		replayDisplayList(ctx, lastDisplayList, options)
	}

	const dispose = (): void => {
		freeYogaNodes()
		records.clear()
		layoutRecords.clear()
		frames.clear()
		lastDisplayList = []
		structureDirty = true
	}

	return {
		applyPatches(patches) {
			for (const p of patches) applyPatch(p)
		},
		setRoot(root) {
			replaceRoot(root)
		},
		layout,
		paint,
		render,
		getScrollMetrics,
		hitTest,
		getNodeInfo,
		replay,
		dispose
	}
}
