import type { SceneNode } from '@jiujue/weave-types'

export type PropType =
	| 'string'
	| 'number'
	| 'boolean'
	| 'color'
	| 'enum'
	| 'json'

export type PropSchema = {
	name: string
	label: string
	type: PropType
	options?: string[] // for enum
	defaultValue?: any
}

export type ComponentDefinition = {
	type: string
	icon?: string // icon name or svg content
	label: string
	props: PropSchema[]
	// Function to create a default node instance
	create: () => Partial<SceneNode>
}

export class Registry {
	private components = new Map<string, ComponentDefinition>()

	register(def: ComponentDefinition) {
		this.components.set(def.type, def)
	}

	get(type: string) {
		return this.components.get(type)
	}

	getAll() {
		return Array.from(this.components.values())
	}
}

export const registry = new Registry()
