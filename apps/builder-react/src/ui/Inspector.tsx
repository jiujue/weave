import React, { useEffect, useState } from 'react'
import { useEditor, findNode, removeNode } from '../state/editor'
import { registry, sceneToJSX } from '@jiujue/weave-editor-core'
import { Trash2 } from 'lucide-react'
import type { SceneNode } from '@jiujue/weave-types'

const get = (obj: any, path: string) => {
	return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}

const set = (obj: any, path: string, value: any) => {
	const parts = path.split('.')
	let current = obj
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i]
		if (!current[part]) current[part] = {}
		current = current[part]
	}
	current[parts[parts.length - 1]] = value
}

export function Inspector() {
	const editor = useEditor()
	const selectedId = editor.selection[0]
	const [jsonDrafts, setJsonDrafts] = useState<Record<string, string>>({})
	const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({})

	// Keyboard shortcut for deletion
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
				// Don't delete if focused on an input
				if (
					document.activeElement instanceof HTMLInputElement ||
					document.activeElement instanceof HTMLTextAreaElement
				) {
					return
				}
				const newScene = removeNode(editor.scene, selectedId)
				if (newScene) {
					editor.updateScene(newScene)
					editor.setSelection([])
				}
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [selectedId, editor.scene]) // Re-bind when selection or scene changes

	const handleDelete = () => {
		if (!selectedId) return
		const newScene = removeNode(editor.scene, selectedId)
		if (newScene) {
			editor.updateScene(newScene)
			editor.setSelection([])
		}
	}

	if (!selectedId) {
		return (
			<div className='flex flex-col h-full'>
				<div className='text-sm text-slate-400 mb-auto'>Select an item</div>
				<button
					className='w-full bg-slate-800 text-white text-xs py-2 rounded hover:bg-slate-700 mt-4'
					onClick={() => {
						const code = sceneToJSX(editor.scene)
						console.log(code)
						alert('Code logged to console')
					}}
				>
					Export Full Scene JSX
				</button>
			</div>
		)
	}

	const node = findNode(editor.scene, selectedId)
	if (!node) return <div>Node not found</div>

	const def = registry.get(node.type)
	if (!def)
		return (
			<div className='flex flex-col gap-4'>
				<div className='text-sm font-medium'>Unknown Type: {node.type}</div>
				<pre className='text-xs bg-slate-50 p-2 rounded overflow-auto border border-slate-100'>
					{JSON.stringify(node, null, 2)}
				</pre>
			</div>
		)

	const handleChange = (path: string, value: any) => {
		// Mutate in place and notify
		set(node, path, value)
		editor.updateScene(editor.scene)
	}

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-col gap-1 pb-4 border-b border-slate-100'>
				<div className='flex items-center justify-between'>
					<div className='text-sm font-medium text-slate-800'>{def.label}</div>
					<button
						onClick={handleDelete}
						className='text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100 transition-colors'
						title='Delete'
					>
						<Trash2 size={14} />
					</button>
				</div>
				<div className='text-xs text-slate-400 font-mono'>{node.id}</div>
			</div>

			{def.props.map(prop => {
				const value = get(node, prop.name) ?? prop.defaultValue
				const jsonKey = `${node.id}:${prop.name}`
				const jsonDraft = jsonDrafts[jsonKey]
				const jsonError = jsonErrors[jsonKey]

				return (
					<div key={prop.name} className='flex flex-col gap-1'>
						<label className='text-xs font-medium text-slate-500'>
							{prop.label}
						</label>
						{prop.type === 'string' && (
							<input
								className='border border-slate-200 rounded px-2 py-1.5 text-sm bg-white text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
								value={value || ''}
								onChange={e => handleChange(prop.name, e.target.value)}
							/>
						)}
						{prop.type === 'number' && (
							<input
								type='number'
								className='border border-slate-200 rounded px-2 py-1.5 text-sm bg-white text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
								value={value ?? ''}
								onChange={e => handleChange(prop.name, Number(e.target.value))}
							/>
						)}
						{prop.type === 'color' && (
							<div className='flex gap-2 items-center'>
								<div className='relative w-8 h-8 rounded border border-slate-200 overflow-hidden shrink-0'>
									<input
										type='color'
										className='absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0'
										value={value || '#000000'}
										onChange={e => handleChange(prop.name, e.target.value)}
									/>
								</div>
								<input
									className='border border-slate-200 rounded px-2 py-1.5 text-sm bg-white text-slate-700 flex-1 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono'
									value={value || ''}
									onChange={e => handleChange(prop.name, e.target.value)}
								/>
							</div>
						)}
						{prop.type === 'enum' && (
							<select
								className='border border-slate-200 rounded px-2 py-1.5 text-sm bg-white text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
								value={value || ''}
								onChange={e => handleChange(prop.name, e.target.value)}
							>
								{prop.options?.map(opt => (
									<option key={opt} value={opt}>
										{opt}
									</option>
								))}
							</select>
						)}
						{prop.type === 'json' && (
							<>
								<textarea
									className='border border-slate-200 rounded px-2 py-1.5 text-xs bg-white text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono min-h-[140px]'
									value={
										jsonDraft ??
										(value === undefined ? '' : JSON.stringify(value, null, 2))
									}
									onChange={e => {
										const next = e.target.value
										setJsonDrafts(prev => ({ ...prev, [jsonKey]: next }))
										setJsonErrors(prev => {
											if (!prev[jsonKey]) return prev
											const copy = { ...prev }
											delete copy[jsonKey]
											return copy
										})
									}}
									onBlur={() => {
										const raw =
											jsonDraft ??
											(value === undefined
												? ''
												: JSON.stringify(value, null, 2))
										const trimmed = raw.trim()
										if (!trimmed) return
										try {
											const parsed = JSON.parse(trimmed)
											handleChange(prop.name, parsed)
											setJsonDrafts(prev => {
												if (!prev[jsonKey]) return prev
												const copy = { ...prev }
												delete copy[jsonKey]
												return copy
											})
											setJsonErrors(prev => {
												if (!prev[jsonKey]) return prev
												const copy = { ...prev }
												delete copy[jsonKey]
												return copy
											})
										} catch (err) {
											setJsonErrors(prev => ({
												...prev,
												[jsonKey]:
													err instanceof Error ? err.message : 'Invalid JSON'
											}))
										}
									}}
								/>
								{jsonError && (
									<div className='text-xs text-red-600 font-mono'>
										{jsonError}
									</div>
								)}
							</>
						)}
					</div>
				)
			})}
		</div>
	)
}
