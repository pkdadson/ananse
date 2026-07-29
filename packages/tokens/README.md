# @canvas/tokens

Design tokens for Canvas: CSS variables and a Tailwind preset.

## Install

```bash
pnpm add @canvas/tokens
```

## CSS variables

Import once at the root of your app:

```ts
import "@canvas/tokens/variables.css";
```

Includes:

- Surface: `--canvas-bg`, `--canvas-node-bg`, `--canvas-node-border`, text colors, radius, shadows
- Edges: `--canvas-edge-color`, `--canvas-edge-highlight`
- Focus / selection rings
- Department accent colors (`--canvas-dept-*`)
- Role styles (executive, vacant)
- Badge colors: remote, hybrid, onsite, contractor, intern, tenure

### Dark theme

Set `data-theme="dark"` on `<html>` (or any ancestor). Variables under `[data-theme="dark"]` override the light defaults.

```html
<html data-theme="dark">
```

## Tailwind preset

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
import canvasPreset from "@canvas/tokens/tailwind";

export default {
  presets: [canvasPreset],
  content: ["./src/**/*.{ts,tsx}"],
} satisfies Config;
```

Utility colors map to the same CSS variables (e.g. `bg-canvas-node`, `text-canvas-node-text`, `border-canvas-node-border`).

## License

MIT
