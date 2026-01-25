import { useEffect, useMemo, useRef, useState } from 'react'
import { createEngine } from '@jiujue/weave-core'
import type { Engine } from '@jiujue/weave-core'
import { sceneFromJSX } from '@jiujue/weave-react'
import {
	attachWeaveDevtools,
	createSceneMirror,
	type WeaveDevtoolsController,
} from '@jiujue/weave-devtools-runtime'
import type {
	SceneNode,
	ScenePatch,
	TableColumn,
	TableRow,
	TextMeasureInput,
	TextMeasurer,
	TextStyle,
} from '@jiujue/weave-types'
import { useContainerWidth } from './useContainerWidth'

const Container = 'container' as any
const Text = 'text' as any
const Table = 'table' as any

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

function createColumns(count: number): readonly TableColumn[] {
	return Array.from({ length: count }, (_, i) => ({
		id: `c${i}`,
		title: `Col ${i + 1}`,
		width: i === 0 ? 180 : 120,
		align: i === 0 ? 'left' : 'right',
		cellTextStyle: { fontSize: 12, color: '#e5e7eb' },
		headerTextStyle: { fontSize: 12, color: '#e5e7eb' },
	}))
}

function createRows(rowCount: number, colCount: number): readonly TableRow[] {
	return Array.from({ length: rowCount }, (_, r) => {
		const cells: Record<string, string> = {}
		for (let c = 0; c < colCount; c++) {
			cells[`c${c}`] = c === 0 ? `Row ${r + 1}` : String((r + 1) * (c + 3))
		}
		return { id: `r${r}`, cells }
	})
}

function buildScene(
	columns: readonly TableColumn[],
	rows: readonly TableRow[],
	tableHeight: number,
): JSX.Element {
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
				Table 滚动：overflowX/overflowY + updateScroll
			</Text>
			<Text id="state" textStyle={{ fontSize: 12, color: '#93c5fd' }}>
				scrollX=0, scrollY=0
			</Text>
			<Table
				id="table"
				style={{
					width: 720,
					height: tableHeight,
					overflowX: 'auto',
					overflowY: 'auto',
				}}
				columns={columns}
				rows={rows}
				tableStyle={{
					background: { color: '#0f172a', alpha: 0.7 },
					headerBackground: { color: '#111827', alpha: 0.9 },
					grid: { color: '#334155', width: 1, alpha: 0.9 },
					headerGrid: { color: '#475569', width: 1, alpha: 0.9 },
					headerRowHeight: 30,
					rowHeight: 28,
					cellPaddingHorizontal: 10,
					cellPaddingVertical: 6,
					headerAlign: 'left',
					cellAlign: 'left',
					headerVAlign: 'middle',
					cellVAlign: 'middle',
				}}
			/>
			<Text id="hint" textStyle={{ fontSize: 12, color: '#94a3b8' }}>
				提示：把鼠标移到表格区域上滚轮滚动（Shift+滚轮更容易触发横向滚动）。
			</Text>
		</Container>
	)
}

export default function Demo(): JSX.Element {
	const { ref: containerRef, width: containerWidth } = useContainerWidth<HTMLDivElement>(980)
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const envRef = useRef<CanvasEnv | null>(null)
	const engineRef = useRef<Engine | null>(null)
	const devtoolsRef = useRef<WeaveDevtoolsController | null>(null)
	const devtoolsIdRef = useRef(
		`weave-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
	)
	const sceneMirror = useMemo(() => createSceneMirror(null), [])

	const textMeasurer = useMemo(() => createBrowserTextMeasurer(), [])
	const columns = useMemo(() => createColumns(14), [])
	const rows = useMemo(() => createRows(200, 14), [])

	const width = Math.max(420, Math.min(containerWidth, 1100))
	const height = 520

	const [tableHeight, setTableHeight] = useState(240)
	const [scrollX, setScrollX] = useState(0)
	const [scrollY, setScrollY] = useState(0)

	const rerender = (engine: Engine) => {
		const env = envRef.current
		if (!env) return
		renderEngineToCanvas(engine, env, width, height)
		devtoolsRef.current?.emit({ type: 'render', time: Date.now() })
	}

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const devtools = attachWeaveDevtools({
			enabled: true,
			id: devtoolsIdRef.current,
			name: 'docs devtools-table-scroll-canvas',
			canvas,
			getScene: sceneMirror.getScene,
			getNodeById: sceneMirror.getNodeById,
			hitTest: async (x: number, y: number) => {
				const engine = engineRef.current
				if (!engine) return { id: null, path: [] }
				return engine.hitTest({ x, y })
			},
			getNodeInfo: async (nodeId: string) => {
				const engine = engineRef.current
				if (!engine) return null
				return engine.getNodeInfo(nodeId)
			},
		})
		devtoolsRef.current = devtools

		return () => {
			devtools.dispose()
			if (devtoolsRef.current === devtools) devtoolsRef.current = null
		}
	}, [])

	useEffect(() => {
		let disposed = false
		const init = async () => {
			const canvas = canvasRef.current
			if (!canvas) return
			const env = ensureCanvasEnv(canvas)
			if (!env) return
			envRef.current = env

			const root = sceneFromJSX(buildScene(columns, rows, tableHeight))
			sceneMirror.setScene(root)
			devtoolsRef.current?.emit({ type: 'setScene', time: Date.now() })

			const engine = await createEngine({
				textMeasurer,
				root,
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
	}, [columns, rows, tableHeight, textMeasurer, width])

	useEffect(() => {
		const engine = engineRef.current
		if (!engine) return
		const patches: ScenePatch[] = [
			{
				op: 'updateStyle',
				id: 'table',
				style: {
					width: 720,
					height: tableHeight,
					overflowX: 'auto',
					overflowY: 'auto',
				},
			},
			{ op: 'updateScroll', id: 'table', scroll: { x: scrollX, y: scrollY } },
			{
				op: 'updateText',
				id: 'state',
				text: `scrollX=${Math.round(scrollX)}, scrollY=${Math.round(scrollY)}`,
			},
		]
		sceneMirror.applyPatches(patches)
		devtoolsRef.current?.emit({
			type: 'applyPatches',
			time: Date.now(),
			count: patches.length,
		})
		engine.applyPatches(patches)
		rerender(engine)
	}, [sceneMirror, scrollX, scrollY, tableHeight, width])

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
			if (!hit.path.includes('table')) return
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
			<div style={{ display: 'grid', gap: 8 }}>
				<label style={{ display: 'grid', gap: 4 }}>
					<span style={{ fontSize: 12, color: '#334155' }}>table height</span>
					<input
						type="range"
						min={160}
						max={360}
						value={tableHeight}
						onChange={(e) => setTableHeight(Number(e.target.value))}
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
						max={5200}
						value={scrollY}
						onChange={(e) => setScrollY(Number(e.target.value))}
					/>
				</label>
			</div>
			<canvas ref={canvasRef} style={{ width: '100%', borderRadius: 8 }} />
		</div>
	)
}
