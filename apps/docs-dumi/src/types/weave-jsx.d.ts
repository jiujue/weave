import type {
	ContainerPaintStyle,
	LayoutStyle,
	Point,
	PolygonPaintStyle,
	TableColumn,
	TableHeaderGroup,
	TableRow,
	TableStyle,
	TextStyle
} from '@jiujue/weave-types'

declare global {
	namespace JSX {
		interface IntrinsicElements {
			container: {
				id?: string
				style?: LayoutStyle
				paint?: ContainerPaintStyle
				children?: any
			}
			relative: {
				id?: string
				style?: LayoutStyle
				paint?: ContainerPaintStyle
				children?: any
			}
			text: {
				id?: string
				style?: LayoutStyle
				textStyle: TextStyle
				text?: string
				children?: any
			}
			polygon: {
				id?: string
				style?: LayoutStyle
				points: readonly Point[]
				paint?: PolygonPaintStyle
				children?: any
			}
			table: {
				id?: string
				style?: LayoutStyle
				columns: readonly TableColumn[]
				header?: readonly TableHeaderGroup[]
				rows: readonly TableRow[]
				tableStyle?: TableStyle
				children?: any
			}
		}
	}
}

export {}
