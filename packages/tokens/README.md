# @ananse/tokens

Design tokens for Ananse: CSS variables and a Tailwind preset.

## Install

```bash
pnpm add @ananse/tokens
```

## CSS variables

Import once at the root of your app:

```ts
import "@ananse/tokens/variables.css";
```

Includes:

- Surface: `--ananse-bg`, `--ananse-node-bg`, `--ananse-node-border`, text colors, radius, shadows
- Edges: `--ananse-edge-color`, `--ananse-edge-highlight`
- Focus / selection rings
- Department accent colors (`--ananse-dept-*`)
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
import anansePreset from "@ananse/tokens/tailwind";

export default {
  presets: [anansePreset],
  content: ["./src/**/*.{ts,tsx}"],
} satisfies Config;
```

Utility colors map to the same CSS variables (e.g. `bg-ananse-node`, `text-ananse-node-text`, `border-ananse-node-border`).

## License

MIT
