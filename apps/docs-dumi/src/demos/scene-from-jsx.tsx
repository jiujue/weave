import React, { useMemo } from 'react'
import { sceneFromJSX } from '@jiujue/weave-react'
import type { SceneNode } from '@jiujue/weave-types'

const Text = 'text' as any

export default function Demo(): JSX.Element {
	const scene: SceneNode = useMemo(
		() =>
			sceneFromJSX(
				<container
					id='root'
					style={{ width: 360, padding: 16, flexDirection: 'column' }}
					paint={{ background: { color: '#0b1021' } }}
				>
					<Text
						id='title'
						textStyle={{
							fontSize: 18,
							color: '#e6e6e6',
							fontWeight: 'bold'
						}}
					>
						Weave: sceneFromJSX
					</Text>
					<Text
						id='desc'
						style={{ marginTop: 8 }}
						textStyle={{ fontSize: 13, color: '#b7c0ff' }}
					>
						把 React JSX 转成纯数据 SceneNode（可 Patch、可跨端）。
					</Text>
				</container>
			),
		[]
	)

	return (
		<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
			<div>
				<div style={{ marginBottom: 8, fontWeight: 600 }}>产物：SceneNode</div>
				<pre
					style={{
						maxHeight: 360,
						maxWidth: '100%',
						boxSizing: 'border-box',
						overflow: 'auto',
						padding: 12,
						borderRadius: 8,
						background: '#0b1021',
						color: '#e6e6e6'
					}}
				>
					{JSON.stringify(scene, null, 2)}
				</pre>
			</div>
			<div>
				<div style={{ marginBottom: 8, fontWeight: 600 }}>下一步</div>
				<ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
					<li>把 scene 交给 @jiujue/weave-core：layout → DisplayList</li>
					<li>用 @jiujue/weave-displaylist replay 到任意 Context2DLike</li>
					<li>用 adapter-offscreen 做主线程/Worker 分离</li>
				</ul>
			</div>
		</div>
	)
}
