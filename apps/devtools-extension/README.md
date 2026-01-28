# Weave DevTools Extension (Plasmo)

## What is this?

A browser extension that provides a Weave panel in DevTools for:

- Viewing the SceneNode scene tree
- Viewing node properties (JSON)
- Inspect mode: Pick nodes in the page and highlight them

## Development

After installing dependencies in the repository root:

- Development: `pnpm -C apps/devtools-extension dev`
- Build: `pnpm -C apps/devtools-extension build`

How to load in Chrome (development build):

- Open `chrome://extensions`
- Enable Developer mode
- Load unpacked → Select `apps/devtools-extension/build/chrome-mv3-dev`

Common development issues:

- `Uncaught Error: Extension context invalidated`
  - This is caused by the old content script context being destroyed after Chrome reloads the extension, or Plasmo hot update triggers an extension reload.
  - Solution: After reloading the extension, **refresh the target page** (or reopen DevTools/page).

## Usage

1. Enable when creating the app in your Weave page:

```ts
createWeaveApp({
	canvas,
	scene,
	devtools: { enabled: true },
})
```

2. Open the page's DevTools and select the `Weave` panel.

## Architecture

- `contents/weave-main.ts`: main world bridge, accesses `window.__WEAVE_DEVTOOLS_HOOK__`
- `content.ts`: isolated world, overlay and inspect, forwards requests/events
- `background.ts`: panel ↔ content script routing
- `devtools.tsx` + `panels/weave-panel/*`: DevTools panel UI
