import type {
	ContainerPaintStyle,
	LayoutStyle,
	Point,
	PolygonPaintStyle,
	TableColumn,
	TableHeaderGroup,
	TableRow,
	TableStyle,
	TextStyle,
} from '@jiujue/weave-types'

declare global {
	namespace JSX {
		interface IntrinsicElements {
			container: {
				id?: string
				style?: LayoutStyle
				paint?: ContainerPaintStyle
				scroll?: Readonly<{ x?: number; y?: number }>
				children?: any
			}
			relative: {
				id?: string
				style?: LayoutStyle
				paint?: ContainerPaintStyle
				scroll?: Readonly<{ x?: number; y?: number }>
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

declare module 'react' {
	namespace JSX {
		interface IntrinsicElements {
			container: {
				id?: string
				style?: LayoutStyle
				paint?: ContainerPaintStyle
				scroll?: Readonly<{ x?: number; y?: number }>
				children?: any
			}
			relative: {
				id?: string
				style?: LayoutStyle
				paint?: ContainerPaintStyle
				scroll?: Readonly<{ x?: number; y?: number }>
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
