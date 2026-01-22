import type { ReactNode } from 'react'
import type {
	ContainerNode,
	PolygonNode,
	RelativeNode,
	SceneNode,
	TableNode,
	TextNode
} from '@jiujue/weave-types'

const REACT_ELEMENT_TYPE = Symbol.for('react.element')
const REACT_FRAGMENT_TYPE = Symbol.for('react.fragment')

type ReactElementLike = Readonly<{
	$$typeof: symbol
	type: unknown
	key: unknown
	props: any
}>

function isSceneNodeLike(value: unknown): value is SceneNode {
	if (!value || typeof value !== 'object') return false
	const v = value as any
	return (
		typeof v.id === 'string' &&
		(v.type === 'container' ||
			v.type === 'relative' ||
			v.type === 'text' ||
			v.type === 'polygon' ||
			v.type === 'table')
	)
}

function isReactElementLike(value: unknown): value is ReactElementLike {
	return (
		!!value &&
		typeof value === 'object' &&
		(value as any).$$typeof === REACT_ELEMENT_TYPE
	)
}

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
	const out: SceneNode[] = []
	for (const c of children) {
		if (isSceneNodeLike(c)) out.push(c)
		else if (isReactElementLike(c)) out.push(fromReactElement(c))
	}
	return out
}

function childrenToText(children: Child[]): string {
	let s = ''
	for (const c of children) {
		if (typeof c === 'string') s += c
		else if (typeof c === 'number') s += String(c)
	}
	return s
}

function fromReactElement(el: ReactElementLike): SceneNode {
	if (el.type === REACT_FRAGMENT_TYPE) {
		const children: Child[] = []
		flattenChildren(el.props?.children, children)
		const nodes = childrenToNodes(children)
		if (nodes.length !== 1)
			throw new Error('Fragment must have exactly one SceneNode child')
		return nodes[0]
	}

	if (typeof el.type !== 'string') {
		throw new Error(
			`Only intrinsic elements are supported. Got: ${String(el.type)}`
		)
	}

	const type = el.type
	const name =
		typeof el.props?.displayName === 'string'
			? el.props.displayName
			: typeof el.props?.name === 'string'
				? el.props.name
				: undefined
	const label = typeof el.props?.label === 'string' ? el.props.label : undefined
	const meta =
		el.props?.meta &&
		typeof el.props.meta === 'object' &&
		!Array.isArray(el.props.meta)
			? (el.props.meta as Readonly<Record<string, unknown>>)
			: undefined
	const children: Child[] = []
	flattenChildren(el.props?.children, children)

	if (type === 'container') {
		const node: ContainerNode = {
			id: requireId(el.key, el.props),
			name,
			label,
			meta,
			type: 'container',
			style: el.props?.style,
			paint: el.props?.paint,
			children: childrenToNodes(children)
		}
		return node
	}

	if (type === 'relative') {
		const node: RelativeNode = {
			id: requireId(el.key, el.props),
			name,
			label,
			meta,
			type: 'relative',
			style: el.props?.style,
			paint: el.props?.paint,
			children: childrenToNodes(children)
		}
		return node
	}

	if (type === 'text') {
		const node: TextNode = {
			id: requireId(el.key, el.props),
			name,
			label,
			meta,
			type: 'text',
			style: el.props?.style,
			textStyle: el.props?.textStyle,
			text:
				typeof el.props?.text === 'string'
					? el.props.text
					: childrenToText(children),
			children: []
		}
		return node
	}

	if (type === 'polygon') {
		const node: PolygonNode = {
			id: requireId(el.key, el.props),
			name,
			label,
			meta,
			type: 'polygon',
			style: el.props?.style,
			points: el.props?.points,
			paint: el.props?.paint,
			children: []
		}
		return node
	}

	if (type === 'table') {
		const node: TableNode = {
			id: requireId(el.key, el.props),
			name,
			label,
			meta,
			type: 'table',
			style: el.props?.style,
			columns: el.props?.columns,
			header: el.props?.header,
			rows: el.props?.rows,
			tableStyle: el.props?.tableStyle
		}
		return node
	}

	throw new Error(`Unknown intrinsic element: ${type}`)
}

export function sceneToJSX(node: SceneNode, indent = 0): string {
	const spaces = '  '.repeat(indent)
	const childIndent = '  '.repeat(indent + 1)

	const props = Object.entries(node)
		.filter(([key]) => key !== 'type' && key !== 'children' && key !== 'text')
		.map(([key, value]) => {
			if (value === undefined) return ''
			if (key === 'id') return `id="${value}"`
			return `${key}={${JSON.stringify(value)}}`
		})
		.filter(Boolean)
		.join(' ')

	if (node.type === 'text') {
		return `${spaces}<text ${props}>${node.text}</text>`
	}

	if (
		(node.type === 'container' || node.type === 'relative') &&
		node.children &&
		node.children.length > 0
	) {
		const children = node.children
			.map(child => sceneToJSX(child, indent + 1))
			.join('\n')
		return `${spaces}<${node.type} ${props}>\n${children}\n${spaces}</${node.type}>`
	}

	return `${spaces}<${node.type} ${props} />`
}

export function sceneFromJSX(node: ReactNode): SceneNode {
	if (isSceneNodeLike(node)) return node
	if (!isReactElementLike(node))
		throw new Error('sceneFromJSX expects a ReactElement (JSX expression)')
	return fromReactElement(node)
}
