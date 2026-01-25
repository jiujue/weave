import type { PlasmoCSConfig } from 'plasmo'
import {
	BRIDGE_SOURCE,
	BRIDGE_VERSION,
	type BridgeEvent,
	type BridgeRequest,
	type BridgeResponse,
} from '../protocol'

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	run_at: 'document_start',
	world: 'MAIN',
}

const DEBUG = true

type WeaveHook = {
	version: 1
	list: () => readonly { id: string; name?: string }[]
	get: (id: string) =>
		| undefined
		| {
				id: string
				name?: string
				canvas: HTMLCanvasElement
				getScene?: () => any
				getNodeById?: (id: string) => any
				hitTest: (x: number, y: number) => Promise<{ id: string | null; path: readonly string[] }>
				getNodeInfo: (id: string) => Promise<{
					x: number
					y: number
					width: number
					height: number
				} | null>
		  }
	subscribe: (listener: () => void) => () => void
}

let hookUnsub: (() => void) | null = null

const postEvent = (event: BridgeEvent) => {
	window.postMessage(
		{
			source: BRIDGE_SOURCE,
			version: BRIDGE_VERSION,
			kind: 'event',
			event,
		},
		'*',
	)
}

const ensureHookSubscription = () => {
	if (hookUnsub) return
	const hook = (window as any).__WEAVE_DEVTOOLS_HOOK__ as WeaveHook | undefined
	if (!hook || hook.version !== 1) return
	hookUnsub = hook.subscribe(() => {
		if (DEBUG) console.log('[weave devtools][bridge] instancesChanged')
		postEvent({ type: 'instancesChanged' })
	})
}

const handleRequest = async (payload: BridgeRequest): Promise<BridgeResponse> => {
	const hook = (window as any).__WEAVE_DEVTOOLS_HOOK__ as WeaveHook | undefined
	if (!hook || hook.version !== 1) return { ok: false, error: 'WEAVE_DEVTOOLS_HOOK_NOT_FOUND' }

	ensureHookSubscription()
	if (DEBUG) console.log('[weave devtools][bridge] request', payload.method)

	if (payload.method === 'listInstances') {
		return { ok: true, result: hook.list() }
	}

	const inst = hook.get(payload.instanceId)
	if (!inst) return { ok: false, error: 'INSTANCE_NOT_FOUND' }

	if (payload.method === 'getScene') return { ok: true, result: inst.getScene?.() ?? null }
	if (payload.method === 'getNode')
		return { ok: true, result: inst.getNodeById?.(payload.nodeId) ?? null }

	if (payload.method === 'getHighlightRect') {
		const info = await inst.getNodeInfo(payload.nodeId)
		if (!info) return { ok: true, result: null }
		const rect = inst.canvas.getBoundingClientRect()
		return {
			ok: true,
			result: {
				left: rect.left + info.x,
				top: rect.top + info.y,
				width: info.width,
				height: info.height,
			},
		}
	}

	if (payload.method === 'pickNode') {
		const instances = hook.list()
		for (const i of instances) {
			const ins = hook.get(i.id)
			if (!ins) continue
			const rect = ins.canvas.getBoundingClientRect()
			if (
				payload.clientX >= rect.left &&
				payload.clientX <= rect.right &&
				payload.clientY >= rect.top &&
				payload.clientY <= rect.bottom
			) {
				const x = payload.clientX - rect.left
				const y = payload.clientY - rect.top
				const hit = await ins.hitTest(x, y)
				if (!hit.id)
					return {
						ok: true,
						result: { instanceId: i.id, nodeId: null, path: [] },
					}
				const info = await ins.getNodeInfo(hit.id)
				const highlight = info
					? {
							left: rect.left + info.x,
							top: rect.top + info.y,
							width: info.width,
							height: info.height,
						}
					: null
				return {
					ok: true,
					result: {
						instanceId: i.id,
						nodeId: hit.id,
						path: hit.path,
						highlight,
					},
				}
			}
		}
		return { ok: true, result: null }
	}

	return { ok: false, error: 'UNKNOWN_METHOD' }
}

window.addEventListener('message', (event) => {
	if (event.source !== window) return
	const data = event.data as any
	if (!data || data.source !== BRIDGE_SOURCE || data.version !== BRIDGE_VERSION) return
	if (data.kind !== 'request') return

	const requestId = data.requestId as number
	const payload = data.payload as BridgeRequest

	Promise.resolve()
		.then(() => handleRequest(payload))
		.then((res) => {
			window.postMessage(
				{
					source: BRIDGE_SOURCE,
					version: BRIDGE_VERSION,
					kind: 'response',
					requestId,
					...res,
				},
				'*',
			)
		})
})
