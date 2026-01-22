declare module '@napi-rs/canvas' {
	export const createCanvas: (width: number, height: number) => any
}

declare module 'canvas' {
	export const createCanvas: (width: number, height: number) => any
}
