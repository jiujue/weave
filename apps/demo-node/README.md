# weave-demo-node

Node demo: Offscreen rendering export to PNG (one image for each of the two scene construction methods).

## Running

In the repository root:

```bash
pnpm install
pnpm -r build
pnpm -C apps/demo-node render
```

Output files are in the `apps/demo-node/` directory (e.g., `output.png`, `output.sceneFromJSX.png`).
