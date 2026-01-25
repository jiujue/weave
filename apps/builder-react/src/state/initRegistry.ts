import { registry } from '@jiujue/weave-editor-core'

export function initRegistry() {
	registry.register({
		type: 'container',
		label: 'Container',
		props: [
			{ name: 'id', label: 'ID', type: 'string' },
			{ name: 'style.width', label: 'Width', type: 'number' },
			{ name: 'style.height', label: 'Height', type: 'number' },
			{
				name: 'style.position',
				label: 'Position',
				type: 'enum',
				options: ['relative', 'absolute'],
			},
			{ name: 'style.top', label: 'Top', type: 'number' },
			{ name: 'style.left', label: 'Left', type: 'number' },
			{ name: 'style.right', label: 'Right', type: 'number' },
			{ name: 'style.bottom', label: 'Bottom', type: 'number' },
			{
				name: 'style.flexDirection',
				label: 'Direction',
				type: 'enum',
				options: ['row', 'column', 'row-reverse', 'column-reverse'],
			},
			{
				name: 'style.flexWrap',
				label: 'Wrap',
				type: 'enum',
				options: ['nowrap', 'wrap', 'wrap-reverse'],
			},
			{
				name: 'style.justifyContent',
				label: 'Justify',
				type: 'enum',
				options: [
					'flex-start',
					'center',
					'flex-end',
					'space-between',
					'space-around',
					'space-evenly',
				],
			},
			{
				name: 'style.alignItems',
				label: 'Align',
				type: 'enum',
				options: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'],
			},
			{ name: 'style.padding', label: 'Padding', type: 'number' },
			{ name: 'style.gap', label: 'Gap', type: 'number' },
			{ name: 'style.background.color', label: 'Bg Color', type: 'color' },
		],
		create: () => ({
			type: 'container',
			style: { width: 100, height: 100 },
			children: [],
		}),
	})

	registry.register({
		type: 'relative',
		label: 'Relative',
		props: [
			{ name: 'id', label: 'ID', type: 'string' },
			{ name: 'style.width', label: 'Width', type: 'number' },
			{ name: 'style.height', label: 'Height', type: 'number' },
			{
				name: 'style.overflowX',
				label: 'Overflow X',
				type: 'enum',
				options: ['visible', 'hidden', 'scroll', 'auto'],
			},
			{
				name: 'style.overflowY',
				label: 'Overflow Y',
				type: 'enum',
				options: ['visible', 'hidden', 'scroll', 'auto'],
			},
		],
		create: () => ({
			type: 'relative',
			style: { width: 320, height: 240 },
			children: [],
		}),
	})

	registry.register({
		type: 'text',
		label: 'Text',
		props: [
			{ name: 'id', label: 'ID', type: 'string' },
			{ name: 'text', label: 'Content', type: 'string' },
			{
				name: 'style.position',
				label: 'Position',
				type: 'enum',
				options: ['relative', 'absolute'],
			},
			{ name: 'style.top', label: 'Top', type: 'number' },
			{ name: 'style.left', label: 'Left', type: 'number' },
			{ name: 'style.right', label: 'Right', type: 'number' },
			{ name: 'style.bottom', label: 'Bottom', type: 'number' },
			{ name: 'textStyle.fontSize', label: 'Font Size', type: 'number' },
			{ name: 'textStyle.color', label: 'Color', type: 'color' },
			{ name: 'style.flexGrow', label: 'Grow', type: 'number' },
			{ name: 'style.flexShrink', label: 'Shrink', type: 'number' },
			{ name: 'style.flexBasis', label: 'Basis', type: 'number' },
		],
		create: () => ({
			type: 'text',
			text: 'Hello',
			textStyle: { fontSize: 16 },
		}),
	})

	registry.register({
		type: 'table',
		label: 'Table',
		props: [
			{ name: 'id', label: 'ID', type: 'string' },
			{ name: 'style.width', label: 'Width', type: 'number' },
			{ name: 'style.height', label: 'Height', type: 'number' },
			{
				name: 'style.position',
				label: 'Position',
				type: 'enum',
				options: ['relative', 'absolute'],
			},
			{ name: 'style.top', label: 'Top', type: 'number' },
			{ name: 'style.left', label: 'Left', type: 'number' },
			{ name: 'style.right', label: 'Right', type: 'number' },
			{ name: 'style.bottom', label: 'Bottom', type: 'number' },
			{
				name: 'style.overflowX',
				label: 'Overflow X',
				type: 'enum',
				options: ['visible', 'hidden', 'scroll', 'auto'],
			},
			{
				name: 'style.overflowY',
				label: 'Overflow Y',
				type: 'enum',
				options: ['visible', 'hidden', 'scroll', 'auto'],
			},
			{
				name: 'tableStyle.headerRowHeight',
				label: 'Header Height',
				type: 'number',
			},
			{ name: 'tableStyle.rowHeight', label: 'Row Height', type: 'number' },
			{ name: 'tableStyle.cellPadding', label: 'Cell Padding', type: 'number' },
			{ name: 'columns', label: 'Columns', type: 'json' },
			{ name: 'rows', label: 'Rows', type: 'json' },
		],
		create: () => ({
			type: 'table',
			style: {
				width: 520,
				height: 280,
				overflowX: 'auto',
				overflowY: 'auto',
			},
			columns: [
				{
					id: 'name',
					title: 'Name',
					width: { type: 'flex', weight: 2 },
					minWidth: 140,
				},
				{
					id: 'role',
					title: 'Role',
					width: { type: 'flex', weight: 1 },
					minWidth: 120,
				},
				{ id: 'score', title: 'Score', width: 90, align: 'right' },
				{ id: 'city', title: 'City', width: { type: 'auto' }, minWidth: 120 },
			],
			rows: [
				{
					id: 'r1',
					cells: {
						name: 'Alice',
						role: 'Engineer',
						score: '93',
						city: 'Shanghai',
					},
				},
				{
					id: 'r2',
					cells: {
						name: 'Bob',
						role: 'Designer',
						score: '88',
						city: 'Shenzhen',
					},
				},
				{
					id: 'r3',
					cells: { name: 'Carol', role: 'PM', score: '91', city: 'Beijing' },
				},
				{
					id: 'r4',
					cells: { name: 'Dave', role: 'QA', score: '85', city: 'Hangzhou' },
				},
				{
					id: 'r5',
					cells: { name: 'Eve', role: 'DevOps', score: '95', city: 'Chengdu' },
				},
				{
					id: 'r6',
					cells: { name: 'Frank', role: 'Data', score: '89', city: 'Wuhan' },
				},
				{
					id: 'r7',
					cells: {
						name: 'Grace',
						role: 'Support',
						score: '84',
						city: 'Nanjing',
					},
				},
				{
					id: 'r8',
					cells: {
						name: 'Heidi',
						role: 'Marketing',
						score: '90',
						city: 'Guangzhou',
					},
				},
			],
		}),
	})
}
