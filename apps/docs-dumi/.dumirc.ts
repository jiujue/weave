import { defineConfig } from 'dumi'

const pathPreFix = 'weave'

export default defineConfig({
	title: 'Weave',
	outputPath: '../../dumi-docs',
	logo: `/${pathPreFix}/weave.svg`,
	base: `/${pathPreFix}/`, // ✅ 关键：这里填你的仓库名
	publicPath: `/${pathPreFix}/`, // ⚠️ 确保静态资源路径正确
	favicons: [`/${pathPreFix}/weave.svg`],
	themeConfig: {
		name: 'Weave',
		logo: `/${pathPreFix}/weave.svg`,
		nav: [
			{ title: '指南', link: '/guide/getting-started' },
			{ title: '选型与对比', link: '/quick-comparison/selection' },
			{ title: '参考', link: '/reference/scene' },
			{ title: '示例', link: '/demos' },
			{
				title: '子包',
				children: [
					{ title: '@jiujue/weave-types', link: '/types' },
					{ title: '@jiujue/weave-core', link: '/core' },
					{ title: '@jiujue/weave-displaylist', link: '/displaylist' },
					{
						title: '@jiujue/weave-adapter-offscreen',
						link: '/adapter-offscreen',
					},
					{ title: '@jiujue/weave-adapter-node', link: '/adapter-node' },
					{ title: '@jiujue/weave-app', link: '/app' },
					{ title: '@jiujue/weave-react', link: '/react' },
				],
			},
		],
		footer: 'Weave · OffscreenCanvas + Yoga + DisplayList',
		socialLinks: {},
	},
})
