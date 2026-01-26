import { defineConfig } from 'tsup'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm'],
	dts: true,
	clean: false, // Don't clean, we need dist/worker.js
	define: {
		__WEAVE_WORKER_CODE__: JSON.stringify(
			fs.readFileSync(path.resolve(__dirname, 'dist/worker.js'), 'utf-8'),
		),
	},
})
