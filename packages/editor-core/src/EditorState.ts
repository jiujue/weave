import type { SceneNode, ScenePatch } from '@jiujue/weave-types'

export type EditorStateListener = (state: EditorState) => void

export class EditorState {
	scene: SceneNode
	selection: string[] = []
	version: number = 0
	zoom: number = 1
	dpr: number = 1
	canvasBackgroundColor: string = '#ffffff'
	private listeners: Set<EditorStateListener> = new Set()

	constructor(initialScene: SceneNode) {
		this.scene = initialScene
	}

	setZoom(zoom: number) {
		this.zoom = zoom
		this.notify()
	}

	setDpr(dpr: number) {
		this.dpr = dpr
		this.notify()
	}

	setCanvasBackgroundColor(color: string) {
		this.canvasBackgroundColor = color
		this.notify()
	}

	setSelection(ids: string[]) {
		this.selection = ids
		this.notify()
	}

	updateScene(newScene: SceneNode) {
		this.scene = newScene
		this.notify()
	}

	applyPatches(patches: ScenePatch[]) {
		// Ideally we apply patches to local scene copy here.
		// For now, we assume the app handles the scene update loop.
		// This method might just be a signal.
	}

	subscribe(listener: EditorStateListener) {
		this.listeners.add(listener)
		return () => this.listeners.delete(listener)
	}

	private notify() {
		this.version++
		this.listeners.forEach((l) => l(this))
	}
}
