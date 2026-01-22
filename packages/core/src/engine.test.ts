import { describe, expect, it } from 'vitest'
import { createEngine } from './engine.js'
import type { TextMeasureInput, TextMeasurer } from '@jiujue/weave-types'

const measurer: TextMeasurer = {
	measure(input: TextMeasureInput) {
		const lineHeight =
			input.style.lineHeight ?? Math.ceil(input.style.fontSize * 1.2)
		const width = Math.min(
			input.maxWidth ?? Number.POSITIVE_INFINITY,
			Math.max(0, input.text.length) * (input.style.fontSize * 0.6)
		)
		return {
			width,
			height: lineHeight,
			lines: [{ text: input.text, width }],
			lineHeight
		}
	}
}

describe('weave core', () => {
	it('computes layout frames from Yoga', async () => {
		const engine = await createEngine({ textMeasurer: measurer })
		engine.applyPatches([
			{
				op: 'updateStyle',
				id: 'root',
				style: { padding: 10, gap: 8, flexDirection: 'column' }
			},
			{
				op: 'addNode',
				parentId: 'root',
				node: {
					id: 't1',
					type: 'text',
					text: 'hello',
					textStyle: {
						color: '#000',
						fontSize: 20,
						whiteSpace: 'nowrap',
						textBaseline: 'top'
					}
				}
			}
		])

		const frames = engine.layout({ width: 300, height: 200 })
		const root = frames.find(f => f.id === 'root')
		const t1 = frames.find(f => f.id === 't1')
		expect(root).toBeTruthy()
		expect(t1).toBeTruthy()
		expect(t1!.rect.width).toBeGreaterThan(0)
		expect(t1!.rect.height).toBeGreaterThan(0)
	})

	it('produces a DisplayList that contains draw ops', async () => {
		const engine = await createEngine({ textMeasurer: measurer })
		engine.applyPatches([
			{
				op: 'updateStyle',
				id: 'root',
				style: { padding: 12, gap: 10, flexDirection: 'column' }
			},
			{
				op: 'addNode',
				parentId: 'root',
				node: {
					id: 'card',
					type: 'container',
					style: { padding: 8, gap: 6, flexDirection: 'column' },
					paint: {
						background: { color: '#111' },
						border: { color: '#222', width: 1 }
					},
					children: [
						{
							id: 't2',
							type: 'text',
							style: { width: 120 },
							text: 'displaylist',
							textStyle: {
								color: '#fff',
								fontSize: 14,
								whiteSpace: 'normal',
								textBaseline: 'top'
							}
						}
					]
				}
			}
		])

		const dl = engine.render({ width: 240, height: 160 })
		expect(dl.length).toBeGreaterThan(0)
		expect(dl.some(op => op.op === 'fillRect')).toBe(true)
		expect(dl.some(op => op.op === 'drawText')).toBe(true)
	})

	it('clips and scrolls container children', async () => {
		const engine = await createEngine({ textMeasurer: measurer })
		engine.applyPatches([
			{
				op: 'updateStyle',
				id: 'root',
				style: { flexDirection: 'column' }
			},
			{
				op: 'addNode',
				parentId: 'root',
				node: {
					id: 'scroll',
					type: 'container',
					style: {
						width: 120,
						height: 40,
						flexDirection: 'column',
						overflowY: 'scroll'
					},
					children: [
						{
							id: 't1',
							type: 'text',
							text: 'line1',
							textStyle: {
								color: '#fff',
								fontSize: 20,
								whiteSpace: 'nowrap',
								textBaseline: 'top'
							}
						},
						{
							id: 't2',
							type: 'text',
							text: 'line2',
							textStyle: {
								color: '#fff',
								fontSize: 20,
								whiteSpace: 'nowrap',
								textBaseline: 'top'
							}
						},
						{
							id: 't3',
							type: 'text',
							text: 'line3',
							textStyle: {
								color: '#fff',
								fontSize: 20,
								whiteSpace: 'nowrap',
								textBaseline: 'top'
							}
						}
					]
				}
			},
			{ op: 'updateScroll', id: 'scroll', scroll: { y: 10 } }
		])

		const dl = engine.render({ width: 300, height: 200 })
		expect(dl.some(op => op.op === 'clipRect')).toBe(true)
		expect(
			dl.some(
				op =>
					op.op === 'fillRect' &&
					op.style?.color === '#000000' &&
					op.style?.alpha === 0.25
			)
		).toBe(true)
		expect(
			dl.some(
				op =>
					op.op === 'fillRect' &&
					op.style?.color === '#94a3b8' &&
					op.style?.alpha === 0.6
			)
		).toBe(true)
		expect(
			dl.some(
				op =>
					op.op === 'translate' &&
					typeof op.y === 'number' &&
					Math.abs(op.y + 10) < 1e-6
			)
		).toBe(true)

		const hit = engine.hitTest({ x: 10, y: 5 })
		expect(hit.id).toBe('t1')
		expect(hit.path.includes('scroll')).toBe(true)
	})

	it('scrolls container horizontally for nowrap text', async () => {
		const engine = await createEngine({ textMeasurer: measurer })
		engine.applyPatches([
			{
				op: 'addNode',
				parentId: 'root',
				node: {
					id: 'scrollx',
					type: 'container',
					style: {
						width: 120,
						height: 40,
						flexDirection: 'column',
						overflowX: 'scroll'
					},
					children: [
						{
							id: 't1',
							type: 'text',
							text: 'this is a very very long line for scrolling',
							textStyle: {
								color: '#fff',
								fontSize: 20,
								whiteSpace: 'nowrap',
								textBaseline: 'top'
							}
						}
					]
				}
			},
			{ op: 'updateScroll', id: 'scrollx', scroll: { x: 10 } }
		])

		const dl = engine.render({ width: 300, height: 200 })
		const meta = engine.getScrollMetrics('scrollx')
		expect(meta).toBeTruthy()
		expect(meta!.maxScrollX).toBeGreaterThan(0)
		expect(
			dl.some(
				op =>
					op.op === 'translate' &&
					typeof op.x === 'number' &&
					Math.abs(op.x + 10) < 1e-6
			)
		).toBe(true)
	})

	it('does not draw text lines beyond layout height', async () => {
		const engine = await createEngine({ textMeasurer: measurer })
		engine.applyPatches([
			{
				op: 'addNode',
				parentId: 'root',
				node: {
					id: 't',
					type: 'text',
					style: { width: 60, height: 24 },
					text: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
					textStyle: {
						color: '#fff',
						fontSize: 20,
						lineHeight: 24,
						whiteSpace: 'normal',
						textBaseline: 'top'
					}
				}
			}
		])

		const dl = engine.render({ width: 200, height: 200 })
		const drawn = dl.filter(op => op.op === 'drawText')
		expect(drawn.length).toBe(1)
	})

	it('scrolls a table horizontally and vertically', async () => {
		const engine = await createEngine({ textMeasurer: measurer })
		engine.applyPatches([
			{
				op: 'addNode',
				parentId: 'root',
				node: {
					id: 'table',
					type: 'table',
					style: {
						width: 240,
						height: 120,
						overflowX: 'auto',
						overflowY: 'auto'
					},
					columns: [
						{ id: 'c0', title: 'C0', width: 120 },
						{ id: 'c1', title: 'C1', width: 120 },
						{ id: 'c2', title: 'C2', width: 120 },
						{ id: 'c3', title: 'C3', width: 120 }
					],
					rows: Array.from({ length: 50 }, (_, i) => ({
						id: `r${i}`,
						cells: {
							c0: `row${i}`,
							c1: String(i * 2),
							c2: String(i * 3),
							c3: String(i * 4)
						}
					})),
					tableStyle: { headerRowHeight: 24, rowHeight: 20 }
				}
			},
			{ op: 'updateScroll', id: 'table', scroll: { x: 50, y: 60 } }
		])

		const dl = engine.render({ width: 300, height: 260 })
		expect(
			dl.some(
				op =>
					op.op === 'translate' &&
					typeof op.x === 'number' &&
					Math.abs(op.x + 50) < 1e-6
			)
		).toBe(true)
		expect(
			dl.some(
				op =>
					op.op === 'translate' &&
					typeof op.y === 'number' &&
					Math.abs(op.y + 60) < 1e-6
			)
		).toBe(true)
		expect(
			dl.some(
				op =>
					op.op === 'fillRect' &&
					op.style?.color === '#94a3b8' &&
					op.style?.alpha === 0.6
			)
		).toBe(true)
	})

	it('renders a table with grouped headers', async () => {
		const engine = await createEngine({ textMeasurer: measurer })
		engine.applyPatches([
			{
				op: 'updateStyle',
				id: 'root',
				style: { padding: 12, gap: 10, flexDirection: 'column' }
			},
			{
				op: 'addNode',
				parentId: 'root',
				node: {
					id: 'table',
					type: 'table',
					style: { width: 420 },
					columns: [
						{ id: 'name', title: 'Name', width: { type: 'flex', weight: 2 } },
						{ id: 'age', title: 'Age', width: 60, align: 'right' },
						{
							id: 'score',
							title: 'Score',
							width: { type: 'auto' },
							align: 'right'
						}
					],
					header: [
						{
							id: 'g1',
							label: 'Profile',
							align: 'center',
							children: [
								{ type: 'col', colId: 'name' },
								{ type: 'col', colId: 'age' }
							]
						},
						{
							id: 'g2',
							label: 'Metrics',
							children: [{ type: 'col', colId: 'score' }]
						}
					],
					rows: [
						{ id: 'r1', cells: { name: 'Alice', age: '30', score: '98' } },
						{ id: 'r2', cells: { name: 'Bob', age: '41', score: '87' } }
					],
					tableStyle: {
						grid: { color: '#333', width: 1 },
						headerBackground: { color: '#111' },
						headerAlign: 'center',
						cellAlign: 'left',
						headerVAlign: 'middle',
						cellVAlign: 'middle',
						headerRowHeight: 30,
						rowHeight: 34
					}
				}
			}
		])

		const dl = engine.render({ width: 600, height: 400 })
		const textOps = dl.filter(op => op.op === 'drawText')
		expect(textOps.length).toBeGreaterThanOrEqual(2 + 3 + 2 * 3)
		expect(dl.some(op => op.op === 'drawPath')).toBe(true)
	})
})
