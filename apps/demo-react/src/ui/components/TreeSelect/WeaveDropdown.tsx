import React, { useEffect, useMemo, useRef } from 'react'
import { createWeaveApp, type WeaveBrowserApp } from '@jiujue/weave-app'
import type { SceneNode } from '@jiujue/weave-types'

export function WeaveDropdown(props: {
	width: number
	height: number
	scene: SceneNode
	onWheel: (deltaY: number) => void
	onHit: (hit: { id: string | null; path: readonly string[] }) => void
	onHover?: (hit: { id: string | null; path: readonly string[] }) => void
}) {
	const { width, height, scene, onWheel, onHit, onHover } = props

	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const appRef = useRef<WeaveBrowserApp | null>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const app = createWeaveApp({
			canvas,
			clearColor: '#0b1020',
			scene,
			devtools: { enabled: false },
		})
		appRef.current = app
		app.render()

		return () => {
			app.dispose()
			appRef.current = null
		}
	}, [])

	useEffect(() => {
		const app = appRef.current
		if (!app) return
		app.setScene(scene)
		app.render()
	}, [scene])

	useEffect(() => {
		const app = appRef.current
		if (!app) return
		app.resize(window.devicePixelRatio || 1)
		app.render()
	}, [width, height])

	const handlers = useMemo(() => {
		const toCanvasPoint = (e: MouseEvent, canvas: HTMLCanvasElement) => {
			const rect = canvas.getBoundingClientRect()
			const x = e.clientX - rect.left
			const y = e.clientY - rect.top
			return { x, y }
		}

		const onClick = async (e: MouseEvent) => {
			const canvas = canvasRef.current
			const app = appRef.current
			if (!canvas || !app) return
			const { x, y } = toCanvasPoint(e, canvas)
			const hit = await app.hitTest(x, y)
			onHit(hit)
		}

		const onMove = async (e: MouseEvent) => {
			if (!onHover) return
			const canvas = canvasRef.current
			const app = appRef.current
			if (!canvas || !app) return
			const { x, y } = toCanvasPoint(e, canvas)
			const hit = await app.hitTest(x, y)
			onHover(hit)
		}

		const onWheelNative = (e: WheelEvent) => {
			onWheel(e.deltaY)
			e.preventDefault()
		}

		return { onClick, onMove, onWheelNative }
	}, [onHit, onHover, onWheel])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		canvas.addEventListener('click', handlers.onClick)
		canvas.addEventListener('mousemove', handlers.onMove)
		canvas.addEventListener('wheel', handlers.onWheelNative, { passive: false })
		return () => {
			canvas.removeEventListener('click', handlers.onClick)
			canvas.removeEventListener('mousemove', handlers.onMove)
			canvas.removeEventListener('wheel', handlers.onWheelNative)
		}
	}, [handlers])

	return (
		<canvas
			ref={canvasRef}
			style={{
				width,
				height,
				display: 'block',
			}}
			width={Math.max(1, Math.floor(width * (window.devicePixelRatio || 1)))}
			height={Math.max(1, Math.floor(height * (window.devicePixelRatio || 1)))}
		/>
	)
}
