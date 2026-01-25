import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createEngine } from '@jiujue/weave-core'
import type { Engine } from '@jiujue/weave-core'
import { sceneFromJSX } from '@jiujue/weave-react'
import { useContainerWidth } from './useContainerWidth'
import type {
	AlignItems,
	JustifyContent,
	LayoutStyle,
	ScenePatch,
	TextMeasurer,
	TextStyle,
} from '@jiujue/weave-types'

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
	height: number,
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
		<container
			id="root"
			style={{
				padding: 16,
				flexDirection: 'row',
				justifyContent: 'space-between',
				alignItems: 'center',
				gap: 12,
			}}
			paint={{
				background: { color: '#0b1021' },
				border: { color: '#334155', width: 1 },
			}}
		>
			<container
				id="box-a"
				style={{ width: 140, height: 56, padding: 10 }}
				paint={{ background: { color: '#1d4ed8' } }}
			>
				<Text id="box-a-text" textStyle={{ fontSize: 12, color: '#e5e7eb', fontWeight: 'bold' }}>
					A (140×56)
				</Text>
			</container>
			<container
				id="box-b"
				style={{ width: 120, height: 90, padding: 10 }}
				paint={{ background: { color: '#16a34a' } }}
			>
				<Text id="box-b-text" textStyle={{ fontSize: 12, color: '#e5e7eb', fontWeight: 'bold' }}>
					B (120×90)
				</Text>
			</container>
			<container
				id="box-c"
				style={{ width: 160, height: 70, padding: 10 }}
				paint={{ background: { color: '#f97316' } }}
			>
				<Text id="box-c-text" textStyle={{ fontSize: 12, color: '#0b1021', fontWeight: 'bold' }}>
					C (160×70)
				</Text>
			</container>
			<container
				id="box-d"
				style={{ width: 110, height: 110, padding: 10 }}
				paint={{ background: { color: '#a855f7' } }}
			>
				<Text id="box-d-text" textStyle={{ fontSize: 12, color: '#0b1021', fontWeight: 'bold' }}>
					D (110×110)
				</Text>
			</container>
		</container>
	)
}

function clampInt(v: number, min: number, max: number): number {
	if (Number.isNaN(v)) return min
	return Math.max(min, Math.min(max, Math.round(v)))
}

const justifyOptions: readonly JustifyContent[] = [
	'flex-start',
	'center',
	'flex-end',
	'space-between',
	'space-around',
	'space-evenly',
]

const alignOptions: readonly AlignItems[] = [
	'stretch',
	'flex-start',
	'center',
	'flex-end',
	'baseline',
]

export default function Demo(): JSX.Element {
	const { ref: containerRef, width: containerWidth } = useContainerWidth<HTMLDivElement>(960)
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const engineRef = useRef<Engine | null>(null)
	const canvasEnvRef = useRef<CanvasEnv | null>(null)

	const textMeasurer = useMemo(() => createBrowserTextMeasurer(), [])

	const [flexDirection, setFlexDirection] = useState<'row' | 'column'>('row')
	const [justifyContent, setJustifyContent] = useState<JustifyContent>('space-between')
	const [alignItems, setAlignItems] = useState<AlignItems>('center')
	const [gap, setGap] = useState(12)
	const [padding, setPadding] = useState(16)
	const [desiredWidth, setDesiredWidth] = useState(900)
	const [height, setHeight] = useState(320)
	const [opCount, setOpCount] = useState<number | null>(null)

	const maxAllowedWidth = Math.max(420, Math.min(containerWidth, 1200))
	const width = Math.max(420, Math.min(desiredWidth, maxAllowedWidth))

	useEffect(() => {
		setDesiredWidth((w) => Math.max(420, Math.min(w, maxAllowedWidth)))
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
				root: sceneFromJSX(initialScene()),
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
	}, [textMeasurer])

	useEffect(() => {
		const engine = engineRef.current
		if (!engine) return

		const style: LayoutStyle = {
			padding,
			flexDirection,
			justifyContent,
			alignItems,
			gap,
		}

		const patches: ScenePatch[] = [{ op: 'updateStyle', id: 'root', style }]
		engine.applyPatches(patches)
		rerender(engine)
	}, [padding, flexDirection, justifyContent, alignItems, gap, width, height])

	return (
		<div ref={containerRef} style={{ display: 'grid', gap: 12 }}>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
					gap: 12,
					alignItems: 'end',
				}}
			>
				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>flexDirection</div>
					<select
						value={flexDirection}
						onChange={(e) => setFlexDirection(e.target.value === 'column' ? 'column' : 'row')}
					>
						<option value="row">row</option>
						<option value="column">column</option>
					</select>
				</label>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>justifyContent</div>
					<select
						value={justifyContent}
						onChange={(e) => setJustifyContent(e.target.value as JustifyContent)}
					>
						{justifyOptions.map((v) => (
							<option key={v} value={v}>
								{v}
							</option>
						))}
					</select>
				</label>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>alignItems</div>
					<select value={alignItems} onChange={(e) => setAlignItems(e.target.value as AlignItems)}>
						{alignOptions.map((v) => (
							<option key={v} value={v}>
								{v}
							</option>
						))}
					</select>
				</label>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>gap</div>
					<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
						<input
							type="range"
							min={0}
							max={40}
							value={gap}
							onChange={(e) => setGap(clampInt(Number(e.target.value), 0, 40))}
						/>
						<span style={{ fontSize: 12, color: '#6b7280' }}>{gap}</span>
					</div>
				</label>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>padding</div>
					<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
						<input
							type="range"
							min={0}
							max={48}
							value={padding}
							onChange={(e) => setPadding(clampInt(Number(e.target.value), 0, 48))}
						/>
						<span style={{ fontSize: 12, color: '#6b7280' }}>{padding}</span>
					</div>
				</label>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>constraints</div>
					<div style={{ display: 'grid', gap: 6 }}>
						<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
							<span style={{ width: 48, fontSize: 12, color: '#6b7280' }}>W</span>
							<input
								type="range"
								min={420}
								max={maxAllowedWidth}
								value={desiredWidth}
								onChange={(e) =>
									setDesiredWidth(clampInt(Number(e.target.value), 420, maxAllowedWidth))
								}
							/>
							<span style={{ width: 40, fontSize: 12, color: '#6b7280' }}>{width}</span>
						</div>
						<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
							<span style={{ width: 48, fontSize: 12, color: '#6b7280' }}>H</span>
							<input
								type="range"
								min={200}
								max={560}
								value={height}
								onChange={(e) => setHeight(clampInt(Number(e.target.value), 200, 560))}
							/>
							<span style={{ width: 40, fontSize: 12, color: '#6b7280' }}>{height}</span>
						</div>
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
						border: '1px solid #e5e7eb',
					}}
				/>
				<div style={{ color: '#6b7280', fontSize: 12 }}>DrawOps：{opCount ?? '-'}</div>
			</div>
		</div>
	)
}
