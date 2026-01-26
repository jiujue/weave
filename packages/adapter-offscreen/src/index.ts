import type { SceneNode, ScenePatch } from '@jiujue/weave-types'
import { attachWeaveDevtools, createSceneMirror } from '@jiujue/weave-devtools-runtime'

export type WeaveWorkerInitMessage = Readonly<{
	type: 'WEAVE_INIT'
	canvas: OffscreenCanvas
	width: number
	height: number
	dpr: number
	scale?: number
	clearColor?: string
	scene?: SceneNode
}>

export type WeaveWorkerPatchMessage = Readonly<{
	type: 'WEAVE_PATCH'
	patches: readonly ScenePatch[]
}>

export type WeaveWorkerResizeMessage = Readonly<{
	type: 'WEAVE_RESIZE'
	width: number
	height: number
	dpr: number
	scale?: number
}>

export type WeaveWorkerRenderMessage = Readonly<{
	type: 'WEAVE_RENDER'
}>

export type WeaveWorkerDisposeMessage = Readonly<{
	type: 'WEAVE_DISPOSE'
}>

export type WeaveWorkerSetSceneMessage = Readonly<{
	type: 'WEAVE_SET_SCENE'
	scene: SceneNode
}>

export type WeaveWorkerHitTestMessage = Readonly<{
	type: 'WEAVE_HIT_TEST'
	requestId: number
	x: number
	y: number
}>

export type WeaveWorkerGetNodeInfoMessage = Readonly<{
	type: 'WEAVE_GET_NODE_INFO'
	requestId: number
	nodeId: string
}>

export type WeaveWorkerSetClearColorMessage = Readonly<{
	type: 'WEAVE_SET_CLEAR_COLOR'
	color: string
}>

export type WeaveWorkerToWorkerMessage =
	| WeaveWorkerInitMessage
	| WeaveWorkerPatchMessage
	| WeaveWorkerResizeMessage
	| WeaveWorkerRenderMessage
	| WeaveWorkerSetSceneMessage
	| WeaveWorkerSetClearColorMessage
	| WeaveWorkerDisposeMessage
	| WeaveWorkerHitTestMessage
	| WeaveWorkerGetNodeInfoMessage

export type WeaveWorkerReadyMessage = Readonly<{
	type: 'WEAVE_READY'
}>

export type WeaveWorkerHitTestResultMessage = Readonly<{
	type: 'WEAVE_HIT_TEST_RESULT'
	requestId: number
	result: { id: string | null; path: readonly string[] }
}>

export type WeaveWorkerGetNodeInfoResultMessage = Readonly<{
	type: 'WEAVE_GET_NODE_INFO_RESULT'
	requestId: number
	result: { x: number; y: number; width: number; height: number } | null
}>

export type WeaveWorkerErrorMessage = Readonly<{
	type: 'WEAVE_ERROR'
	message: string
}>

export type WeaveWorkerToMainMessage =
	| WeaveWorkerReadyMessage
	| WeaveWorkerErrorMessage
	| WeaveWorkerHitTestResultMessage
	| WeaveWorkerGetNodeInfoResultMessage

export type OffscreenClientOptions = Readonly<{
	canvas: HTMLCanvasElement
	worker: Worker
	clearColor?: string
	dpr?: number
	scale?: number
	scene?: SceneNode
}>

export type OffscreenClient = Readonly<{
	applyPatches(patches: readonly ScenePatch[]): void
	setScene(scene: SceneNode): void
	setClearColor(color: string): void
	resize(dpr?: number, scale?: number): void
	render(): void
	dispose(): void
	hitTest(x: number, y: number): Promise<{ id: string | null; path: readonly string[] }>
	getNodeInfo(id: string): Promise<{ x: number; y: number; width: number; height: number } | null>
}>

export function createOffscreenClient(options: OffscreenClientOptions): OffscreenClient {
	const { canvas, worker } = options
	const offscreen = canvas.transferControlToOffscreen()
	let currentDpr = options.dpr ?? (globalThis.devicePixelRatio || 1)
	let currentScale = options.scale ?? 1
	const getDpr = () => currentDpr
	const getScale = () => currentScale

	let reqId = 0
	const pendingRequests = new Map<number, (res: any) => void>()

	worker.addEventListener('message', (event) => {
		const msg = event.data as WeaveWorkerToMainMessage
		if (msg.type === 'WEAVE_HIT_TEST_RESULT') {
			const resolve = pendingRequests.get(msg.requestId)
			if (resolve) {
				resolve(msg.result)
				pendingRequests.delete(msg.requestId)
			}
		}
		if (msg.type === 'WEAVE_GET_NODE_INFO_RESULT') {
			const resolve = pendingRequests.get(msg.requestId)
			if (resolve) {
				resolve(msg.result)
				pendingRequests.delete(msg.requestId)
			}
		}
	})

	const init = (): void => {
		// 初始化时把 OffscreenCanvas transfer 给 Worker；后续只通过消息同步尺寸与 scene/patch。
		const rect = canvas.getBoundingClientRect()
		worker.postMessage(
			{
				type: 'WEAVE_INIT',
				canvas: offscreen,
				width: rect.width,
				height: rect.height,
				dpr: getDpr(),
				scale: getScale(),
				clearColor: options.clearColor,
				scene: options.scene,
			} satisfies WeaveWorkerInitMessage,
			[offscreen],
		)
	}

	const resize = (dpr?: number, scale?: number): void => {
		if (dpr != null) currentDpr = dpr
		if (scale != null) currentScale = scale
		const rect = canvas.getBoundingClientRect()
		worker.postMessage({
			type: 'WEAVE_RESIZE',
			width: rect.width,
			height: rect.height,
			dpr: getDpr(),
			scale: getScale(),
		} satisfies WeaveWorkerResizeMessage)
	}

	const applyPatches = (patches: readonly ScenePatch[]): void => {
		worker.postMessage({
			type: 'WEAVE_PATCH',
			patches,
		} satisfies WeaveWorkerPatchMessage)
	}

	const setScene = (scene: SceneNode): void => {
		worker.postMessage({
			type: 'WEAVE_SET_SCENE',
			scene,
		} satisfies WeaveWorkerSetSceneMessage)
	}

	const setClearColor = (color: string): void => {
		worker.postMessage({
			type: 'WEAVE_SET_CLEAR_COLOR',
			color,
		} satisfies WeaveWorkerSetClearColorMessage)
	}

	const render = (): void => {
		worker.postMessage({
			type: 'WEAVE_RENDER',
		} satisfies WeaveWorkerRenderMessage)
	}

	const dispose = (): void => {
		worker.postMessage({
			type: 'WEAVE_DISPOSE',
		} satisfies WeaveWorkerDisposeMessage)
		worker.terminate()
	}

	const hitTest = (
		x: number,
		y: number,
	): Promise<{ id: string | null; path: readonly string[] }> => {
		return new Promise((resolve) => {
			const requestId = ++reqId
			pendingRequests.set(requestId, resolve)
			worker.postMessage({
				type: 'WEAVE_HIT_TEST',
				requestId,
				x: x / getScale(),
				y: y / getScale(),
			} satisfies WeaveWorkerHitTestMessage)
		})
	}

	const getNodeInfo = (
		nodeId: string,
	): Promise<{
		x: number
		y: number
		width: number
		height: number
	} | null> => {
		return new Promise((resolve) => {
			const requestId = ++reqId
			pendingRequests.set(requestId, (result) => {
				if (!result) {
					resolve(null)
					return
				}
				const s = getScale()
				resolve({
					x: result.x * s,
					y: result.y * s,
					width: result.width * s,
					height: result.height * s,
				})
			})
			worker.postMessage({
				type: 'WEAVE_GET_NODE_INFO',
				requestId,
				nodeId,
			} satisfies WeaveWorkerGetNodeInfoMessage)
		})
	}

	init()

	return {
		applyPatches,
		setScene,
		setClearColor,
		resize,
		render,
		dispose,
		hitTest,
		getNodeInfo,
	}
}

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
	wheelScroll?: Readonly<{
		targetId: string
		speed?: number
		axis?: 'x' | 'y' | 'both'
		shiftToHorizontal?: boolean
	}>
}>

export type WeaveBrowserApp = Readonly<{
	setScene(scene: SceneNode): void
	applyPatches(patches: readonly ScenePatch[]): void
	getScene(): SceneNode | null
	getNodeById(id: string): SceneNode | null
	setClearColor(color: string): void
	resize(dpr?: number, scale?: number): void
	render(): void
	dispose(): void
	hitTest(x: number, y: number): Promise<{ id: string | null; path: readonly string[] }>
	getNodeInfo(id: string): Promise<{ x: number; y: number; width: number; height: number } | null>
}>

export function createWeaveBrowserApp(options: WeaveBrowserAppOptions): WeaveBrowserApp {
	// @ts-ignore injected by tsup
	const workerCode = __WEAVE_WORKER_CODE__
	const blob = new Blob([workerCode], { type: 'application/javascript' })
	const worker = new Worker(URL.createObjectURL(blob), {
		type: 'module',
	})
	const devtoolsEnabled = options.devtools?.enabled ?? false
	let currentDpr = options.dpr ?? (globalThis.devicePixelRatio || 1)

	const client = createOffscreenClient({
		canvas: options.canvas,
		worker,
		clearColor: options.clearColor,
		dpr: options.dpr,
		scale: options.scale,
		scene: options.scene,
	})
	const sceneMirror = createSceneMirror(options.scene ?? null)
	const devtools = attachWeaveDevtools({
		enabled: devtoolsEnabled,
		id: options.devtools?.id,
		name: options.devtools?.name,
		log: options.devtools?.log,
		canvas: options.canvas,
		getScene: sceneMirror.getScene,
		getNodeById: sceneMirror.getNodeById,
		hitTest: (x: number, y: number) => client.hitTest(x, y),
		getNodeInfo: (id: string) => client.getNodeInfo(id),
	})
	worker.addEventListener('message', (event) => {
		const msg = event.data as { type?: string; message?: string }
		if (msg?.type === 'WEAVE_ERROR') {
			options.onError?.(msg.message ?? 'Unknown worker error')
			devtools.emit({
				type: 'error',
				message: msg.message ?? 'Unknown worker error',
				time: Date.now(),
			})
		}
	})

	const setScene = (scene: SceneNode): void => {
		sceneMirror.setScene(scene)
		devtools.emit({ type: 'setScene', time: Date.now() })
		client.setScene(scene)
	}

	const applyPatches = (patches: readonly ScenePatch[]): void => {
		sceneMirror.applyPatches(patches)
		devtools.emit({
			type: 'applyPatches',
			time: Date.now(),
			count: patches.length,
		})
		client.applyPatches(patches)
	}

	const render = (): void => {
		devtools.emit({ type: 'render', time: Date.now() })
		client.render()
	}

	const resize = (dpr?: number, scale?: number): void => {
		if (dpr != null) currentDpr = dpr
		client.resize(dpr, scale)
		const rect = options.canvas.getBoundingClientRect()
		devtools.emit({
			type: 'resize',
			time: Date.now(),
			width: rect.width,
			height: rect.height,
			dpr: currentDpr,
		})
	}

	let scrollX = 0
	let scrollY = 0
	const wheel = options.wheelScroll

	const onWheel = (event: WheelEvent): void => {
		if (!wheel) return
		event.preventDefault()
		const speed = wheel.speed ?? 1
		const axis = wheel.axis ?? 'both'
		const shiftToHorizontal = wheel.shiftToHorizontal ?? true
		const rawDX = event.deltaX
		const rawDY = event.deltaY
		const dx = shiftToHorizontal && event.shiftKey && axis !== 'y' ? rawDY + rawDX : rawDX
		const dy = shiftToHorizontal && event.shiftKey ? 0 : rawDY

		if (axis === 'x') scrollX += dx * speed
		else if (axis === 'y') scrollY += dy * speed
		else {
			scrollX += dx * speed
			scrollY += dy * speed
		}
		applyPatches([
			{
				op: 'updateScroll',
				id: wheel.targetId,
				scroll: { x: scrollX, y: scrollY },
			},
		])
		render()
	}

	if (wheel) options.canvas.addEventListener('wheel', onWheel, { passive: false })

	return {
		setScene,
		applyPatches,
		getScene: sceneMirror.getScene,
		getNodeById: sceneMirror.getNodeById,
		setClearColor: client.setClearColor,
		resize,
		render,
		dispose: () => {
			devtools.dispose()
			if (wheel) options.canvas.removeEventListener('wheel', onWheel)
			client.dispose()
		},
		hitTest: client.hitTest,
		getNodeInfo: client.getNodeInfo,
	}
}
