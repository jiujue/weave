import { createWeaveApp } from '@jiujue/weave-app'
import type { SceneNode } from '@jiujue/weave-types'
import { sceneFromJSX } from '@jiujue/weave-react'
import React from 'react'

const canvasSimple = document.getElementById(
	'canvasSimple'
) as HTMLCanvasElement
const canvasTyped = document.getElementById('canvasTyped') as HTMLCanvasElement

const tableColumns = [
	{ id: 'name', title: '姓名', width: { type: 'flex', weight: 2 } },
	{ id: 'age', title: '年龄', width: 72, align: 'right' },
	{ id: 'city', title: '城市', width: { type: 'flex', weight: 2 } },
	{ id: 'dept', title: '部门', width: { type: 'flex', weight: 2 } },
	{ id: 'role', title: '岗位', width: { type: 'flex', weight: 2 } },
	{ id: 'q1', title: 'Q1', width: 72, align: 'right' },
	{ id: 'q2', title: 'Q2', width: 72, align: 'right' },
	{ id: 'q3', title: 'Q3', width: 72, align: 'right' },
	{ id: 'q4', title: 'Q4', width: 72, align: 'right' },
	{ id: 'total', title: '全年', width: 88, align: 'right' }
] as const

const tableHeader = [
	{
		id: 'g1',
		label: '基础信息',
		align: 'center',
		children: [
			{ type: 'col', colId: 'name' },
			{ type: 'col', colId: 'age' },
			{ type: 'col', colId: 'city' }
		]
	},
	{
		id: 'g2',
		label: '工作信息',
		align: 'center',
		children: [
			{ type: 'col', colId: 'dept' },
			{ type: 'col', colId: 'role' }
		]
	},
	{
		id: 'g3',
		label: '绩效',
		align: 'center',
		children: [
			{
				id: 'g3-1',
				label: '季度评分',
				align: 'center',
				children: [
					{ type: 'col', colId: 'q1' },
					{ type: 'col', colId: 'q2' },
					{ type: 'col', colId: 'q3' },
					{ type: 'col', colId: 'q4' }
				]
			},
			{
				id: 'g3-2',
				label: '汇总',
				align: 'center',
				children: [{ type: 'col', colId: 'total' }]
			}
		]
	}
] as const

const tableRows = [
	{
		id: 'r1',
		cells: {
			name: '张三',
			age: '28',
			city: '上海',
			dept: '前端',
			role: '工程师',
			q1: '96',
			q2: '98',
			q3: '97',
			q4: '99',
			total: '98'
		}
	},
	{
		id: 'r2',
		cells: {
			name: '李四',
			age: '34',
			city: '北京',
			dept: '平台',
			role: 'Tech Lead',
			q1: '88',
			q2: '86',
			q3: '89',
			q4: '87',
			total: '88'
		}
	},
	{
		id: 'r3',
		cells: {
			name: '王五',
			age: '22',
			city: '深圳',
			dept: '数据',
			role: '实习生',
			q1: '80',
			q2: '84',
			q3: '82',
			q4: '85',
			total: '83'
		}
	},
	{
		id: 'r4',
		cells: {
			name: '赵六',
			age: '41',
			city: '杭州',
			dept: '产品',
			role: 'PM',
			q1: '72',
			q2: '76',
			q3: '78',
			q4: '75',
			total: '75'
		}
	},
	{
		id: 'r5',
		cells: {
			name: '陈七',
			age: '29',
			city: '成都',
			dept: '测试',
			role: 'QA',
			q1: '90',
			q2: '92',
			q3: '91',
			q4: '93',
			total: '92'
		}
	}
] as const

const typedScene: SceneNode = (
	<container
		id='root'
		style={{ padding: 24, gap: 16, flexDirection: 'column' }}
	>
		<text
			id='title'
			textStyle={{
				color: '#e5e7eb',
				fontSize: 26,
				fontWeight: 700,
				whiteSpace: 'nowrap',
				textBaseline: 'top'
			}}
		>
			Weave：Offscreen + Yoga + DisplayList
		</text>

		<container
			id='row'
			style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}
		>
			<container
				id='badge'
				style={{ paddingVertical: 10, paddingHorizontal: 12 }}
				paint={{
					background: { color: '#111827', alpha: 0.9 },
					border: { color: '#374151', width: 1 }
				}}
			>
				<text
					id='badgeText'
					textStyle={{
						color: '#93c5fd',
						fontSize: 14,
						whiteSpace: 'nowrap',
						textBaseline: 'top'
					}}
				>
					布局来自 Yoga，渲染靠 DisplayList
				</text>
			</container>

			<polygon
				id='poly'
				style={{ marginLeft: 6 }}
				points={[
					{ x: 0, y: 8 },
					{ x: 40, y: 0 },
					{ x: 72, y: 22 },
					{ x: 56, y: 56 },
					{ x: 16, y: 48 }
				]}
				paint={{
					fill: { color: '#34d399', alpha: 0.9 },
					stroke: { color: '#10b981', width: 2, alpha: 0.9 }
				}}
			/>
		</container>

		<container
			id='card'
			style={{ padding: 16, gap: 10, flexDirection: 'column' }}
			paint={{
				background: { color: '#0f172a', alpha: 0.9 },
				border: { color: '#1f2937', width: 1 }
			}}
		>
			<text
				id='cardTitle'
				textStyle={{
					color: '#f8fafc',
					fontSize: 18,
					fontWeight: 600,
					whiteSpace: 'nowrap',
					textBaseline: 'top'
				}}
			>
				Text / Container / Polygon 基础元素
			</text>
			<text
				id='cardBody'
				style={{ width: 520 }}
				textStyle={{
					color: '#cbd5e1',
					fontSize: 14,
					whiteSpace: 'normal',
					textBaseline: 'top',
					lineHeight: 18
				}}
			>
				这段文字会在 Yoga 的 width 约束下进行测量，生成多行 lines，然后 paint
				阶段输出多条 drawText 指令（仍然是 DisplayList）。
			</text>
		</container>

		<table
			id='table1'
			style={{ width: 980 }}
			columns={tableColumns}
			header={tableHeader}
			rows={tableRows}
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
				cellPaddingVertical: 8
			}}
		/>
	</container>
)

const el = React.createElement
const simpleScene: SceneNode = sceneFromJSX(
	el(
		'container',
		{ id: 'root', style: { padding: 24, gap: 16, flexDirection: 'column' } },
		el(
			'text',
			{
				id: 'title',
				textStyle: {
					color: '#e5e7eb',
					fontSize: 26,
					fontWeight: 700,
					whiteSpace: 'nowrap',
					textBaseline: 'top'
				}
			},
			'sceneFromJSX（更简单）'
		),
		el(
			'container',
			{
				id: 'row',
				style: { flexDirection: 'row', gap: 16, alignItems: 'center' }
			},
			el(
				'container',
				{
					id: 'badge',
					style: { paddingVertical: 10, paddingHorizontal: 12 },
					paint: {
						background: { color: '#111827', alpha: 0.9 },
						border: { color: '#374151', width: 1 }
					}
				},
				el(
					'text',
					{
						id: 'badgeText',
						textStyle: {
							color: '#93c5fd',
							fontSize: 14,
							whiteSpace: 'nowrap',
							textBaseline: 'top'
						}
					},
					'JSX 交给 React element；sceneFromJSX 转成 SceneNode'
				)
			),
			el('polygon', {
				id: 'poly',
				style: { marginLeft: 6 },
				points: [
					{ x: 0, y: 8 },
					{ x: 40, y: 0 },
					{ x: 72, y: 22 },
					{ x: 56, y: 56 },
					{ x: 16, y: 48 }
				],
				paint: {
					fill: { color: '#34d399', alpha: 0.9 },
					stroke: { color: '#10b981', width: 2, alpha: 0.9 }
				}
			})
		),
		el(
			'container',
			{
				id: 'card',
				style: { padding: 16, gap: 10, flexDirection: 'column' },
				paint: {
					background: { color: '#0f172a', alpha: 0.9 },
					border: { color: '#1f2937', width: 1 }
				}
			},
			el(
				'text',
				{
					id: 'cardTitle',
					textStyle: {
						color: '#f8fafc',
						fontSize: 18,
						fontWeight: 600,
						whiteSpace: 'nowrap',
						textBaseline: 'top'
					}
				},
				'Text / Container / Polygon 基础元素'
			),
			el(
				'text',
				{
					id: 'cardBody',
					style: { width: 520 },
					textStyle: {
						color: '#cbd5e1',
						fontSize: 14,
						whiteSpace: 'normal',
						textBaseline: 'top',
						lineHeight: 18
					}
				},
				'这段文字会在 Yoga 的 width 约束下进行测量，生成多行 lines，然后输出 drawText 指令。'
			)
		),
		el('table', {
			id: 'table1',
			style: { width: 980 },
			columns: tableColumns as any,
			header: tableHeader as any,
			rows: tableRows as any,
			tableStyle: {
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
				cellPaddingVertical: 8
			}
		})
	)
)

const appSimple = createWeaveApp({
	canvas: canvasSimple,
	clearColor: '#0b1020',
	scene: simpleScene,
	onError(message) {
		console.error('[weave worker error][simple]', message)
	}
})

const appTyped = createWeaveApp({
	canvas: canvasTyped,
	clearColor: '#0b1020',
	scene: typedScene,
	onError(message) {
		console.error('[weave worker error][typed]', message)
	}
})

const resize = () => {
	appSimple.resize()
	appTyped.resize()
	appSimple.render()
	appTyped.render()
}

window.addEventListener('resize', resize)

const button = document.getElementById('rerender') as HTMLButtonElement
button.addEventListener('click', () => {
	appSimple.render()
	appTyped.render()
})

appSimple.render()
appTyped.render()
