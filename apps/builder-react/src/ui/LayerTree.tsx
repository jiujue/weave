import React, { useRef, useState } from 'react'
import { useEditor, moveNode } from '../state/editor'
import { clsx } from 'clsx'
import {
	Box,
	Type,
	Table,
	Hexagon,
	ChevronRight,
	ChevronDown,
	Trash2,
	Download,
	Upload,
	FileJson,
	FileCode,
	MoreHorizontal,
	LayoutTemplate,
} from 'lucide-react'
import * as Babel from '@babel/standalone'
import type { SceneNode } from '@jiujue/weave-types'
import { removeNode } from '../state/editor'
import { sceneToJSX } from '@jiujue/weave-react'
import { JuejinPage } from '../JuejinDemo'

// Simple JSX AST to SceneNode converter
// This is a basic implementation and might not cover all edge cases
const jsxToScene = (code: string): SceneNode | null => {
	try {
		// Transpile JSX to JS calls (React.createElement)
		const transpiled = Babel.transform(code, {
			presets: ['react'],
		}).code

		if (!transpiled) return null

		// Helper to execute the transpiled code safely
		// We mock React.createElement to build our SceneNode tree instead of React elements
		const mockCreateElement = (type: string, props: any, ...children: any[]) => {
			const node: any = { type, ...props }

			// Handle children
			if (children && children.length > 0) {
				// Flatten children array and filter out nulls/strings (unless it's text content)
				const flatChildren = children.flat().filter((c) => c !== null && c !== undefined)

				if (type === 'text') {
					// For text nodes, children are the text content
					node.text = flatChildren.join('')
				} else {
					// For other nodes, children are child nodes
					// Filter out strings (whitespace) that might appear in JSX
					node.children = flatChildren.filter((c) => typeof c === 'object')
				}
			}

			// Generate ID if missing (simple random id)
			if (!node.id) {
				node.id = type + '_' + Math.random().toString(36).substr(2, 5)
			}

			return node
		}

		// Execute the code with our mock React
		// The code usually starts with "React.createElement(...)" or similar
		// We wrap it in a function to return the result
		const runner = new Function('React', `return ${transpiled}`)
		const result = runner({ createElement: mockCreateElement })

		return result as SceneNode
	} catch (err) {
		console.error('JSX Import Error:', err)
		return null
	}
}

const NodeIcon = ({ type }: { type: string }) => {
	switch (type) {
		case 'container':
			return <Box size={14} />
		case 'relative':
			return <LayoutTemplate size={14} />
		case 'text':
			return <Type size={14} />
		case 'table':
			return <Table size={14} />
		case 'polygon':
			return <Hexagon size={14} />
		default:
			return <Box size={14} />
	}
}

const TreeNode = ({ node, depth = 0 }: { node: SceneNode; depth?: number }) => {
	const editor = useEditor()
	const isSelected = editor.selection.includes(node.id)
	// Simple check for children property
	const children = 'children' in node ? ((node as any).children as SceneNode[]) : undefined
	const hasChildren = children && children.length > 0
	const [expanded, setExpanded] = React.useState(true)
	const [dragOver, setDragOver] = useState<'top' | 'bottom' | 'inside' | null>(null)
	const ref = useRef<HTMLDivElement>(null)

	const handleSelect = (e: React.MouseEvent) => {
		e.stopPropagation()
		editor.setSelection([node.id])
	}

	const handleToggle = (e: React.MouseEvent) => {
		e.stopPropagation()
		setExpanded(!expanded)
	}

	const handleDragStart = (e: React.DragEvent) => {
		e.stopPropagation()
		e.dataTransfer.setData('application/weave-node', node.id)
		e.dataTransfer.effectAllowed = 'move'
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (!ref.current) return

		const rect = ref.current.getBoundingClientRect()
		const y = e.clientY - rect.top
		const height = rect.height

		// 25% top -> insert before
		// 25% bottom -> insert after
		// 50% middle -> insert inside (if container)

		if (node.type === 'container' || node.type === 'relative' || node.type === 'table') {
			if (y < height * 0.25) setDragOver('top')
			else if (y > height * 0.75) setDragOver('bottom')
			else setDragOver('inside')
		} else {
			if (y < height * 0.5) setDragOver('top')
			else setDragOver('bottom')
		}
	}

	const handleDragLeave = (e: React.DragEvent) => {
		e.stopPropagation()
		setDragOver(null)
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setDragOver(null)

		const dragId = e.dataTransfer.getData('application/weave-node')
		if (!dragId || dragId === node.id) return

		let position: 'before' | 'after' | 'inside' = 'inside'
		if (dragOver === 'top') position = 'before'
		if (dragOver === 'bottom') position = 'after'

		// Can't drop inside non-container
		if (
			position === 'inside' &&
			node.type !== 'container' &&
			node.type !== 'relative' &&
			node.type !== 'table'
		) {
			position = 'after'
		}

		const newScene = moveNode(editor.scene, dragId, node.id, position)
		if (newScene !== editor.scene) {
			editor.updateScene(newScene)
		}
	}

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (node.id === 'root') return
		const newScene = removeNode(editor.scene, node.id)
		if (newScene) {
			editor.updateScene(newScene)
			editor.setSelection([])
		}
	}

	return (
		<div>
			<div
				ref={ref}
				draggable
				className={clsx(
					'group flex items-center h-8 cursor-pointer text-slate-700 select-none pr-2 relative border-transparent border-y-2',
					isSelected ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-slate-100',
					dragOver === 'top' && 'border-t-blue-500',
					dragOver === 'bottom' && 'border-b-blue-500',
					dragOver === 'inside' && 'bg-blue-100 ring-1 ring-inset ring-blue-500',
				)}
				style={{ paddingLeft: depth * 12 + 4 }}
				onClick={handleSelect}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				<div
					className="w-5 h-5 flex items-center justify-center mr-0.5 text-slate-400 hover:text-slate-600 shrink-0"
					onClick={hasChildren ? handleToggle : undefined}
				>
					{hasChildren && (expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
				</div>
				<div className="mr-2 opacity-70 shrink-0">
					<NodeIcon type={node.type} />
				</div>
				<span className="text-xs truncate flex-1">{node.id}</span>
				{node.id !== 'root' && (
					<button
						className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
						onClick={handleDelete}
						title="Delete"
					>
						<Trash2 size={12} />
					</button>
				)}
			</div>
			{hasChildren && expanded && (
				<div>
					{children.map((child: SceneNode) => (
						<TreeNode key={child.id} node={child} depth={depth + 1} />
					))}
				</div>
			)}
		</div>
	)
}

export function LayerTree() {
	const editor = useEditor()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [showMenu, setShowMenu] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	// Close menu when clicking outside
	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setShowMenu(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const handleExportJSON = () => {
		const json = JSON.stringify(editor.scene, null, 2)
		const blob = new Blob([json], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `weave-scene-${Date.now()}.json`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
		setShowMenu(false)
	}

	const handleExportJSX = () => {
		const jsx = sceneToJSX(editor.scene)
		const blob = new Blob([jsx], { type: 'text/plain' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `weave-scene-${Date.now()}.jsx`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
		setShowMenu(false)
	}

	const handleLoadDemo = () => {
		if (window.confirm('This will replace your current scene with the Juejin Demo. Continue?')) {
			setShowMenu(false)
			requestAnimationFrame(() => {
				const canvas = document.getElementById('weave-canvas') as HTMLCanvasElement | null
				const rect = canvas?.getBoundingClientRect()
				const canvasW = rect?.width ?? 0
				const maxViewportW = 1440
				const nextZoom = canvasW > 0 ? Math.min(1, maxViewportW / canvasW) : 1
				editor.setZoom(Math.max(0.1, Math.min(5, nextZoom)))
				editor.updateScene(JuejinPage())
				editor.setSelection([])
			})
			return
		}
		setShowMenu(false)
	}

	const handleImport = () => {
		fileInputRef.current?.click()
		setShowMenu(false)
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		const reader = new FileReader()
		reader.onload = (event) => {
			try {
				const content = event.target?.result as string
				if (file.name.endsWith('.json')) {
					const json = JSON.parse(content)
					if (json && typeof json === 'object' && json.id && json.type) {
						editor.updateScene(json)
					} else {
						alert('Invalid scene JSON')
					}
				} else if (file.name.endsWith('.jsx') || file.name.endsWith('.tsx')) {
					const node = jsxToScene(content)
					if (node) {
						editor.updateScene(node)
					} else {
						alert('Failed to parse JSX. Please ensure it is valid React JSX.')
					}
				}
			} catch (err) {
				console.error(err)
				alert('Failed to parse file')
			}
		}
		reader.readAsText(file)
		e.target.value = ''
	}

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between p-2 border-b border-slate-200 bg-slate-50 relative">
				<span className="text-xs font-semibold text-slate-500 uppercase">Layers</span>
				<div className="flex gap-1" ref={menuRef}>
					<button
						className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
						onClick={() => setShowMenu(!showMenu)}
						title="Menu"
					>
						<MoreHorizontal size={16} />
					</button>

					{showMenu && (
						<div className="absolute top-full right-2 mt-1 w-40 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50 flex flex-col text-xs">
							<button
								className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left w-full"
								onClick={handleLoadDemo}
							>
								<LayoutTemplate size={14} className="text-slate-400" />
								<span>Load Juejin Demo</span>
							</button>
							<div className="h-px bg-slate-100 my-1" />
							<button
								className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left w-full"
								onClick={handleImport}
							>
								<Upload size={14} className="text-slate-400" />
								<span>Import JSON / JSX</span>
							</button>
							<div className="h-px bg-slate-100 my-1" />
							<button
								className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left w-full"
								onClick={handleExportJSON}
							>
								<FileJson size={14} className="text-slate-400" />
								<span>Export JSON</span>
							</button>
							<button
								className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left w-full"
								onClick={handleExportJSX}
							>
								<FileCode size={14} className="text-slate-400" />
								<span>Export JSX</span>
							</button>
						</div>
					)}
				</div>
				<input
					ref={fileInputRef}
					type="file"
					accept=".json,.jsx,.tsx"
					className="hidden"
					onChange={handleFileChange}
				/>
			</div>
			<div className="flex-1 overflow-y-auto pb-10">
				<TreeNode node={editor.scene} />
			</div>
		</div>
	)
}
