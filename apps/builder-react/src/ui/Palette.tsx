import React, { useState } from 'react'
import { useEditor } from '../state/editor'
import { registry } from '@jiujue/weave-editor-core'
import { Box, Plus } from 'lucide-react'
import type { SceneNode } from '@jiujue/weave-types'

export function Palette() {
	const editor = useEditor()
	const components = registry.getAll()

	const handleAdd = (type: string) => {
		const def = registry.get(type)
		if (!def || !def.create) return

		const newNode = def.create() as SceneNode
		// Ensure ID is unique
		newNode.id = `${type}-${Math.random().toString(36).slice(2, 7)}`

		// Add to root for now, or selected container if available
		const root = editor.scene
		// Simple logic: if root is container, push to children
		if ('children' in root && Array.isArray(root.children)) {
			const newChildren = [...root.children, newNode]
			// This is a bit hacky, ideally we use patches or a proper update method
			// We need to update the root node immutably
			const newRoot = { ...root, children: newChildren }
			editor.updateScene(newRoot as SceneNode)
			// Auto select new node
			editor.setSelection([newNode.id])
		}
	}

	return (
		<div className='grid grid-cols-2 gap-2 p-2'>
			{components.map(comp => (
				<button
					key={comp.type}
					className='flex flex-col items-center justify-center p-3 border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 transition-colors'
					onClick={() => handleAdd(comp.type)}
				>
					<Box size={20} className='text-slate-500 mb-1' />
					<span className='text-xs text-slate-600 font-medium'>
						{comp.label}
					</span>
				</button>
			))}
		</div>
	)
}
