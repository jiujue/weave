export const CHANNEL = 'weave-devtools'
export const BRIDGE_SOURCE = 'weave-devtools-bridge'
export const BRIDGE_VERSION = 1 as const

export type BridgeRequest =
	| Readonly<{ method: 'listInstances' }>
	| Readonly<{ method: 'ping' }>
	| Readonly<{ method: 'getScene'; instanceId: string }>
	| Readonly<{ method: 'getNode'; instanceId: string; nodeId: string }>
	| Readonly<{ method: 'getHighlightRect'; instanceId: string; nodeId: string }>
	| Readonly<{ method: 'pickNode'; clientX: number; clientY: number }>
	| Readonly<{ method: 'startInspect' }>
	| Readonly<{ method: 'stopInspect' }>

export type BridgeResponse =
	| Readonly<{ ok: true; result: unknown }>
	| Readonly<{ ok: false; error: string }>

export type BridgeEvent = Readonly<{ type: 'instancesChanged' }>

export type ContentRequestMessage = Readonly<{
	channel: typeof CHANNEL
	kind: 'contentRequest'
	requestId: number
	payload: BridgeRequest
}>

export type PanelRequestMessage = Readonly<{
	channel: typeof CHANNEL
	kind: 'panelRequest'
	tabId: number
	requestId: number
	payload: BridgeRequest
}>

export type ContentEventMessage = Readonly<{
	channel: typeof CHANNEL
	kind: 'contentEvent'
	tabId: number
	event:
		| Readonly<{ type: 'hover'; instanceId: string; nodeId: string | null }>
		| Readonly<{ type: 'select'; instanceId: string; nodeId: string | null }>
		| Readonly<{ type: 'bridgeEvent'; event: BridgeEvent }>
}>
