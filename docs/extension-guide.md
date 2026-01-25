# Extension Guide

How to add new components to the Weave Editor.

## 1. Register a Component

Use `registry.register` to add a new component definition.

```typescript
import { registry } from '@jiujue/weave-editor-core'

registry.register({
	type: 'my-component',
	label: 'My Component',
	props: [
		{ name: 'id', label: 'ID', type: 'string' },
		{ name: 'customProp', label: 'Custom Prop', type: 'string' },
	],
	create: () => ({
		type: 'my-component',
		customProp: 'default value',
	}),
})
```

## 2. Property Types

Supported property types for the Inspector:

- `string`: Text input
- `number`: Number input
- `boolean`: Checkbox (TODO)
- `color`: Color picker
- `enum`: Dropdown select

## 3. Code Generation

The `sceneToJSX` generator uses the `type` field as the tag name by default.
You can customize the tag name or behavior in future versions.
