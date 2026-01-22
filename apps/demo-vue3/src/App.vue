<template>
	<div class="app">
		<div class="bar">
			<div class="title">Weave + Vue3</div>
			<div class="hint">Scene 是纯数据（框架无关），这里用 Vue3 生成并渲染</div>
		</div>

		<div class="stage">
			<div class="panel">
				<div class="sectionTitle">文档参数</div>
				<div class="row">
					<label class="label">
						<span>风格</span>
						<select v-model="variant" class="select">
							<option value="invoice">结算单</option>
							<option value="reimburse">报销单</option>
							<option value="statement">对账单</option>
						</select>
					</label>
				</div>
				<div class="row">
					<div class="kv">
						<div class="k">尺寸</div>
						<div class="v">A4（794 × 1123）</div>
					</div>
				</div>

				<div class="divider" />

				<div class="sectionTitle">生成图片（PNG）</div>
				<div class="row">
					<label class="label">
						<span>导出 DPR</span>
						<select v-model.number="exportDpr" class="select">
							<option :value="1">1</option>
							<option :value="2">2</option>
							<option :value="3">3</option>
						</select>
					</label>
				</div>
				<div class="row">
					<button
						class="btn"
						type="button"
						:disabled="exporting"
						@click="generatePng"
					>
						{{ exporting ? '生成中...' : '生成 PNG' }}
					</button>
					<a
						v-if="exportUrl"
						class="link"
						:href="exportUrl"
						:download="downloadName"
					>
						下载
					</a>
				</div>
				<div class="row">
					<div class="status">
						<div>
							状态：{{ exporting ? 'rendering' : exportUrl ? 'ready' : 'idle' }}
						</div>
						<div v-if="exportMs != null">耗时：{{ exportMs }}ms</div>
						<div v-if="exportError" class="error">{{ exportError }}</div>
					</div>
				</div>
				<div v-if="exportUrl" class="thumbWrap">
					<img class="thumb" :src="exportUrl" alt="export preview" />
				</div>
			</div>

			<div class="preview">
				<div class="previewHeader">
					<div class="previewTitle">实时预览（Canvas / Worker）</div>
					<div class="previewSub">切换风格会重新 setScene 并 render</div>
				</div>
				<div class="previewScroll">
					<div class="canvasBox">
						<WeaveCanvas :scene="scene" />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { TableRow } from '@jiujue/weave-types'
import WeaveCanvas from './components/WeaveCanvas.vue'
import { createWeaveImageClient } from '@jiujue/weave-adapter-worker-image'
import {
	buildReportScene,
	columnsFor,
	type ReportDataset,
	type ReportVariant
} from './weave/buildScene.tsx'

const variant = ref<ReportVariant>('invoice')
const exportDpr = ref<number>(2)
const exporting = ref(false)
const exportUrl = ref<string | null>(null)
const exportMs = ref<number | null>(null)
const exportError = ref<string | null>(null)

const dataset = computed<ReportDataset>(() => {
	return {
		id: 1,
		customer: '某某有限公司',
		project: '年度咨询',
		date: '2026-01-16',
		owner: '张三'
	}
})

const rows = computed<readonly TableRow[]>(() => {
	if (variant.value === 'invoice') {
		return [
			{
				id: 'r1',
				cells: {
					item: '咨询服务',
					period: '2026-01',
					qty: '1',
					unit: '399.00',
					amount: '399.00'
				}
			},
			{
				id: 'r2',
				cells: {
					item: '专项支持',
					period: '2026-01',
					qty: '2',
					unit: '199.00',
					amount: '398.00'
				}
			}
		]
	}
	if (variant.value === 'reimburse') {
		return [
			{
				id: 'r1',
				cells: {
					item: '差旅费用',
					cat: '项目',
					invoiceNo: 'FP00101',
					amount: '128.50',
					note: '含税'
				}
			},
			{
				id: 'r2',
				cells: {
					item: '住宿费用',
					cat: '项目',
					invoiceNo: 'FP00102',
					amount: '399.00',
					note: '—'
				}
			}
		]
	}
	return [
		{
			id: 'r1',
			cells: {
				subject: '应收账款',
				memo: '业务流水 001-01',
				debit: '500.00',
				credit: '',
				balance: '6500.00'
			}
		},
		{
			id: 'r2',
			cells: {
				subject: '银行存款',
				memo: '业务流水 001-02',
				debit: '',
				credit: '120.00',
				balance: '6380.00'
			}
		}
	]
})

const scene = computed(() => {
	return buildReportScene({
		pageW: 794,
		pageH: 1123,
		variant: variant.value,
		dataset: dataset.value,
		columns: columnsFor(variant.value),
		rows: rows.value
	})
})

const downloadName = computed(() => {
	return `weave-${variant.value}-a4-dpr${exportDpr.value}.png`
})

const revokeExportUrl = () => {
	if (!exportUrl.value) return
	URL.revokeObjectURL(exportUrl.value)
	exportUrl.value = null
}

onBeforeUnmount(() => revokeExportUrl())

const generatePng = async () => {
	if (exporting.value) return
	exporting.value = true
	exportError.value = null
	exportMs.value = null

	const start = performance.now()
	const client = createWeaveImageClient({
		width: 794,
		height: 1123,
		dpr: exportDpr.value,
		scene: scene.value,
		clearColor: '#ffffff'
	})

	try {
		const r = await client.render()
		revokeExportUrl()
		const blob = new Blob([r.data], { type: r.mime })
		exportUrl.value = URL.createObjectURL(blob)
		exportMs.value = Math.round(performance.now() - start)
	} catch (e) {
		exportError.value = e instanceof Error ? e.message : String(e)
	} finally {
		client.dispose()
		exporting.value = false
	}
}
</script>

<style scoped>
.app {
	height: 100%;
	display: grid;
	grid-template-rows: auto 1fr;
}

.bar {
	display: flex;
	gap: 12px;
	align-items: center;
	justify-content: space-between;
	padding: 10px 12px;
	border-bottom: 1px solid #1f2937;
	background: #0b1021;
}

.title {
	font-size: 14px;
	font-weight: 700;
	color: #e5e7eb;
}

.hint {
	font-size: 12px;
	color: #94a3b8;
}

.label {
	display: grid;
	gap: 4px;
	font-size: 12px;
	color: #cbd5e1;
}

.select {
	height: 30px;
	background: #0f172a;
	color: #e5e7eb;
	border: 1px solid #334155;
	border-radius: 6px;
	padding: 0 8px;
}

.stage {
	padding: 18px;
	display: grid;
	grid-template-columns: 320px 1fr;
	gap: 14px;
	align-items: start;
	overflow: hidden;
}

.panel {
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 10px;
	padding: 12px;
	display: grid;
	gap: 10px;
}

.canvasBox {
	width: 794px;
	aspect-ratio: 794 / 1123;
	border: 1px solid #334155;
	border-radius: 10px;
	overflow: hidden;
	background: #ffffff;
}

.preview {
	display: grid;
	grid-template-rows: auto 1fr;
	gap: 10px;
	justify-items: center;
}

.previewScroll {
	width: 100%;
	max-height: calc(100vh - 220px);
	overflow: auto;
	display: grid;
	place-items: start center;
	padding: 4px 0;
}

.previewHeader {
	display: grid;
	gap: 2px;
	justify-self: stretch;
}

.previewTitle {
	font-size: 12px;
	color: #cbd5e1;
	font-weight: 700;
}

.previewSub {
	font-size: 12px;
	color: #94a3b8;
}

.sectionTitle {
	font-size: 12px;
	font-weight: 700;
	color: #e5e7eb;
}

.row {
	display: flex;
	gap: 10px;
	align-items: end;
}

.divider {
	height: 1px;
	background: #1f2937;
}

.kv {
	display: grid;
	gap: 4px;
}

.k {
	font-size: 12px;
	color: #94a3b8;
}

.v {
	font-size: 12px;
	color: #e5e7eb;
}

.btn {
	height: 30px;
	padding: 0 10px;
	border-radius: 8px;
	border: 1px solid #334155;
	background: #111827;
	color: #e5e7eb;
	cursor: pointer;
}

.btn:disabled {
	opacity: 0.6;
	cursor: default;
}

.link {
	height: 30px;
	display: inline-flex;
	align-items: center;
	padding: 0 10px;
	border-radius: 8px;
	border: 1px solid #334155;
	color: #e5e7eb;
	text-decoration: none;
	background: #0b1021;
}

.status {
	font-size: 12px;
	color: #94a3b8;
	display: grid;
	gap: 4px;
}

.error {
	color: #fca5a5;
}

.thumbWrap {
	border-top: 1px solid #1f2937;
	padding-top: 10px;
}

.thumb {
	width: 100%;
	display: block;
	border-radius: 8px;
	border: 1px solid #334155;
	background: #ffffff;
}

@media (max-width: 980px) {
	.stage {
		grid-template-columns: 1fr;
	}
	.canvasBox {
		width: 794px;
	}
}
</style>
