const { defineConfig } = require('cz-git')

module.exports = defineConfig({
	extends: ['@commitlint/config-conventional'],
	rules: {},
	prompt: {
		useEmoji: false,
		types: [
			{ value: 'feat', name: 'feat:     新功能' },
			{ value: 'fix', name: 'fix:      修复问题' },
			{ value: 'docs', name: 'docs:     文档变更' },
			{ value: 'style', name: 'style:    格式调整（不影响逻辑）' },
			{ value: 'refactor', name: 'refactor: 重构（非修复/非功能）' },
			{ value: 'perf', name: 'perf:     性能优化' },
			{ value: 'test', name: 'test:     测试相关' },
			{ value: 'build', name: 'build:    构建系统/依赖变更' },
			{ value: 'ci', name: 'ci:       CI 配置变更' },
			{ value: 'chore', name: 'chore:    其他杂项' },
			{ value: 'revert', name: 'revert:   回滚提交' },
		],
		scopes: ['core', 'demo', 'docs', 'tooling'],
		allowCustomScopes: true,
		allowEmptyScopes: true,
	},
})
