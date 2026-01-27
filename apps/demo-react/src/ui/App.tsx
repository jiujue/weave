import React, { useState } from 'react'
import { ReactPerfDemo } from './perf/ReactPerfDemo'
import { TreeSelectDemo } from './treeselect/TreeSelectDemo'
import { WeaveDemo } from './weave/WeaveDemo'

export function App() {
	const [demo, setDemo] = useState<'weave' | 'perf' | 'treeselect'>('weave')

	return (
		<div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
			<div
				style={{
					padding: 10,
					borderBottom: '1px solid rgba(229, 231, 235, 0.9)',
					background: '#fff',
					display: 'flex',
					gap: 10,
				}}
			>
				<button
					onClick={() => setDemo('weave')}
					style={{
						padding: '8px 10px',
						borderRadius: 10,
						border: '1px solid #d1d5db',
						background: demo === 'weave' ? '#111827' : '#fff',
						color: demo === 'weave' ? '#fff' : '#111827',
						cursor: 'pointer',
					}}
				>
					Weave 表格
				</button>
				<button
					onClick={() => setDemo('perf')}
					style={{
						padding: '8px 10px',
						borderRadius: 10,
						border: '1px solid #d1d5db',
						background: demo === 'perf' ? '#111827' : '#fff',
						color: demo === 'perf' ? '#fff' : '#111827',
						cursor: 'pointer',
					}}
				>
					React 性能
				</button>
				<button
					onClick={() => setDemo('treeselect')}
					style={{
						padding: '8px 10px',
						borderRadius: 10,
						border: '1px solid #d1d5db',
						background: demo === 'treeselect' ? '#111827' : '#fff',
						color: demo === 'treeselect' ? '#fff' : '#111827',
						cursor: 'pointer',
					}}
				>
					TreeSelect
				</button>
			</div>

			<div style={{ flex: 1, minHeight: 0 }}>
				{demo === 'weave' ? (
					<WeaveDemo />
				) : demo === 'perf' ? (
					<ReactPerfDemo />
				) : (
					<TreeSelectDemo />
				)}
			</div>
		</div>
	)
}
