import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { SceneNode, TableColumn, TableRow, TableStyle, TextStyle } from '@jiujue/weave-types'
import { sceneFromJSX } from '@jiujue/weave-react'
import {
	createWeaveImageClient,
	type WeaveImageClient,
	type WeaveImageResult,
} from '@jiujue/weave-adapter-worker-image'

const Container = 'container' as any
const Text = 'text' as any
const Table = 'table' as any

type ReportVariant = 'invoice' | 'reimburse' | 'statement'

type Dataset = Readonly<{
	id: number
	customer: string
	project: string
	date: string
	owner: string
}>

const mulberry32 = (seed: number) => {
	let a = seed >>> 0
	return () => {
		a |= 0
		a = (a + 0x6d2b79f5) | 0
		let t = Math.imul(a ^ (a >>> 15), 1 | a)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

const pick = <T,>(rnd: () => number, items: readonly T[]): T =>
	items[Math.floor(rnd() * items.length)]

const pad2 = (n: number) => String(n).padStart(2, '0')

function createDatasets(count: number): readonly Dataset[] {
	const customers = ['某某有限公司', '星河科技', '青云贸易', '远航物流', '新峰制造', '光合传媒']
	const projects = ['SaaS 续费', '年度咨询', '交付验收', '系统改造', '数据治理', '培训服务']
	const owners = ['王强', '李雷', '韩梅梅', '张三', '赵四', '钱七']
	const base = new Date('2026-01-16T00:00:00Z')
	return Array.from({ length: count }, (_, idx) => {
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

function variantName(v: ReportVariant): string {
	if (v === 'invoice') return '结算单'
	if (v === 'reimburse') return '报销单'
	return '对账单'
}

function variantTheme(v: ReportVariant): { primary: string; tint: string } {
	if (v === 'invoice') return { primary: '#2563eb', tint: '#eff6ff' }
	if (v === 'reimburse') return { primary: '#16a34a', tint: '#ecfdf5' }
	return { primary: '#7c3aed', tint: '#f5f3ff' }
}

function tableStyleFor(v: ReportVariant): TableStyle {
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
		headerTextStyle: { fontSize: 12, color: '#0f172a', fontWeight: 'bold' },
		cellTextStyle: { fontSize: 12, color: '#0f172a' },
	}
}

function columnsFor(v: ReportVariant): readonly TableColumn[] {
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

function rowsFor(v: ReportVariant, datasetId: number): readonly TableRow[] {
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
			} satisfies TableRow
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
			} satisfies TableRow
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
		} satisfies TableRow
	})
}

function sumAmount(rows: readonly TableRow[], colId: string): number {
	let sum = 0
	for (const r of rows) sum += Number(r.cells[colId] || 0)
	return sum
}

function buildReportScene(input: {
	pageW: number
	pageH: number
	variant: ReportVariant
	dataset: Dataset
	columns: readonly TableColumn[]
	rows: readonly TableRow[]
}): JSX.Element {
	const theme = variantTheme(input.variant)
	const title: TextStyle = {
		fontSize: 22,
		color: '#0f172a',
		fontWeight: 'bold',
		whiteSpace: 'nowrap',
		textBaseline: 'top',
	}
	const h2: TextStyle = {
		fontSize: 14,
		color: '#0f172a',
		fontWeight: 'bold',
		whiteSpace: 'nowrap',
		textBaseline: 'top',
	}
	const body: TextStyle = {
		fontSize: 12,
		color: '#0f172a',
		whiteSpace: 'normal',
		textBaseline: 'top',
	}
	const subtle: TextStyle = {
		fontSize: 11,
		color: '#475569',
		whiteSpace: 'normal',
		textBaseline: 'top',
	}
	const mono: TextStyle = {
		fontSize: 11,
		color: '#0f172a',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
		whiteSpace: 'nowrap',
		textBaseline: 'top',
	}

	const padding = 56
	const contentW = input.pageW - padding * 2
	const subtotal = input.variant === 'statement' ? 0 : sumAmount(input.rows, 'amount')
	const tax = input.variant === 'invoice' ? subtotal * 0.06 : 0
	const total = subtotal + tax

	return (
		<Container
			id="root"
			style={{
				width: input.pageW,
				height: input.pageH,
				flexDirection: 'column',
				padding,
				gap: 18,
			}}
			paint={{
				background: { color: '#ffffff' },
				border: { color: '#e2e8f0', width: 1 },
			}}
		>
			<Container
				id="header"
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 16,
				}}
			>
				<Container
					id="headerLeft"
					style={{
						flexDirection: 'column',
						flexGrow: 1,
						flexShrink: 1,
						minWidth: 0,
						gap: 4,
					}}
				>
					<Text id="docTitle" textStyle={title}>
						{variantName(input.variant)}
					</Text>
					<Text id="docSub" textStyle={subtle}>
						客户：{input.dataset.customer}｜项目：{input.dataset.project}
						｜经办：{input.dataset.owner}
					</Text>
				</Container>
				<Container
					id="headerBadge"
					style={{ padding: 10 }}
					paint={{
						background: { color: theme.tint },
						border: { color: theme.primary, width: 1 },
					}}
				>
					<Text id="headerBadgeText" textStyle={mono}>
						ID {String(input.dataset.id).padStart(3, '0')} · {input.dataset.date}
					</Text>
				</Container>
			</Container>

			<Container
				id="dividerTop"
				style={{ height: 1 }}
				paint={{ background: { color: '#e2e8f0' } }}
			/>

			<Container id="metaRow" style={{ flexDirection: 'row', gap: 18 }}>
				<Container
					id="metaLeft"
					style={{
						flexDirection: 'column',
						gap: 6,
						flexGrow: 1,
						flexShrink: 1,
						minWidth: 0,
					}}
				>
					<Text id="metaLeftTitle" textStyle={h2}>
						摘要
					</Text>
					<Text id="metaLeftLine1" textStyle={body}>
						本页展示：WebWorker 渲染 A4 PNG（主线程只显示 img），用于性能与大批量生成场景。
					</Text>
					<Text id="metaLeftLine2" textStyle={body}>
						当前风格：{variantName(input.variant)}（主题色 {theme.primary}）
					</Text>
				</Container>
				<Container
					id="metaRight"
					style={{ flexDirection: 'column', gap: 6, width: 240, flexShrink: 0 }}
				>
					<Text id="metaRightTitle" textStyle={h2}>
						元信息
					</Text>
					<Text id="metaRightLine1" textStyle={body}>
						单号：
						{`NO.${input.dataset.date.replaceAll('-', '')}-${pad2(input.dataset.id)}`}
					</Text>
					<Text id="metaRightLine2" textStyle={body}>
						币种：CNY
					</Text>
					<Text id="metaRightLine3" textStyle={body}>
						状态：草稿
					</Text>
				</Container>
			</Container>

			<Container id="detailSection" style={{ flexDirection: 'column', gap: 10, flexGrow: 1 }}>
				<Text id="detailTitle" textStyle={h2}>
					明细表
				</Text>
				<Table
					id="detail"
					style={{
						width: contentW,
						height: 420,
						overflowY: 'visible',
						overflowX: 'visible',
					}}
					columns={input.columns}
					rows={input.rows}
					tableStyle={tableStyleFor(input.variant)}
				/>
				{input.variant !== 'statement' ? (
					<Container id="totalRow" style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
						<Container id="totalBox" style={{ flexDirection: 'column', gap: 6, width: 280 }}>
							<Container
								id="totalLine1"
								style={{
									flexDirection: 'row',
									justifyContent: 'space-between',
								}}
							>
								<Text id="subtotalLabel" textStyle={subtle}>
									小计
								</Text>
								<Text id="subtotalValue" textStyle={mono}>
									{subtotal.toFixed(2)}
								</Text>
							</Container>
							{input.variant === 'invoice' ? (
								<Container
									id="totalLine2"
									style={{
										flexDirection: 'row',
										justifyContent: 'space-between',
									}}
								>
									<Text id="taxLabel" textStyle={subtle}>
										税额（6%）
									</Text>
									<Text id="taxValue" textStyle={mono}>
										{tax.toFixed(2)}
									</Text>
								</Container>
							) : null}
							<Container
								id="totalDivider"
								style={{ height: 1 }}
								paint={{ background: { color: '#e2e8f0' } }}
							/>
							<Container
								id="totalLine3"
								style={{
									flexDirection: 'row',
									justifyContent: 'space-between',
								}}
							>
								<Text id="grandTotalLabel" textStyle={h2}>
									合计
								</Text>
								<Text id="grandTotalValue" textStyle={mono}>
									{total.toFixed(2)}
								</Text>
							</Container>
						</Container>
					</Container>
				) : null}
			</Container>

			<Container id="footer" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
				<Text id="footerLeft" textStyle={mono}>
					weave / batch-report
				</Text>
				<Text id="footerRight" textStyle={mono}>
					page 1 / 1
				</Text>
			</Container>
		</Container>
	)
}

type CacheItem = Readonly<{
	width: number
	height: number
	mime: 'image/png'
	data: ArrayBuffer
}>

export default function Demo(): JSX.Element {
	const a4 = useMemo(() => ({ pageW: 794, pageH: 1123 }), [])
	const datasets = useMemo(() => createDatasets(100), [])

	const [variant, setVariant] = useState<ReportVariant>('invoice')
	const [index, setIndex] = useState(1)
	const [dpr, setDpr] = useState(2)

	const [imgUrl, setImgUrl] = useState<string | null>(null)
	const [status, setStatus] = useState<string>('ready')
	const [bench, setBench] = useState<string>('')

	const clientRef = useRef<WeaveImageClient | null>(null)
	const lastUrlRef = useRef<string | null>(null)

	const cacheRef = useRef<Map<string, CacheItem>>(new Map())
	const cacheOrderRef = useRef<string[]>([])
	const cacheMax = 20

	const previewTheme = useMemo(() => variantTheme(variant), [variant])
	const columns = useMemo(() => columnsFor(variant), [variant])
	const dataset = datasets[index - 1]
	const rows = useMemo(() => rowsFor(variant, dataset.id), [dataset.id, variant])
	const scene: SceneNode = useMemo(
		() => sceneFromJSX(buildReportScene({ ...a4, variant, dataset, columns, rows })),
		[a4, columns, dataset, rows, variant],
	)

	const revokeLast = () => {
		const u = lastUrlRef.current
		if (!u) return
		URL.revokeObjectURL(u)
		lastUrlRef.current = null
	}

	const setImageFromResult = (r: WeaveImageResult) => {
		revokeLast()
		const blob = new Blob([r.data], { type: r.mime })
		const url = URL.createObjectURL(blob)
		lastUrlRef.current = url
		setImgUrl(url)
	}

	const cachePut = (key: string, value: CacheItem) => {
		const cache = cacheRef.current
		const order = cacheOrderRef.current
		if (cache.has(key)) {
			cache.set(key, value)
			const idx = order.indexOf(key)
			if (idx >= 0) order.splice(idx, 1)
			order.push(key)
			return
		}
		cache.set(key, value)
		order.push(key)
		while (order.length > cacheMax) {
			const evict = order.shift()
			if (!evict) break
			cache.delete(evict)
		}
	}

	useEffect(() => {
		const client = createWeaveImageClient({
			width: a4.pageW,
			height: a4.pageH,
			dpr,
			scene,
			clearColor: '#ffffff',
			onError: (m) => setStatus(m),
		})
		clientRef.current = client
		setStatus('rendering')
		client
			.render()
			.then((r) => {
				cachePut(`${variant}:${dataset.id}:${dpr}`, {
					width: r.width,
					height: r.height,
					mime: r.mime,
					data: r.data,
				})
				setImageFromResult(r)
				setStatus('ready')
			})
			.catch(() => setStatus('error'))

		return () => {
			client.dispose()
			clientRef.current = null
			revokeLast()
		}
	}, [])

	useEffect(() => {
		const client = clientRef.current
		if (!client) return
		client.resize({ width: a4.pageW, height: a4.pageH, dpr })
		const key = `${variant}:${dataset.id}:${dpr}`
		const cached = cacheRef.current.get(key)
		if (cached) {
			setStatus('cached')
			setImageFromResult({ ...cached })
			return
		}
		setStatus('rendering')
		client.setScene(scene)
		client
			.render()
			.then((r) => {
				cachePut(key, {
					width: r.width,
					height: r.height,
					mime: r.mime,
					data: r.data,
				})
				setImageFromResult(r)
				setStatus('ready')
			})
			.catch(() => setStatus('error'))
	}, [a4.pageH, a4.pageW, dpr, dataset.id, scene, variant])

	useEffect(() => {
		const el = document.getElementById(`preview-${index}`)
		el?.scrollIntoView({ block: 'nearest', inline: 'center' })
	}, [index])

	const runBenchmark = async () => {
		const client = clientRef.current
		if (!client) return
		setBench('running...')
		setStatus('benchmark')
		const start = performance.now()
		for (const ds of datasets) {
			const cols = columnsFor(variant)
			const rs = rowsFor(variant, ds.id)
			const sc = sceneFromJSX(
				buildReportScene({
					...a4,
					variant,
					dataset: ds,
					columns: cols,
					rows: rs,
				}),
			)
			client.setScene(sc)
			await client.render()
		}
		const end = performance.now()
		setBench(
			`done: ${datasets.length} 张，耗时 ${(end - start).toFixed(0)}ms（风格=${variantName(variant)}，DPR=${dpr}）`,
		)
		setStatus('ready')
	}

	return (
		<div style={{ display: 'grid', gap: 10 }}>
			<div
				style={{
					display: 'flex',
					gap: 8,
					overflowX: 'auto',
					padding: 8,
					border: '1px solid #e2e8f0',
					borderRadius: 8,
					background: '#ffffff',
				}}
			>
				{datasets.map((d) => {
					const active = d.id === index
					return (
						<button
							key={d.id}
							id={`preview-${d.id}`}
							type="button"
							onClick={() => setIndex(d.id)}
							style={{
								minWidth: 120,
								padding: '8px 10px',
								borderRadius: 8,
								border: `1px solid ${active ? previewTheme.primary : '#e2e8f0'}`,
								background: active ? previewTheme.tint : '#ffffff',
								color: '#0f172a',
								textAlign: 'left',
								cursor: 'pointer',
							}}
						>
							<div style={{ fontSize: 12, fontWeight: 700 }}>
								#{String(d.id).padStart(3, '0')} {d.customer}
							</div>
							<div
								style={{
									fontSize: 11,
									color: '#475569',
									whiteSpace: 'nowrap',
									overflow: 'hidden',
								}}
							>
								{d.project}
							</div>
						</button>
					)
				})}
			</div>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: '1fr 1fr 1fr',
					gap: 10,
					alignItems: 'end',
				}}
			>
				<label style={{ display: 'grid', gap: 4 }}>
					<span style={{ fontSize: 12, color: '#334155' }}>风格</span>
					<select
						value={variant}
						onChange={(e) => setVariant(e.target.value as ReportVariant)}
						style={{ height: 32 }}
					>
						<option value="invoice">结算单</option>
						<option value="reimburse">报销单</option>
						<option value="statement">对账单</option>
					</select>
				</label>
				<label style={{ display: 'grid', gap: 4 }}>
					<span style={{ fontSize: 12, color: '#334155' }}>数据（1-100）</span>
					<input
						type="range"
						min={1}
						max={100}
						value={index}
						onChange={(e) => setIndex(Number(e.target.value))}
					/>
				</label>
				<label style={{ display: 'grid', gap: 4 }}>
					<span style={{ fontSize: 12, color: '#334155' }}>DPR</span>
					<select
						value={String(dpr)}
						onChange={(e) => setDpr(Number(e.target.value))}
						style={{ height: 32 }}
					>
						<option value="1">1</option>
						<option value="2">2</option>
						<option value="3">3</option>
					</select>
				</label>
			</div>

			<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
				<div style={{ fontSize: 12, color: '#334155' }}>
					状态：{status}｜当前：{variantName(variant)} · #{String(index).padStart(3, '0')} ·{' '}
					{dataset.customer}
				</div>
				<button
					type="button"
					onClick={() => void runBenchmark()}
					style={{ height: 30, padding: '0 10px' }}
				>
					渲染 100 张（当前风格）
				</button>
				<div style={{ fontSize: 12, color: '#334155' }}>{bench}</div>
			</div>

			<img
				alt="worker rendered batch report"
				src={imgUrl ?? undefined}
				style={{
					width: '100%',
					display: 'block',
					background: '#ffffff',
					borderRadius: 8,
				}}
			/>
		</div>
	)
}
