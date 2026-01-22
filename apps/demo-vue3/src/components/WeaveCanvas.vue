<template>
	<div ref="wrapRef" class="wrap">
		<canvas ref="canvasRef" class="canvas" />
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { SceneNode } from '@jiujue/weave-types'
import { createWeaveApp, type WeaveBrowserApp } from '@jiujue/weave-app'

const props = defineProps<{
	scene: SceneNode
}>()

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let app: WeaveBrowserApp | null = null
let ro: ResizeObserver | null = null

const resizeAndRender = () => {
	if (!app) return
	app.resize()
	app.render()
}

onMounted(() => {
	const canvas = canvasRef.value
	if (!canvas) return

	app = createWeaveApp({
		canvas,
		clearColor: '#ffffff',
		scene: props.scene,
		onError(message) {
			console.error('[weave worker error]', message)
		}
	})

	app.render()

	if (wrapRef.value) {
		ro = new ResizeObserver(() => resizeAndRender())
		ro.observe(wrapRef.value)
	} else {
		window.addEventListener('resize', resizeAndRender)
	}
})

onBeforeUnmount(() => {
	ro?.disconnect()
	ro = null
	window.removeEventListener('resize', resizeAndRender)
	app?.dispose()
	app = null
})

watch(
	() => props.scene,
	scene => {
		if (!app) return
		app.setScene(scene)
		app.render()
	},
	{ deep: false }
)
</script>

<style scoped>
.wrap {
	width: 100%;
	height: 100%;
}

.canvas {
	width: 100%;
	height: 100%;
	display: block;
}
</style>
