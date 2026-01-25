import type {
	ContainerNode,
	ContainerPaintStyle,
	LayoutStyle,
	Point,
	PolygonNode,
	PolygonPaintStyle,
	RelativeNode,
	SceneNode,
	TableColumn,
	TableHeaderGroup,
	TableRow,
	TableStyle,
	TextNode,
	TextStyle,
} from './index.js'

export const Fragment = Symbol.for('weave.fragment')

type Child = SceneNode | string | number | boolean | null | undefined

function flattenChildren(value: unknown, out: Child[]): void {
	if (value == null || value === false) return
	if (Array.isArray(value)) {
		for (const v of value) flattenChildren(v, out)
		return
	}
	out.push(value as Child)
}

function requireId(key: unknown, props: unknown): string {
	const fromProps = (props as { id?: unknown } | null)?.id
	const id =
		typeof fromProps === 'string'
			? fromProps
			: typeof key === 'string'
				? key
				: typeof key === 'number'
					? String(key)
					: null
	if (!id) throw new Error('Missing id/key for JSX element')
	return id
}

function childrenToNodes(children: Child[]): SceneNode[] {
	return children.filter((c): c is SceneNode => typeof c === 'object' && c != null && 'id' in c)
}

function childrenToText(children: Child[]): string {
	let s = ''
	for (const c of children) {
		if (typeof c === 'string') s += c
		else if (typeof c === 'number') s += String(c)
	}
	return s
}

type ContainerProps = Readonly<{
	id?: string
	name?: string
	label?: string
	meta?: Readonly<Record<string, unknown>>
	displayName?: string
	style?: LayoutStyle
	paint?: ContainerPaintStyle
	children?: unknown
}>

type RelativeProps = Readonly<{
	id?: string
	name?: string
	label?: string
	meta?: Readonly<Record<string, unknown>>
	displayName?: string
	style?: LayoutStyle
	paint?: ContainerPaintStyle
	children?: unknown
}>

type TextProps = Readonly<{
	id?: string
	name?: string
	label?: string
	meta?: Readonly<Record<string, unknown>>
	displayName?: string
	style?: LayoutStyle
	textStyle: TextStyle
	text?: string
	children?: unknown
}>

type PolygonProps = Readonly<{
	id?: string
	name?: string
	label?: string
	meta?: Readonly<Record<string, unknown>>
	displayName?: string
	style?: LayoutStyle
	points: readonly Point[]
	paint?: PolygonPaintStyle
	children?: unknown
}>

type TableProps = Readonly<{
	id?: string
	name?: string
	label?: string
	meta?: Readonly<Record<string, unknown>>
	displayName?: string
	style?: LayoutStyle
	columns: readonly TableColumn[]
	header?: readonly TableHeaderGroup[]
	rows: readonly TableRow[]
	tableStyle?: TableStyle
}>

export namespace JSX {
	export type Element = SceneNode
	export interface IntrinsicElements {
		container: ContainerProps
		relative: RelativeProps
		text: TextProps
		polygon: PolygonProps
		table: TableProps
	}
}

type FunctionComponent<P> = (props: P) => SceneNode

export function jsx(type: unknown, props: any, key?: unknown): SceneNode {
	if (typeof type === 'function') {
		return (type as FunctionComponent<any>)({ ...props, key })
	}

	const children: Child[] = []
	flattenChildren(props?.children, children)

	const name =
		typeof props?.displayName === 'string'
			? props.displayName
			: typeof props?.name === 'string'
				? props.name
				: undefined
	const label = typeof props?.label === 'string' ? props.label : undefined
	const meta =
		props?.meta && typeof props.meta === 'object' && !Array.isArray(props.meta)
			? (props.meta as Readonly<Record<string, unknown>>)
			: undefined

	if (type === Fragment) {
		const nodes = childrenToNodes(children)
		if (nodes.length !== 1) throw new Error('Fragment must have exactly one SceneNode child')
		return nodes[0]
	}

	if (type === 'container') {
		const id = requireId(key, props)
		const node: ContainerNode = {
			id,
			name,
			label,
			meta,
			type: 'container',
			style: props?.style,
			paint: props?.paint,
			children: childrenToNodes(children),
		}
		return node
	}

	if (type === 'relative') {
		const id = requireId(key, props)
		const node: RelativeNode = {
			id,
			name,
			label,
			meta,
			type: 'relative',
			style: props?.style,
			paint: props?.paint,
			children: childrenToNodes(children),
		}
		return node
	}

	if (type === 'text') {
		const id = requireId(key, props)
		const node: TextNode = {
			id,
			name,
			label,
			meta,
			type: 'text',
			style: props?.style,
			textStyle: props?.textStyle,
			text: typeof props?.text === 'string' ? props.text : childrenToText(children),
			children: [],
		}
		return node
	}

	if (type === 'polygon') {
		const id = requireId(key, props)
		const node: PolygonNode = {
			id,
			name,
			label,
			meta,
			type: 'polygon',
			style: props?.style,
			points: props?.points,
			paint: props?.paint,
			children: [],
		}
		return node
	}

	if (type === 'table') {
		const id = requireId(key, props)
		return {
			id,
			name,
			label,
			meta,
			type: 'table',
			style: props?.style,
			columns: props?.columns,
			header: props?.header,
			rows: props?.rows,
			tableStyle: props?.tableStyle,
		}
	}

	throw new Error(`Unknown JSX element type: ${String(type)}`)
}

export const jsxs = jsx
