/** @jsxImportSource @jiujue/weave-types */
import type { SceneNode, TableRow } from '@jiujue/weave-types'

export type WeaveSceneProps = Readonly<{
	message: string
	hue: number
	rows: readonly TableRow[]
	tableHeight: number
}>

export function buildWeaveScene(props: WeaveSceneProps): SceneNode {
	return (
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
				@jiujue/weave-types JSX runtime（更强类型）
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
						{props.message}
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
						fill: { color: `hsl(${props.hue} 80% 55%)`, alpha: 0.9 },
						stroke: {
							color: `hsl(${props.hue} 80% 45%)`,
							width: 2,
							alpha: 0.9
						}
					}}
				/>
			</container>

			<table
				id='table'
				style={{
					width: 980,
					...(props.tableHeight > 0 ? { height: props.tableHeight } : {})
				}}
				columns={[
					{ id: 'name', title: '姓名', width: { type: 'flex', weight: 2 } },
					{
						id: 'age',
						title: '年龄',
						width: 72,
						align: 'right',
						vAlign: 'middle'
					},
					{ id: 'city', title: '城市', width: { type: 'flex', weight: 2 } },
					{ id: 'dept', title: '部门', width: { type: 'flex', weight: 2 } },
					{ id: 'role', title: '岗位', width: { type: 'flex', weight: 2 } },
					{
						id: 'q1',
						title: 'Q1',
						width: 72,
						align: 'right',
						vAlign: 'middle'
					},
					{
						id: 'q2',
						title: 'Q2',
						width: 72,
						align: 'right',
						vAlign: 'middle'
					},
					{
						id: 'q3',
						title: 'Q3',
						width: 72,
						align: 'right',
						vAlign: 'middle'
					},
					{
						id: 'q4',
						title: 'Q4',
						width: 72,
						align: 'right',
						vAlign: 'middle'
					},
					{
						id: 'total',
						title: '全年',
						width: 88,
						align: 'right',
						vAlign: 'middle'
					}
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
							{ type: 'col', colId: 'city' }
						]
					},
					{
						id: 'g2',
						label: '工作信息',
						align: 'center',
						vAlign: 'middle',
						children: [
							{ type: 'col', colId: 'dept' },
							{ type: 'col', colId: 'role' }
						]
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
									{ type: 'col', colId: 'q4' }
								]
							},
							{
								id: 'g3-2',
								label: '汇总',
								align: 'center',
								vAlign: 'middle',
								children: [{ type: 'col', colId: 'total' }]
							}
						]
					}
				]}
				rows={props.rows}
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
}
