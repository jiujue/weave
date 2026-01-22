import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { createWeaveApp } from '@jiujue/weave-app'
import { sceneFromJSX } from '@jiujue/weave-react'
import React from 'react'
import { jsx, jsxs } from '@jiujue/weave-types/jsx-runtime'

let registerFromPathFn = null
let registerFontFn = null

try {
	const mod = await import('@napi-rs/canvas')
	const GlobalFonts = mod.GlobalFonts
	if (GlobalFonts && typeof GlobalFonts.registerFromPath === 'function') {
		registerFromPathFn = (path, family) =>
			GlobalFonts.registerFromPath(path, family)
	}
} catch {}

try {
	const mod = await import('canvas')
	const registerFont = mod.registerFont
	if (typeof registerFont === 'function') {
		registerFontFn = (path, family) => registerFont(path, { family })
	}
} catch {}

const tryRegisterFont = (path, family) => {
	if (!path || !family) return false
	if (!existsSync(path)) return false
	try {
		if (registerFromPathFn) {
			registerFromPathFn(path, family)
			return true
		}
		if (registerFontFn) {
			registerFontFn(path, family)
			return true
		}
	} catch {}
	return false
}

let primaryFontFamily = process.env.WEAVE_FONT_FAMILY ?? 'Microsoft YaHei'
const envFontPath = process.env.WEAVE_FONT_PATH
const envFontFamily = process.env.WEAVE_FONT_FAMILY
let registered = false

if (envFontPath && envFontFamily) {
	registered = tryRegisterFont(envFontPath, envFontFamily)
	if (registered) primaryFontFamily = envFontFamily
} else if (process.platform === 'win32') {
	const candidates = [
		{ path: 'C:\\Windows\\Fonts\\msyh.ttc', family: 'Microsoft YaHei' },
		{ path: 'C:\\Windows\\Fonts\\msyhbd.ttc', family: 'Microsoft YaHei' },
		{ path: 'C:\\Windows\\Fonts\\simhei.ttf', family: 'SimHei' },
		{ path: 'C:\\Windows\\Fonts\\simsun.ttc', family: 'SimSun' }
	]
	for (const c of candidates) {
		if (tryRegisterFont(c.path, c.family)) {
			primaryFontFamily = c.family
			registered = true
			break
		}
	}
}

const fontFamily = [
	primaryFontFamily,
	'Microsoft YaHei',
	'PingFang SC',
	'Noto Sans CJK SC',
	'Noto Sans SC',
	'Source Han Sans SC',
	'Segoe UI',
	'Arial',
	'sans-serif'
].join(', ')

if (registered) console.log(`Using font: ${primaryFontFamily}`)

const titleStyle = {
	color: '#e5e7eb',
	fontSize: 28,
	fontWeight: 700,
	fontFamily,
	whiteSpace: 'nowrap',
	textBaseline: 'top'
}

const bodyStyle = {
	color: '#cbd5e1',
	fontSize: 14,
	fontFamily,
	whiteSpace: 'normal',
	textBaseline: 'top',
	lineHeight: 18
}

const poly = {
	id: 'poly',
	points: [
		{ x: 0, y: 10 },
		{ x: 50, y: 0 },
		{ x: 90, y: 35 },
		{ x: 70, y: 80 },
		{ x: 20, y: 65 }
	],
	paint: {
		fill: { color: '#34d399', alpha: 0.9 },
		stroke: { color: '#10b981', width: 2, alpha: 0.9 }
	}
}

const tableColumns = [
	{ id: 'name', title: '姓名', width: { type: 'flex', weight: 2 } },
	{ id: 'age', title: '年龄', width: 72, align: 'right', vAlign: 'middle' },
	{ id: 'city', title: '城市', width: { type: 'flex', weight: 2 } },
	{ id: 'dept', title: '部门', width: { type: 'flex', weight: 2 } },
	{ id: 'role', title: '岗位', width: { type: 'flex', weight: 2 } },
	{ id: 'q1', title: 'Q1', width: 72, align: 'right', vAlign: 'middle' },
	{ id: 'q2', title: 'Q2', width: 72, align: 'right', vAlign: 'middle' },
	{ id: 'q3', title: 'Q3', width: 72, align: 'right', vAlign: 'middle' },
	{ id: 'q4', title: 'Q4', width: 72, align: 'right', vAlign: 'middle' },
	{ id: 'total', title: '全年', width: 88, align: 'right', vAlign: 'middle' }
]

const tableHeader = [
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
]

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
]

const tableStyle = {
	background: { color: '#0f172a', alpha: 0.9 },
	headerBackground: { color: '#111827', alpha: 0.95 },
	altRowBackground: { color: '#0b1224', alpha: 0.9 },
	grid: { color: '#334155', width: 1, alpha: 0.9 },
	headerAlign: 'center',
	cellAlign: 'left',
	headerVAlign: 'middle',
	cellVAlign: 'middle',
	headerRowHeight: 40,
	rowHeight: 32,
	cellPaddingHorizontal: 10,
	cellPaddingVertical: 8
}

const el = React.createElement
const sceneSimple = sceneFromJSX(
	el(
		'container',
		{ id: 'root', style: { padding: 24, gap: 16, flexDirection: 'column' } },
		el(
			'text',
			{ id: 'title', textStyle: titleStyle },
			'Weave Node Render - sceneFromJSX（更简单）'
		),
		el(
			'text',
			{
				id: 'body',
				style: { width: 520 },
				textStyle: bodyStyle
			},
			'这个脚本在 Node 环境创建引擎，生成 DisplayList，并通过 @napi-rs/canvas 或 canvas 导出 PNG。'
		),
		el('polygon', { id: poly.id, points: poly.points, paint: poly.paint }),
		el('table', {
			id: 'table',
			style: { width: 752, height: 240 },
			columns: tableColumns,
			header: tableHeader,
			rows: tableRows,
			tableStyle
		})
	)
)

const sceneTyped = jsxs('container', {
	id: 'root',
	style: { padding: 24, gap: 16, flexDirection: 'column' },
	children: [
		jsx('text', {
			id: 'title',
			textStyle: titleStyle,
			children:
				'Weave Node Render - @jiujue/weave-types JSX runtime（更强类型）'
		}),
		jsx('text', {
			id: 'body',
			style: { width: 520 },
			textStyle: bodyStyle,
			children:
				'这个场景通过 @jiujue/weave-types/jsx-runtime 生成 SceneNode（相当于 TSX 编译后的输出）。'
		}),
		jsx('polygon', { id: poly.id, points: poly.points, paint: poly.paint }),
		jsx('table', {
			id: 'table',
			style: { width: 752, height: 240 },
			columns: tableColumns,
			header: tableHeader,
			rows: tableRows,
			tableStyle
		})
	]
})

try {
	const appSimple = createWeaveApp({
		width: 800,
		height: 480,
		clearColor: '#0b1020',
		scene: sceneSimple
	})
	const appTyped = createWeaveApp({
		width: 800,
		height: 480,
		clearColor: '#0b1020',
		scene: sceneTyped
	})
	try {
		const pngSimple = await appSimple.renderToPng()
		await writeFile(
			new URL('./output.sceneFromJSX.png', import.meta.url),
			pngSimple
		)
		console.log('Wrote output.sceneFromJSX.png')

		const pngTyped = await appTyped.renderToPng()
		await writeFile(
			new URL('./output.jsxRuntime.png', import.meta.url),
			pngTyped
		)
		console.log('Wrote output.jsxRuntime.png')
	} finally {
		appSimple.dispose()
		appTyped.dispose()
	}
} catch (err) {
	const message = err instanceof Error ? err.message : String(err)
	console.error(message)
	console.error(
		'Install one of: pnpm add -D @napi-rs/canvas  OR  pnpm add -D canvas'
	)
	process.exitCode = 1
}
