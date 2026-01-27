import type React from 'react'
import type { FlatTreeItem, TreeSelectKey, TreeSelectNode } from './types'

export function normalizeKey(node: TreeSelectNode): TreeSelectKey {
	return typeof node.key === 'string' && node.key.length > 0 ? node.key : node.value
}

export function isTextLike(value: React.ReactNode): value is string {
	return typeof value === 'string'
}

export function nodeTitleText(title: React.ReactNode): string {
	if (typeof title === 'string') return title
	if (typeof title === 'number') return String(title)
	return ''
}

export function generateTreeData(params: {
	depth: number
	total: number
}): readonly TreeSelectNode[] {
	const depth = Math.max(1, Math.floor(params.depth))
	const total = Math.max(1, Math.floor(params.total))

	let used = 0
	let id = 1

	function makeNode(level: number): TreeSelectNode {
		const currentId = id++
		used++
		const key = `n-${currentId}`

		const canHaveChildren = level < depth && used < total
		if (!canHaveChildren) {
			return { key, value: key, title: `Node ${currentId}` }
		}

		const remaining = total - used
		const maxChildren = Math.min(6, Math.max(1, remaining))
		const childrenCount = Math.min(maxChildren, 2 + (currentId % 4))

		const children: TreeSelectNode[] = []
		for (let i = 0; i < childrenCount; i++) {
			if (used >= total) break
			children.push(makeNode(level + 1))
		}

		return { key, value: key, title: `Node ${currentId}`, children }
	}

	const roots: TreeSelectNode[] = []
	while (used < total) {
		roots.push(makeNode(1))
	}
	return roots
}

export function findNodeByValue(
	treeData: readonly TreeSelectNode[],
	value: string,
): TreeSelectNode | null {
	for (const node of treeData) {
		if (node.value === value) return node
		if (node.children?.length) {
			const found = findNodeByValue(node.children, value)
			if (found) return found
		}
	}
	return null
}

export function collectDefaultExpandedKeys(
	treeData: readonly TreeSelectNode[],
): readonly TreeSelectKey[] {
	const out: TreeSelectKey[] = []
	const walk = (nodes: readonly TreeSelectNode[]) => {
		for (const n of nodes) {
			if (n.children?.length) out.push(normalizeKey(n))
			if (n.children?.length) walk(n.children)
		}
	}
	walk(treeData)
	return out
}

export function filterTreeData(params: {
	treeData: readonly TreeSelectNode[]
	query: string
}): readonly TreeSelectNode[] {
	const q = params.query.trim().toLowerCase()
	if (!q) return params.treeData

	const walk = (nodes: readonly TreeSelectNode[]): TreeSelectNode[] => {
		const out: TreeSelectNode[] = []
		for (const n of nodes) {
			const titleText = nodeTitleText(n.title).toLowerCase()
			const children = n.children?.length ? walk(n.children) : []
			const selfMatch = titleText.includes(q)
			if (selfMatch || children.length > 0) {
				out.push({ ...n, children: children.length > 0 ? children : n.children })
			}
		}
		return out
	}

	return walk(params.treeData)
}

export function flattenVisibleTree(params: {
	treeData: readonly TreeSelectNode[]
	expandedKeys: ReadonlySet<TreeSelectKey>
}): readonly FlatTreeItem[] {
	const out: FlatTreeItem[] = []

	const walk = (nodes: readonly TreeSelectNode[], level: number) => {
		for (const n of nodes) {
			const key = normalizeKey(n)
			const hasChildren = !!n.children?.length
			out.push({
				key,
				value: n.value,
				title: n.title,
				level,
				hasChildren,
				disabled: !!n.disabled,
				selectable: n.selectable !== false,
			})
			if (hasChildren && params.expandedKeys.has(key)) {
				walk(n.children!, level + 1)
			}
		}
	}

	walk(params.treeData, 0)
	return out
}
