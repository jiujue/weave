import React, { useState, useEffect } from 'react'
import { WeaveCanvas } from './WeaveCanvas'
import { useEditor } from '../state/editor'
import { LayerTree } from './LayerTree'
import { Inspector } from './Inspector'
import { Palette } from './Palette'
import { Layers, PlusSquare, Minus, Plus, Palette as PaletteIcon } from 'lucide-react'
import { clsx } from 'clsx'

export function App() {
	const editor = useEditor()
	const [activeTab, setActiveTab] = useState<'layers' | 'assets'>('layers')
	const [zoom, setZoom] = useState(editor.zoom)
	const [showBgPicker, setShowBgPicker] = useState(false)

	useEffect(() => {
		setZoom(editor.zoom)
	}, [editor.version])

	const handleZoomOut = () => {
		const next = Math.max(0.1, zoom - 0.1)
		editor.setZoom(next)
		setZoom(next)
	}

	const handleZoomIn = () => {
		const next = Math.min(5, zoom + 0.1)
		editor.setZoom(next)
		setZoom(next)
	}

	const bgColors = ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#0f172a', '#000000']

	return (
		<div className="h-full min-h-0 grid grid-cols-[280px_1fr_320px] bg-slate-50">
			{/* Left Sidebar */}
			<div className="border-r border-slate-200 bg-white flex flex-col min-h-0">
				<div className="flex border-b border-slate-100">
					<button
						className={clsx(
							'flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-colors',
							activeTab === 'layers'
								? 'border-slate-800 text-slate-800'
								: 'border-transparent text-slate-500 hover:text-slate-700',
						)}
						onClick={() => setActiveTab('layers')}
					>
						<Layers size={14} />
						Layers
					</button>
					<button
						className={clsx(
							'flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-colors',
							activeTab === 'assets'
								? 'border-slate-800 text-slate-800'
								: 'border-transparent text-slate-500 hover:text-slate-700',
						)}
						onClick={() => setActiveTab('assets')}
					>
						<PlusSquare size={14} />
						Assets
					</button>
				</div>

				<div className="flex-1 min-h-0 overflow-auto">
					{activeTab === 'layers' ? (
						<div className="p-2">
							<LayerTree />
						</div>
					) : (
						<Palette />
					)}
				</div>
			</div>

			{/* Center: Canvas */}
			<div className="relative bg-[#1e1e1e] overflow-hidden flex flex-col min-h-0">
				{/* Toolbar */}
				<div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
					<div className="bg-sky-300 backdrop-blur text-white/80 text-xs px-2 py-1.5 rounded-full flex items-center gap-2 select-none">
						<button className="p-1 hover:bg-white/20 rounded-full" onClick={handleZoomOut}>
							<Minus size={12} />
						</button>
						<span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
						<button className="p-1 hover:bg-white/20 rounded-full" onClick={handleZoomIn}>
							<Plus size={12} />
						</button>
					</div>

					<div className="relative flex">
						<button
							className=" bg-sky-300 rounded-full ring-1 ring-black/20 "
							onClick={() => setShowBgPicker(!showBgPicker)}
							title="Change Background Color"
						>
							<div
								className="w-4 h-4 rounded-full border border-white/20"
								style={{ backgroundColor: editor.canvasBackgroundColor }}
							/>
						</button>
						{showBgPicker && (
							<div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded shadow-lg p-2 flex gap-1 z-20">
								{bgColors.map((c) => (
									<button
										key={c}
										className="w-5 h-5 rounded-full border border-slate-200 hover:scale-110 transition-transform"
										style={{ backgroundColor: c }}
										onClick={() => {
											editor.setCanvasBackgroundColor(c)
											setShowBgPicker(false)
										}}
									/>
								))}
							</div>
						)}
					</div>
				</div>
				<WeaveCanvas scene={editor.scene} version={editor.version} />
			</div>

			{/* Right Sidebar: Inspector */}
			<div className="border-l border-slate-200 bg-white flex flex-col min-h-0">
				<div className="p-4 border-b border-slate-100 font-medium text-sm text-slate-700">
					Properties
				</div>
				<div className="flex-1 min-h-0 overflow-auto p-4">
					<Inspector />
				</div>
			</div>
		</div>
	)
}
