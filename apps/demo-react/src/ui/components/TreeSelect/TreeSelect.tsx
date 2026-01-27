import { useEffect, useMemo, useRef, useState } from 'react'
import type { FlatTreeItem, TreeSelectKey, TreeSelectNode, TreeSelectProps } from './types'
import {
	collectDefaultExpandedKeys,
	filterTreeData,
	findNodeByValue,
	flattenVisibleTree,
	generateTreeData,
	nodeTitleText,
} from './treeUtils'
import { buildDropdownScene, dropdownRowHeight } from './DropdownScene'
import { WeaveDropdown } from './WeaveDropdown'

function useControllableValue<T>(params: {
	value: T | undefined
	defaultValue: T
	onChange?: (next: T) => void
}): [T, (next: T) => void] {
	const { value, defaultValue, onChange } = params
	const [inner, setInner] = useState<T>(defaultValue)
	const merged = value !== undefined ? value : inner
	const set = (next: T) => {
		if (value === undefined) setInner(next)
		onChange?.(next)
	}
	return [merged, set]
}

function extractKeyFromHit(path: readonly string[] | null | undefined): TreeSelectKey | null {
	if (!path?.length) return null
	for (const id of path) {
		if (id.startsWith('row-')) return id.slice('row-'.length)
		if (id.startsWith('toggle-')) return id.slice('toggle-'.length)
		if (id.startsWith('toggleIcon-')) return id.slice('toggleIcon-'.length)
	}
	return null
}

function isToggleHit(path: readonly string[] | null | undefined): boolean {
	if (!path?.length) return false
	return path.some((id) => id.startsWith('toggle-') || id.startsWith('toggleIcon-'))
}

export function TreeSelect(props: TreeSelectProps) {
	const {
		treeData: treeDataProp,
		value,
		defaultValue,
		onChange,
		placeholder,
		disabled,
		allowClear,
		showSearch,
		treeDefaultExpandAll,
		treeExpandedKeys,
		defaultExpandedKeys,
		onTreeExpand,
		style,
		className,
		dropdownStyle,
		dropdownClassName,
		popupMatchSelectWidth = true,
		treeDepth = 3,
		treeTotal = 120,
		dropdownHeight = 320,
		themeColor = '#60a5fa',
	} = props

	const generatedTreeData = useMemo(() => {
		return generateTreeData({ depth: treeDepth, total: treeTotal })
	}, [treeDepth, treeTotal])

	const mergedTreeData = (
		treeDataProp?.length ? treeDataProp : generatedTreeData
	) as readonly TreeSelectNode[]

	const [selectedValue, setSelectedValue] = useControllableValue<string>({
		value,
		defaultValue: defaultValue ?? '',
		onChange: (next) => {
			const node = next ? findNodeByValue(mergedTreeData, next) : null
			onChange?.(next, node?.title ?? '', { triggerNode: node ?? undefined })
		},
	})

	const initialExpanded = useMemo(() => {
		if (defaultExpandedKeys?.length) return [...defaultExpandedKeys]
		if (treeDefaultExpandAll) return [...collectDefaultExpandedKeys(mergedTreeData)]
		return []
	}, [defaultExpandedKeys, mergedTreeData, treeDefaultExpandAll])

	const expandedControlled = treeExpandedKeys !== undefined
	const [expandedInner, setExpandedInner] = useState<readonly TreeSelectKey[]>(initialExpanded)
	const expandedKeysArr = expandedControlled ? treeExpandedKeys! : expandedInner
	const expandedKeysSet = useMemo(() => new Set(expandedKeysArr), [expandedKeysArr])

	const setExpandedKeys = (next: readonly TreeSelectKey[]) => {
		if (!expandedControlled) setExpandedInner(next)
		onTreeExpand?.(next)
	}

	const containerRef = useRef<HTMLDivElement | null>(null)
	const inputRef = useRef<HTMLInputElement | null>(null)
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState('')
	const [hoveredKey, setHoveredKey] = useState<TreeSelectKey | null>(null)

	const filteredTreeData = useMemo(() => {
		return showSearch ? filterTreeData({ treeData: mergedTreeData, query: search }) : mergedTreeData
	}, [mergedTreeData, search, showSearch])

	const visibleItems = useMemo<readonly FlatTreeItem[]>(() => {
		return flattenVisibleTree({ treeData: filteredTreeData, expandedKeys: expandedKeysSet })
	}, [expandedKeysSet, filteredTreeData])

	const selectedNode = useMemo(() => {
		return selectedValue ? findNodeByValue(mergedTreeData, selectedValue) : null
	}, [mergedTreeData, selectedValue])

	const inputText = useMemo(() => {
		if (showSearch) return search
		if (!selectedNode) return ''
		return nodeTitleText(selectedNode.title)
	}, [search, selectedNode, showSearch])

	useEffect(() => {
		if (!showSearch) return
		if (!selectedNode) {
			setSearch('')
			return
		}
		setSearch(nodeTitleText(selectedNode.title))
	}, [selectedNode, showSearch])

	const [popupRect, setPopupRect] = useState<{ left: number; top: number; width: number }>({
		left: 0,
		top: 0,
		width: 240,
	})

	const refreshPopupRect = () => {
		const el = containerRef.current
		if (!el) return
		const rect = el.getBoundingClientRect()
		setPopupRect({
			left: rect.left + window.scrollX,
			top: rect.bottom + window.scrollY,
			width: rect.width,
		})
	}

	useEffect(() => {
		if (!open) return
		refreshPopupRect()
		const onScroll = () => refreshPopupRect()
		const onResize = () => refreshPopupRect()
		window.addEventListener('scroll', onScroll, true)
		window.addEventListener('resize', onResize)
		return () => {
			window.removeEventListener('scroll', onScroll, true)
			window.removeEventListener('resize', onResize)
		}
	}, [open])

	useEffect(() => {
		if (!open) return
		const onDown = (e: MouseEvent) => {
			const el = containerRef.current
			if (!el) return
			if (e.target instanceof Node && el.contains(e.target)) return
			setOpen(false)
			setHoveredKey(null)
		}
		document.addEventListener('mousedown', onDown, true)
		return () => document.removeEventListener('mousedown', onDown, true)
	}, [open])

	const [scrollY, setScrollY] = useState(0)
	useEffect(() => {
		if (!open) return
		setScrollY(0)
	}, [open, visibleItems.length])

	const dropdownWidth = popupMatchSelectWidth ? popupRect.width : 360

	const contentHeight = visibleItems.length * dropdownRowHeight
	const maxScroll = Math.max(0, contentHeight - dropdownHeight)
	const clampedScrollY = Math.min(maxScroll, Math.max(0, scrollY))

	useEffect(() => {
		if (scrollY !== clampedScrollY) setScrollY(clampedScrollY)
	}, [clampedScrollY, scrollY])

	const scene = useMemo(() => {
		return buildDropdownScene({
			width: dropdownWidth,
			height: dropdownHeight,
			scrollY: clampedScrollY,
			items: visibleItems,
			expandedKeys: expandedKeysSet,
			selectedValue: selectedValue || null,
			hoveredKey,
			themeColor,
		})
	}, [
		clampedScrollY,
		dropdownHeight,
		dropdownWidth,
		expandedKeysSet,
		hoveredKey,
		selectedValue,
		themeColor,
		visibleItems,
	])

	const onToggle = (key: TreeSelectKey) => {
		const next = new Set(expandedKeysSet)
		if (next.has(key)) next.delete(key)
		else next.add(key)
		setExpandedKeys(Array.from(next))
	}

	const onSelect = (item: FlatTreeItem) => {
		if (item.disabled || !item.selectable) return
		setSelectedValue(item.value)
		setOpen(false)
		setHoveredKey(null)
	}

	const setOpenSafe = (next: boolean) => {
		if (disabled) return
		setOpen(next)
		if (!next) setHoveredKey(null)
	}

	return (
		<div ref={containerRef} className={className} style={{ position: 'relative', ...style }}>
			<div style={{ position: 'relative' }}>
				<input
					ref={inputRef}
					disabled={disabled}
					placeholder={placeholder}
					value={inputText}
					readOnly={!showSearch}
					onChange={(e) => {
						if (!showSearch) return
						setSearch(e.target.value)
						setOpenSafe(true)
					}}
					onFocus={() => setOpenSafe(true)}
					onMouseDown={() => setOpenSafe(true)}
					style={{
						width: '100%',
						boxSizing: 'border-box',
						padding: '10px 34px 10px 12px',
						borderRadius: 10,
						border: '1px solid #d1d5db',
						outline: 'none',
						fontSize: 14,
						lineHeight: 1.2,
					}}
				/>
				{allowClear && !disabled && selectedValue ? (
					<button
						onMouseDown={(e) => e.preventDefault()}
						onClick={() => {
							setSelectedValue('')
							if (showSearch) setSearch('')
							setOpenSafe(false)
						}}
						style={{
							position: 'absolute',
							right: 10,
							top: '50%',
							transform: 'translateY(-50%)',
							width: 18,
							height: 18,
							borderRadius: 999,
							border: '1px solid rgba(148, 163, 184, 0.35)',
							background: '#fff',
							color: '#64748b',
							cursor: 'pointer',
							padding: 0,
							lineHeight: 1,
						}}
					>
						×
					</button>
				) : null}
			</div>

			{open ? (
				<div
					className={dropdownClassName}
					style={{
						position: 'fixed',
						left: popupRect.left,
						top: popupRect.top,
						width: dropdownWidth,
						height: dropdownHeight,
						zIndex: 1000,
						borderRadius: 12,
						overflow: 'hidden',
						boxShadow: '0 20px 40px rgba(15, 23, 42, 0.28)',
						...dropdownStyle,
					}}
				>
					<WeaveDropdown
						width={dropdownWidth}
						height={dropdownHeight}
						scene={scene}
						onWheel={(deltaY) => {
							setScrollY((prev) => prev + deltaY)
						}}
						onHit={(hit) => {
							const key = extractKeyFromHit(hit.path)
							if (!key) return
							const item = visibleItems.find((it) => it.key === key)
							if (!item) return
							if (isToggleHit(hit.path) && item.hasChildren) {
								onToggle(key)
								return
							}
							onSelect(item)
						}}
						onHover={(hit) => {
							const key = extractKeyFromHit(hit.path)
							setHoveredKey(key)
						}}
					/>
				</div>
			) : null}
		</div>
	)
}
