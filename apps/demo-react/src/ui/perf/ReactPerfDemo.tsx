import React, { useCallback, useState } from 'react'
import { PerfComparison } from './PerfComparison'

export function ReactPerfDemo() {
	const [perfCount, setPerfCount] = useState(250)
	const [perfWork, setPerfWork] = useState(18)
	const [perfPulse, setPerfPulse] = useState(0)
	const [perfSelected, setPerfSelected] = useState('i1')

	const onPerfSelect = useCallback((id: string) => {
		setPerfSelected(id)
	}, [])

	return (
		<div
			style={{
				height: '100%',
				display: 'grid',
				gridTemplateColumns: '360px 1fr',
			}}
		>
			<div
				style={{
					padding: 16,
					borderRight: '1px solid #e5e7eb',
					background: '#fafafa',
				}}
			>
				<h2 style={{ margin: '0 0 8px' }}>React 性能对比</h2>
				<div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
					同一组交互下对比：列表每次都重渲染 vs useMemo + memo 降低重渲染范围。
				</div>

				<div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
					<label style={{ display: 'grid', gap: 6 }}>
						<div style={{ fontSize: 12, color: '#374151' }}>条目数: {perfCount}</div>
						<input
							type="range"
							min={20}
							max={800}
							step={10}
							value={perfCount}
							onChange={(e) => setPerfCount(Number(e.target.value))}
						/>
					</label>

					<label style={{ display: 'grid', gap: 6 }}>
						<div style={{ fontSize: 12, color: '#374151' }}>每条计算量: {perfWork}</div>
						<input
							type="range"
							min={0}
							max={40}
							value={perfWork}
							onChange={(e) => setPerfWork(Number(e.target.value))}
						/>
					</label>

					<div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
						<button
							onClick={() => setPerfPulse((n) => n + 1)}
							style={{
								padding: '10px 12px',
								borderRadius: 8,
								border: '1px solid #d1d5db',
								background: '#fff',
								cursor: 'pointer',
							}}
						>
							触发无关更新
						</button>
						<button
							onClick={() => {
								const n = Math.max(1, perfCount)
								const idx = Math.floor(Math.random() * n) + 1
								setPerfSelected(`i${idx}`)
							}}
							style={{
								padding: '10px 12px',
								borderRadius: 8,
								border: '1px solid #d1d5db',
								background: '#fff',
								cursor: 'pointer',
							}}
						>
							随机选中
						</button>
					</div>
				</div>
			</div>

			<PerfComparison
				itemCount={perfCount}
				work={perfWork}
				pulse={perfPulse}
				selectedId={perfSelected}
				onSelect={onPerfSelect}
			/>
		</div>
	)
}
