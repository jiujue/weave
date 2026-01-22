import React, { useEffect, useRef } from 'react'
import { createWeaveApp } from '@jiujue/weave-app'
import type { SceneNode } from '@jiujue/weave-types'

export function WeaveCanvas(props: Readonly<{ scene: SceneNode }>) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const appRef = useRef<ReturnType<typeof createWeaveApp> | null>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const app = createWeaveApp({
			canvas,
			clearColor: '#0b1020',
			scene: props.scene,
			devtools: { enabled: true, name: 'demo-react', log: true },
			onError(message) {
				console.error('[weave worker error]', message)
			}
		})
		appRef.current = app
		app.render()

		const onResize = () => {
			app.resize()
			app.render()
		}
		window.addEventListener('resize', onResize)

		return () => {
			window.removeEventListener('resize', onResize)
			app.dispose()
			appRef.current = null
		}
	}, [])

	useEffect(() => {
		const app = appRef.current
		if (!app) return
		app.setScene(props.scene)
		app.render()
	}, [props.scene])

	return (
		<canvas
			ref={canvasRef}
			style={{ width: '100%', height: '100%', display: 'block' }}
		/>
	)
}
