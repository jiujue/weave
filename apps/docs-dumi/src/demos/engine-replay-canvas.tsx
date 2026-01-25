import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createEngine } from '@jiujue/weave-core'
import { sceneFromJSX } from '@jiujue/weave-react'
import type { TextMeasurer, TextStyle } from '@jiujue/weave-types'
import { useContainerWidth } from './useContainerWidth'

const Container = 'container' as any
const Text = 'text' as any
const Polygon = 'polygon' as any

function fontFromTextStyle(style: TextStyle): string {
	const weight = style.fontWeight ?? 'normal'
	const fontStyle = style.fontStyle ?? 'normal'
	const size = style.fontSize
	const family = style.fontFamily ?? 'sans-serif'
	return `${fontStyle} ${weight} ${size}px ${family}`
}

function createBrowserTextMeasurer(): TextMeasurer {
	const canvas = document.createElement('canvas')
	const ctx = canvas.getContext('2d')!

	return {
		measure({ text, style }) {
			ctx.font = fontFromTextStyle(style)
			const width = Math.ceil(ctx.measureText(text).width)
			const lineHeight = style.lineHeight ?? Math.ceil(style.fontSize * 1.2)
			return { width, height: lineHeight, lineHeight }
		},
	}
}

function createSceneElement() {
	return (
		<Container
			id="root"
			style={{ width: 480, padding: 16, flexDirection: 'column' }}
			paint={{ background: { color: '#0b1021' } }}
		>
			<Text id="t1" textStyle={{ fontSize: 16, color: '#e6e6e6', fontWeight: 'bold' }}>
				createEngine + replay(canvas)
			</Text>
			<Text id="t2" style={{ marginTop: 8 }} textStyle={{ fontSize: 12, color: '#b7c0ff' }}>
				这个示例在页面内直接跑 core（无 Worker），用于理解 data → layout → displaylist → replay
				的最短链路。
			</Text>
			<Polygon
				id="tri"
				style={{ marginTop: 12, width: 120, height: 80 }}
				points={[
					{ x: 0, y: 80 },
					{ x: 60, y: 0 },
					{ x: 120, y: 80 },
				]}
				paint={{ fill: { color: '#4ade80' } }}
			/>
		</Container>
	)
}

export default function Demo(): JSX.Element {
	const { ref: containerRef, width: containerWidth } = useContainerWidth<HTMLDivElement>(720)
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const textMeasurer = useMemo(() => createBrowserTextMeasurer(), [])
	const [ready, setReady] = useState(false)
	const [opCount, setOpCount] = useState<number | null>(null)

	const width = Math.max(360, Math.min(containerWidth, 960))
	const height = 220

	useEffect(() => {
		let disposed = false
		let engine: Awaited<ReturnType<typeof createEngine>> | null = null

		const run = async () => {
			engine = await createEngine({
				textMeasurer,
				root: sceneFromJSX(createSceneElement()),
			})
			if (disposed) return

			const canvas = canvasRef.current
			if (!canvas) return
			const ctx = canvas.getContext('2d')
			if (!ctx) return

			const dpr = window.devicePixelRatio || 1
			canvas.style.width = '100%'
			canvas.style.height = `${height}px`
			canvas.width = Math.floor(width * dpr)
			canvas.height = Math.floor(height * dpr)

			ctx.setTransform(1, 0, 0, 1, 0, 0)
			ctx.clearRect(0, 0, canvas.width, canvas.height)

			const displayList = engine.render({ width, height })
			setOpCount(displayList.length)
			engine.replay(ctx, { dpr })
			setReady(true)
		}

		void run()

		return () => {
			disposed = true
			engine?.dispose()
		}
	}, [textMeasurer, width, height])

	return (
		<div ref={containerRef} style={{ display: 'grid', gap: 12 }}>
			<canvas
				ref={canvasRef}
				style={{
					display: 'block',
					width: '100%',
					borderRadius: 8,
					border: '1px solid #e5e7eb',
				}}
			/>
			<div style={{ color: '#6b7280', fontSize: 12 }}>
				状态：
				{ready ? '已渲染（layout + displaylist + replay）' : '加载 Yoga 中...'}
				{opCount != null ? `，DrawOps：${opCount}` : ''}
			</div>
		</div>
	)
}
