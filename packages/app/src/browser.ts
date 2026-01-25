import { createWeaveBrowserApp } from '@jiujue/weave-adapter-offscreen'
import type { SceneNode, ScenePatch } from '@jiujue/weave-types'

export type WeaveBrowserAppOptions = Readonly<{
	canvas: HTMLCanvasElement
	clearColor?: string
	dpr?: number
	scale?: number
	scene?: SceneNode
	onError?: (message: string) => void
	devtools?: Readonly<{
		enabled?: boolean
		id?: string
		name?: string
		log?: boolean
	}>
}>

export type WeaveBrowserApp = Readonly<{
	kind: 'browser'
	setScene(scene: SceneNode): void
	setClearColor(color: string): void
	applyPatches(patches: readonly ScenePatch[]): void
	getScene(): SceneNode | null
	getNodeById(id: string): SceneNode | null
	resize(dpr?: number, scale?: number): void
	render(): void
	dispose(): void
	hitTest(x: number, y: number): Promise<{ id: string | null; path: readonly string[] }>
	getNodeInfo(id: string): Promise<{ x: number; y: number; width: number; height: number } | null>
}>

export function createWeaveApp(options: WeaveBrowserAppOptions): WeaveBrowserApp {
	const app = createWeaveBrowserApp(options)
	return {
		kind: 'browser',
		setScene: app.setScene,
		setClearColor: app.setClearColor,
		applyPatches: app.applyPatches,
		getScene: app.getScene,
		getNodeById: app.getNodeById,
		resize: app.resize,
		render: app.render,
		dispose: app.dispose,
		hitTest: app.hitTest,
		getNodeInfo: app.getNodeInfo,
	}
}
