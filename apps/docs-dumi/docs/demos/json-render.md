---
title: JSON 渲染示例
order: 10
---

# 从 JSON 渲染

本示例展示了如何使用 `@jiujue/weave-core` 直接将 JSON 数据渲染到 Canvas 上。Weave 的核心引擎是数据驱动的，这意味着你可以通过简单的 JSON 对象来描述整个场景结构、样式和内容。

## 在线演示

你可以修改下方的 JSON 配置，点击 "Render" 按钮实时更新画布内容。

```tsx
import React, { useEffect, useRef, useState } from 'react'
import { createEngine } from '@jiujue/weave-core'
import type { SceneNode } from '@jiujue/weave-types'

// 初始 JSON 数据
const initialJson: SceneNode = {
	id: 'root',
	type: 'container',
	style: {
		width: 600,
		height: 400,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
		gap: 10,
		background: { color: '#1e293b' },
	},
	children: [
		{
			id: 'header',
			type: 'container',
			style: {
				width: '100%',
				height: 60,
				flexDirection: 'row',
				justifyContent: 'space-between',
				alignItems: 'center',
				paddingHorizontal: 20,
				background: { color: '#334155' },
				marginBottom: 20,
				borderRadius: 8,
			},
			children: [
				{
					id: 'logo',
					type: 'text',
					text: 'WEAVE',
					textStyle: { fontSize: 24, fontWeight: 700, color: '#38bdf8' },
				},
				{
					id: 'menu',
					type: 'text',
					text: 'Menu',
					textStyle: { fontSize: 14, color: '#94a3b8' },
				},
			],
		},
		{
			id: 'content',
			type: 'container',
			style: {
				width: '100%',
				flex: 1,
				flexDirection: 'row',
				gap: 20,
			},
			children: [
				{
					id: 'sidebar',
					type: 'container',
					style: {
						width: 150,
						height: '100%',
						background: { color: '#334155' },
						borderRadius: 8,
						padding: 10,
						gap: 10,
					},
					children: [
						{
							id: 'item1',
							type: 'text',
							text: 'Dashboard',
							textStyle: { color: '#e2e8f0', fontSize: 14 },
						},
						{
							id: 'item2',
							type: 'text',
							text: 'Settings',
							textStyle: { color: '#e2e8f0', fontSize: 14 },
						},
						{
							id: 'item3',
							type: 'text',
							text: 'Profile',
							textStyle: { color: '#e2e8f0', fontSize: 14 },
						},
					],
				},
				{
					id: 'main',
					type: 'container',
					style: {
						flex: 1,
						height: '100%',
						background: { color: '#475569' },
						borderRadius: 8,
						justifyContent: 'center',
						alignItems: 'center',
					},
					children: [
						{
							id: 'welcome',
							type: 'text',
							text: 'Welcome to Weave',
							textStyle: { fontSize: 32, color: '#ffffff', fontWeight: 'bold' },
						},
						{
							id: 'desc',
							type: 'text',
							text: 'Edit JSON below to update me!',
							textStyle: { fontSize: 16, color: '#cbd5e1' },
						},
					],
				},
			],
		},
	],
}

// 简单的文本测量实现 (浏览器端)
const createTextMeasurer = (ctx: CanvasRenderingContext2D) => ({
	measure: (input: any) => {
		const { text, style } = input
		const font = `${style.fontStyle || ''} ${style.fontWeight || 400} ${style.fontSize || 14}px ${style.fontFamily || 'sans-serif'}`
		ctx.font = font
		const metrics = ctx.measureText(text)
		return {
			width: metrics.width,
			height: (style.fontSize || 14) * 1.2, // 简单估算行高
			lines: [],
		}
	},
})

export default () => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [jsonContent, setJsonContent] = useState(JSON.stringify(initialJson, null, 2))
	const [error, setError] = useState('')
	const engineRef = useRef<any>(null)

	// 初始化引擎
	useEffect(() => {
		let mounted = true

		const init = async () => {
			if (!canvasRef.current) return

			const ctx = canvasRef.current.getContext('2d')
			if (!ctx) return

			// 1. 创建引擎
			const engine = await createEngine({
				textMeasurer: createTextMeasurer(ctx),
			})

			if (mounted) {
				engineRef.current = engine
				renderScene()
			}
		}

		init()

		return () => {
			mounted = false
			if (engineRef.current) {
				engineRef.current.dispose()
			}
		}
	}, [])

	// 渲染函数
	const renderScene = () => {
		if (!engineRef.current || !canvasRef.current) return

		try {
			const scene = JSON.parse(jsonContent)
			setError('')

			// 2. 设置根节点
			engineRef.current.setRoot(scene)

			// 3. 计算布局并生成绘制指令
			const width = 600
			const height = 400
			engineRef.current.render({ width, height })

			// 4. 回放绘制
			const ctx = canvasRef.current.getContext('2d')
			ctx.clearRect(0, 0, width, height)
			engineRef.current.replay(ctx)
		} catch (e) {
			setError(e.message)
		}
	}

	// 监听 JSON 变化并重新渲染
	useEffect(() => {
		renderScene()
	}, [jsonContent]) // 简单起见，每次 JSON 字符串变化都尝试渲染

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			{/* 画布区域 */}
			<div
				style={{
					border: '1px solid #e2e8f0',
					borderRadius: 8,
					overflow: 'hidden',
				}}
			>
				<canvas
					ref={canvasRef}
					width={600}
					height={400}
					style={{ display: 'block', width: 600, height: 400 }}
				/>
			</div>

			{/* 编辑器区域 */}
			<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<span style={{ fontWeight: 'bold', fontSize: 14 }}>Scene JSON</span>
					{error && <span style={{ color: 'red', fontSize: 12 }}>{error}</span>}
				</div>
				<textarea
					value={jsonContent}
					onChange={(e) => setJsonContent(e.target.value)}
					style={{
						width: '100%',
						height: 300,
						fontFamily: 'monospace',
						fontSize: 12,
						padding: 12,
						borderRadius: 8,
						border: `1px solid ${error ? 'red' : '#e2e8f0'}`,
						backgroundColor: '#f8fafc',
						resize: 'vertical',
					}}
				/>
			</div>
		</div>
	)
}
```
