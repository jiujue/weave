import { useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

export function useContainerWidth<T extends HTMLElement>(
	initialWidth = 800
): Readonly<{ ref: RefObject<T>; width: number }> {
	const ref = useRef<T>(null)
	const [width, setWidth] = useState(initialWidth)

	useLayoutEffect(() => {
		const el = ref.current
		if (!el) return

		const apply = () => {
			const w = Math.floor(el.clientWidth)
			if (w > 0) setWidth(w)
		}

		apply()

		if (typeof ResizeObserver !== 'function') return
		const ro = new ResizeObserver(() => apply())
		ro.observe(el)
		return () => ro.disconnect()
	}, [])

	return { ref, width }
}
