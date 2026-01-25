import { jsx, jsxs } from '@jiujue/weave-types/jsx-runtime'

const variantName = (v) => {
	if (v === 'invoice') return '结算单'
	if (v === 'reimburse') return '报销单'
	return '对账单'
}

const variantTheme = (v) => {
	if (v === 'invoice') return { primary: '#2563eb', tint: '#eff6ff' }
	if (v === 'reimburse') return { primary: '#16a34a', tint: '#ecfdf5' }
	return { primary: '#7c3aed', tint: '#f5f3ff' }
}

export const columnsForRuntimeJs = (v) => {
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

const sumAmount = (rows, colId) => {
	let sum = 0
	for (const r of rows) sum += Number(r.cells[colId] || 0)
	return sum
}

export const buildReportSceneRuntimeJs = (input) => {
	const theme = variantTheme(input.variant)
	const padding = 56
	const contentW = input.pageW - padding * 2

	const titleStyle = {
		fontSize: 22,
		color: '#0f172a',
		fontWeight: 'bold',
		whiteSpace: 'nowrap',
		textBaseline: 'top',
	}
	const h2 = {
		fontSize: 14,
		color: '#0f172a',
		fontWeight: 'bold',
		whiteSpace: 'nowrap',
		textBaseline: 'top',
	}
	const subtle = {
		fontSize: 11,
		color: '#475569',
		whiteSpace: 'normal',
		textBaseline: 'top',
	}
	const mono = {
		fontSize: 11,
		color: '#0f172a',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
		whiteSpace: 'nowrap',
		textBaseline: 'top',
	}

	const subtotal = input.variant === 'statement' ? 0 : sumAmount(input.rows, 'amount')
	const tax = input.variant === 'invoice' ? subtotal * 0.06 : 0
	const total = subtotal + tax

	return jsxs('container', {
		id: 'root',
		style: {
			width: input.pageW,
			height: input.pageH,
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
								children: variantName(input.variant),
							}),
							jsx('text', {
								id: 'docSub',
								textStyle: subtle,
								children: `客户：${input.dataset.customer}｜项目：${input.dataset.project}｜经办：${input.dataset.owner}`,
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
							children: `ID ${String(input.dataset.id).padStart(3, '0')} · ${input.dataset.date}`,
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
						columns: input.columns,
						rows: input.rows,
						tableStyle: {
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
							},
							cellTextStyle: { fontSize: 12, color: '#0f172a' },
						},
					}),
					input.variant === 'statement'
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
										input.variant !== 'invoice'
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
						children: 'weave / vue3-runtime-js',
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
