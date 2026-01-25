import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createEngine } from '@jiujue/weave-core'
import type { Engine } from '@jiujue/weave-core'
import { sceneFromJSX } from '@jiujue/weave-react'
import type { ScenePatch, TextMeasureInput, TextMeasurer, TextStyle } from '@jiujue/weave-types'
import { useContainerWidth } from './useContainerWidth'

const Container = 'container' as any
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
		measure(input: TextMeasureInput) {
			ctx.font = fontFromTextStyle(input.style)
			const width = Math.ceil(
				Math.min(input.maxWidth ?? Number.POSITIVE_INFINITY, ctx.measureText(input.text).width),
			)
			const lineHeight = input.style.lineHeight ?? Math.ceil(input.style.fontSize * 1.2)
			return { width, height: lineHeight, lineHeight }
		},
	}
}

type CanvasEnv = Readonly<{
	canvas: HTMLCanvasElement
	ctx: CanvasRenderingContext2D
}>

function ensureCanvasEnv(canvas: HTMLCanvasElement): CanvasEnv | null {
	const ctx = canvas.getContext('2d')
	if (!ctx) return null
	return { canvas, ctx }
}

function renderEngineToCanvas(engine: Engine, env: CanvasEnv, width: number, height: number): void {
	const dpr = window.devicePixelRatio || 1
	env.canvas.style.height = `${height}px`
	env.canvas.width = Math.floor(width * dpr)
	env.canvas.height = Math.floor(height * dpr)

	env.ctx.setTransform(1, 0, 0, 1, 0, 0)
	env.ctx.clearRect(0, 0, env.canvas.width, env.canvas.height)

	engine.render({ width, height })
	engine.replay(env.ctx, { dpr })
}

function createGrid(): readonly string[] {
	return Array.from({ length: 40 }, (_, r) => {
		return Array.from(
			{ length: 12 },
			(_, c) => `R${String(r + 1).padStart(2, '0')}-C${String(c + 1).padStart(2, '0')}`,
		).join('    ')
	})
}

function buildScene(lines: readonly string[], w: number, h: number): JSX.Element {
	return (
		<Container
			id="root"
			style={{ padding: 16, flexDirection: 'column', gap: 10 }}
			paint={{
				background: { color: '#0b1021' },
				border: { color: '#334155', width: 1 },
			}}
		>
			<Text id="title" textStyle={{ fontSize: 16, color: '#e5e7eb' }}>
				双向滚动容器：overflowX/overflowY + scrollX/scrollY
			</Text>
			<Text id="state" textStyle={{ fontSize: 12, color: '#93c5fd' }}>
				scrollX=0, scrollY=0, viewport={w}x{h}
			</Text>
			<Container
				id="panel"
				style={{
					width: w,
					height: h,
					flexDirection: 'column',
					gap: 6,
					padding: 10,
					overflowX: 'auto',
					overflowY: 'auto',
				}}
				paint={{
					background: { color: '#0f172a', alpha: 0.7 },
					border: { color: '#334155', width: 1 },
				}}
			>
				{lines.map((t, idx) => (
					<Text
						key={idx}
						id={`line-${idx}`}
						textStyle={{ fontSize: 13, color: '#e5e7eb', whiteSpace: 'nowrap' }}
					>
						{t}
					</Text>
				))}
			</Container>
			<Text id="hint" textStyle={{ fontSize: 12, color: '#94a3b8' }}>
				提示：在面板上滚轮竖向滚动；按住 Shift 可更容易触发横向滚动（或触控板横滑）。
			</Text>
		</Container>
	)
}

export default function Demo(): JSX.Element {
	const { ref: containerRef, width: containerWidth } = useContainerWidth<HTMLDivElement>(960)
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const envRef = useRef<CanvasEnv | null>(null)
	const engineRef = useRef<Engine | null>(null)

	const textMeasurer = useMemo(() => createBrowserTextMeasurer(), [])
	const lines = useMemo(() => createGrid(), [])

	const width = Math.max(420, Math.min(containerWidth, 980))
	const height = 520

	const [viewportW, setViewportW] = useState(520)
	const [viewportH, setViewportH] = useState(220)
	const [scrollX, setScrollX] = useState(0)
	const [scrollY, setScrollY] = useState(0)
	const [metrics, setMetrics] = useState<any>(null)

	const rerender = (engine: Engine) => {
		const env = envRef.current
		if (!env) return
		renderEngineToCanvas(engine, env, width, height)
		setMetrics(engine.getScrollMetrics('panel'))
	}

	useEffect(() => {
		let disposed = false
		const init = async () => {
			const canvas = canvasRef.current
			if (!canvas) return
			const env = ensureCanvasEnv(canvas)
			if (!env) return
			envRef.current = env

			const engine = await createEngine({
				textMeasurer,
				root: sceneFromJSX(buildScene(lines, viewportW, viewportH)),
			})
			if (disposed) {
				engine.dispose()
				return
			}
			engineRef.current = engine
			rerender(engine)
		}
		void init()
		return () => {
			disposed = true
			engineRef.current?.dispose()
			engineRef.current = null
		}
	}, [lines, textMeasurer, viewportW, viewportH, width])

	useEffect(() => {
		const engine = engineRef.current
		if (!engine) return
		const patches: ScenePatch[] = [
			{
				op: 'updateStyle',
				id: 'panel',
				style: {
					width: viewportW,
					height: viewportH,
					flexDirection: 'column',
					gap: 6,
					padding: 10,
					overflowX: 'auto',
					overflowY: 'auto',
				},
			},
			{ op: 'updateScroll', id: 'panel', scroll: { x: scrollX, y: scrollY } },
			{
				op: 'updateText',
				id: 'state',
				text: `scrollX=${Math.round(scrollX)}, scrollY=${Math.round(scrollY)}, viewport=${Math.round(
					viewportW,
				)}x${Math.round(viewportH)}`,
			},
		]
		engine.applyPatches(patches)
		rerender(engine)
	}, [scrollX, scrollY, viewportW, viewportH, width])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const onWheel = (event: WheelEvent) => {
			const rect = canvas.getBoundingClientRect()
			const x = event.clientX - rect.left
			const y = event.clientY - rect.top
			const engine = engineRef.current
			if (!engine) return
			const hit = engine.hitTest({ x, y })
			if (!hit.path.includes('panel')) return
			event.preventDefault()
			const dx = event.shiftKey ? event.deltaY : event.deltaX
			const dy = event.shiftKey ? 0 : event.deltaY
			setScrollX((v) => v + dx)
			setScrollY((v) => v + dy)
		}
		canvas.addEventListener('wheel', onWheel, { passive: false })
		return () => canvas.removeEventListener('wheel', onWheel)
	}, [])

	return (
		<div ref={containerRef} style={{ display: 'grid', gap: 10 }}>
			<div style={{ fontSize: 12, color: '#334155' }}>
				{metrics
					? `viewport=${Math.round(metrics.viewportWidth)}x${Math.round(
							metrics.viewportHeight,
						)}, content=${Math.round(metrics.contentWidth)}x${Math.round(
							metrics.contentHeight,
						)}, scroll=(${Math.round(metrics.scrollX)}/${Math.round(
							metrics.maxScrollX,
						)}, ${Math.round(metrics.scrollY)}/${Math.round(metrics.maxScrollY)})`
					: 'viewport/content/maxScroll 计算中...'}
			</div>
			<div style={{ display: 'grid', gap: 8 }}>
				<label style={{ display: 'grid', gap: 4 }}>
					<span style={{ fontSize: 12, color: '#334155' }}>viewport width</span>
					<input
						type="range"
						min={260}
						max={760}
						value={viewportW}
						onChange={(e) => setViewportW(Number(e.target.value))}
					/>
				</label>
				<label style={{ display: 'grid', gap: 4 }}>
					<span style={{ fontSize: 12, color: '#334155' }}>viewport height</span>
					<input
						type="range"
						min={140}
						max={320}
						value={viewportH}
						onChange={(e) => setViewportH(Number(e.target.value))}
					/>
				</label>
				<label style={{ display: 'grid', gap: 4 }}>
					<span style={{ fontSize: 12, color: '#334155' }}>scrollX</span>
					<input
						type="range"
						min={0}
						max={1600}
						value={scrollX}
						onChange={(e) => setScrollX(Number(e.target.value))}
					/>
				</label>
				<label style={{ display: 'grid', gap: 4 }}>
					<span style={{ fontSize: 12, color: '#334155' }}>scrollY</span>
					<input
						type="range"
						min={0}
						max={1600}
						value={scrollY}
						onChange={(e) => setScrollY(Number(e.target.value))}
					/>
				</label>
			</div>
			<canvas ref={canvasRef} style={{ width: '100%', borderRadius: 8 }} />
		</div>
	)
}
