import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
	plugins: [react()],
	server: { port: 5174 },
	resolve: {
		alias: {
			'@jiujue/weave-core': path.resolve(
				__dirname,
				'../../packages/core/src/index.ts'
			),
			'@jiujue/weave-types': path.resolve(
				__dirname,
				'../../packages/types/src/index.ts'
			),
			'@jiujue/weave-react': path.resolve(
				__dirname,
				'../../packages/react/src/index.ts'
			),
			'@jiujue/weave-editor-core': path.resolve(
				__dirname,
				'../../packages/editor-core/src/index.ts'
			)
		}
	}
})
