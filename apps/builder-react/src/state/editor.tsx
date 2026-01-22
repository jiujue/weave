import { EditorState } from '@jiujue/weave-editor-core'
import { sceneFromJSX } from '@jiujue/weave-react'
import React, { useEffect, useState } from 'react'
import type { SceneNode } from '@jiujue/weave-types'
import { initRegistry } from './initRegistry'

// Initialize Registry
initRegistry()

// Initial Scene Definition
const initialScene = sceneFromJSX(
	<container
		id='root'
		style={{
			width: '100%',
			height: '100%',
			flexDirection: 'column',
			background: { color: '#0f172a' }
		}}
	>
		<container
			id='header'
			style={{
				height: 60,
				width: '100%',
				flexDirection: 'row',
				alignItems: 'center',
				paddingHorizontal: 20,
				background: { color: '#1e293b' }
			}}
		>
			<text
				id='logo'
				textStyle={{ fontSize: 20, fontWeight: 700, color: '#fff' }}
			>
				Weave Editor
			</text>
			<text id='subtitle' textStyle={{ fontSize: 14, color: '#94a3b8' }}>
				Built with React + Worker
			</text>
		</container>
		<container
			id='content'
			style={{ flexGrow: 1, flexDirection: 'row', padding: 20, gap: 20 }}
		>
			<container
				id='card1'
				style={{
					width: 200,
					height: 150,
					background: { color: '#334155' },
					borderRadius: 8
				}}
			/>
			<container
				id='card2'
				style={{
					width: 200,
					height: 150,
					background: { color: '#334155' },
					borderRadius: 8
				}}
			/>
		</container>
	</container>
)

// Singleton instance
export const editor = new EditorState(initialScene as SceneNode)

function isParentableNode(node: SceneNode): boolean {
	return (
		node.type === 'container' ||
		node.type === 'relative' ||
		node.type === 'table'
	)
}

// Helper to find node by ID
export function findNode(root: SceneNode, id: string): SceneNode | null {
	if (root.id === id) return root
	if (isParentableNode(root)) {
		const children = (root as any).children as SceneNode[] | undefined
		if (Array.isArray(children)) {
			for (const child of children) {
				const found = findNode(child as SceneNode, id)
				if (found) return found
			}
		}
	}
	return null
}

// Helper to find parent of node by ID
export function findParent(root: SceneNode, id: string): SceneNode | null {
	if (isParentableNode(root)) {
		const children = (root as any).children as SceneNode[] | undefined
		if (Array.isArray(children)) {
			for (const child of children) {
				if (child.id === id) return root
				const found = findParent(child as SceneNode, id)
				if (found) return found
			}
		}
	}
	return null
}

// Helper to remove node
export function removeNode(root: SceneNode, id: string): SceneNode | null {
	if (root.id === id) return null // Cannot remove root if we are calling on root, handled by caller usually

	if (isParentableNode(root)) {
		const children = (root as any).children as SceneNode[] | undefined
		const list = Array.isArray(children) ? children : []
		const index = list.findIndex(c => c.id === id)
		if (index !== -1) {
			const newChildren = [...list]
			newChildren.splice(index, 1)
			return { ...root, children: newChildren } as SceneNode
		}

		for (let i = 0; i < list.length; i++) {
			const child = list[i]
			const newChild = removeNode(child as SceneNode, id)
			if (newChild !== child) {
				const newChildren = [...list]
				newChildren[i] = newChild!
				return { ...root, children: newChildren } as SceneNode
			}
		}
	}
	return root
}

// Helper to insert node
export function insertNode(
	root: SceneNode,
	parentId: string,
	node: SceneNode,
	index?: number
): SceneNode {
	if (root.id === parentId) {
		if (isParentableNode(root)) {
			const children = (root as any).children as SceneNode[] | undefined
			const newChildren = Array.isArray(children) ? [...children] : []
			if (typeof index === 'number' && index >= 0) {
				newChildren.splice(index, 0, node)
			} else {
				newChildren.push(node)
			}
			return { ...root, children: newChildren } as SceneNode
		}
		return root
	}

	if (isParentableNode(root)) {
		const children = (root as any).children as SceneNode[] | undefined
		const list = Array.isArray(children) ? children : []
		for (let i = 0; i < list.length; i++) {
			const child = list[i]
			const newChild = insertNode(child as SceneNode, parentId, node, index)
			if (newChild !== child) {
				const newChildren = [...list]
				newChildren[i] = newChild
				return { ...root, children: newChildren } as SceneNode
			}
		}
	}
	return root
}

// Helper to move node
export function moveNode(
	root: SceneNode,
	dragId: string,
	targetId: string,
	position: 'before' | 'after' | 'inside'
): SceneNode {
	if (dragId === targetId) return root

	// 1. Find the node to move
	const nodeToMove = findNode(root, dragId)
	if (!nodeToMove) return root

	// 2. Remove it from old location
	const sceneWithoutNode = removeNode(root, dragId)
	if (!sceneWithoutNode) return root

	// 3. Determine new parent and index
	let newParentId = ''
	let newIndex: number | undefined = undefined

	if (position === 'inside') {
		newParentId = targetId
		// Append to end
	} else {
		const targetParent = findParent(root, targetId)
		if (!targetParent) return root // Can't move relative to root if root is target?
		newParentId = targetParent.id

		// Find index of target in its parent
		// Note: We need to find index in sceneWithoutNode because removal might have shifted indices
		// But wait, if we removed it first, we need to find target in the new tree.
		const newTargetParent = findNode(sceneWithoutNode, newParentId)
		if (
			!newTargetParent ||
			!('children' in newTargetParent) ||
			!newTargetParent.children
		)
			return root

		const targetIndex = newTargetParent.children.findIndex(
			c => c.id === targetId
		)
		if (targetIndex === -1) return root

		newIndex = position === 'before' ? targetIndex : targetIndex + 1
	}

	// 4. Insert at new location
	return insertNode(sceneWithoutNode, newParentId, nodeToMove, newIndex)
}

// Hook
export function useEditor() {
	const [version, setVersion] = useState(0)

	useEffect(() => {
		return editor.subscribe(() => setVersion(v => v + 1))
	}, [])

	return editor
}
