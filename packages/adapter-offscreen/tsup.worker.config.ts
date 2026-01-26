import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/worker.ts'],
	format: ['esm'],
	target: 'es2022',
	platform: 'browser',
	splitting: false,
	dts: true,
	outDir: 'dist',
	clean: true,
	noExternal: [/.*/],
})
