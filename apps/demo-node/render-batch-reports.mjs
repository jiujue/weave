import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createWeaveApp } from '@jiujue/weave-app'
import { jsx, jsxs } from '@jiujue/weave-types/jsx-runtime'

let registerFromPathFn = null
let registerFontFn = null

try {
	const mod = await import('@napi-rs/canvas')
	const GlobalFonts = mod.GlobalFonts
	if (GlobalFonts && typeof GlobalFonts.registerFromPath === 'function') {
		registerFromPathFn = (path, family) => GlobalFonts.registerFromPath(path, family)
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

if (envFontPath && envFontFamily) {
	if (tryRegisterFont(envFontPath, envFontFamily)) primaryFontFamily = envFontFamily
} else if (process.platform === 'win32') {
	const candidates = [
		{ path: 'C:\\Windows\\Fonts\\msyh.ttc', family: 'Microsoft YaHei' },
		{ path: 'C:\\Windows\\Fonts\\msyhbd.ttc', family: 'Microsoft YaHei' },
		{ path: 'C:\\Windows\\Fonts\\simhei.ttf', family: 'SimHei' },
		{ path: 'C:\\Windows\\Fonts\\simsun.ttc', family: 'SimSun' },
	]
	for (const c of candidates) {
		if (tryRegisterFont(c.path, c.family)) {
			primaryFontFamily = c.family
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
	'sans-serif',
].join(', ')

const mulberry32 = (seed) => {
	let a = seed >>> 0
	return () => {
		a |= 0
		a = (a + 0x6d2b79f5) | 0
		let t = Math.imul(a ^ (a >>> 15), 1 | a)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

const pick = (rnd, items) => items[Math.floor(rnd() * items.length)]
const pad2 = (n) => String(n).padStart(2, '0')

const parseArgs = (argv) => {
	const out = {}
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]
		if (!a.startsWith('--')) continue
		const [k, v0] = a.slice(2).split('=')
		const v = v0 != null ? v0 : argv[i + 1]
		out[k] = v ?? true
		if (v0 == null && v != null && !String(v).startsWith('--')) i++
	}
	return out
}

const args = parseArgs(process.argv.slice(2))

const A4 = { w: 794, h: 1123 }
const variant = String(args.variant ?? 'invoice')
const dpr = Math.max(1, Number(args.dpr ?? 2))
const outDir = resolve(process.cwd(), String(args.out ?? './out/batch-reports'))
const count = Math.max(1, Number(args.count ?? 100))
const onlyId = args.id != null ? Math.max(1, Number(args.id)) : null

const variantName = (v) => {
	if (v === 'invoice') return '结算单'
	if (v === 'reimburse') return '报销单'
	if (v === 'statement') return '对账单'
	return String(v)
}

const variantTheme = (v) => {
	if (v === 'invoice') return { primary: '#2563eb', tint: '#eff6ff' }
	if (v === 'reimburse') return { primary: '#16a34a', tint: '#ecfdf5' }
	return { primary: '#7c3aed', tint: '#f5f3ff' }
}

const tableStyleFor = (v) => {
	const theme = variantTheme(v)
	return {
		background: { color: '#ffffff' },
		headerBackground: { color: theme.tint },
		altRowBackground: { color: '#f8fafc' },
		grid: { color: '#e2e8f0', width: 1, alpha: 1 },
		headerGrid: { color: '#e2e8f0', width: 1, alpha: 1 },
		cellPadding: 8,
		headerRowHeight: 34,
		rowHeight: 30,
		headerTextStyle: {
			fontSize: 12,
			color: '#0f172a',
			fontWeight: 'bold',
			fontFamily,
		},
		cellTextStyle: { fontSize: 12, color: '#0f172a', fontFamily },
	}
}

const columnsFor = (v) => {
	if (v === 'invoice') {
		return [
			{
				id: 'item',
				title: '项目',
				width: { type: 'flex', weight: 3 },
				align: 'left',
			},
			{
				id: 'period',
				title: '周期',
				width: { type: 'flex', weight: 2 },
				align: 'left',
			},
			{ id: 'qty', title: '数量', width: 72, align: 'right' },
			{ id: 'unit', title: '单价', width: 88, align: 'right' },
			{ id: 'amount', title: '金额', width: 96, align: 'right' },
		]
	}
	if (v === 'reimburse') {
		return [
			{
				id: 'item',
				title: '费用项',
				width: { type: 'flex', weight: 2 },
				align: 'left',
			},
			{
				id: 'cat',
				title: '类别',
				width: { type: 'flex', weight: 1 },
				align: 'left',
			},
			{ id: 'invoiceNo', title: '票据', width: 120, align: 'left' },
			{ id: 'amount', title: '金额', width: 96, align: 'right' },
			{
				id: 'note',
				title: '备注',
				width: { type: 'flex', weight: 2 },
				align: 'left',
			},
		]
	}
	return [
		{
			id: 'subject',
			title: '科目',
			width: { type: 'flex', weight: 2 },
			align: 'left',
		},
		{
			id: 'memo',
			title: '摘要',
			width: { type: 'flex', weight: 3 },
			align: 'left',
		},
		{ id: 'debit', title: '借', width: 96, align: 'right' },
		{ id: 'credit', title: '贷', width: 96, align: 'right' },
		{ id: 'balance', title: '余额', width: 110, align: 'right' },
	]
}

const rowsFor = (v, datasetId) => {
	const rnd = mulberry32(2000 + datasetId + (v === 'invoice' ? 0 : v === 'reimburse' ? 100 : 200))
	const n = 8 + Math.floor(rnd() * 10)
	const money = () => (Math.round((100 + rnd() * 900) * 100) / 100).toFixed(2)

	if (v === 'invoice') {
		const periods = ['2026-01', '2025-Q4', '2026-Q1', '2025-12', '2026-01~02']
		const items = ['咨询服务', '系统维护', '实施交付', '培训服务', '专项支持']
		return Array.from({ length: n }, (_, i) => {
			const qty = 1 + (i % 4)
			const unit = 199 + Math.floor(rnd() * 200)
			const amount = (qty * unit).toFixed(2)
			return {
				id: `r-${i + 1}`,
				cells: {
					item: `${pick(rnd, items)}（${i + 1}）`,
					period: pick(rnd, periods),
					qty: String(qty),
					unit: unit.toFixed(2),
					amount,
				},
			}
		})
	}

	if (v === 'reimburse') {
		const items = ['差旅', '交通', '住宿', '餐饮', '材料', '办公']
		const cats = ['日常', '项目', '客户', '其他']
		return Array.from({ length: n }, (_, i) => {
			return {
				id: `r-${i + 1}`,
				cells: {
					item: `${pick(rnd, items)}费用`,
					cat: pick(rnd, cats),
					invoiceNo: `FP${datasetId}${pad2(i + 1)}${pad2(Math.floor(rnd() * 99))}`,
					amount: money(),
					note: i % 3 === 0 ? '含税' : i % 3 === 1 ? '不含税' : '—',
				},
			}
		})
	}

	let balance = 5000 + Math.floor(rnd() * 8000)
	const subjects = ['应收账款', '主营业务收入', '其他应收', '管理费用', '预收账款', '银行存款']
	return Array.from({ length: n }, (_, i) => {
		const debit = rnd() > 0.55 ? Number(money()) : 0
		const credit = debit === 0 ? Number(money()) : 0
		balance = balance + debit - credit
		return {
			id: `r-${i + 1}`,
			cells: {
				subject: pick(rnd, subjects),
				memo: `业务流水 ${datasetId}-${pad2(i + 1)}`,
				debit: debit ? debit.toFixed(2) : '',
				credit: credit ? credit.toFixed(2) : '',
				balance: balance.toFixed(2),
			},
		}
	})
}

const createDatasets = (n) => {
	const customers = ['某某有限公司', '星河科技', '青云贸易', '远航物流', '新峰制造', '光合传媒']
	const projects = ['SaaS 续费', '年度咨询', '交付验收', '系统改造', '数据治理', '培训服务']
	const owners = ['王强', '李雷', '韩梅梅', '张三', '赵四', '钱七']
	const base = new Date('2026-01-16T00:00:00Z')
	return Array.from({ length: n }, (_, idx) => {
		const id = idx + 1
		const rnd = mulberry32(1000 + id)
		const d = new Date(base.getTime() - Math.floor(rnd() * 60) * 86400_000)
		const date = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
		return {
			id,
			customer: pick(rnd, customers),
			project: pick(rnd, projects),
			date,
			owner: pick(rnd, owners),
		}
	})
}

const sumAmount = (rows, colId) => {
	let sum = 0
	for (const r of rows) sum += Number(r.cells[colId] || 0)
	return sum
}

const buildScene = ({ pageW, pageH, variant, dataset, columns, rows }) => {
	const theme = variantTheme(variant)
	const titleStyle = {
		fontSize: 22,
		color: '#0f172a',
		fontWeight: 700,
		fontFamily,
		whiteSpace: 'nowrap',
		textBaseline: 'top',
	}
	const h2 = {
		fontSize: 14,
		color: '#0f172a',
		fontWeight: 700,
		fontFamily,
		whiteSpace: 'nowrap',
		textBaseline: 'top',
	}
	const body = {
		fontSize: 12,
		color: '#0f172a',
		fontFamily,
		whiteSpace: 'normal',
		textBaseline: 'top',
	}
	const subtle = {
		fontSize: 11,
		color: '#475569',
		fontFamily,
		whiteSpace: 'normal',
		textBaseline: 'top',
	}
	const mono = {
		fontSize: 11,
		color: '#0f172a',
		fontFamily: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace, ${fontFamily}`,
		whiteSpace: 'nowrap',
		textBaseline: 'top',
	}

	const padding = 56
	const contentW = pageW - padding * 2
	const subtotal = variant === 'statement' ? 0 : sumAmount(rows, 'amount')
	const tax = variant === 'invoice' ? subtotal * 0.06 : 0
	const total = subtotal + tax

	return jsxs('container', {
		id: 'root',
		style: {
			width: pageW,
			height: pageH,
			flexDirection: 'column',
			padding,
			gap: 18,
		},
		paint: {
			background: { color: '#ffffff' },
			border: { color: '#e2e8f0', width: 1 },
		},
		children: [
			jsxs('container', {
				id: 'header',
				style: {
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 16,
				},
				children: [
					jsxs('container', {
						id: 'headerLeft',
						style: {
							flexDirection: 'column',
							flexGrow: 1,
							flexShrink: 1,
							minWidth: 0,
							gap: 4,
						},
						children: [
							jsx('text', {
								id: 'docTitle',
								textStyle: titleStyle,
								children: variantName(variant),
							}),
							jsx('text', {
								id: 'docSub',
								textStyle: subtle,
								children: `客户：${dataset.customer}｜项目：${dataset.project}｜经办：${dataset.owner}`,
							}),
						],
					}),
					jsx('container', {
						id: 'headerBadge',
						style: { padding: 10 },
						paint: {
							background: { color: theme.tint },
							border: { color: theme.primary, width: 1 },
						},
						children: jsx('text', {
							id: 'headerBadgeText',
							textStyle: mono,
							children: `ID ${String(dataset.id).padStart(3, '0')} · ${dataset.date}`,
						}),
					}),
				],
			}),
			jsx('container', {
				id: 'dividerTop',
				style: { height: 1 },
				paint: { background: { color: '#e2e8f0' } },
			}),
			jsxs('container', {
				id: 'metaRow',
				style: { flexDirection: 'row', gap: 18 },
				children: [
					jsxs('container', {
						id: 'metaLeft',
						style: {
							flexDirection: 'column',
							gap: 6,
							flexGrow: 1,
							flexShrink: 1,
							minWidth: 0,
						},
						children: [
							jsx('text', {
								id: 'metaLeftTitle',
								textStyle: h2,
								children: '摘要',
							}),
							jsx('text', {
								id: 'metaLeftLine1',
								textStyle: body,
								children:
									'Node 环境渲染：createWeaveApp + adapter-node 输出 PNG（无浏览器/无 Worker）。',
							}),
							jsx('text', {
								id: 'metaLeftLine2',
								textStyle: body,
								children: `当前风格：${variantName(variant)}（主题色 ${theme.primary}）`,
							}),
						],
					}),
					jsxs('container', {
						id: 'metaRight',
						style: {
							flexDirection: 'column',
							gap: 6,
							width: 240,
							flexShrink: 0,
						},
						children: [
							jsx('text', {
								id: 'metaRightTitle',
								textStyle: h2,
								children: '元信息',
							}),
							jsx('text', {
								id: 'metaRightLine1',
								textStyle: body,
								children: `单号：NO.${dataset.date.replaceAll('-', '')}-${pad2(dataset.id)}`,
							}),
							jsx('text', {
								id: 'metaRightLine2',
								textStyle: body,
								children: '币种：CNY',
							}),
							jsx('text', {
								id: 'metaRightLine3',
								textStyle: body,
								children: '状态：草稿',
							}),
						],
					}),
				],
			}),
			jsxs('container', {
				id: 'detailSection',
				style: { flexDirection: 'column', gap: 10, flexGrow: 1 },
				children: [
					jsx('text', { id: 'detailTitle', textStyle: h2, children: '明细表' }),
					jsx('table', {
						id: 'detail',
						style: {
							width: contentW,
							height: 420,
							overflowY: 'visible',
							overflowX: 'visible',
						},
						columns,
						rows,
						tableStyle: tableStyleFor(variant),
					}),
					variant === 'statement'
						? null
						: jsx('container', {
								id: 'totalRow',
								style: { flexDirection: 'row', justifyContent: 'flex-end' },
								children: jsxs('container', {
									id: 'totalBox',
									style: { flexDirection: 'column', gap: 6, width: 280 },
									children: [
										jsxs('container', {
											id: 'totalLine1',
											style: {
												flexDirection: 'row',
												justifyContent: 'space-between',
											},
											children: [
												jsx('text', {
													id: 'subtotalLabel',
													textStyle: subtle,
													children: '小计',
												}),
												jsx('text', {
													id: 'subtotalValue',
													textStyle: mono,
													children: subtotal.toFixed(2),
												}),
											],
										}),
										variant !== 'invoice'
											? null
											: jsxs('container', {
													id: 'totalLine2',
													style: {
														flexDirection: 'row',
														justifyContent: 'space-between',
													},
													children: [
														jsx('text', {
															id: 'taxLabel',
															textStyle: subtle,
															children: '税额（6%）',
														}),
														jsx('text', {
															id: 'taxValue',
															textStyle: mono,
															children: tax.toFixed(2),
														}),
													],
												}),
										jsx('container', {
											id: 'totalDivider',
											style: { height: 1 },
											paint: { background: { color: '#e2e8f0' } },
										}),
										jsxs('container', {
											id: 'totalLine3',
											style: {
												flexDirection: 'row',
												justifyContent: 'space-between',
											},
											children: [
												jsx('text', {
													id: 'grandTotalLabel',
													textStyle: h2,
													children: '合计',
												}),
												jsx('text', {
													id: 'grandTotalValue',
													textStyle: mono,
													children: total.toFixed(2),
												}),
											],
										}),
									],
								}),
							}),
				],
			}),
			jsxs('container', {
				id: 'footer',
				style: { flexDirection: 'row', justifyContent: 'space-between' },
				children: [
					jsx('text', {
						id: 'footerLeft',
						textStyle: mono,
						children: 'weave / node-batch-report',
					}),
					jsx('text', {
						id: 'footerRight',
						textStyle: mono,
						children: 'page 1 / 1',
					}),
				],
			}),
		],
	})
}

const variants = variant === 'all' ? ['invoice', 'reimburse', 'statement'] : [variant]
const datasets = createDatasets(count)

await mkdir(outDir, { recursive: true })

const start = performance.now()
let rendered = 0
let renderMs = 0
let writeMs = 0

for (const v of variants) {
	const dir = resolve(outDir, v)
	await mkdir(dir, { recursive: true })

	const cols = columnsFor(v)
	let app = null
	for (const ds of datasets) {
		if (onlyId != null && ds.id !== onlyId) continue
		const rows = rowsFor(v, ds.id)
		const scene = buildScene({
			pageW: A4.w,
			pageH: A4.h,
			variant: v,
			dataset: ds,
			columns: cols,
			rows,
		})

		if (!app)
			app = createWeaveApp({
				width: A4.w,
				height: A4.h,
				dpr,
				clearColor: '#ffffff',
				scene,
			})
		else app.setScene(scene)

		const t0 = performance.now()
		const png = await app.renderToPng()
		const t1 = performance.now()
		const name = `report-${String(ds.id).padStart(3, '0')}.png`
		const p = resolve(dir, name)
		await writeFile(p, png)
		const t2 = performance.now()

		renderMs += t1 - t0
		writeMs += t2 - t1
		rendered++
		if (rendered % 10 === 0) console.log(`Rendered ${rendered}... (${p})`)
	}
	app?.dispose()
}

const end = performance.now()
console.log(
	`Done. Rendered ${rendered} image(s) in ${(end - start).toFixed(0)}ms. out=${outDir} dpr=${dpr} variant=${variant}`,
)
console.log(`Breakdown: render=${renderMs.toFixed(0)}ms, write=${writeMs.toFixed(0)}ms`)
console.log('Tip: use --variant=all to render 3 styles; use --id=1..100 to render one.')
