import React from 'react'
import type { SceneNode } from '@jiujue/weave-types'
import { sceneFromJSX } from '@jiujue/weave-react'
import type { FlatTreeItem, TreeSelectKey } from './types'

const rowHeight = 34
const indent = 16

function trianglePoints(params: { dir: 'right' | 'down' }): readonly { x: number; y: number }[] {
	if (params.dir === 'down') {
		return [
			{ x: 4, y: 6 },
			{ x: 12, y: 6 },
			{ x: 8, y: 12 },
		]
	}
	return [
		{ x: 6, y: 4 },
		{ x: 6, y: 12 },
		{ x: 12, y: 8 },
	]
}

export function buildDropdownScene(params: {
	width: number
	height: number
	scrollY: number
	items: readonly FlatTreeItem[]
	expandedKeys: ReadonlySet<TreeSelectKey>
	selectedValue: string | null
	hoveredKey: TreeSelectKey | null
	themeColor: string
}) {
	const { width, height, scrollY, items, expandedKeys, selectedValue, hoveredKey, themeColor } =
		params

	return sceneFromJSX(
		<container
			id="dropdown-root"
			style={{
				width,
				height,
				flexDirection: 'column',
				overflowY: 'scroll',
			}}
			scroll={{ y: scrollY }}
			paint={{
				background: { color: '#0b1020', alpha: 0.98 },
				border: { color: 'rgba(148, 163, 184, 0.22)', width: 1, alpha: 1 },
			}}
		>
			{items.map((it) => {
				const isSelected = selectedValue === it.value
				const isHovered = hoveredKey === it.key
				const isExpanded = it.hasChildren && expandedKeys.has(it.key)
				const rowBg = isSelected
					? { color: themeColor, alpha: 0.18 }
					: isHovered
						? { color: 'rgba(148, 163, 184, 0.18)', alpha: 1 }
						: undefined

				return (
					<React.Fragment key={it.key}>
						<container
							id={`row-${it.key}`}
							style={{
								height: rowHeight,
								width: '100%',
								flexDirection: 'row',
								alignItems: 'center',
								gap: 6,
								paddingLeft: 12 + it.level * indent,
								paddingRight: 12,
							}}
							paint={rowBg ? { background: rowBg } : undefined}
						>
							<container
								id={`toggle-${it.key}`}
								style={{
									width: 18,
									height: 18,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								{it.hasChildren ? (
									<polygon
										id={`toggleIcon-${it.key}`}
										points={trianglePoints({ dir: isExpanded ? 'down' : 'right' })}
										paint={{ fill: { color: 'rgba(226, 232, 240, 0.75)', alpha: 1 } }}
									/>
								) : null}
							</container>

							<container
								id={`labelWrap-${it.key}`}
								style={{
									flexGrow: 1,
									flexDirection: 'row',
									alignItems: 'center',
									overflowX: 'hidden',
								}}
							>
								<text
									id={`label-${it.key}`}
									textStyle={{
										color: it.disabled
											? 'rgba(148, 163, 184, 0.45)'
											: isSelected
												? themeColor
												: 'rgba(226, 232, 240, 0.92)',
										fontSize: 13,
										whiteSpace: 'nowrap',
										textBaseline: 'middle',
									}}
								>
									{typeof it.title === 'string' ? it.title : String(it.title ?? '')}
								</text>
							</container>

							<container
								id={`markWrap-${it.key}`}
								style={{
									width: 18,
									height: 18,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								{isSelected ? (
									<text
										id={`mark-${it.key}`}
										textStyle={{
											color: themeColor,
											fontSize: 14,
											fontWeight: 700,
											whiteSpace: 'nowrap',
											textBaseline: 'middle',
											textAlign: 'center',
										}}
									>
										✓
									</text>
								) : null}
							</container>
						</container>
					</React.Fragment>
				)
			})}
		</container>,
	) as SceneNode
}

export const dropdownRowHeight = rowHeight
