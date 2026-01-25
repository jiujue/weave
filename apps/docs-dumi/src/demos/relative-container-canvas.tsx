import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createEngine } from '@jiujue/weave-core'
import { sceneFromJSX } from '@jiujue/weave-react'
import type { TextMeasurer, TextStyle } from '@jiujue/weave-types'
import { useContainerWidth } from './useContainerWidth'

const Text = 'text' as any

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
		<container
			id="root"
			style={{ width: '100%', padding: 16, flexDirection: 'column', gap: 12 }}
			paint={{ background: { color: '#ffffff' } }}
		>
			<Text id="title" textStyle={{ fontSize: 16, color: '#0f172a', fontWeight: 700 }}>
				relative 容器：直接子元素默认绝对定位
			</Text>
			<relative
				id="rel"
				style={{ width: '100%', height: 240 }}
				paint={{
					background: { color: '#0b1021' },
					border: { color: '#334155', width: 1 },
				}}
			>
				<container
					id="badge-1"
					style={{ top: 12, left: 12, width: 160, height: 44, padding: 10 }}
					paint={{ background: { color: '#2563eb' } }}
				>
					<Text id="badge-1-text" textStyle={{ fontSize: 12, color: '#e5e7eb', fontWeight: 700 }}>
						top:12 left:12
					</Text>
				</container>
				<container
					id="badge-2"
					style={{ right: 12, top: 18, width: 180, height: 44, padding: 10 }}
					paint={{ background: { color: '#16a34a' } }}
				>
					<Text id="badge-2-text" textStyle={{ fontSize: 12, color: '#052e16', fontWeight: 700 }}>
						right:12 top:18
					</Text>
				</container>
				<container
					id="badge-3"
					style={{
						left: 60,
						bottom: 16,
						width: 260,
						height: 64,
						padding: 12,
					}}
					paint={{ background: { color: '#f97316' } }}
				>
					<Text id="badge-3-text" textStyle={{ fontSize: 12, color: '#0b1021', fontWeight: 700 }}>
						left:60 bottom:16
					</Text>
				</container>
				<Text
					id="flow"
					style={{ position: 'relative', marginTop: 12, marginLeft: 12 }}
					textStyle={{ fontSize: 12, color: '#cbd5e1' }}
				>
					我显式 position=relative，所以按常规流式布局参与排版
				</Text>
			</relative>
			<Text id="hint" textStyle={{ fontSize: 12, color: '#64748b' }}>
				提示：子节点不写 position 时即可直接用 top/left/right/bottom。
			</Text>
		</container>
	)
}

export default function Demo(): JSX.Element {
	const { ref: containerRef, width: containerWidth } = useContainerWidth<HTMLDivElement>(720)
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const textMeasurer = useMemo(() => createBrowserTextMeasurer(), [])
	const [ready, setReady] = useState(false)

	const width = Math.max(360, Math.min(containerWidth, 960))
	const height = 340

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

			engine.render({ width, height })
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
				状态：{ready ? '已渲染' : '加载 Yoga 中...'}
			</div>
		</div>
	)
}
