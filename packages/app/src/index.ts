import type { SceneNode, ScenePatch } from '@jiujue/weave-types'

export type WeaveBrowserAppOptions = Readonly<{
	canvas: HTMLCanvasElement
	clearColor?: string
	dpr?: number
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
	resize(dpr?: number): void
	render(): void
	dispose(): void
	hitTest(x: number, y: number): Promise<{ id: string | null; path: readonly string[] }>
	getNodeInfo(id: string): Promise<{ x: number; y: number; width: number; height: number } | null>
}>

export type WeaveNodeAppOptions = Readonly<{
	width: number
	height: number
	dpr?: number
	clearColor?: string
	scene?: SceneNode
}>

export type WeaveNodeApp = Readonly<{
	kind: 'node'
	setScene(scene: SceneNode): void
	applyPatches(patches: readonly ScenePatch[]): void
	renderToPng(): Promise<Uint8Array>
	dispose(): void
}>

export type WeaveApp = WeaveBrowserApp | WeaveNodeApp

export declare function createWeaveApp(options: WeaveBrowserAppOptions): WeaveBrowserApp
export declare function createWeaveApp(options: WeaveNodeAppOptions): WeaveNodeApp
