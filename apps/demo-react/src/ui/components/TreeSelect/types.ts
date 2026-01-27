import type React from 'react'

export type TreeSelectKey = string

export type TreeSelectNode = {
	title: React.ReactNode
	value: string
	key?: TreeSelectKey
	children?: readonly TreeSelectNode[]
	disabled?: boolean
	selectable?: boolean
}

export type TreeSelectChangeExtra = {
	triggerNode?: TreeSelectNode
}

export type TreeSelectProps = {
	value?: string
	defaultValue?: string
	onChange?: (value: string, label: React.ReactNode, extra: TreeSelectChangeExtra) => void

	treeData?: readonly TreeSelectNode[]

	placeholder?: string
	disabled?: boolean
	allowClear?: boolean
	showSearch?: boolean

	treeDefaultExpandAll?: boolean
	treeExpandedKeys?: readonly TreeSelectKey[]
	defaultExpandedKeys?: readonly TreeSelectKey[]
	onTreeExpand?: (expandedKeys: readonly TreeSelectKey[]) => void

	style?: React.CSSProperties
	className?: string
	dropdownStyle?: React.CSSProperties
	dropdownClassName?: string
	popupMatchSelectWidth?: boolean

	treeDepth?: number
	treeTotal?: number
	dropdownHeight?: number
	themeColor?: string
}

export type FlatTreeItem = {
	key: TreeSelectKey
	value: string
	title: React.ReactNode
	level: number
	hasChildren: boolean
	disabled: boolean
	selectable: boolean
}
