export type NumberLike = number

export type Point = Readonly<{
	x: number
	y: number
}>

export type Rect = Readonly<{
	x: number
	y: number
	width: number
	height: number
}>

export type Color = string

export type FillStyle = Readonly<{
	color: Color
	alpha?: number
}>

export type StrokeStyle = Readonly<{
	color: Color
	width: number
	alpha?: number
}>

export type TextStyle = Readonly<{
	color: Color
	alpha?: number
	fontFamily?: string
	fontSize: number
	fontWeight?: string | number
	fontStyle?: 'normal' | 'italic' | 'oblique'
	lineHeight?: number
	letterSpacing?: number
	textAlign?: 'left' | 'center' | 'right'
	textBaseline?: 'alphabetic' | 'top' | 'middle' | 'bottom'
	whiteSpace?: 'nowrap' | 'normal'
}>

export type PathCmd =
	| Readonly<{ op: 'moveTo'; x: number; y: number }>
	| Readonly<{ op: 'lineTo'; x: number; y: number }>
	| Readonly<{ op: 'closePath' }>

export type LayoutRect = Readonly<{
	left: number
	top: number
	width: number
	height: number
}>

export type LayoutFrame = Readonly<{
	id: string
	rect: LayoutRect
}>

export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse'
export type JustifyContent =
	| 'flex-start'
	| 'center'
	| 'flex-end'
	| 'space-between'
	| 'space-around'
	| 'space-evenly'
export type AlignItems = 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline'
export type FlexWrap = 'no-wrap' | 'wrap' | 'wrap-reverse'
export type PositionType = 'relative' | 'absolute'

export type Overflow = 'visible' | 'hidden' | 'scroll' | 'auto'

export type Dimension = number | string

export type LayoutStyle = Readonly<{
	width?: Dimension
	height?: Dimension
	minWidth?: Dimension
	minHeight?: Dimension
	maxWidth?: Dimension
	maxHeight?: Dimension

	overflowX?: Overflow
	overflowY?: Overflow

	flex?: number
	flexGrow?: number
	flexShrink?: number
	flexBasis?: Dimension
	flexDirection?: FlexDirection
	justifyContent?: JustifyContent
	alignItems?: AlignItems
	flexWrap?: FlexWrap
	gap?: number
	rowGap?: number
	columnGap?: number

	padding?: Dimension
	paddingHorizontal?: Dimension
	paddingVertical?: Dimension
	paddingLeft?: Dimension
	paddingRight?: Dimension
	paddingTop?: Dimension
	paddingBottom?: Dimension

	margin?: Dimension
	marginHorizontal?: Dimension
	marginVertical?: Dimension
	marginLeft?: Dimension
	marginRight?: Dimension
	marginTop?: Dimension
	marginBottom?: Dimension

	position?: PositionType
	left?: Dimension
	right?: Dimension
	top?: Dimension
	bottom?: Dimension
}>

export type ContainerPaintStyle = Readonly<{
	background?: FillStyle
	border?: StrokeStyle
}>

export type PolygonPaintStyle = Readonly<{
	fill?: FillStyle
	stroke?: StrokeStyle
}>

export type BaseNode = Readonly<{
	id: string
	name?: string
	label?: string
	meta?: Readonly<Record<string, unknown>>
	style?: LayoutStyle
	children?: SceneNode[]
}>

export type ScrollOffset = Readonly<{
	x?: number
	y?: number
}>

export type ContainerNode = BaseNode &
	Readonly<{
		type: 'container'
		paint?: ContainerPaintStyle
		scroll?: ScrollOffset
	}>

export type RelativeNode = BaseNode &
	Readonly<{
		type: 'relative'
		paint?: ContainerPaintStyle
		scroll?: ScrollOffset
	}>

export type TextNode = BaseNode &
	Readonly<{
		type: 'text'
		text: string
		textStyle: TextStyle
	}>

export type PolygonNode = BaseNode &
	Readonly<{
		type: 'polygon'
		points: readonly Point[]
		paint?: PolygonPaintStyle
	}>

export type TableColumnWidth =
	| number
	| Readonly<{ type: 'auto' }>
	| Readonly<{ type: 'flex'; weight?: number }>

export type TableColumn = Readonly<{
	id: string
	title: string
	width?: TableColumnWidth
	minWidth?: number
	maxWidth?: number
	align?: 'left' | 'center' | 'right'
	vAlign?: 'top' | 'middle' | 'bottom'
	headerTextStyle?: TextStyle
	cellTextStyle?: TextStyle
}>

export type TableHeaderLeaf = Readonly<{
	type: 'col'
	colId: string
}>

export type TableHeaderGroup = Readonly<{
	id: string
	label: string
	align?: 'left' | 'center' | 'right'
	vAlign?: 'top' | 'middle' | 'bottom'
	textStyle?: TextStyle
	children: readonly (TableHeaderGroup | TableHeaderLeaf)[]
}>

export type TableRow = Readonly<{
	id: string
	cells: Readonly<Record<string, string>>
}>

export type TablePaintStyle = Readonly<{
	background?: FillStyle
	headerBackground?: FillStyle
	rowBackground?: FillStyle
	altRowBackground?: FillStyle
	grid?: StrokeStyle
	headerGrid?: StrokeStyle
}>

export type TableMetricsStyle = Readonly<{
	cellPadding?: number
	cellPaddingHorizontal?: number
	cellPaddingVertical?: number
	cellPaddingLeft?: number
	cellPaddingRight?: number
	cellPaddingTop?: number
	cellPaddingBottom?: number
	headerRowHeight?: number
	rowHeight?: number
	autoMeasureRowCount?: number
}>

export type TableTextStyle = Readonly<{
	headerAlign?: 'left' | 'center' | 'right'
	cellAlign?: 'left' | 'center' | 'right'
	headerVAlign?: 'top' | 'middle' | 'bottom'
	cellVAlign?: 'top' | 'middle' | 'bottom'
	headerTextStyle?: TextStyle
	cellTextStyle?: TextStyle
}>

export type TableStyle = TablePaintStyle & TableMetricsStyle & TableTextStyle

export type TableNode = BaseNode &
	Readonly<{
		type: 'table'
		scroll?: ScrollOffset
		columns: readonly TableColumn[]
		header?: readonly TableHeaderGroup[]
		rows: readonly TableRow[]
		tableStyle?: TableStyle
	}>

export type SceneNode = ContainerNode | RelativeNode | TextNode | PolygonNode | TableNode

export type SceneRoot = Readonly<{
	root: SceneNode
}>

export type ScenePatch =
	| Readonly<{
			op: 'addNode'
			parentId: string
			node: SceneNode
			index?: number
	  }>
	| Readonly<{ op: 'removeNode'; id: string }>
	| Readonly<{ op: 'updateStyle'; id: string; style: LayoutStyle | undefined }>
	| Readonly<{
			op: 'updateScroll'
			id: string
			scroll: ScrollOffset | undefined
	  }>
	| Readonly<{ op: 'updateText'; id: string; text: string }>
	| Readonly<{ op: 'updateTextStyle'; id: string; textStyle: TextStyle }>
	| Readonly<{ op: 'replacePoints'; id: string; points: readonly Point[] }>
	| Readonly<{ op: 'updateTableData'; id: string; rows: readonly TableRow[] }>
	| Readonly<{
			op: 'updateTableColumns'
			id: string
			columns: readonly TableColumn[]
			header?: readonly TableHeaderGroup[]
	  }>
	| Readonly<{
			op: 'updateTableStyle'
			id: string
			tableStyle: TableStyle | undefined
	  }>

export type TextMeasureInput = Readonly<{
	text: string
	style: TextStyle
	maxWidth?: number
}>

export type TextMeasureOutput = Readonly<{
	width: number
	height: number
	lineHeight?: number
	lines?: readonly Readonly<{ text: string; width: number }>[]
}>

export interface TextMeasurer {
	measure(input: TextMeasureInput): TextMeasureOutput
}

export type Context2DLike = {
	save(): void
	restore(): void
	translate(x: number, y: number): void
	scale?(x: number, y: number): void
	setTransform?(a: number, b: number, c: number, d: number, e: number, f: number): void

	beginPath(): void
	moveTo(x: number, y: number): void
	lineTo(x: number, y: number): void
	closePath(): void
	clip(): void

	fillRect(x: number, y: number, w: number, h: number): void
	strokeRect(x: number, y: number, w: number, h: number): void

	fill(): void
	stroke(): void

	fillText(text: string, x: number, y: number): void

	font: string
	textAlign: CanvasTextAlign
	textBaseline: CanvasTextBaseline
	globalAlpha: number
	fillStyle: unknown
	strokeStyle: unknown
	lineWidth: number
}
