import React, { useEffect, useRef, useState } from 'react'
import { createWeaveApp } from '@jiujue/weave-app'
import type { SceneNode } from '@jiujue/weave-types'
import { editor } from '../state/editor'

type OverlayRect = {
	x: number
	y: number
	width: number
	height: number
}

export function WeaveCanvas(
	props: Readonly<{ scene: SceneNode; version?: number }>
) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const appRef = useRef<ReturnType<typeof createWeaveApp> | null>(null)
	const [overlay, setOverlay] = useState<OverlayRect | null>(null)
	const [selectionId, setSelectionId] = useState<string | null>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		// Initialize scale and dpr from editor state or window
		if (editor.dpr === 1) {
			editor.setDpr(window.devicePixelRatio || 1)
		}

		const app = createWeaveApp({
			canvas,
			clearColor: editor.canvasBackgroundColor,
			scene: props.scene,
			dpr: editor.dpr,
			scale: editor.zoom,
			devtools: { enabled: true, name: 'builder-react', log: true },
			onError(message) {
				console.error('[weave worker error]', message)
			}
		})
		appRef.current = app
		app.render()

		const onResize = () => {
			app.resize(editor.dpr, editor.zoom)
			app.render()
		}
		window.addEventListener('resize', onResize)
		let raf = 0
		const ro = new ResizeObserver(() => {
			onResize()
			if (raf) cancelAnimationFrame(raf)
			raf = requestAnimationFrame(onResize)
		})
		ro.observe(canvas)

		// Subscribe to zoom/dpr changes
		const unsubscribe = editor.subscribe(state => {
			app.resize(state.dpr, state.zoom)
			if (state.canvasBackgroundColor !== appRef.current?.clearColor) {
				// We don't have direct access to clearColor prop on app,
				// but we added setClearColor method to the interface.
				// However, createWeaveApp returns a wrapper that might not expose it if we didn't update the type fully in WeaveCanvas usage
				// Let's cast for now as we updated the underlying types
				;(app as any).setClearColor?.(state.canvasBackgroundColor)
			}
			app.render()
		})

		return () => {
			window.removeEventListener('resize', onResize)
			if (raf) cancelAnimationFrame(raf)
			ro.disconnect()
			unsubscribe()
			app.dispose()
			appRef.current = null
		}
	}, [])

	useEffect(() => {
		const app = appRef.current
		if (!app) return
		app.resize(editor.dpr, editor.zoom)
		app.setScene(props.scene)
		app.render()
	}, [props.scene, props.version])

	// Sync selection from editor state to overlay
	useEffect(() => {
		return editor.subscribe(state => {
			const id = state.selection[0]
			setSelectionId(id)
		})
	}, [])

	// Poll for layout info when selection changes
	useEffect(() => {
		if (!selectionId) {
			setOverlay(null)
			return
		}

		const app = appRef.current
		if (!app || app.kind !== 'browser') return

		const fetchInfo = async () => {
			try {
				// @ts-ignore
				const info = await app.getNodeInfo(selectionId)
				if (info) {
					setOverlay(info)
				} else {
					setOverlay(null)
				}
			} catch (err) {
				console.error('Failed to get node info:', err)
			}
		}

		fetchInfo()
		// Also re-fetch if scene changes (e.g. drag)
		// Ideally we should listen to scene updates or layout events
		const interval = setInterval(fetchInfo, 100) // Poll for now as layout might be async
		return () => clearInterval(interval)
	}, [selectionId, props.scene]) // Re-run when selection or scene updates

	const handlePointerDown = async (e: React.PointerEvent) => {
		const app = appRef.current
		if (!app || app.kind !== 'browser') return

		const rect = canvasRef.current!.getBoundingClientRect()
		const x = e.clientX - rect.left
		const y = e.clientY - rect.top

		try {
			// @ts-ignore - hitTest might not be in d.ts if build failed or cached
			const result = await app.hitTest(x, y)
			if (result && result.id) {
				editor.setSelection([result.id])
			} else {
				editor.setSelection([])
			}
		} catch (err) {
			console.error('HitTest error:', err)
		}
	}

	return (
		<div className='relative w-full h-full'>
			<canvas
				id='weave-canvas'
				ref={canvasRef}
				style={{
					width: '100%',
					height: '100%',
					display: 'block',
					touchAction: 'none'
				}}
				onPointerDown={handlePointerDown}
			/>
			{overlay && (
				<div
					className='absolute border-2 border-blue-500 pointer-events-none'
					style={{
						left: overlay.x,
						top: overlay.y,
						width: overlay.width,
						height: overlay.height
					}}
				>
					<div className='absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-1 rounded-sm'>
						{selectionId}
					</div>
				</div>
			)}
		</div>
	)
}
