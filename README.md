# Canvas

**Install once, render a production-looking org chart in five minutes.**

Canvas is a design-forward org-chart kit for React. It packages layout, search, focus, keyboard navigation, and polished people cards on top of React Flow — so you ship a viewer, not a wiring project.

## Why Canvas vs raw React Flow

| Raw React Flow | Canvas |
|----------------|--------|
| You design node cards, edges, collapse, search, and focus yourself | `OrgChart` ships with those behaviors |
| Layout and tree math are DIY | `@canvas/core` provides dagre org layout + tree utils |
| Tokens and densities are ad hoc | Built-in densities and badge chips via design tokens |
| Data is free-form | Typed `Employee` model + Zod schemas + CSV/HRIS adapters |

Use React Flow when you need a custom graph editor. Use Canvas when you need an **org chart that looks finished on day one**.

## Install

```bash
pnpm add @canvas/react @canvas/core
# peer: react, react-dom
```

Import design tokens once in your app entry:

```ts
import "@canvas/tokens/variables.css";
```

## Minimal example

```tsx
import { OrgChart } from "@canvas/react";
import "@canvas/tokens/variables.css";

const data = [
  { id: "ceo", name: "Ada Lovelace", title: "CEO", managerId: null },
  { id: "cto", name: "Grace Hopper", title: "CTO", managerId: "ceo" },
];

export function App() {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <OrgChart data={data} mode="view" showSearch nodeVariant="detailed" />
    </div>
  );
}
```

The chart container needs an explicit height (e.g. `100vh` or a flex child with `minHeight: 0`).

## Features

- **Pan / zoom** — React Flow canvas with fit-on-load behavior
- **Collapse / expand** — managers hide and show their subtree
- **Search** — filter by name, title, department, email, location
- **Focus mode** — highlight a person and their chain; dim the rest
- **Keyboard** — arrow navigation; `/` focuses search; `Escape` clears focus
- **Minimap & controls** — optional, toggle via props
- **Densities** — `default` | `detailed` | `compact` | `minimal`
- **Badges** — work mode, employment type, tenure chips on detailed cards
- **Data adapters** — `parseEmployeesCsv`, `fromHrisJson`, `fromNestedTree` in `@canvas/core`

## Density variants

| `nodeVariant` | What you get |
|---------------|--------------|
| `default` | Name, title, department — balanced card |
| `detailed` | Email, location, and badges (remote, contractor, tenure, …) |
| `compact` | Smaller card; name + title only |
| `minimal` | Initials avatar + name — densest overview |

Pass `nodeVariant` on `OrgChart`, or use the card components directly from `@canvas/react`.

## Local demo

```bash
pnpm install
pnpm --filter=@canvas/core build
pnpm --filter=@canvas/react build
pnpm dev:demo
```

## Recipes

- [Quickstart](docs/recipes/01-quickstart.md)
- [Themed org chart](docs/recipes/02-themed-org-chart.md)
- [Density and badges](docs/recipes/03-density-and-badges.md)
- [Import CSV & HRIS](docs/recipes/04-import-csv-and-hris.md)

## Packages

| Package | Role |
|---------|------|
| [`@canvas/core`](packages/core) | Types, Zod schemas, layout, tree/search, CSV/HRIS adapters |
| [`@canvas/react`](packages/react) | `OrgChart`, cards, edges, hooks |
| [`@canvas/tokens`](packages/tokens) | CSS variables + Tailwind preset |

## Roadmap

Shipped: install docs, density kit, CSV/HRIS adapters.

Planned next:

- In-product org chart editor (reparent, vacant roles, undo)

## License

MIT
