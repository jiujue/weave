import React, { useEffect, useMemo, useState } from 'react'
import { CHANNEL, type BridgeRequest, type ContentEventMessage } from '../../protocol'

type SceneNode = any

const DEBUG = true

const getInspectedTabId = (): number => {
	const tabId = (globalThis as any).chrome?.devtools?.inspectedWindow?.tabId
	if (typeof tabId !== 'number') throw new Error('DEVTOOLS_TAB_ID_UNAVAILABLE')
	return tabId
}

const evalInInspectedWindow = async <T,>(expression: string): Promise<T> => {
	return new Promise((resolve, reject) => {
		chrome.devtools.inspectedWindow.eval(expression, (result: unknown, exceptionInfo: any) => {
			if (exceptionInfo?.isException) {
				reject(
					new Error(
						exceptionInfo?.value?.message ?? exceptionInfo?.value ?? 'INSPECTED_EVAL_EXCEPTION',
					),
				)
				return
			}
			resolve(result as T)
		})
	})
}

async function sendToBackground<T>(payload: BridgeRequest): Promise<T> {
	const tabId = getInspectedTabId()
	const requestId = Math.floor(Math.random() * 1e9)
	if (DEBUG) console.log('[weave devtools][panel] request', requestId, payload.method)
	const res = (await chrome.runtime.sendMessage({
		channel: CHANNEL,
		kind: 'panelRequest',
		tabId,
		requestId,
		payload,
	})) as any
	if (DEBUG) console.log('[weave devtools][panel] response', requestId, res?.ok)
	if (!res?.ok) throw new Error(res?.error ?? 'UNKNOWN_ERROR')
	return res.result as T
}

const TreeNode = (props: {
	node: SceneNode
	depth: number
	selectedId: string | null
	onSelect: (id: string) => void
	expanded: Readonly<Record<string, boolean>>
	onToggle: (id: string) => void
}) => {
	const node = props.node
	const id = String(node?.id ?? '')
	const type = String(node?.type ?? '')
	const displayName =
		typeof node?.name === 'string'
			? node.name
			: typeof node?.label === 'string'
				? node.label
				: undefined
	const children = Array.isArray(node?.children) ? (node.children as SceneNode[]) : []
	const isExpanded = props.expanded[id] ?? true
	const isSelected = props.selectedId === id

	return (
		<div>
			<div
				style={{
					paddingLeft: props.depth * 12,
					fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
					fontSize: 12,
					lineHeight: '20px',
					cursor: 'pointer',
					background: isSelected ? 'rgba(59,130,246,0.12)' : undefined,
					borderLeft: isSelected ? '2px solid rgb(59 130 246)' : '2px solid transparent',
				}}
				onClick={() => props.onSelect(id)}
			>
				{children.length > 0 && (
					<span
						style={{ display: 'inline-block', width: 16, userSelect: 'none' }}
						onClick={(e) => {
							e.stopPropagation()
							props.onToggle(id)
						}}
					>
						{isExpanded ? '▾' : '▸'}
					</span>
				)}
				{children.length === 0 && <span style={{ display: 'inline-block', width: 16 }} />}
				<span style={{ opacity: 0.7 }}>{type}</span>
				<span style={{ marginLeft: 6 }}>{displayName ? `${displayName} (${id})` : id}</span>
			</div>
			{children.length > 0 &&
				isExpanded &&
				children.map((c) => (
					<TreeNode
						key={String(c?.id ?? Math.random())}
						node={c}
						depth={props.depth + 1}
						selectedId={props.selectedId}
						onSelect={props.onSelect}
						expanded={props.expanded}
						onToggle={props.onToggle}
					/>
				))}
		</div>
	)
}

export default function WeavePanel() {
	const [instances, setInstances] = useState<{ id: string; name?: string }[]>([])
	const [instancesSource, setInstancesSource] = useState<'bridge' | 'eval' | null>(null)
	const [instanceId, setInstanceId] = useState<string | null>(null)
	const [scene, setScene] = useState<SceneNode | null>(null)
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [selectedNode, setSelectedNode] = useState<unknown>(null)
	const [expanded, setExpanded] = useState<Record<string, boolean>>({})
	const [inspectOn, setInspectOn] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [pingBg, setPingBg] = useState<string | null>(null)
	const [pingTab, setPingTab] = useState<string | null>(null)

	const title = useMemo(() => {
		const inst = instances.find((i) => i.id === instanceId)
		return inst?.name ? `${inst.name} (${inst.id})` : instanceId
	}, [instances, instanceId])

	const refreshInstances = async () => {
		try {
			setError(null)
			const list = await sendToBackground<{ id: string; name?: string }[]>({
				method: 'listInstances',
			})
			setInstances(list)
			setInstancesSource('bridge')
			if (!instanceId && list.length > 0) setInstanceId(list[0].id)
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e))
		}
	}

	const refreshInstancesViaEval = async () => {
		try {
			setError(null)
			const list = await evalInInspectedWindow<{ id: string; name?: string }[]>(
				`(() => {
  const hook = window.__WEAVE_DEVTOOLS_HOOK__
  if (!hook || hook.version !== 1) return []
  return hook.list()
})()`,
			)
			setInstances(list)
			setInstancesSource('eval')
			if (!instanceId && list.length > 0) setInstanceId(list[0].id)
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e))
		}
	}

	const refreshScene = async (id: string) => {
		const s = await sendToBackground<SceneNode | null>({
			method: 'getScene',
			instanceId: id,
		})
		setScene(s)
	}

	const refreshSceneViaEval = async (id: string) => {
		try {
			setError(null)
			const s = await evalInInspectedWindow<SceneNode | null>(
				`(() => {
  const hook = window.__WEAVE_DEVTOOLS_HOOK__
  if (!hook || hook.version !== 1) return null
  const inst = hook.get(${JSON.stringify(id)})
  if (!inst) return null
  return inst.getScene ? inst.getScene() : null
})()`,
			)
			setScene(s)
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e))
		}
	}

	const refreshNode = async (id: string, nodeId: string) => {
		const n = await sendToBackground<unknown>({
			method: 'getNode',
			instanceId: id,
			nodeId,
		})
		setSelectedNode(n)
	}

	const refreshNodeViaEval = async (id: string, nodeId: string) => {
		try {
			setError(null)
			const n = await evalInInspectedWindow<unknown>(
				`(() => {
  const hook = window.__WEAVE_DEVTOOLS_HOOK__
  if (!hook || hook.version !== 1) return null
  const inst = hook.get(${JSON.stringify(id)})
  if (!inst) return null
  return inst.getNodeById ? inst.getNodeById(${JSON.stringify(nodeId)}) : null
})()`,
			)
			setSelectedNode(n)
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e))
		}
	}

	const highlightNode = async (id: string, nodeId: string) => {
		await sendToBackground({
			method: 'getHighlightRect',
			instanceId: id,
			nodeId,
		})
	}

	useEffect(() => {
		void refreshInstances()
	}, [])

	useEffect(() => {
		if (!instanceId) return
		void refreshScene(instanceId)
	}, [instanceId])

	useEffect(() => {
		if (!instanceId || !selectedId) return
		void refreshNode(instanceId, selectedId)
		void highlightNode(instanceId, selectedId)
	}, [instanceId, selectedId])

	useEffect(() => {
		const onMessage = (message: unknown) => {
			const msg = message as any
			if (!msg || msg.channel !== CHANNEL || msg.kind !== 'contentEvent') return
			const ev = msg as ContentEventMessage
			const tabId = getInspectedTabId()
			if (ev.tabId !== tabId) return
			if (DEBUG) console.log('[weave devtools][panel] contentEvent', ev.event?.type)

			if (ev.event.type === 'bridgeEvent' && ev.event.event.type === 'instancesChanged') {
				void refreshInstances()
				return
			}

			if (ev.event.type === 'select') {
				if (ev.event.instanceId && ev.event.instanceId !== instanceId)
					setInstanceId(ev.event.instanceId)
				setSelectedId(ev.event.nodeId)
			}
		}
		chrome.runtime.onMessage.addListener(onMessage)
		return () => chrome.runtime.onMessage.removeListener(onMessage)
	}, [instanceId, instances])

	const toggleInspect = async () => {
		try {
			setError(null)
			const tabId = getInspectedTabId()
			const requestId = Math.floor(Math.random() * 1e9)
			await chrome.runtime.sendMessage({
				channel: CHANNEL,
				kind: 'panelRequest',
				tabId,
				requestId,
				payload: { method: inspectOn ? 'stopInspect' : 'startInspect' },
			})
			setInspectOn(!inspectOn)
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e))
		}
	}

	return (
		<div
			style={{
				fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
			}}
		>
			{error && (
				<div
					style={{
						padding: 8,
						background: '#FEF2F2',
						borderBottom: '1px solid #FCA5A5',
					}}
				>
					<div style={{ fontSize: 12, color: '#991B1B' }}>{error}</div>
				</div>
			)}
			<div
				style={{
					display: 'flex',
					gap: 8,
					alignItems: 'center',
					padding: 8,
					borderBottom: '1px solid #e5e7eb',
					flexWrap: 'wrap',
				}}
			>
				<button
					style={{ padding: '4px 8px' }}
					onClick={() => {
						void refreshInstancesViaEval()
					}}
				>
					Load Instances (Eval)
				</button>
				<button
					style={{ padding: '4px 8px' }}
					onClick={() => {
						void (async () => {
							try {
								setError(null)
								const res = (await chrome.runtime.sendMessage({
									channel: CHANNEL,
									kind: 'ping',
								})) as any
								setPingBg(JSON.stringify(res?.result ?? res, null, 2))
							} catch (e) {
								setError(e instanceof Error ? e.message : String(e))
							}
						})()
					}}
				>
					Ping Background
				</button>
				<button
					style={{ padding: '4px 8px' }}
					onClick={() => {
						void (async () => {
							try {
								setError(null)
								const res = await sendToBackground<any>({ method: 'ping' })
								setPingTab(JSON.stringify(res, null, 2))
							} catch (e) {
								setError(e instanceof Error ? e.message : String(e))
							}
						})()
					}}
				>
					Ping Tab Content
				</button>
				<select
					style={{ flex: 1, padding: '4px 8px' }}
					value={instanceId ?? ''}
					onChange={(e) => setInstanceId(e.target.value)}
				>
					<option value="" disabled>
						No instance
					</option>
					{instances.map((i) => (
						<option key={i.id} value={i.id}>
							{i.name ? `${i.name} (${i.id})` : i.id}
						</option>
					))}
				</select>
				<button style={{ padding: '4px 8px' }} onClick={toggleInspect}>
					{inspectOn ? 'Stop Inspect' : 'Inspect'}
				</button>
				<button
					style={{ padding: '4px 8px' }}
					onClick={() => {
						if (instanceId) void refreshScene(instanceId)
					}}
				>
					Refresh
				</button>
				<button
					style={{ padding: '4px 8px' }}
					onClick={() => {
						if (instanceId) void refreshSceneViaEval(instanceId)
					}}
				>
					Refresh (Eval)
				</button>
			</div>

			{(pingBg || pingTab) && (
				<div style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>
					<div style={{ fontSize: 12, color: '#6b7280' }}>Ping</div>
					<pre
						style={{
							margin: 0,
							padding: 8,
							fontSize: 11,
							lineHeight: '16px',
							whiteSpace: 'pre-wrap',
							fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
							background: '#F9FAFB',
							border: '1px solid #E5E7EB',
						}}
					>
						{pingBg ? `background: ${pingBg}\n` : ''}
						{pingTab ? `tab: ${pingTab}\n` : ''}
					</pre>
				</div>
			)}

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: '1fr 1fr',
					height: pingBg || pingTab ? 'calc(100vh - 112px)' : 'calc(100vh - 42px)',
				}}
			>
				<div style={{ overflow: 'auto', borderRight: '1px solid #e5e7eb' }}>
					<div style={{ padding: 8, fontSize: 12, color: '#6b7280' }}>
						{title}
						{instancesSource ? ` · instances: ${instances.length} · ${instancesSource}` : ''}
					</div>
					{scene ? (
						<TreeNode
							node={scene}
							depth={0}
							selectedId={selectedId}
							onSelect={(id) => setSelectedId(id)}
							expanded={expanded}
							onToggle={(id) =>
								setExpanded((m) => ({
									...m,
									[id]: !(m[id] ?? true),
								}))
							}
						/>
					) : (
						<div style={{ padding: 8, fontSize: 12, color: '#6b7280' }}>
							No scene. Enable devtools and ensure setScene is called.
						</div>
					)}
				</div>
				<div style={{ overflow: 'auto' }}>
					<div style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>
						<div style={{ fontSize: 12, color: '#6b7280' }}>Selected</div>
						<div style={{ fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>
							{selectedId ?? '-'}
						</div>
					</div>
					<pre
						style={{
							margin: 0,
							padding: 8,
							fontSize: 11,
							lineHeight: '16px',
							fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
						}}
					>
						{selectedNode ? JSON.stringify(selectedNode, null, 2) : 'Select a node'}
					</pre>
				</div>
			</div>
		</div>
	)
}
