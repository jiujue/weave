import type { SceneNode, ScenePatch } from '@jiujue/weave-types'

export type WeaveDevtoolsHookVersion = 1

export type WeaveDevtoolsEvent =
	| Readonly<{ type: 'error'; message: string; time: number }>
	| Readonly<{ type: 'setScene'; time: number }>
	| Readonly<{ type: 'applyPatches'; time: number; count: number }>
	| Readonly<{ type: 'render'; time: number }>
	| Readonly<{
			type: 'resize'
			time: number
			width: number
			height: number
			dpr: number
	  }>

export type WeaveDevtoolsInstance = Readonly<{
	id: string
	name?: string
	canvas: HTMLCanvasElement
	getScene?: () => SceneNode | null
	getNodeById?: (id: string) => SceneNode | null
	hitTest: (x: number, y: number) => Promise<{ id: string | null; path: readonly string[] }>
	getNodeInfo: (
		id: string,
	) => Promise<{ x: number; y: number; width: number; height: number } | null>
	subscribe?: (listener: (event: WeaveDevtoolsEvent) => void) => () => void
}>

export type WeaveDevtoolsHook = Readonly<{
	version: WeaveDevtoolsHookVersion
	register: (instance: WeaveDevtoolsInstance) => void
	unregister: (id: string) => void
	list: () => readonly Pick<WeaveDevtoolsInstance, 'id' | 'name'>[]
	get: (id: string) => WeaveDevtoolsInstance | undefined
	subscribe: (listener: () => void) => () => void
}>

const KEY = '__WEAVE_DEVTOOLS_HOOK__'

export function ensureWeaveDevtoolsHook(): WeaveDevtoolsHook {
	const g = globalThis as any
	const existing = g[KEY] as WeaveDevtoolsHook | undefined
	if (existing?.version === 1) return existing

	const instances = new Map<string, WeaveDevtoolsInstance>()
	const listeners = new Set<() => void>()
	const emit = () => {
		for (const l of listeners) l()
	}

	const hook: WeaveDevtoolsHook = {
		version: 1,
		register(instance) {
			instances.set(instance.id, instance)
			emit()
		},
		unregister(id) {
			if (!instances.has(id)) return
			instances.delete(id)
			emit()
		},
		list() {
			return [...instances.values()].map((i) => ({ id: i.id, name: i.name }))
		},
		get(id) {
			return instances.get(id)
		},
		subscribe(listener) {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
	}

	g[KEY] = hook
	return hook
}

export function findNodeById(root: SceneNode, id: string): SceneNode | null {
	if (root.id === id) return root
	const children = (root as any).children as SceneNode[] | undefined
	if (!Array.isArray(children)) return null
	for (const child of children) {
		const found = findNodeById(child, id)
		if (found) return found
	}
	return null
}

function updateNode(
	root: SceneNode,
	id: string,
	updater: (node: SceneNode) => SceneNode,
): SceneNode {
	if (root.id === id) return updater(root)

	const children = (root as any).children as SceneNode[] | undefined
	if (!Array.isArray(children) || children.length === 0) return root

	let changed = false
	const nextChildren = children.map((c) => {
		const next = updateNode(c, id, updater)
		if (next !== c) changed = true
		return next
	})
	if (!changed) return root

	return { ...(root as any), children: nextChildren } as SceneNode
}

function insertNode(root: SceneNode, parentId: string, node: SceneNode, index?: number): SceneNode {
	if (root.id === parentId) {
		const children = (root as any).children as SceneNode[] | undefined
		if (!Array.isArray(children)) return root
		const nextChildren = [...children]
		if (typeof index === 'number' && index >= 0) nextChildren.splice(index, 0, node)
		else nextChildren.push(node)
		return { ...(root as any), children: nextChildren } as SceneNode
	}

	const children = (root as any).children as SceneNode[] | undefined
	if (!Array.isArray(children) || children.length === 0) return root

	let changed = false
	const nextChildren = children.map((c) => {
		const next = insertNode(c, parentId, node, index)
		if (next !== c) changed = true
		return next
	})
	if (!changed) return root
	return { ...(root as any), children: nextChildren } as SceneNode
}

function removeNode(root: SceneNode, id: string): SceneNode {
	if (root.id === id) return root
	const children = (root as any).children as SceneNode[] | undefined
	if (!Array.isArray(children) || children.length === 0) return root

	const directIndex = children.findIndex((c) => c.id === id)
	if (directIndex !== -1) {
		const nextChildren = [...children]
		nextChildren.splice(directIndex, 1)
		return { ...(root as any), children: nextChildren } as SceneNode
	}

	let changed = false
	const nextChildren = children.map((c) => {
		const next = removeNode(c, id)
		if (next !== c) changed = true
		return next
	})
	if (!changed) return root
	return { ...(root as any), children: nextChildren } as SceneNode
}

function applyPatch(root: SceneNode, patch: ScenePatch): SceneNode {
	if (patch.op === 'addNode') return insertNode(root, patch.parentId, patch.node, patch.index)
	if (patch.op === 'removeNode') return removeNode(root, patch.id)
	if (patch.op === 'updateStyle')
		return updateNode(root, patch.id, (node) => ({
			...(node as any),
			style: patch.style,
		}))
	if (patch.op === 'updateScroll')
		return updateNode(root, patch.id, (node) => ({
			...(node as any),
			scroll: patch.scroll,
		}))
	if (patch.op === 'updateText')
		return updateNode(root, patch.id, (node) =>
			node.type === 'text' ? ({ ...(node as any), text: patch.text } as SceneNode) : node,
		)
	if (patch.op === 'updateTextStyle')
		return updateNode(root, patch.id, (node) =>
			node.type === 'text' ? ({ ...(node as any), textStyle: patch.textStyle } as SceneNode) : node,
		)
	if (patch.op === 'replacePoints')
		return updateNode(root, patch.id, (node) =>
			node.type === 'polygon' ? ({ ...(node as any), points: patch.points } as SceneNode) : node,
		)
	if (patch.op === 'updateTableData')
		return updateNode(root, patch.id, (node) =>
			node.type === 'table' ? ({ ...(node as any), rows: patch.rows } as SceneNode) : node,
		)
	if (patch.op === 'updateTableColumns')
		return updateNode(root, patch.id, (node) =>
			node.type === 'table'
				? ({
						...(node as any),
						columns: patch.columns,
						header: patch.header,
					} as SceneNode)
				: node,
		)
	if (patch.op === 'updateTableStyle')
		return updateNode(root, patch.id, (node) =>
			node.type === 'table'
				? ({ ...(node as any), tableStyle: patch.tableStyle } as SceneNode)
				: node,
		)

	return root
}

export function applyScenePatches(root: SceneNode, patches: readonly ScenePatch[]): SceneNode {
	let next = root
	for (const p of patches) next = applyPatch(next, p)
	return next
}

export type SceneMirror = Readonly<{
	getScene(): SceneNode | null
	getNodeById(id: string): SceneNode | null
	setScene(scene: SceneNode): void
	applyPatches(patches: readonly ScenePatch[]): void
}>

export function createSceneMirror(initialScene: SceneNode | null): SceneMirror {
	let scene = initialScene
	return {
		getScene: () => scene,
		getNodeById: (id) => (scene ? findNodeById(scene, id) : null),
		setScene(next) {
			scene = next
		},
		applyPatches(patches) {
			if (!scene) return
			scene = applyScenePatches(scene, patches)
		},
	}
}

export type AttachWeaveDevtoolsOptions = Readonly<{
	enabled?: boolean
	id?: string
	name?: string
	log?: boolean
	canvas: HTMLCanvasElement
	getScene?: () => SceneNode | null
	getNodeById?: (id: string) => SceneNode | null
	hitTest: (x: number, y: number) => Promise<{ id: string | null; path: readonly string[] }>
	getNodeInfo: (
		id: string,
	) => Promise<{ x: number; y: number; width: number; height: number } | null>
}>

export type WeaveDevtoolsController = Readonly<{
	id: string
	emit(event: WeaveDevtoolsEvent): void
	dispose(): void
}>

function createId(): string {
	return `weave-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function attachWeaveDevtools(options: AttachWeaveDevtoolsOptions): WeaveDevtoolsController {
	const enabled = options.enabled ?? false
	const id = options.id ?? createId()
	if (!enabled) {
		return { id, emit: () => {}, dispose: () => {} }
	}

	const listeners = new Set<(event: WeaveDevtoolsEvent) => void>()
	const logEnabled = options.log ?? false
	const log = (...args: unknown[]) => {
		if (!logEnabled) return
		console.log('[weave devtools]', ...args)
	}

	const hook = ensureWeaveDevtoolsHook()
	log('register', { id, name: options.name })
	hook.register({
		id,
		name: options.name,
		canvas: options.canvas,
		getScene: options.getScene,
		getNodeById: options.getNodeById,
		hitTest: options.hitTest,
		getNodeInfo: options.getNodeInfo,
		subscribe(listener) {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
	})

	return {
		id,
		emit(event) {
			log('event', event.type)
			for (const l of listeners) l(event)
		},
		dispose() {
			log('unregister', { id })
			hook.unregister(id)
			listeners.clear()
		},
	}
}
