import type { SceneNode, TableColumn, TableRow, TableStyle } from '@jiujue/weave-types'

export type ReportVariant = 'invoice' | 'reimburse' | 'statement'

export type ReportDataset = Readonly<{
	id: number
	customer: string
	project: string
	date: string
	owner: string
}>

const variantName = (v: ReportVariant): string => {
	if (v === 'invoice') return '结算单'
	if (v === 'reimburse') return '报销单'
	return '对账单'
}

const variantTheme = (v: ReportVariant): { primary: string; tint: string } => {
	if (v === 'invoice') return { primary: '#2563eb', tint: '#eff6ff' }
	if (v === 'reimburse') return { primary: '#16a34a', tint: '#ecfdf5' }
	return { primary: '#7c3aed', tint: '#f5f3ff' }
}

export const columnsFor = (v: ReportVariant): readonly TableColumn[] => {
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

export const tableStyleFor = (v: ReportVariant): TableStyle => {
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

const sumAmount = (rows: readonly TableRow[], colId: string): number => {
	let sum = 0
	for (const r of rows) sum += Number(r.cells[colId] || 0)
	return sum
}

export function buildReportScene(
	input: Readonly<{
		pageW: number
		pageH: number
		variant: ReportVariant
		dataset: ReportDataset
		columns: readonly TableColumn[]
		rows: readonly TableRow[]
	}>,
): SceneNode {
	const theme = variantTheme(input.variant)
	const padding = 56
	const contentW = input.pageW - padding * 2

	const titleStyle = {
		fontSize: 22,
		color: '#0f172a',
		fontWeight: 'bold',
		whiteSpace: 'nowrap',
		textBaseline: 'top',
	} as const
	const h2 = {
		fontSize: 14,
		color: '#0f172a',
		fontWeight: 'bold',
		whiteSpace: 'nowrap',
		textBaseline: 'top',
	} as const
	const subtle = {
		fontSize: 11,
		color: '#475569',
		whiteSpace: 'normal',
		textBaseline: 'top',
	} as const
	const mono = {
		fontSize: 11,
		color: '#0f172a',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
		whiteSpace: 'nowrap',
		textBaseline: 'top',
	} as const

	const subtotal = input.variant === 'statement' ? 0 : sumAmount(input.rows, 'amount')
	const tax = input.variant === 'invoice' ? subtotal * 0.06 : 0
	const total = subtotal + tax

	return (
		<container
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
			<container
				id="header"
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 16,
				}}
			>
				<container
					id="headerLeft"
					style={{
						flexDirection: 'column',
						flexGrow: 1,
						flexShrink: 1,
						minWidth: 0,
						gap: 4,
					}}
				>
					<text id="docTitle" textStyle={titleStyle}>
						{variantName(input.variant)}
					</text>
					<text id="docSub" textStyle={subtle}>
						客户：{input.dataset.customer}｜项目：{input.dataset.project}
						｜经办：{input.dataset.owner}
					</text>
				</container>
				<container
					id="headerBadge"
					style={{ padding: 10 }}
					paint={{
						background: { color: theme.tint },
						border: { color: theme.primary, width: 1 },
					}}
				>
					<text id="headerBadgeText" textStyle={mono}>
						ID {String(input.dataset.id).padStart(3, '0')} · {input.dataset.date}
					</text>
				</container>
			</container>

			<container
				id="dividerTop"
				style={{ height: 1 }}
				paint={{ background: { color: '#e2e8f0' } }}
			/>

			<container id="detailSection" style={{ flexDirection: 'column', gap: 10, flexGrow: 1 }}>
				<text id="detailTitle" textStyle={h2}>
					明细表
				</text>
				<table
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

				{input.variant === 'statement' ? null : (
					<container id="totalRow" style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
						<container id="totalBox" style={{ flexDirection: 'column', gap: 6, width: 280 }}>
							<container
								id="totalLine1"
								style={{
									flexDirection: 'row',
									justifyContent: 'space-between',
								}}
							>
								<text id="subtotalLabel" textStyle={subtle}>
									小计
								</text>
								<text id="subtotalValue" textStyle={mono}>
									{subtotal.toFixed(2)}
								</text>
							</container>

							{input.variant !== 'invoice' ? null : (
								<container
									id="totalLine2"
									style={{
										flexDirection: 'row',
										justifyContent: 'space-between',
									}}
								>
									<text id="taxLabel" textStyle={subtle}>
										税额（6%）
									</text>
									<text id="taxValue" textStyle={mono}>
										{tax.toFixed(2)}
									</text>
								</container>
							)}

							<container
								id="totalDivider"
								style={{ height: 1 }}
								paint={{ background: { color: '#e2e8f0' } }}
							/>

							<container
								id="totalLine3"
								style={{
									flexDirection: 'row',
									justifyContent: 'space-between',
								}}
							>
								<text id="grandTotalLabel" textStyle={h2}>
									合计
								</text>
								<text id="grandTotalValue" textStyle={mono}>
									{total.toFixed(2)}
								</text>
							</container>
						</container>
					</container>
				)}
			</container>

			<container id="footer" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
				<text id="footerLeft" textStyle={mono}>
					weave / vue3
				</text>
				<text id="footerRight" textStyle={mono}>
					page 1 / 1
				</text>
			</container>
		</container>
	)
}
