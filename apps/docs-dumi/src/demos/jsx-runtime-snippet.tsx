import React from 'react'

export default function Demo(): JSX.Element {
	return (
		<div style={{ lineHeight: 1.7 }}>
			<div style={{ marginBottom: 8 }}>
				这段代码展示 <code>@jiujue/weave-types/jsx-runtime</code> 的写法（更偏
				DSL，强类型）。
			</div>
			<pre
				style={{
					padding: 12,
					borderRadius: 8,
					background: '#0b1021',
					color: '#e6e6e6',
					overflow: 'auto'
				}}
			>{`/** @jsxImportSource @jiujue/weave-types */
import type { SceneNode } from '@jiujue/weave-types'

const scene: SceneNode = (
  <container id="root" style={{ padding: 16, flexDirection: 'column' }}>
    <text id="title" textStyle={{ fontSize: 18, fill: '#111827' }}>
      Hello Weave
    </text>
  </container>
)`}</pre>
		</div>
	)
}
