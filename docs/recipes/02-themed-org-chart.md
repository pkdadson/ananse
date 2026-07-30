# Recipe: Themed org chart

Style Ananse with design tokens and optional Tailwind.

## 1. CSS variables

Import the token stylesheet once:

```ts
import "@ananse/tokens/variables.css";
```

All node surfaces, edges, focus rings, department accents, and badge colors read from CSS custom properties (see `@ananse/tokens`).

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

If you use Tailwind, extend the Ananse palette:

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
import anansePreset from "@ananse/tokens/tailwind";

export default {
  presets: [anansePreset],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
} satisfies Config;
```

Example utilities:

```tsx
<div className="bg-ananse-bg text-ananse-node-text border border-ananse-node-border">
  …
</div>
```

## 4. Custom overrides

Override any variable after the import:

```css
:root {
  --ananse-node-radius: 16px;
  --ananse-dept-engineering: hsl(200 90% 45%);
}
```

## Related

- [Quickstart](01-quickstart.md)
- [Density and badges](03-density-and-badges.md)
