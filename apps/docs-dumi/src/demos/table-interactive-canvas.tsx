import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createEngine } from '@jiujue/weave-core'
import type { Engine } from '@jiujue/weave-core'
import { sceneFromJSX } from '@jiujue/weave-react'
import { useContainerWidth } from './useContainerWidth'
import type {
	ScenePatch,
	TableColumn,
	TableHeaderGroup,
	TableRow,
	TableStyle,
	TextMeasurer,
	TextStyle
} from '@jiujue/weave-types'

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

function createColumns(): readonly TableColumn[] {
	return [
		{
			id: 'name',
			title: 'Name',
			width: { type: 'flex', weight: 2 },
			cellTextStyle: { fontSize: 12, color: '#e5e7eb' }
		},
		{
			id: 'status',
			title: 'Status',
			width: 120,
			align: 'center',
			cellTextStyle: { fontSize: 12, color: '#e5e7eb' }
		},
		{
			id: 'score',
			title: 'Score',
			width: 100,
			align: 'right',
			cellTextStyle: { fontSize: 12, color: '#e5e7eb' }
		}
	]
}

function createGroupedHeader(): readonly TableHeaderGroup[] {
	return [
		{
			id: 'g-user',
			label: 'User',
			align: 'left',
			children: [
				{ type: 'col', colId: 'name' },
				{ type: 'col', colId: 'status' }
			]
		},
		{
			id: 'g-metrics',
			label: 'Metrics',
			align: 'right',
			children: [{ type: 'col', colId: 'score' }]
		}
	]
}

function randomRow(i: number): TableRow {
	const names = ['Ada', 'Linus', 'Grace', 'Ken', 'Edsger', 'Margaret', 'Alan']
	const statuses = ['Active', 'Idle', 'Paused']
	const name = names[i % names.length]
	const status = statuses[Math.floor(Math.random() * statuses.length)]
	const score = String(Math.floor(50 + Math.random() * 50))

	return {
		id: `r-${i}`,
		cells: {
			name,
			status,
			score
		}
	}
}

function createRows(count: number): readonly TableRow[] {
	return Array.from({ length: count }, (_, i) => randomRow(i))
}

function tableStyleFromState(input: {
	zebra: boolean
	cellPadding: number
	rowHeight: number
}): TableStyle {
	return {
		background: { color: '#0b1021' },
		headerBackground: { color: '#111827' },
		rowBackground: { color: '#0b1021' },
		altRowBackground: input.zebra ? { color: '#0f172a' } : undefined,
		grid: { color: '#334155', width: 1, alpha: 0.7 },
		headerGrid: { color: '#334155', width: 1, alpha: 0.9 },
		cellPadding: input.cellPadding,
		headerRowHeight: 34,
		rowHeight: input.rowHeight,
		headerTextStyle: { fontSize: 12, color: '#e5e7eb', fontWeight: 'bold' },
		cellTextStyle: { fontSize: 12, color: '#e5e7eb' }
	}
}

function initialScene(): JSX.Element {
	return (
		<container
			id='root'
			style={{
				padding: 16,
				flexDirection: 'column',
				gap: 12
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
				Table：列定义 + Header Group + 数据更新
			</Text>
			<Table
				id='tbl'
				style={{ height: 260 }}
				columns={createColumns()}
				header={createGroupedHeader()}
				rows={createRows(6)}
				tableStyle={tableStyleFromState({
					zebra: true,
					cellPadding: 10,
					rowHeight: 30
				})}
			/>
		</container>
	)
}

function clampInt(v: number, min: number, max: number): number {
	if (Number.isNaN(v)) return min
	return Math.max(min, Math.min(max, Math.round(v)))
}

export default function Demo(): JSX.Element {
	const { ref: containerRef, width: containerWidth } =
		useContainerWidth<HTMLDivElement>(960)
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const engineRef = useRef<Engine | null>(null)
	const canvasEnvRef = useRef<CanvasEnv | null>(null)

	const textMeasurer = useMemo(() => createBrowserTextMeasurer(), [])

	const [rows, setRows] = useState<readonly TableRow[]>(() => createRows(6))
	const [groupedHeader, setGroupedHeader] = useState(true)
	const [zebra, setZebra] = useState(true)
	const [cellPadding, setCellPadding] = useState(10)
	const [rowHeight, setRowHeight] = useState(30)
	const [tableHeight, setTableHeight] = useState(260)
	const [opCount, setOpCount] = useState<number | null>(null)

	const width = Math.max(520, Math.min(containerWidth, 1200))
	const height = Math.max(260, tableHeight + 120)

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
			engineRef.current?.dispose()
			engineRef.current = null
		}
	}, [textMeasurer])

	useEffect(() => {
		const engine = engineRef.current
		if (!engine) return

		const patches: ScenePatch[] = [
			{
				op: 'updateStyle',
				id: 'root',
				style: { padding: 16, flexDirection: 'column', gap: 12 }
			},
			{
				op: 'updateStyle',
				id: 'tbl',
				style: { width: Math.max(320, width - 32), height: tableHeight }
			},
			{ op: 'updateTableData', id: 'tbl', rows },
			{
				op: 'updateTableStyle',
				id: 'tbl',
				tableStyle: tableStyleFromState({ zebra, cellPadding, rowHeight })
			},
			{
				op: 'updateTableColumns',
				id: 'tbl',
				columns: createColumns(),
				header: groupedHeader ? createGroupedHeader() : undefined
			}
		]

		engine.applyPatches(patches)
		rerender(engine)
	}, [
		rows,
		groupedHeader,
		zebra,
		cellPadding,
		rowHeight,
		tableHeight,
		width,
		height
	])

	const addRow = () => {
		setRows(prev => [...prev, randomRow(prev.length)])
	}

	const removeRow = () => {
		setRows(prev => prev.slice(0, Math.max(0, prev.length - 1)))
	}

	const randomizeScores = () => {
		setRows(prev =>
			prev.map(r => ({
				...r,
				cells: {
					...r.cells,
					score: String(Math.floor(50 + Math.random() * 50))
				}
			}))
		)
	}

	const sortByScore = () => {
		setRows(prev =>
			[...prev].sort(
				(a, b) => Number(b.cells.score ?? '0') - Number(a.cells.score ?? '0')
			)
		)
	}

	return (
		<div ref={containerRef} style={{ display: 'grid', gap: 12 }}>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
					gap: 12,
					alignItems: 'end'
				}}
			>
				<div style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>数据</div>
					<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
						<button onClick={addRow}>add row</button>
						<button onClick={removeRow} disabled={rows.length === 0}>
							remove row
						</button>
						<button onClick={randomizeScores}>randomize score</button>
						<button onClick={sortByScore}>sort score desc</button>
					</div>
				</div>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>Header Group</div>
					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<input
							type='checkbox'
							checked={groupedHeader}
							onChange={e => setGroupedHeader(e.target.checked)}
						/>
						<span style={{ fontSize: 12, color: '#6b7280' }}>
							{groupedHeader ? 'enabled' : 'disabled'}
						</span>
					</div>
				</label>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>Zebra Rows</div>
					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<input
							type='checkbox'
							checked={zebra}
							onChange={e => setZebra(e.target.checked)}
						/>
						<span style={{ fontSize: 12, color: '#6b7280' }}>
							{zebra ? 'enabled' : 'disabled'}
						</span>
					</div>
				</label>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>Cell Padding</div>
					<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
						<input
							type='range'
							min={0}
							max={18}
							value={cellPadding}
							onChange={e =>
								setCellPadding(clampInt(Number(e.target.value), 0, 18))
							}
						/>
						<span style={{ fontSize: 12, color: '#6b7280' }}>
							{cellPadding}
						</span>
					</div>
				</label>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>Row Height</div>
					<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
						<input
							type='range'
							min={22}
							max={44}
							value={rowHeight}
							onChange={e =>
								setRowHeight(clampInt(Number(e.target.value), 22, 44))
							}
						/>
						<span style={{ fontSize: 12, color: '#6b7280' }}>{rowHeight}</span>
					</div>
				</label>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>
						Table Height（溢出裁剪）
					</div>
					<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
						<input
							type='range'
							min={120}
							max={420}
							value={tableHeight}
							onChange={e =>
								setTableHeight(clampInt(Number(e.target.value), 120, 420))
							}
						/>
						<span style={{ fontSize: 12, color: '#6b7280' }}>
							{tableHeight}
						</span>
					</div>
				</label>

				<div style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>当前行数</div>
					<div style={{ fontSize: 12, color: '#6b7280' }}>{rows.length}</div>
				</div>
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
