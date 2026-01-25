import React, { useEffect, useMemo, useState } from 'react'
import type { SceneNode, TextStyle } from '@jiujue/weave-types'
import { sceneFromJSX } from '@jiujue/weave-react'
import { createWeaveImageClient } from '@jiujue/weave-adapter-worker-image'

const Container = 'container' as any
const Text = 'text' as any

function buildA4Scene(size: { pageW: number; pageH: number }): JSX.Element {
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
	const mono: TextStyle = {
		fontSize: 11,
		color: '#0f172a',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
		whiteSpace: 'nowrap',
		textBaseline: 'top',
	}

	return (
		<Container
			id="root"
			style={{
				width: size.pageW,
				height: size.pageH,
				flexDirection: 'column',
				padding: 56,
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
					id="logo"
					style={{ width: 40, height: 40 }}
					paint={{ background: { color: '#2563eb', alpha: 0.9 } }}
				/>
				<Container
					id="headerText"
					style={{
						flexDirection: 'column',
						flexGrow: 1,
						flexShrink: 1,
						minWidth: 0,
						gap: 4,
					}}
				>
					<Text id="docTitle" textStyle={title}>
						A4 文档（flex 布局）
					</Text>
					<Text id="docSub" textStyle={body}>
						由 WebWorker 离屏渲染为 PNG，主线程仅展示 img（更适合导出/预渲染场景）
					</Text>
				</Container>
				<Container
					id="badge"
					style={{ padding: 8 }}
					paint={{
						background: { color: '#e0f2fe', alpha: 1 },
						border: { color: '#38bdf8', width: 1 },
					}}
				>
					<Text id="badgeText" textStyle={mono}>
						DPR x2
					</Text>
				</Container>
			</Container>

			<Container id="hr" style={{ height: 1 }} paint={{ background: { color: '#e2e8f0' } }} />

			<Container id="content" style={{ flexDirection: 'row', gap: 18, flexGrow: 1 }}>
				<Container
					id="left"
					style={{
						flexDirection: 'column',
						gap: 10,
						flexGrow: 1,
						flexShrink: 1,
						minWidth: 0,
					}}
				>
					<Text id="sec1" textStyle={h2}>
						概览
					</Text>
					<Text id="p1" textStyle={body}>
						本示例在 worker 中用 @jiujue/weave-core 生成 display list，并回放到
						OffscreenCanvas，然后 convertToBlob 得到 PNG。
					</Text>
					<Text id="p2" textStyle={body}>
						布局完全走 Yoga（flexDirection/gap/flexGrow 等），因此能像写 UI 一样拼装一张“文档”。
					</Text>
					<Container
						id="callout"
						style={{ padding: 12, gap: 6, flexDirection: 'column' }}
						paint={{
							background: { color: '#f8fafc' },
							border: { color: '#e2e8f0', width: 1 },
						}}
					>
						<Text id="calloutTitle" textStyle={h2}>
							关键点
						</Text>
						<Text id="calloutLine1" textStyle={body}>
							- 主线程不画 canvas，只显示 img
						</Text>
						<Text id="calloutLine2" textStyle={body}>
							- DPR 提升后边缘/字体更清晰
						</Text>
						<Text id="calloutLine3" textStyle={body}>
							- 适合“导出/静态预渲染/低频更新”
						</Text>
					</Container>
				</Container>

				<Container
					id="right"
					style={{
						flexDirection: 'column',
						gap: 10,
						width: 220,
						flexShrink: 0,
					}}
				>
					<Text id="sec2" textStyle={h2}>
						元信息
					</Text>
					<Container
						id="meta"
						style={{ flexDirection: 'column', gap: 6, padding: 10 }}
						paint={{
							background: { color: '#f8fafc' },
							border: { color: '#e2e8f0', width: 1 },
						}}
					>
						<Text id="m1" textStyle={mono}>
							page: {size.pageW}x{size.pageH}
						</Text>
						<Text id="m2" textStyle={mono}>
							layout: flex
						</Text>
						<Text id="m3" textStyle={mono}>
							output: image/png
						</Text>
					</Container>
					<Text id="sec3" textStyle={h2}>
						说明
					</Text>
					<Text id="p3" textStyle={body}>
						A4 这里按 96 DPI 近似：794 x 1123（逻辑像素），再用 DPR 放大渲染。
					</Text>
				</Container>
			</Container>

			<Container id="footer" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
				<Text id="f1" textStyle={mono}>
					weave / worker-image
				</Text>
				<Text id="f2" textStyle={mono}>
					page 1 / 1
				</Text>
			</Container>
		</Container>
	)
}

export default function Demo(): JSX.Element {
	const a4 = useMemo(() => ({ pageW: 794, pageH: 1123 }), [])
	const scene: SceneNode = useMemo(() => sceneFromJSX(buildA4Scene(a4)), [a4])
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
	}, [scene])

	if (!imgUrl) return <img alt="worker rendered" style={{ width: '100%', display: 'block' }} />
	return (
		<img
			alt="worker rendered"
			src={imgUrl}
			style={{ width: '100%', display: 'block', background: '#ffffff' }}
		/>
	)
}
