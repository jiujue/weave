import React, { useMemo, useState } from 'react'
import { TreeSelect } from '../components/TreeSelect'

export function TreeSelectDemo() {
	const [depth, setDepth] = useState(3)
	const [total, setTotal] = useState(120)
	const [theme, setTheme] = useState('#60a5fa')
	const [value, setValue] = useState('')

	const colors = useMemo(() => {
		return ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa']
	}, [])

	return (
		<div style={{ padding: 16, height: '100%', boxSizing: 'border-box' }}>
			<h2 style={{ margin: '0 0 8px' }}>TreeSelect（Input + Weave Dropdown）</h2>
			<div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
				输入框用原生 input；下拉树用 Weave 渲染与交互（展开、选择、滚动）。
			</div>

			<div style={{ marginTop: 16, display: 'grid', gap: 12, maxWidth: 520 }}>
				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#374151' }}>树深度: {depth}</div>
					<input
						type="range"
						min={1}
						max={6}
						value={depth}
						onChange={(e) => setDepth(Number(e.target.value))}
					/>
				</label>

				<label style={{ display: 'grid', gap: 6 }}>
					<div style={{ fontSize: 12, color: '#374151' }}>总条数: {total}</div>
					<input
						type="range"
						min={20}
						max={800}
						step={10}
						value={total}
						onChange={(e) => setTotal(Number(e.target.value))}
					/>
				</label>

				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
					<div style={{ fontSize: 12, color: '#374151' }}>主题色:</div>
					{colors.map((c) => (
						<button
							key={c}
							onClick={() => setTheme(c)}
							style={{
								width: 22,
								height: 22,
								borderRadius: 999,
								border: c === theme ? `2px solid ${c}` : '1px solid rgba(148, 163, 184, 0.5)',
								background: c,
								cursor: 'pointer',
								padding: 0,
							}}
						/>
					))}
					<input
						value={theme}
						onChange={(e) => setTheme(e.target.value)}
						style={{
							width: 110,
							padding: '6px 8px',
							borderRadius: 8,
							border: '1px solid #d1d5db',
							outline: 'none',
							fontSize: 12,
						}}
					/>
				</div>

				<TreeSelect
					value={value}
					onChange={(v) => setValue(v)}
					allowClear
					showSearch
					placeholder="请选择"
					treeDepth={depth}
					treeTotal={total}
					themeColor={theme}
					dropdownHeight={340}
				/>

				<div style={{ fontSize: 12, color: '#6b7280' }}>value: {value || '(empty)'}</div>
			</div>
		</div>
	)
}
