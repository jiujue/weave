const el = document.getElementById('weave-panel-loading')

;(globalThis as any).__WEAVE_PANEL_BOOT__ = true

if (el) {
	const setText = (color: string, text: string) => {
		el.style.color = color
		el.textContent = text
	}

	globalThis.addEventListener('error', (e) => {
		const msg = (e as any)?.message ?? String(e)
		setText('#991B1B', `Weave panel crashed: ${msg}`)
	})

	globalThis.addEventListener('unhandledrejection', (e) => {
		const reason = (e as any)?.reason ?? e
		const msg = reason?.message ?? String(reason)
		setText('#991B1B', `Weave panel crashed: ${msg}`)
	})

	setTimeout(() => {
		if (document.getElementById('weave-panel-loading')) {
			setText(
				'#92400E',
				'Weave panel still loading... (Right click -> Inspect to view panel console)',
			)
		}
	}, 1500)
}
