module.exports = {
	root: true,
	ignorePatterns: [
		'node_modules',
		'dist',
		'.turbo',
		'.dumi',
		'apps/devtools-extension/.plasmo',
		'apps/devtools-extension/build',
		'**/*.d.ts',
		'**/*.runtime.js',
		'**/output*.png',
	],
	env: {
		es2022: true,
		node: true,
		browser: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react/recommended',
		'plugin:react-hooks/recommended',
		'plugin:vue/vue3-recommended',
		'prettier',
	],
	parserOptions: {
		ecmaVersion: 2022,
		sourceType: 'module',
	},
	settings: {
		react: {
			version: '18.0',
		},
	},
	overrides: [
		{
			files: ['**/*.{ts,tsx}'],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				project: null,
			},
		},
		{
			files: ['**/*.cjs'],
			rules: {
				'@typescript-eslint/no-require-imports': 'off',
			},
		},
		{
			files: ['**/*.vue'],
			parser: 'vue-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser',
				ecmaVersion: 2022,
				sourceType: 'module',
				extraFileExtensions: ['.vue'],
			},
		},
	],
	rules: {
		'react/react-in-jsx-scope': 'off',
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-namespace': 'off',
		'@typescript-eslint/ban-ts-comment': 'off',
		'react-hooks/exhaustive-deps': 'off',
		'react-hooks/set-state-in-effect': 'off',
		'react-hooks/purity': 'off',
		'react/no-unknown-property': 'off',
		'prefer-const': 'off',
		'no-empty': 'off',
		'no-constant-condition': 'off',
	},
}
