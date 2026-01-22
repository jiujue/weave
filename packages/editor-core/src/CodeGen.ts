import type { SceneNode } from '@jiujue/weave-types'

export function sceneToJSX(node: SceneNode, indent = 0): string {
	const spaces = ' '.repeat(indent)

	const props = Object.entries(node as any)
		.filter(([key]) => key !== 'type' && key !== 'children' && key !== 'text')
		.map(([key, value]) => {
			if (value === undefined) return ''
			if (key === 'id') return `id="${value}"`
			return `${key}={${JSON.stringify(value)}}`
		})
		.filter(Boolean)
		.join(' ')

	const open = props ? `<${node.type} ${props}` : `<${node.type}`

	if (node.type === 'text') {
		return `${spaces}${open}>${(node as any).text}</${node.type}>`
	}

	if (
		'children' in node &&
		Array.isArray((node as any).children) &&
		(node as any).children.length > 0
	) {
		const childrenStr = (node as any).children
			.map((c: SceneNode) => sceneToJSX(c as SceneNode, indent + 2))
			.join('\n')
		return `${spaces}${open}>\n${childrenStr}\n${spaces}</${node.type}>`
	}

	return `${spaces}${open} />`
}
