import { createEngine } from '@jiujue/weave-core'
import type { SceneNode } from '@jiujue/weave-types'
import { useEffect, useRef } from 'react'

// Mock Data
const articles = [
	{
		title: '为什么 Instagram 再次转向 React Native',
		desc: '2023 年，Meta 悄然更新点燃了对 React Native 的承诺。这一次，带来了真正的生产成果。',
		author: 'JarvanMo',
		views: '2.0k',
		likes: 13,
		tags: ['前端', 'React Native'],
	},
	{
		title: '前端必学-完美组件封装原则',
		desc: '本文总结了多年组件封装经验，以及拜读 antd、element-plus 等多个知名库源码...',
		author: 'Freedom风间',
		views: '28k',
		likes: 695,
		tags: ['前端', 'JavaScript', '设计模式'],
	},
	{
		title: '我用 Cursor + Trae 手搓了一个 App，上架了 App Store',
		desc: '本文讲述作者使用 AI 工具 Cursor 与 Trae 开发并上架证件照水印 App 的全过程...',
		author: 'Stay_Thinking',
		views: '4.1k',
		likes: 28,
		tags: ['AI编程', 'Cursor'],
	},
	{
		title: '如何知道同事的工资？',
		desc: '作为牛马，虽然能理解薪资保密的初衷，但你肯定忍不住想知道身边同事的工资吧？',
		author: '野生的码农',
		views: '37k',
		likes: 210,
		tags: ['程序员', '职场'],
	},
]

const rightSideCards = [
	{ title: '晚上好!', desc: '点亮在社区的每一天', action: '去签到' },
	{
		title: '文章榜',
		items: [
			'"死了么"用户数翻800倍',
			'普通前端仔的 2025',
			'我的2025: 做项目、跑副业',
			'2025年总结: 我还在往前走',
		],
	},
]

// Components (Helper functions to generate SceneNode)
const Header = (): SceneNode => ({
	id: 'header',
	type: 'container',
	style: {
		width: '100%',
		height: 60,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		background: { color: '#ffffff' },
		borderBottomWidth: 1,
		borderColor: '#e5e7eb',
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
	},
	children: [
		{
			id: 'header-left',
			type: 'container',
			style: { flexDirection: 'row', alignItems: 'center', gap: 20 },
			children: [
				{
					id: 'logo',
					type: 'text',
					text: '稀土掘金',
					textStyle: { fontSize: 18, fontWeight: 700, color: '#1e80ff' },
				},
				{
					id: 'nav-home',
					type: 'text',
					text: '首页',
					textStyle: { fontSize: 14, color: '#1e80ff' },
				},
				{
					id: 'nav-ai',
					type: 'text',
					text: 'AI Coding',
					textStyle: { fontSize: 14, color: '#515767' },
				},
				{
					id: 'nav-course',
					type: 'text',
					text: '课程',
					textStyle: { fontSize: 14, color: '#515767' },
				},
				{
					id: 'nav-live',
					type: 'text',
					text: '直播',
					textStyle: { fontSize: 14, color: '#515767' },
				},
			],
		},
		{
			id: 'header-right',
			type: 'container',
			style: { flexDirection: 'row', alignItems: 'center', gap: 15 },
			children: [
				{
					id: 'search',
					type: 'container',
					style: {
						width: 200,
						height: 32,
						background: { color: '#f2f3f5' },
						borderRadius: 4,
						justifyContent: 'center',
						paddingLeft: 10,
					},
					children: [
						{
							id: 'search-text',
							type: 'text',
							text: '搜索稀土掘金',
							textStyle: { fontSize: 12, color: '#86909c' },
						},
					],
				},
				{
					id: 'creator-btn',
					type: 'container',
					style: {
						paddingHorizontal: 15,
						height: 32,
						background: { color: '#1e80ff' },
						borderRadius: 4,
						justifyContent: 'center',
						alignItems: 'center',
					},
					children: [
						{
							id: 'creator-text',
							type: 'text',
							text: '创作者中心',
							textStyle: { fontSize: 12, color: '#ffffff' },
						},
					],
				},
			],
		},
	],
})

const Sidebar = (): SceneNode => ({
	id: 'sidebar',
	type: 'container',
	style: {
		width: 180,
		paddingTop: 20,
		gap: 5,
		background: { color: '#ffffff' },
		marginRight: 20,
		borderRadius: 4,
	},
	children: [
		'关注',
		'综合',
		'后端',
		'前端',
		'Android',
		'iOS',
		'人工智能',
		'开发工具',
		'代码人生',
		'阅读',
	].map((item, index) => ({
		id: `sidebar-${index}`,
		type: 'container',
		style: {
			paddingVertical: 10,
			paddingHorizontal: 15,
			background: item === '综合' ? { color: '#eaf2ff' } : undefined,
			borderRadius: 4,
		},
		children: [
			{
				id: `sidebar-text-${index}`,
				type: 'text',
				text: item,
				textStyle: {
					fontSize: 14,
					color: item === '综合' ? '#1e80ff' : '#515767',
				},
			},
		],
	})),
})

const ArticleCard = (article: any, index: number): SceneNode => ({
	id: `article-${index}`,
	type: 'container',
	style: {
		padding: 20,
		background: { color: '#ffffff' },
		borderBottomWidth: 1,
		borderColor: '#e5e7eb',
		gap: 8,
	},
	children: [
		{
			id: `title-${index}`,
			type: 'text',
			text: article.title,
			textStyle: { fontSize: 16, fontWeight: 700, color: '#1d2129' },
		},
		{
			id: `desc-${index}`,
			type: 'text',
			text: article.desc,
			textStyle: { fontSize: 13, color: '#86909c' },
		},
		{
			id: `meta-${index}`,
			type: 'container',
			style: {
				flexDirection: 'row',
				alignItems: 'center',
				gap: 10,
				marginTop: 4,
			},
			children: [
				{
					id: `author-${index}`,
					type: 'text',
					text: article.author,
					textStyle: { fontSize: 12, color: '#4e5969' },
				},
				{
					id: `views-${index}`,
					type: 'text',
					text: `${article.views} 浏览`,
					textStyle: { fontSize: 12, color: '#86909c' },
				},
				{
					id: `likes-${index}`,
					type: 'text',
					text: `${article.likes} 赞`,
					textStyle: { fontSize: 12, color: '#86909c' },
				},
				...(article.tags || []).map((tag: string, tIdx: number) => ({
					id: `tag-${index}-${tIdx}`,
					type: 'text',
					text: tag,
					textStyle: { fontSize: 12, color: '#86909c' },
				})),
			],
		},
	],
})

const MainContent = (): SceneNode => ({
	id: 'main-list',
	type: 'container',
	style: {
		flex: 1,
		background: { color: '#ffffff' },
		borderRadius: 4,
	},
	children: [
		{
			id: 'list-header',
			type: 'container',
			style: {
				flexDirection: 'row',
				padding: 15,
				borderBottomWidth: 1,
				borderColor: '#e5e7eb',
				gap: 20,
			},
			children: [
				{
					id: 'sort-rec',
					type: 'text',
					text: '推荐',
					textStyle: { fontSize: 14, color: '#1e80ff' },
				},
				{
					id: 'sort-new',
					type: 'text',
					text: '最新',
					textStyle: { fontSize: 14, color: '#515767' },
				},
			],
		},
		...articles.map((article, index) => ArticleCard(article, index)),
	],
})

const RightSidebar = (): SceneNode => ({
	id: 'right-sidebar',
	type: 'container',
	style: {
		width: 260,
		marginLeft: 20,
		gap: 20,
	},
	children: [
		// Sign in card
		{
			id: 'signin-card',
			type: 'container',
			style: {
				padding: 20,
				background: { color: '#ffffff' },
				borderRadius: 4,
				gap: 10,
			},
			children: [
				{
					id: 'greeting',
					type: 'container',
					style: {
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
					},
					children: [
						{
							id: 'greet-title',
							type: 'text',
							text: '晚上好!',
							textStyle: { fontSize: 16, fontWeight: 600 },
						},
						{
							id: 'checkin-btn',
							type: 'container',
							style: {
								paddingHorizontal: 10,
								paddingVertical: 5,
								borderWidth: 1,
								borderColor: '#1e80ff',
								borderRadius: 4,
							},
							children: [
								{
									id: 'checkin-text',
									type: 'text',
									text: '去签到',
									textStyle: { fontSize: 12, color: '#1e80ff' },
								},
							],
						},
					],
				},
				{
					id: 'slogan',
					type: 'text',
					text: '点亮在社区的每一天',
					textStyle: { fontSize: 12, color: '#86909c' },
				},
			],
		},
		// Ad banner
		{
			id: 'ad-banner',
			type: 'container',
			style: {
				height: 200,
				background: { color: '#1e1e1e' },
				borderRadius: 4,
				justifyContent: 'center',
				alignItems: 'center',
			},
			children: [
				{
					id: 'ad-text',
					type: 'text',
					text: '「AI/Vibe Coding」',
					textStyle: { fontSize: 18, color: '#ffffff', fontWeight: 700 },
				},
				{
					id: 'ad-sub',
					type: 'text',
					text: '对我的影响',
					textStyle: { fontSize: 14, color: '#cccccc' },
				},
			],
		},
		// Rank list
		{
			id: 'rank-list',
			type: 'container',
			style: {
				padding: 15,
				background: { color: '#ffffff' },
				borderRadius: 4,
				gap: 10,
			},
			children: [
				{
					id: 'rank-title',
					type: 'text',
					text: '📝 文章榜',
					textStyle: { fontSize: 14, fontWeight: 600 },
				},
				...rightSideCards[1].items.map((item, idx) => ({
					id: `rank-item-${idx}`,
					type: 'container',
					style: { flexDirection: 'row', gap: 10, alignItems: 'center' },
					children: [
						{
							id: `rank-num-${idx}`,
							type: 'text',
							text: `${idx + 1}`,
							textStyle: {
								fontSize: 14,
								color: idx < 3 ? '#ff5132' : '#86909c',
								fontWeight: 700,
							},
						},
						{
							id: `rank-text-${idx}`,
							type: 'text',
							text: item,
							textStyle: { fontSize: 13, color: '#333' },
						},
					],
				})),
			],
		},
	],
})

export const JuejinPage = (): SceneNode => ({
	id: 'root',
	type: 'container',
	style: {
		width: '100%',
		height: '100%',
		background: { color: '#f4f5f9' },
		alignItems: 'center',
		paddingTop: 80, // Space for fixed header
	},
	children: [
		Header(),
		{
			id: 'content-wrapper',
			type: 'container',
			style: {
				width: 960, // Max width
				maxWidth: '100%',
				flexDirection: 'row',
				alignItems: 'flex-start',
			},
			children: [Sidebar(), MainContent(), RightSidebar()],
		},
	],
})

// React Component Wrapper
export default function JuejinDemo() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const engineRef = useRef<any>(null)

	useEffect(() => {
		let mounted = true
		const init = async () => {
			if (!canvasRef.current) return

			const ctx = canvasRef.current.getContext('2d')
			if (!ctx) return

			// Simple Text Measurer
			const textMeasurer = {
				measure: (input: any) => {
					const { text, style } = input
					const font = `${style.fontWeight || 400} ${style.fontSize || 14}px ${style.fontFamily || 'sans-serif'}`
					ctx.font = font
					const metrics = ctx.measureText(text)
					return {
						width: metrics.width,
						height: (style.fontSize || 14) * 1.4,
						lines: [],
					}
				},
			}

			const engine = await createEngine({ textMeasurer })
			if (!mounted) return

			engineRef.current = engine
			engine.setRoot(JuejinPage())

			const render = () => {
				if (!canvasRef.current) return
				const { clientWidth, clientHeight } = canvasRef.current
				canvasRef.current.width = clientWidth
				canvasRef.current.height = clientHeight

				engine.render({ width: clientWidth, height: clientHeight })
				ctx.clearRect(0, 0, clientWidth, clientHeight)
				engine.replay(ctx)
			}

			render()
			window.addEventListener('resize', render)

			return () => {
				window.removeEventListener('resize', render)
			}
		}

		init()
		return () => {
			mounted = false
			engineRef.current?.dispose()
		}
	}, [])

	return (
		<div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
			<canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
		</div>
	)
}
