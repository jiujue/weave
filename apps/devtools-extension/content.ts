import type { PlasmoCSConfig } from 'plasmo'
import {
	BRIDGE_SOURCE,
	BRIDGE_VERSION,
	CHANNEL,
	type BridgeEvent,
	type BridgeRequest,
	type ContentRequestMessage,
} from './protocol'

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	run_at: 'document_start',
}

let reqId = 0
const pending = new Map<number, (res: any) => void>()
const DEBUG = true

const safeRuntimeSendMessage = (message: any) => {
	try {
		if (!chrome?.runtime?.id) return
		chrome.runtime.sendMessage(message)
	} catch {}
}

window.addEventListener('message', (event) => {
	if (event.source !== window) return
	const data = event.data as any
	if (!data || data.source !== BRIDGE_SOURCE || data.version !== BRIDGE_VERSION)
		return

	if (data.kind === 'response') {
		if (DEBUG)
			console.log('[weave devtools][content] bridge response', data.requestId)
		const resolve = pending.get(data.requestId)
		if (!resolve) return
		pending.delete(data.requestId)
		resolve(data)
		return
	}

	if (data.kind === 'event') {
		if (DEBUG)
			console.log('[weave devtools][content] bridge event', data.event?.type)
		const ev = data.event as BridgeEvent
		safeRuntimeSendMessage({
			channel: CHANNEL,
			kind: 'contentEvent',
			event: { type: 'bridgeEvent', event: ev },
		})
	}
})

const requestMainWorld = (payload: BridgeRequest): Promise<any> => {
	return new Promise((resolve) => {
		const requestId = ++reqId
		if (DEBUG)
			console.log(
				'[weave devtools][content] bridge request',
				requestId,
				payload.method
			)
		pending.set(requestId, resolve)
		window.postMessage(
			{
				source: BRIDGE_SOURCE,
				version: BRIDGE_VERSION,
				kind: 'request',
				requestId,
				payload,
			},
			'*'
		)
	})
}

let overlayEl: HTMLDivElement | null = null

const ensureOverlay = (): HTMLDivElement => {
	if (overlayEl) return overlayEl
	const el = document.createElement('div')
	el.style.position = 'fixed'
	el.style.left = '0px'
	el.style.top = '0px'
	el.style.width = '0px'
	el.style.height = '0px'
	el.style.pointerEvents = 'none'
	el.style.zIndex = '2147483647'
	el.style.border = '2px solid rgb(59 130 246)'
	el.style.background = 'rgba(59,130,246,0.08)'
	el.style.display = 'none'
	document.documentElement.appendChild(el)
	overlayEl = el
	return el
}

const setOverlayRect = (rect: any | null) => {
	const el = ensureOverlay()
	if (!rect) {
		el.style.display = 'none'
		return
	}
	el.style.display = 'block'
	el.style.left = `${rect.left}px`
	el.style.top = `${rect.top}px`
	el.style.width = `${rect.width}px`
	el.style.height = `${rect.height}px`
}

let inspectEnabled = false
let rafPending = false
let lastPoint: { x: number; y: number } | null = null
let lastHover: { instanceId: string; nodeId: string | null } | null = null

const handleInspectMove = (e: MouseEvent) => {
	if (!inspectEnabled) return
	lastPoint = { x: e.clientX, y: e.clientY }
	if (rafPending) return
	rafPending = true
	requestAnimationFrame(async () => {
		rafPending = false
		if (!lastPoint) return
		const pickRes = await requestMainWorld({
			method: 'pickNode',
			clientX: lastPoint.x,
			clientY: lastPoint.y,
		})
		if (!pickRes?.ok) return
		const pick = pickRes.result as any
		if (!pick || !pick.instanceId) {
			if (lastHover) {
				lastHover = null
				setOverlayRect(null)
				safeRuntimeSendMessage({
					channel: CHANNEL,
					kind: 'contentEvent',
					event: { type: 'hover', instanceId: '', nodeId: null },
				})
			}
			return
		}

		const nextHover = {
			instanceId: pick.instanceId as string,
			nodeId: pick.nodeId as string | null,
		}
		if (
			lastHover &&
			lastHover.instanceId === nextHover.instanceId &&
			lastHover.nodeId === nextHover.nodeId
		)
			return
		lastHover = nextHover
		setOverlayRect(pick.highlight ?? null)
		safeRuntimeSendMessage({
			channel: CHANNEL,
			kind: 'contentEvent',
			event: {
				type: 'hover',
				instanceId: nextHover.instanceId,
				nodeId: nextHover.nodeId,
			},
		})
	})
}

const handleInspectClick = (e: MouseEvent) => {
	if (!inspectEnabled) return
	e.preventDefault()
	e.stopPropagation()
	void (async () => {
		const pickRes = await requestMainWorld({
			method: 'pickNode',
			clientX: e.clientX,
			clientY: e.clientY,
		})
		if (pickRes?.ok) {
			const pick = pickRes.result as any
			if (DEBUG)
				console.log(
					'[weave devtools][content] select',
					pick?.instanceId,
					pick?.nodeId
				)
			setOverlayRect(pick?.highlight ?? null)
			safeRuntimeSendMessage({
				channel: CHANNEL,
				kind: 'contentEvent',
				event: {
					type: 'select',
					instanceId: pick?.instanceId ?? '',
					nodeId: pick?.nodeId ?? null,
				},
			})
		}
		inspectEnabled = false
		window.removeEventListener('mousemove', handleInspectMove, true)
		window.removeEventListener('click', handleInspectClick, true)
	})()
}

try {
	chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
		const msg = message as any
		if (!msg || msg.channel !== CHANNEL || msg.kind !== 'contentRequest') return
		const req = msg as ContentRequestMessage
		void (async () => {
			if (DEBUG)
				console.log(
					'[weave devtools][content] contentRequest',
					req.requestId,
					req.payload.method
				)
			if (req.payload.method === 'pickNode') {
				sendResponse({ ok: false, error: 'UNSUPPORTED_FROM_PANEL' })
				return
			}
			if (req.payload.method === 'ping') {
				sendResponse({
					ok: true,
					result: { time: Date.now(), href: location.href },
				})
				return
			}
			if (req.payload.method === 'startInspect') {
				if (inspectEnabled) {
					sendResponse({ ok: true, result: null })
					return
				}
				inspectEnabled = true
				window.addEventListener('mousemove', handleInspectMove, true)
				window.addEventListener('click', handleInspectClick, true)
				sendResponse({ ok: true, result: null })
				return
			}
			if (req.payload.method === 'stopInspect') {
				inspectEnabled = false
				window.removeEventListener('mousemove', handleInspectMove, true)
				window.removeEventListener('click', handleInspectClick, true)
				sendResponse({ ok: true, result: null })
				return
			}

			const res = await requestMainWorld(req.payload)
			if (req.payload.method === 'getHighlightRect' && res?.ok) {
				setOverlayRect(res.result ?? null)
			}
			sendResponse(res)
		})()
		return true
	})
} catch {}
