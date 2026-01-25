import { jsx, jsxs } from '@jiujue/weave-types/jsx-runtime'

const sum = (rows, colId) => {
	let s = 0
	for (const r of rows) s += Number(r.cells[colId] || 0)
	return s
}

export function buildWeaveSceneRuntimeJs(input) {
	const hue = Number(input?.hue ?? 210)
	const rows = input?.rows ?? []
	const tableHeight = Number(input?.tableHeight ?? 0)
	const message = String(input?.message ?? 'Hello')

	const total = sum(rows, 'q1') + sum(rows, 'q2') + sum(rows, 'q3') + sum(rows, 'q4')

	return jsxs('container', {
		id: 'root',
		style: { padding: 24, gap: 16, flexDirection: 'column' },
		children: [
			jsx('text', {
				id: 'title',
				textStyle: {
					color: '#e5e7eb',
					fontSize: 26,
					fontWeight: 700,
					whiteSpace: 'nowrap',
					textBaseline: 'top',
				},
				children: '@jiujue/weave-types/jsx-runtime（JS 项目直接用函数，不需要 TS/JSX 编译配置）',
			}),
			jsxs('container', {
				id: 'row',
				style: { flexDirection: 'row', gap: 16, alignItems: 'center' },
				children: [
					jsx('container', {
						id: 'badge',
						style: { paddingVertical: 10, paddingHorizontal: 12 },
						paint: {
							background: { color: '#111827', alpha: 0.9 },
							border: { color: '#374151', width: 1 },
						},
						children: jsx('text', {
							id: 'badgeText',
							textStyle: {
								color: '#93c5fd',
								fontSize: 14,
								whiteSpace: 'nowrap',
								textBaseline: 'top',
							},
							children: message,
						}),
					}),
					jsx('polygon', {
						id: 'poly',
						style: { marginLeft: 6 },
						points: [
							{ x: 0, y: 8 },
							{ x: 40, y: 0 },
							{ x: 72, y: 22 },
							{ x: 56, y: 56 },
							{ x: 16, y: 48 },
						],
						paint: {
							fill: { color: `hsl(${hue} 80% 55%)`, alpha: 0.9 },
							stroke: { color: `hsl(${hue} 80% 45%)`, width: 2, alpha: 0.9 },
						},
					}),
					jsx('container', {
						id: 'total',
						style: { paddingVertical: 10, paddingHorizontal: 12 },
						paint: {
							background: { color: '#0b1021', alpha: 1 },
							border: { color: '#334155', width: 1 },
						},
						children: jsx('text', {
							id: 'totalText',
							textStyle: {
								color: '#e5e7eb',
								fontSize: 14,
								whiteSpace: 'nowrap',
								textBaseline: 'top',
							},
							children: `Total: ${total}`,
						}),
					}),
				],
			}),
			jsx('table', {
				id: 'table',
				style: {
					width: 980,
					...(tableHeight > 0 ? { height: tableHeight } : {}),
				},
				columns: [
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
					{ id: 'q4', title: 'Q4', width: 72, align: 'right', vAlign: 'middle' },
				],
				rows,
				tableStyle: {
					background: { color: '#0b1021' },
					headerBackground: { color: '#111827' },
					altRowBackground: { color: '#0f172a' },
					grid: { color: '#334155', width: 1, alpha: 0.7 },
					headerGrid: { color: '#334155', width: 1, alpha: 0.9 },
					cellPadding: 8,
					headerRowHeight: 34,
					rowHeight: 30,
					headerTextStyle: {
						fontSize: 12,
						color: '#e5e7eb',
						fontWeight: 'bold',
					},
					cellTextStyle: { fontSize: 12, color: '#e5e7eb' },
				},
			}),
		],
	})
}
