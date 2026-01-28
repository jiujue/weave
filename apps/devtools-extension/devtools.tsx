import { useEffect } from 'react'

const panelPath = 'tabs/weave-panel.html'

export default function DevtoolsPage() {
	useEffect(() => {
		const g = globalThis as any
		if (g.__WEAVE_DEVTOOLS_PANEL_CREATED__) return
		g.__WEAVE_DEVTOOLS_PANEL_CREATED__ = true

		chrome.devtools.panels.create('Weave', 'assets/icon.png', panelPath)
	}, [])

	return null
}
