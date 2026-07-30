# Canvas

**The design-forward canvas platform for hierarchies and flows.**

## 5-line quickstart

```tsx
import { OrgChart } from "@canvas/react";

const people = [
  { id: "ceo", name: "Ada Lovelace", title: "CEO", managerId: null },
  { id: "cto", name: "Grace Hopper", title: "CTO", managerId: "ceo" },
];

export default function App() {
  return <OrgChart defaultData={people} height="100vh" showSearch />;
}
```

That’s it. Tokens auto-inject. No CSS import. No React Flow setup.

```bash
pnpm add @canvas/react @canvas/core @canvas/tokens
# peers: react, react-dom (>=18.2)
```

**Playground:** run the monorepo demo — `pnpm dev:demo` → http://localhost:5173/

---

## Edit mode (still simple)

```tsx
import { useState } from "react";
import { OrgChart } from "@canvas/react";

export function Editable({ initial }) {
  const [people, setPeople] = useState(initial);
  return (
    <OrgChart
      data={people}
      mode="edit"
      onChange={setPeople}
      height="100vh"
      showSearch
    />
  );
}
```

No `editor={{ onReparent, onUndo, … }}` glue required. Undo/redo, reparent, inspector, multi-select, and export are built in.

| Pattern | API |
|---------|-----|
| Uncontrolled | `defaultData` + optional `onChange` |
| Controlled | `data` + `onChange` |
| Persist prototype | `persistKey="org-v1"` |
| Advanced | `useOrgChartEditor` + `editor` prop |

---

## Load any people payload

```ts
import { loadOrg, formatLoadOrgErrors } from "@canvas/core";

const result = loadOrg({ type: "employees", data: apiJson });
// or: { type: "csv", text }, { type: "hris", data }, { type: "nested", data }

if (!result.ok) {
  console.error(formatLoadOrgErrors(result)); // human-friendly
} else {
  // result.employees, result.warnings
}
```

---

## Mind map & flow

```tsx
import { MindMap, FlowBuilder } from "@canvas/react";

<MindMap data={mindNodes} height="100vh" showExport />
<FlowBuilder nodes={steps} links={edges} height="100vh" showLegend showExport />
```

---

## Why Canvas

| Need | Raw React Flow | Enterprise | **Canvas** |
|------|----------------|------------|------------|
| Beautiful org chart tomorrow | Weeks | License | **Minutes** |
| HR domain (vacant, badges) | DIY | Generic | **Built-in** |
| CSV / HRIS import | DIY | Vendor | **`loadOrg`** |
| Light editor | DIY | Heavy | **`mode="edit"`** |
| Mind + flow | Separate | SKUs | **One kit** |
| MIT | Yes | No | **Yes** |

---

## Packages

| Package | Role |
|---------|------|
| `@canvas/react` | `OrgChart`, `MindMap`, `FlowBuilder`, hooks |
| `@canvas/core` | Types, layouts, `loadOrg`, mutations, persist |
| `@canvas/tokens` | CSS variables (also auto-injected) |

Peers: **React 18.2+** or 19.

---

## Customize

```tsx
// Hide fields
<OrgChart data={people} fields={{ email: false, badges: false }} />

// Full card escape hatch
<OrgChart
  data={people}
  renderCard={(person) => <div>{person.name}</div>}
/>

// Theme via CSS variables
:root { --canvas-edge-highlight: #7c3aed; }
```

---

## DX tools

```bash
pnpm doctor              # environment + optional --data people.json
pnpm create-app my-app   # scaffold Vite + React + OrgChart
pnpm bench               # layout performance
pnpm publish:check       # test + build + lint + dry-run publish
```

---

## Recipes

1. [Quickstart](docs/recipes/01-quickstart.md)
2. [Theming](docs/recipes/02-themed-org-chart.md)
3. [Density & badges](docs/recipes/03-density-and-badges.md)
4. [CSV / HRIS](docs/recipes/04-import-csv-and-hris.md)
5. [Editor mode](docs/recipes/05-editor-mode.md)
6. [Next.js / SSR](docs/recipes/06-ssr-next.md)
7. [Persist & REST API](docs/recipes/07-persist-and-api.md)

**Stories:** `packages/react/stories/` (CSF stubs for Storybook/Ladle).

---

## Local monorepo

```bash
pnpm install
pnpm build
pnpm dev:demo
pnpm test
```

## FAQ

**Blank chart?** Pass `height="100vh"` or ensure the parent has a real height. Dev builds warn when height ≈ 0.

**SSR / Next?** Use `dynamic(() => import("@canvas/react").then(m => m.OrgChart), { ssr: false })` — see [SSR recipe](docs/recipes/06-ssr-next.md).

**React 18?** Supported (`>=18.2`).

**Save to my API?** `onChange` or `onMutation` — see [persist recipe](docs/recipes/07-persist-and-api.md).
