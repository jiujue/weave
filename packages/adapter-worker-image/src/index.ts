import type { SceneNode, ScenePatch } from '@jiujue/weave-types'

export type WeaveImageWorkerToWorkerMessage =
	| Readonly<{
			type: 'WEAVE_IMAGE_INIT'
			width: number
			height: number
			dpr: number
			clearColor?: string
			scene?: SceneNode
	  }>
	| Readonly<{ type: 'WEAVE_IMAGE_PATCH'; patches: readonly ScenePatch[] }>
	| Readonly<{ type: 'WEAVE_IMAGE_SET_SCENE'; scene: SceneNode }>
	| Readonly<{
			type: 'WEAVE_IMAGE_RESIZE'
			width: number
			height: number
			dpr: number
	  }>
	| Readonly<{ type: 'WEAVE_IMAGE_RENDER'; requestId: number }>
	| Readonly<{ type: 'WEAVE_IMAGE_DISPOSE' }>

export type WeaveImageWorkerToMainMessage =
	| Readonly<{ type: 'WEAVE_IMAGE_READY' }>
	| Readonly<{ type: 'WEAVE_IMAGE_ERROR'; message: string }>
	| Readonly<{
			type: 'WEAVE_IMAGE_RESULT'
			requestId: number
			width: number
			height: number
			mime: 'image/png'
			data: ArrayBuffer
	  }>

export type WeaveImageClientOptions = Readonly<{
	width: number
	height: number
	dpr?: number
	clearColor?: string
	scene?: SceneNode
	worker?: Worker
	onError?: (message: string) => void
}>

export type WeaveImageResult = Readonly<{
	width: number
	height: number
	mime: 'image/png'
	data: ArrayBuffer
}>

export type WeaveImageClient = Readonly<{
	setScene(scene: SceneNode): void
	applyPatches(patches: readonly ScenePatch[]): void
	resize(size: { width: number; height: number; dpr?: number }): void
	render(): Promise<WeaveImageResult>
	dispose(): void
}>

export function createWeaveImageClient(options: WeaveImageClientOptions): WeaveImageClient {
	// @ts-ignore injected by tsup
	const workerCode = __WEAVE_WORKER_CODE__
	const blob = new Blob([workerCode], { type: 'application/javascript' })
	const worker = options.worker ?? new Worker(URL.createObjectURL(blob), { type: 'module' })

	const dpr = options.dpr ?? (globalThis.devicePixelRatio || 1)
	let requestId = 0
	const pending = new Map<
		number,
		{
			resolve: (r: WeaveImageResult) => void
			reject: (e: Error) => void
		}
	>()

	const onMessage = (event: MessageEvent<WeaveImageWorkerToMainMessage>) => {
		const msg = event.data
		if (msg.type === 'WEAVE_IMAGE_ERROR') {
			options.onError?.(msg.message)
			for (const [, p] of pending) p.reject(new Error(msg.message))
			pending.clear()
			return
		}
		if (msg.type === 'WEAVE_IMAGE_RESULT') {
			const p = pending.get(msg.requestId)
			if (!p) return
			pending.delete(msg.requestId)
			p.resolve({
				width: msg.width,
				height: msg.height,
				mime: msg.mime,
				data: msg.data,
			})
		}
	}
	worker.addEventListener('message', onMessage as any)

	worker.postMessage({
		type: 'WEAVE_IMAGE_INIT',
		width: options.width,
		height: options.height,
		dpr,
		clearColor: options.clearColor,
		scene: options.scene,
	} satisfies WeaveImageWorkerToWorkerMessage)

	return {
		setScene(scene) {
			worker.postMessage({
				type: 'WEAVE_IMAGE_SET_SCENE',
				scene,
			} satisfies WeaveImageWorkerToWorkerMessage)
		},
		applyPatches(patches) {
			worker.postMessage({
				type: 'WEAVE_IMAGE_PATCH',
				patches,
			} satisfies WeaveImageWorkerToWorkerMessage)
		},
		resize(size) {
			worker.postMessage({
				type: 'WEAVE_IMAGE_RESIZE',
				width: size.width,
				height: size.height,
				dpr: size.dpr ?? (globalThis.devicePixelRatio || 1),
			} satisfies WeaveImageWorkerToWorkerMessage)
		},
		render() {
			const id = ++requestId
			const p = new Promise<WeaveImageResult>((resolve, reject) => {
				pending.set(id, { resolve, reject })
			})
			worker.postMessage({
				type: 'WEAVE_IMAGE_RENDER',
				requestId: id,
			} satisfies WeaveImageWorkerToWorkerMessage)
			return p
		},
		dispose() {
			for (const [, p] of pending) p.reject(new Error('disposed'))
			pending.clear()
			worker.removeEventListener('message', onMessage as any)
			worker.postMessage({
				type: 'WEAVE_IMAGE_DISPOSE',
			} satisfies WeaveImageWorkerToWorkerMessage)
			worker.terminate()
		},
	}
}
