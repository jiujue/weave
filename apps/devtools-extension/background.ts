import {
	CHANNEL,
	type ContentEventMessage,
	type PanelRequestMessage,
} from './protocol'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	const msg = message as any
	if (!msg || msg.channel !== CHANNEL) return

	if (msg.kind === 'ping') {
		sendResponse({
			ok: true,
			result: {
				runtimeId: chrome.runtime.id,
				time: Date.now(),
			},
		})
		return
	}

	if (msg.kind === 'panelRequest') {
		const req = msg as PanelRequestMessage
		chrome.tabs.sendMessage(
			req.tabId,
			{
				channel: CHANNEL,
				kind: 'contentRequest',
				requestId: req.requestId,
				payload: req.payload,
			},
			(res) => {
				const err = chrome.runtime.lastError
				if (err) {
					sendResponse({ ok: false, error: err.message })
					return
				}
				sendResponse(res)
			}
		)
		return true
	}

	if (msg.kind === 'contentEvent') {
		const tabId = sender.tab?.id
		if (typeof tabId !== 'number') return
		const event = msg.event
		const out: ContentEventMessage = {
			channel: CHANNEL,
			kind: 'contentEvent',
			tabId,
			event,
		}
		chrome.runtime.sendMessage(out)
	}
})
