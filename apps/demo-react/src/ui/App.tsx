import React, { useMemo, useState } from 'react'
import type { SceneNode, TableRow } from '@jiujue/weave-types'
import { sceneFromJSX } from '@jiujue/weave-react'
import { WeaveCanvas } from './WeaveCanvas'
import { buildWeaveScene } from '../weave-scene/Scene'

const cities = ['上海', '北京', '深圳', '杭州', '成都', '武汉', '南京', '西安']
const depts = ['前端', '平台', '数据', '测试', '产品', '设计', '客户端']
const roles = ['工程师', 'Tech Lead', 'PM', 'QA', '实习生', 'Designer']
const familyNames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '陈', '褚', '卫', '蒋']
const givenNames = [
	'一',
	'二',
	'三',
	'四',
	'五',
	'六',
	'七',
	'八',
	'九',
	'十',
	'子',
	'明',
	'浩',
	'宁',
	'然',
	'文',
]

function pick<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)]!
}

function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeRow(id: string): TableRow {
	const q1 = randInt(60, 100)
	const q2 = randInt(60, 100)
	const q3 = randInt(60, 100)
	const q4 = randInt(60, 100)
	const total = Math.round((q1 + q2 + q3 + q4) / 4)
	const name = `${pick(familyNames)}${pick(givenNames)}${
		Math.random() < 0.25 ? pick(givenNames) : ''
	}`
	return {
		id,
		cells: {
			name,
			age: String(randInt(20, 45)),
			city: pick(cities),
			dept: pick(depts),
			role: pick(roles),
			q1: String(q1),
			q2: String(q2),
			q3: String(q3),
			q4: String(q4),
			total: String(total),
		},
	}
}

function makeRows(count: number, startIndex = 1): readonly TableRow[] {
	const out: TableRow[] = []
	for (let i = 0; i < count; i++) out.push(makeRow(`r${startIndex + i}`))
	return out
}

export function App() {
	const [rowCount, setRowCount] = useState(20)
	const [tableHeight, setTableHeight] = useState(360)
	const [seed, setSeed] = useState(1)
	const [rows, setRows] = useState<readonly TableRow[]>(() => makeRows(20, 1))

	const message = useMemo(() => {
		return `rows=${rows.length} height=${
			tableHeight === 0 ? 'auto' : `${tableHeight}px`
		} seed=${seed}`
	}, [rows.length, seed, tableHeight])

	const sceneFromJsx = useMemo<SceneNode>(() => {
		return sceneFromJSX(
			<container id="root-sceneFromJSX" style={{ padding: 24, gap: 16, flexDirection: 'column' }}>
				<text
					id="title"
					textStyle={{
						color: '#e5e7eb',
						fontSize: 26,
						fontWeight: 700,
						whiteSpace: 'nowrap',
						textBaseline: 'top',
					}}
				>
					sceneFromJSX（更简单）
				</text>

				<text
					id="hint"
					textStyle={{
						color: '#93c5fd',
						fontSize: 14,
						whiteSpace: 'nowrap',
						textBaseline: 'top',
					}}
				>
					{message}
				</text>

				<table
					id="table"
					style={{
						width: 980,
						...(tableHeight > 0 ? { height: tableHeight } : {}),
					}}
					columns={[
						{ id: 'name', title: '姓名', width: { type: 'flex', weight: 2 } },
						{
							id: 'age',
							title: '年龄',
							width: 72,
							align: 'right',
							vAlign: 'middle',
						},
						{ id: 'city', title: '城市', width: { type: 'flex', weight: 2 } },
						{ id: 'dept', title: '部门', width: { type: 'flex', weight: 2 } },
						{ id: 'role', title: '岗位', width: { type: 'flex', weight: 2 } },
						{
							id: 'q1',
							title: 'Q1',
							width: 72,
							align: 'right',
							vAlign: 'middle',
						},
						{
							id: 'q2',
							title: 'Q2',
							width: 72,
							align: 'right',
							vAlign: 'middle',
						},
						{
							id: 'q3',
							title: 'Q3',
							width: 72,
							align: 'right',
							vAlign: 'middle',
						},
						{
							id: 'q4',
							title: 'Q4',
							width: 72,
							align: 'right',
							vAlign: 'middle',
						},
						{
							id: 'total',
							title: '全年',
							width: 88,
							align: 'right',
							vAlign: 'middle',
						},
					]}
					header={[
						{
							id: 'g1',
							label: '基础信息',
							align: 'center',
							vAlign: 'middle',
							children: [
								{ type: 'col', colId: 'name' },
								{ type: 'col', colId: 'age' },
								{ type: 'col', colId: 'city' },
							],
						},
						{
							id: 'g2',
							label: '工作信息',
							align: 'center',
							vAlign: 'middle',
							children: [
								{ type: 'col', colId: 'dept' },
								{ type: 'col', colId: 'role' },
							],
						},
						{
							id: 'g3',
							label: '绩效',
							align: 'center',
							vAlign: 'middle',
							children: [
								{
									id: 'g3-1',
									label: '季度评分',
									align: 'center',
									vAlign: 'middle',
									children: [
										{ type: 'col', colId: 'q1' },
										{ type: 'col', colId: 'q2' },
										{ type: 'col', colId: 'q3' },
										{ type: 'col', colId: 'q4' },
									],
								},
								{
									id: 'g3-2',
									label: '汇总',
									align: 'center',
									vAlign: 'middle',
									children: [{ type: 'col', colId: 'total' }],
								},
							],
						},
					]}
					rows={rows}
					tableStyle={{
						background: { color: '#0f172a', alpha: 0.9 },
						headerBackground: { color: '#111827', alpha: 0.95 },
						altRowBackground: { color: '#0b1224', alpha: 0.9 },
						grid: { color: '#334155', width: 1, alpha: 0.9 },
						headerAlign: 'center',
						cellAlign: 'left',
						headerVAlign: 'middle',
						cellVAlign: 'middle',
						headerRowHeight: 44,
						rowHeight: 40,
						cellPaddingHorizontal: 10,
						cellPaddingVertical: 8,
					}}
				/>
			</container>,
		)
	}, [message, rows, tableHeight])

	const sceneTyped = useMemo<SceneNode>(() => {
		return buildWeaveScene({ message, hue: 150, rows, tableHeight })
	}, [message, rows, tableHeight])

	return (
		<div
			style={{
				height: '100%',
				display: 'grid',
				gridTemplateColumns: '360px 1fr',
			}}
		>
			<div
				style={{
					padding: 16,
					borderRight: '1px solid #e5e7eb',
					background: '#fafafa',
				}}
			>
				<h2 style={{ margin: '0 0 8px' }}>Weave React</h2>
				<div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
					React 管状态与表单；Weave 在 Worker 内排版与绘制。
				</div>

				<div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
					<div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>
						右侧同时展示两种场景构建方式：sceneFromJSX 与 @jiujue/weave-types JSX runtime。
					</div>
					<label style={{ display: 'grid', gap: 6 }}>
						<div style={{ fontSize: 12, color: '#374151' }}>行数: {rowCount}</div>
						<input
							type="range"
							min={0}
							max={200}
							value={rowCount}
							onChange={(e) => {
								const next = Number(e.target.value)
								setRowCount(next)
								setRows((prev) => {
									if (next === prev.length) return prev
									if (next < prev.length) return prev.slice(0, next)
									const start = prev.length + 1
									return [...prev, ...makeRows(next - prev.length, start)]
								})
							}}
						/>
					</label>
					<label style={{ display: 'grid', gap: 6 }}>
						<div style={{ fontSize: 12, color: '#374151' }}>
							表格高度: {tableHeight === 0 ? 'auto' : `${tableHeight}px`}
						</div>
						<input
							type="range"
							min={0}
							max={900}
							step={20}
							value={tableHeight}
							onChange={(e) => setTableHeight(Number(e.target.value))}
						/>
						<input
							type="number"
							min={0}
							max={4000}
							step={10}
							value={tableHeight}
							onChange={(e) => {
								const next = Number(e.target.value)
								setTableHeight(Number.isFinite(next) ? next : 0)
							}}
							style={{
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								borderRadius: 8,
								outline: 'none',
							}}
						/>
					</label>

					<div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
						<button
							onClick={() => {
								setSeed((s) => s + 1)
								setRows(makeRows(rowCount, 1))
							}}
							style={{
								padding: '10px 12px',
								borderRadius: 8,
								border: '1px solid #d1d5db',
								background: '#fff',
								cursor: 'pointer',
							}}
						>
							随机生成
						</button>
						<button
							onClick={() => {
								setRows((prev) => {
									const nextId = `r${prev.length + 1}`
									return [...prev, makeRow(nextId)]
								})
								setRowCount((n) => n + 1)
							}}
							style={{
								padding: '10px 12px',
								borderRadius: 8,
								border: '1px solid #d1d5db',
								background: '#fff',
								cursor: 'pointer',
							}}
						>
							新增一行
						</button>
						<button
							onClick={() => {
								setRows((prev) => prev.slice(0, Math.max(0, prev.length - 1)))
								setRowCount((n) => Math.max(0, n - 1))
							}}
							style={{
								padding: '10px 12px',
								borderRadius: 8,
								border: '1px solid #d1d5db',
								background: '#fff',
								cursor: 'pointer',
							}}
						>
							删除一行
						</button>
						<button
							onClick={() => {
								setRows((prev) => {
									const copy = [...prev]
									for (let i = copy.length - 1; i > 0; i--) {
										const j = Math.floor(Math.random() * (i + 1))
										;[copy[i], copy[j]] = [copy[j], copy[i]]
									}
									return copy
								})
							}}
							style={{
								padding: '10px 12px',
								borderRadius: 8,
								border: '1px solid #d1d5db',
								background: '#fff',
								cursor: 'pointer',
							}}
						>
							打乱顺序
						</button>
					</div>
				</div>
			</div>

			<div
				style={{
					position: 'relative',
					background: '#0b1020',
					display: 'grid',
					gridTemplateRows: '1fr 1fr',
				}}
			>
				<div
					style={{
						position: 'relative',
						borderBottom: '1px solid rgba(229, 231, 235, 0.14)',
					}}
				>
					<div
						style={{
							position: 'absolute',
							top: 12,
							left: 12,
							zIndex: 1,
							padding: '6px 10px',
							border: '1px solid rgba(148, 163, 184, 0.22)',
							borderRadius: 999,
							background: 'rgba(15, 23, 42, 0.7)',
							color: '#e5e7eb',
							fontSize: 12,
							lineHeight: 1,
							backdropFilter: 'blur(8px)',
							pointerEvents: 'none',
						}}
					>
						sceneFromJSX（更简单）
					</div>
					<WeaveCanvas scene={sceneFromJsx} />
				</div>
				<div style={{ position: 'relative' }}>
					<div
						style={{
							position: 'absolute',
							top: 12,
							left: 12,
							zIndex: 1,
							padding: '6px 10px',
							border: '1px solid rgba(148, 163, 184, 0.22)',
							borderRadius: 999,
							background: 'rgba(15, 23, 42, 0.7)',
							color: '#e5e7eb',
							fontSize: 12,
							lineHeight: 1,
							backdropFilter: 'blur(8px)',
							pointerEvents: 'none',
						}}
					>
						@jiujue/weave-types JSX runtime（更强类型）
					</div>
					<WeaveCanvas scene={sceneTyped} />
				</div>
			</div>
		</div>
	)
}
