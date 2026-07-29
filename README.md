# Canvas

**The design-forward canvas platform for hierarchies and flows — starting with the best free React org chart for people data.**

Install once. Ship org charts, mind maps, and process flows without rebuilding React Flow from scratch.

## Why Canvas wins

| Need | Raw React Flow | Enterprise (GoJS / Syncfusion) | **Canvas** |
|------|----------------|--------------------------------|------------|
| Beautiful org chart tomorrow | Weeks of glue | License + learning curve | **Minutes** |
| HR domain (vacant, dotted line, badges) | DIY | Often generic | **Built-in** |
| CSV / HRIS import | DIY | Vendor connectors | **Adapters in core** |
| Light editor (reparent, undo, inspector) | DIY | Heavy suites | **Included** |
| Mind map + process flow | Separate projects | Separate SKUs | **One platform** |
| Open source MIT | Yes | No | **Yes** |

**Positioning:** between *primitives* (React Flow) and *enterprise engines* — batteries-included, HR-ready, multi-layout.

## Install

```bash
pnpm add @canvas/react @canvas/core @canvas/tokens
# peers: react, react-dom
```

```ts
import "@canvas/tokens/variables.css";
```

## Three products, one toolkit

### 1. Org Chart (people hierarchies)

```tsx
import { OrgChart, useOrgChartEditor } from "@canvas/react";

const editor = useOrgChartEditor({ initialData: employees });

<OrgChart
  data={editor.data}
  mode="edit" // or "view"
  showSearch
  nodeVariant="detailed"
  editor={{
    onReparent: editor.reparent,
    onAddVacant: editor.addVacant,
    onRemove: editor.remove,
    onUpdate: editor.update,
    onUndo: editor.undo,
    onRedo: editor.redo,
    canUndo: editor.canUndo,
    canRedo: editor.canRedo,
    lastError: editor.lastError,
  }}
/>
```

**Viewer:** pan/zoom, collapse, search, focus, keyboard, minimap  
**Editor:** free drag, reparent, multi-select (Shift / marquee), bulk remove, vacant roles, inspector, undo/redo, export JSON  
**Densities:** `default` | `detailed` | `compact` | `minimal`  
**Import:** `parseEmployeesCsv`, `fromHrisJson`, `fromNestedTree`

### 2. Mind Map (radial hierarchies)

```tsx
import { MindMap } from "@canvas/react";
import type { MindNode } from "@canvas/core";

const data: MindNode[] = [
  { id: "root", label: "Career path", parentId: null },
  { id: "ic", label: "IC track", parentId: "root" },
];

<MindMap data={data} />
```

Custom **radial layout** in `@canvas/core` (`layoutMindMap`) — not just another top-down tree.

### 3. Flow Builder (process DAGs)

```tsx
import { FlowBuilder } from "@canvas/react";

<FlowBuilder
  nodes={[
    { id: "s", label: "Start", kind: "start" },
    { id: "t", label: "Task", kind: "task" },
    { id: "e", label: "Done", kind: "end" },
  ]}
  links={[
    { source: "s", target: "t" },
    { source: "t", target: "e" },
  ]}
/>
```

Dagre-powered `layoutFlow` for onboarding chains, approvals, checklists.

## Scale story

```bash
pnpm --filter=@canvas/core build
node scripts/bench-layout.mjs
```

- `generateOrgChart({ size: 500 | 1000 | 2000 })` for synthetic data  
- React surfaces use **`onlyRenderVisibleElements`** for large canvases  
- Demo **Stress 400** mode for interactive smoke tests  

## Packages

| Package | Role |
|---------|------|
| `@canvas/core` | Types, schemas, org/mind/flow layouts, adapters, edit mutations, perf generators, JSON export |
| `@canvas/react` | `OrgChart`, `MindMap`, `FlowBuilder`, cards, hooks, export helpers |
| `@canvas/tokens` | CSS variables + Tailwind preset |

## Local demo

```bash
pnpm install
pnpm --filter=@canvas/core build
pnpm --filter=@canvas/react build
pnpm dev:demo
```

Switch **Org Chart · Mind Map · Flow · Stress 400** in the header.

## Recipes

- [Quickstart](docs/recipes/01-quickstart.md)
- [Themed org chart](docs/recipes/02-themed-org-chart.md)
- [Density and badges](docs/recipes/03-density-and-badges.md)
- [Import CSV & HRIS](docs/recipes/04-import-csv-and-hris.md)
- [Editor mode](docs/recipes/05-editor-mode.md)

## Publishing

```bash
pnpm publish:check
# then publish tokens → core → react after securing npm scope
```

**Scope note:** code uses `@canvas/*`. Confirm availability or rename before public release.

## What “YES” means for the market

| Question | Answer |
|----------|--------|
| Unique as a **canvas platform**? | **Yes** — org + mind + flow layouts and React surfaces in one kit |
| Unique as a **people org-chart kit**? | **Yes** — HR model, adapters, densities, vacant/executive, editor |
| Beneficial to developers? | **Yes** — days of RF glue → hours of integration |
| Ready to ship / compete for installs? | **Yes** at **0.1.x** — publish, demo, benches, multi-product surface |

## License

MIT — see [LICENSE](./LICENSE).
