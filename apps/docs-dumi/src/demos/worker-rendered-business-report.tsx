import React, { useEffect, useMemo, useState } from 'react'
import type { SceneNode, TableColumn, TableRow, TableStyle, TextStyle } from '@jiujue/weave-types'
import { sceneFromJSX } from '@jiujue/weave-react'
import { createWeaveImageClient } from '@jiujue/weave-adapter-worker-image'

const Container = 'container' as any
const Text = 'text' as any
const Table = 'table' as any

function tableStyle(): TableStyle {
	return {
		background: { color: '#ffffff' },
		headerBackground: { color: '#f1f5f9' },
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

function buildColumns(): readonly TableColumn[] {
	return [
		{
			id: 'item',
			title: '项目',
			width: { type: 'flex', weight: 3 },
			align: 'left',
		},
		{
			id: 'spec',
			title: '规格',
			width: { type: 'flex', weight: 2 },
			align: 'left',
		},
		{ id: 'qty', title: '数量', width: 72, align: 'right' },
		{ id: 'unit', title: '单价', width: 88, align: 'right' },
		{ id: 'amount', title: '金额', width: 96, align: 'right' },
	]
}

function buildRows(): readonly TableRow[] {
	const items = Array.from({ length: 10 }, (_, i) => {
		const qty = 1 + (i % 4)
		const unit = 199 + i * 37
		const amount = qty * unit
		return {
			id: `r-${i + 1}`,
			cells: {
				item: `咨询服务（第 ${i + 1} 项）`,
				spec: i % 2 === 0 ? '远程交付 / 月度' : '现场交付 / 周期',
				qty: String(qty),
				unit: unit.toFixed(2),
				amount: amount.toFixed(2),
			},
		} satisfies TableRow
	})
	return items
}

function sumAmount(rows: readonly TableRow[]): number {
	let sum = 0
	for (const r of rows) sum += Number(r.cells.amount || 0)
	return sum
}

function buildA4BusinessScene(input: {
	pageW: number
	pageH: number
	columns: readonly TableColumn[]
	rows: readonly TableRow[]
}): JSX.Element {
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
	const total = sumAmount(input.rows)

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
						费用结算单 / 报销明细
					</Text>
					<Text id="docSub" textStyle={subtle}>
						示例：业务风格文档（文字 + 表格），由 Worker 渲染成 PNG，主线程仅展示图片
					</Text>
				</Container>
				<Container
					id="headerNo"
					style={{ padding: 10 }}
					paint={{
						background: { color: '#eff6ff' },
						border: { color: '#bfdbfe', width: 1 },
					}}
				>
					<Text id="headerNoText" textStyle={mono}>
						NO. 2026-001
					</Text>
				</Container>
			</Container>

			<Container
				id="dividerTop"
				style={{ height: 1 }}
				paint={{ background: { color: '#e2e8f0' } }}
			/>

			<Container id="meta" style={{ flexDirection: 'row', gap: 18 }}>
				<Container
					id="payee"
					style={{
						flexDirection: 'column',
						gap: 6,
						flexGrow: 1,
						flexShrink: 1,
						minWidth: 0,
					}}
				>
					<Text id="payeeTitle" textStyle={h2}>
						收款方信息
					</Text>
					<Text id="payeeLine1" textStyle={body}>
						公司：Weave 示例科技有限公司
					</Text>
					<Text id="payeeLine2" textStyle={body}>
						联系人：张三（财务）
					</Text>
					<Text id="payeeLine3" textStyle={body}>
						开户行：XX 银行 XX 支行
					</Text>
					<Text id="payeeLine4" textStyle={body}>
						账号：6222 **** **** 1234
					</Text>
				</Container>
				<Container
					id="billMeta"
					style={{ flexDirection: 'column', gap: 6, width: 240, flexShrink: 0 }}
				>
					<Text id="billMetaTitle" textStyle={h2}>
						单据信息
					</Text>
					<Text id="billMetaLine1" textStyle={body}>
						客户：某某有限公司
					</Text>
					<Text id="billMetaLine2" textStyle={body}>
						日期：2026-01-16
					</Text>
					<Text id="billMetaLine3" textStyle={body}>
						币种：CNY
					</Text>
					<Text id="billMetaLine4" textStyle={body}>
						状态：待审批
					</Text>
				</Container>
			</Container>

			<Container id="detailSection" style={{ flexDirection: 'column', gap: 10, flexGrow: 1 }}>
				<Text id="detailTitle" textStyle={h2}>
					费用明细
				</Text>
				<Table
					id="detail"
					style={{
						width: contentW,
						height: 360,
						overflowY: 'visible',
						overflowX: 'visible',
					}}
					columns={input.columns}
					rows={input.rows}
					tableStyle={tableStyle()}
				/>
				<Container id="totalRow" style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
					<Container id="totalBox" style={{ flexDirection: 'column', gap: 6, width: 280 }}>
						<Container
							id="totalLine1"
							style={{ flexDirection: 'row', justifyContent: 'space-between' }}
						>
							<Text id="subtotalLabel" textStyle={subtle}>
								小计
							</Text>
							<Text id="subtotalValue" textStyle={mono}>
								{total.toFixed(2)}
							</Text>
						</Container>
						<Container
							id="totalLine2"
							style={{ flexDirection: 'row', justifyContent: 'space-between' }}
						>
							<Text id="taxLabel" textStyle={subtle}>
								税额（6%）
							</Text>
							<Text id="taxValue" textStyle={mono}>
								{(total * 0.06).toFixed(2)}
							</Text>
						</Container>
						<Container
							id="totalDivider"
							style={{ height: 1 }}
							paint={{ background: { color: '#e2e8f0' } }}
						/>
						<Container
							id="totalLine3"
							style={{ flexDirection: 'row', justifyContent: 'space-between' }}
						>
							<Text id="grandTotalLabel" textStyle={h2}>
								合计
							</Text>
							<Text id="grandTotalValue" textStyle={mono}>
								{(total * 1.06).toFixed(2)}
							</Text>
						</Container>
					</Container>
				</Container>
			</Container>

			<Container id="remark" style={{ flexDirection: 'column', gap: 8 }}>
				<Text id="remarkTitle" textStyle={h2}>
					备注
				</Text>
				<Text id="remarkText" textStyle={body}>
					1）该文档为示例数据，仅用于展示 worker 渲染图片能力；2）实际业务可通过 patch
					更新表格行、汇总字段、审批信息等； 3）如需分页，可按 A4 高度拆分为多张图片。
				</Text>
			</Container>

			<Container id="footer" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
				<Text id="footerLeft" textStyle={mono}>
					weave / business-report
				</Text>
				<Text id="footerRight" textStyle={mono}>
					page 1 / 1
				</Text>
			</Container>
		</Container>
	)
}

export default function Demo(): JSX.Element {
	const a4 = useMemo(() => ({ pageW: 794, pageH: 1123 }), [])
	const columns = useMemo(() => buildColumns(), [])
	const rows = useMemo(() => buildRows(), [])
	const scene: SceneNode = useMemo(
		() => sceneFromJSX(buildA4BusinessScene({ ...a4, columns, rows })),
		[a4, columns, rows],
	)

	const [imgUrl, setImgUrl] = useState<string | null>(null)

	useEffect(() => {
		let disposed = false
		let lastUrl: string | null = null

		const cleanupUrl = () => {
			if (!lastUrl) return
			URL.revokeObjectURL(lastUrl)
			lastUrl = null
		}

		const client = createWeaveImageClient({
			width: a4.pageW,
			height: a4.pageH,
			dpr: Math.max(2, window.devicePixelRatio || 1),
			scene,
			clearColor: '#ffffff',
			onError: () => {
				cleanupUrl()
				if (!disposed) setImgUrl(null)
			},
		})

		client
			.render()
			.then((r) => {
				if (disposed) return
				cleanupUrl()
				const blob = new Blob([r.data], { type: r.mime })
				lastUrl = URL.createObjectURL(blob)
				setImgUrl(lastUrl)
			})
			.catch(() => {
				cleanupUrl()
				if (!disposed) setImgUrl(null)
			})

		return () => {
			disposed = true
			cleanupUrl()
			client.dispose()
		}
	}, [a4.pageH, a4.pageW, scene])

	if (!imgUrl) return <img alt="worker rendered" style={{ width: '100%', display: 'block' }} />
	return (
		<img
			alt="worker rendered"
			src={imgUrl}
			style={{ width: '100%', display: 'block', background: '#ffffff' }}
		/>
	)
}
