# Recipe: Quickstart

Get a working org chart in a few minutes.

## 1. Install

```bash
pnpm add @canvas/react @canvas/core
```

Peers: `react` and `react-dom` (19+ recommended).

## 2. Import tokens

In your app entry (e.g. `main.tsx`):

```ts
import "@canvas/tokens/variables.css";
```

Without this import, cards and edges still render but colors fall back to browser defaults.

## 3. Mount OrgChart

```tsx
import { OrgChart } from "@canvas/react";

const data = [
  { id: "ceo", name: "Ada Lovelace", title: "CEO", managerId: null },
  { id: "cto", name: "Grace Hopper", title: "CTO", managerId: "ceo", department: "engineering" },
  { id: "eng-1", name: "Alan Turing", title: "Engineer", managerId: "cto", department: "engineering" },
];

export function App() {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <OrgChart data={data} mode="view" showSearch showMinimap showControls />
    </div>
  );
}
```

## Tips

- **Height matters.** The chart fills its parent. Use `height: 100vh` or a flex child with `flex: 1` and `minHeight: 0`.
- **Ids are stable.** Every employee needs a unique `id`. Use `managerId: null` (or omit) for the root.
- **Optional fields.** `title`, `department`, `email`, `location`, and badge fields enrich cards and search — see [Density and badges](03-density-and-badges.md).

## Next

- [Themed org chart](02-themed-org-chart.md)
- [Density and badges](03-density-and-badges.md)
