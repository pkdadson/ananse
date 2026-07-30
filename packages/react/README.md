# @ananse/react

**The design-forward React library for org charts, mind maps, and flow builders.**

- `<OrgChart>` — hierarchical org chart with search, focus, densities, and a built-in editor
- `<MindMap>` — radial mind map
- `<FlowBuilder>` — process DAG with legend + export
- MIT · React 18.2+ or 19 · SSR-friendly

## Install

```bash
pnpm add @ananse/react @ananse/core @ananse/tokens
# peers: react, react-dom (>=18.2)
```

Tokens auto-inject — no CSS import required.

## Quickstart

```tsx
import { OrgChart } from "@ananse/react";

const people = [
  { id: "ceo", name: "Ada Lovelace", title: "CEO", managerId: null },
  { id: "cto", name: "Grace Hopper", title: "CTO", managerId: "ceo" },
];

export default function App() {
  return <OrgChart defaultData={people} height="100vh" showSearch />;
}
```

## Edit mode (no glue)

```tsx
import { useState } from "react";
import { OrgChart } from "@ananse/react";

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

Undo/redo, drag-to-reparent, inspector, multi-select, vacant roles, and JSON export are built in. No `editor={{ onReparent, onUndo, … }}` wiring required.

| Pattern | API |
|---------|-----|
| Uncontrolled | `defaultData` + optional `onChange` |
| Controlled | `data` + `onChange` |
| Persist prototype | `persistKey="org-v1"` |
| Advanced | `useOrgChartEditor` + `editor` prop |

## Beyond people

`OrgChart` is a generic tree — accounts, products, geo, categories, anything hierarchical.

```tsx
<OrgChart defaultData={accounts} domain="hierarchy" height="100vh" showSearch />
```

## Mind map & flow

```tsx
import { MindMap, FlowBuilder } from "@ananse/react";

<MindMap data={mindNodes} height="100vh" showExport />
<FlowBuilder nodes={steps} links={edges} height="100vh" showLegend showExport />
```

## Customize

```tsx
// Hide fields
<OrgChart data={people} fields={{ email: false, badges: false }} />

// Full card escape hatch
<OrgChart data={people} renderCard={(person) => <div>{person.name}</div>} />
```

Theme via CSS variables:

```css
:root { --ananse-edge-highlight: #7c3aed; }
```

## Extensibility

| Gap | API |
|-----|-----|
| i18n | `labels` / `plugins[].labels` |
| Custom RF nodes/edges | `nodeTypes`, `edgeTypes`, `getNodeType` |
| Free edges (matrix) | `extraEdges` + `dottedLineManagerIds` |
| BYO layout | `layout={(employees, opts) => LayoutResult}` |
| Replace inspector / vacant UI | `renderInspector`, `renderAddVacant` |
| Light plugins | `plugins={[{ id, labels, nodeTypes, edgeTypes }]}` |

## Docs & recipes

- Full README, positioning, and FAQ: <https://github.com/pkdadson/ananse#readme>
- Recipes: <https://github.com/pkdadson/ananse/tree/main/docs/recipes>
  - Quickstart, theming, density, CSV/HRIS, editor mode, SSR/Next.js, persist, extensibility, hierarchy-beyond-people

## FAQ

**Blank chart?** Pass `height="100vh"` or ensure the parent has a real height. Dev builds warn when height ≈ 0.

**SSR / Next?** Use `dynamic(() => import("@ananse/react").then(m => m.OrgChart), { ssr: false })`.

**Save to my API?** `onChange` or `onMutation` — see the [persist recipe](https://github.com/pkdadson/ananse/blob/main/docs/recipes/07-persist-and-api.md).

## License

MIT
