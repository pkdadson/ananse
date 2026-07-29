# Recipe: Themed org chart

Style Canvas with design tokens and optional Tailwind.

## 1. CSS variables

Import the token stylesheet once:

```ts
import "@canvas/tokens/variables.css";
```

All node surfaces, edges, focus rings, department accents, and badge colors read from CSS custom properties (see `@canvas/tokens`).

## 2. Dark theme

Toggle dark mode by setting `data-theme` on the document (or a wrapping element):

```tsx
useEffect(() => {
  document.documentElement.dataset.theme = "dark"; // or "light" / delete
}, []);
```

```html
<html data-theme="dark">
```

Dark overrides live under `[data-theme="dark"]` in `variables.css` (background, node fill, borders, muted text, badges).

## 3. Tailwind preset (optional)

If you use Tailwind, extend the Canvas palette:

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
import canvasPreset from "@canvas/tokens/tailwind";

export default {
  presets: [canvasPreset],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
} satisfies Config;
```

Example utilities:

```tsx
<div className="bg-canvas-bg text-canvas-node-text border border-canvas-node-border">
  …
</div>
```

## 4. Custom overrides

Override any variable after the import:

```css
:root {
  --canvas-node-radius: 16px;
  --canvas-dept-engineering: hsl(200 90% 45%);
}
```

## Related

- [Quickstart](01-quickstart.md)
- [Density and badges](03-density-and-badges.md)
