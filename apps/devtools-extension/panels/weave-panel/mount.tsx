import React from 'react'
import { createRoot } from 'react-dom/client'
import WeavePanel from './index'

const root = document.getElementById('root')
const loading = document.getElementById('weave-panel-loading')

if (!root) {
	if (loading) {
		loading.style.color = '#991B1B'
		loading.textContent = 'Weave panel: missing #root'
	}
} else {
	if (loading) loading.remove()
	createRoot(root).render(<WeavePanel />)
}
