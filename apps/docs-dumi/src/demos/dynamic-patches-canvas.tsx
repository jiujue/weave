import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createEngine } from '@jiujue/weave-core'
import type { Engine } from '@jiujue/weave-core'
import { sceneFromJSX } from '@jiujue/weave-react'
import type { ScenePatch, TextMeasurer, TextStyle } from '@jiujue/weave-types'
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
		}
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

function renderEngineToCanvas(
	engine: Engine,
	env: CanvasEnv,
	width: number,
	height: number
): number {
	const dpr = window.devicePixelRatio || 1
	env.canvas.style.height = `${height}px`
	env.canvas.width = Math.floor(width * dpr)
	env.canvas.height = Math.floor(height * dpr)

	env.ctx.setTransform(1, 0, 0, 1, 0, 0)
	env.ctx.clearRect(0, 0, env.canvas.width, env.canvas.height)

	const displayList = engine.render({ width, height })
	engine.replay(env.ctx, { dpr })
	return displayList.length
}

function initialScene(): JSX.Element {
	return (
		<Container
			id='root'
			style={{
				padding: 16,
				flexDirection: 'column',
				gap: 8
			}}
			paint={{
				background: { color: '#0b1021' },
				border: { color: '#334155', width: 1 }
			}}
		>
			<Text
				id='title'
				textStyle={{ fontSize: 16, color: '#e6e6e6', fontWeight: 'bold' }}
			>
				动态更新：applyPatches + render + replay
			</Text>
			<Text id='counter' textStyle={{ fontSize: 13, color: '#b7c0ff' }}>
				counter = 0
			</Text>
			<Polygon
				id='wave'
				style={{ width: 360, height: 80 }}
				points={[
					{ x: 0, y: 40 },
					{ x: 90, y: 10 },
					{ x: 180, y: 70 },
					{ x: 270, y: 10 },
					{ x: 360, y: 40 }
				]}
				paint={{ stroke: { color: '#22c55e', width: 2 } }}
			/>
		</Container>
	)
}

function clampInt(v: number, min: number, max: number): number {
	if (Number.isNaN(v)) return min
	return Math.max(min, Math.min(max, Math.round(v)))
}

export default function Demo(): JSX.Element {
	const { ref: containerRef, width: containerWidth } =
		useContainerWidth<HTMLDivElement>(900)
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const engineRef = useRef<Engine | null>(null)
	const canvasEnvRef = useRef<CanvasEnv | null>(null)
	const rafRef = useRef<number | null>(null)

	const textMeasurer = useMemo(() => createBrowserTextMeasurer(), [])

	const [running, setRunning] = useState(true)
	const [counter, setCounter] = useState(0)
	const [padding, setPadding] = useState(16)
	const [showExtra, setShowExtra] = useState(false)
	const [desiredWidth, setDesiredWidth] = useState(760)
	const [height, setHeight] = useState(300)
	const [opCount, setOpCount] = useState<number | null>(null)

	const maxAllowedWidth = Math.max(420, Math.min(containerWidth, 1200))
	const width = Math.max(420, Math.min(desiredWidth, maxAllowedWidth))

	useEffect(() => {
		setDesiredWidth(w => Math.max(420, Math.min(w, maxAllowedWidth)))
	}, [maxAllowedWidth])

	const rerender = (engine: Engine) => {
		const env = canvasEnvRef.current
		if (!env) return
		setOpCount(renderEngineToCanvas(engine, env, width, height))
	}

	useEffect(() => {
		let disposed = false

		const init = async () => {
			const canvas = canvasRef.current
			if (!canvas) return
			const env = ensureCanvasEnv(canvas)
			if (!env) return
			canvasEnvRef.current = env

			const engine = await createEngine({
				textMeasurer,
				root: sceneFromJSX(initialScene())
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
			if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
			engineRef.current?.dispose()
			engineRef.current = null
		}
	}, [textMeasurer])

	useEffect(() => {
		const engine = engineRef.current
		if (!engine) return

		const patches: ScenePatch[] = [
			{ op: 'updateText', id: 'counter', text: `counter = ${counter}` },
			{
				op: 'updateStyle',
				id: 'root',
				style: {
					padding,
					flexDirection: 'column',
					gap: 8
				}
			}
		]

		if (showExtra) {
			patches.push({
				op: 'addNode',
				parentId: 'root',
				node: {
					id: 'extra',
					type: 'text',
					text: '这是一个通过 addNode 动态插入的节点',
					textStyle: { fontSize: 12, color: '#93c5fd' }
				}
			})
		} else {
			patches.push({ op: 'removeNode', id: 'extra' })
		}

		engine.applyPatches(patches)
		rerender(engine)
	}, [counter, padding, showExtra, width, height])

	useEffect(() => {
		if (!running) return

		let start = performance.now()

		const tick = (now: number) => {
			const engine = engineRef.current
			if (!engine) return

			const t = (now - start) / 1000
			const points = Array.from({ length: 9 }, (_, i) => {
				const x = i * 45
				const y = 40 + Math.sin(t * 2 + i * 0.7) * 22
				return { x, y }
			})

			engine.applyPatches([{ op: 'replacePoints', id: 'wave', points }])
			rerender(engine)

			rafRef.current = requestAnimationFrame(tick)
		}

		rafRef.current = requestAnimationFrame(tick)
		return () => {
			if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
			rafRef.current = null
		}
	}, [running, width, height])

	return (
		<div ref={containerRef} style={{ display: 'grid', gap: 12 }}>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
					gap: 12,
					alignItems: 'center'
				}}
			>
				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>counter</div>
					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<button onClick={() => setCounter(c => c + 1)}>+1</button>
						<button onClick={() => setCounter(c => c - 1)}>-1</button>
						<button onClick={() => setCounter(0)}>reset</button>
					</div>
				</label>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>
						动画波形（replacePoints）
					</div>
					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<button onClick={() => setRunning(v => !v)}>
							{running ? 'pause' : 'play'}
						</button>
						<span style={{ fontSize: 12, color: '#6b7280' }}>
							{running ? 'running' : 'paused'}
						</span>
					</div>
				</label>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>
						padding（updateStyle）
					</div>
					<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
						<input
							type='range'
							min={0}
							max={48}
							value={padding}
							onChange={e =>
								setPadding(clampInt(Number(e.target.value), 0, 48))
							}
						/>
						<span style={{ fontSize: 12, color: '#6b7280' }}>{padding}</span>
					</div>
				</label>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>add/remove 节点</div>
					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<input
							type='checkbox'
							checked={showExtra}
							onChange={e => setShowExtra(e.target.checked)}
						/>
						<span style={{ fontSize: 12, color: '#6b7280' }}>
							{showExtra ? 'show extra' : 'hide extra'}
						</span>
					</div>
				</label>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>canvas width</div>
					<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
						<input
							type='range'
							min={420}
							max={maxAllowedWidth}
							value={desiredWidth}
							onChange={e =>
								setDesiredWidth(
									clampInt(Number(e.target.value), 420, maxAllowedWidth)
								)
							}
						/>
						<span style={{ fontSize: 12, color: '#6b7280' }}>{width}</span>
					</div>
				</label>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>canvas height</div>
					<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
						<input
							type='range'
							min={180}
							max={520}
							value={height}
							onChange={e =>
								setHeight(clampInt(Number(e.target.value), 180, 520))
							}
						/>
						<span style={{ fontSize: 12, color: '#6b7280' }}>{height}</span>
					</div>
				</label>
			</div>

			<div style={{ display: 'grid', gap: 8 }}>
				<canvas
					ref={canvasRef}
					style={{
						display: 'block',
						width: '100%',
						maxWidth: `${width}px`,
						borderRadius: 10,
						border: '1px solid #e5e7eb'
					}}
				/>
				<div style={{ color: '#6b7280', fontSize: 12 }}>
					DrawOps：{opCount ?? '-'}
				</div>
			</div>
		</div>
	)
}
