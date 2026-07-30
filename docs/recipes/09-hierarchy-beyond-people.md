# Recipe: Hierarchy beyond people

`OrgChart` is a **tree viewer/editor**. The default UX is HR-oriented, but the same component works for accounts, products, geo, cost centers, and ownership trees.

## 1. Use `domain="hierarchy"`

```tsx
import { OrgChart } from "@ananse/react";

const accounts = [
  { id: "corp", name: "Acme Global", title: "Holding", parentId: null },
  { id: "eu", name: "Europe", title: "Region", parentId: "corp" },
  { id: "de", name: "Germany", title: "Country", parentId: "eu" },
];

export function AccountTree() {
  return (
    <OrgChart
      defaultData={accounts}
      domain="hierarchy"
      height="100vh"
      showSearch
      mode="edit"
      onChange={console.log}
    />
  );
}
```

`domain="hierarchy"` applies:

| Area | People (`domain="people"`) | Hierarchy |
|------|----------------------------|-----------|
| Search placeholder | Search people… | Search nodes… |
| Add action | + Vacant role | + Child node |
| Collapse | Hide N reports | Hide N children |
| Inspector | Email, tenure, employment… | Name, type, group, region |
| Cards | Employment badges | Badges/email hidden |

Override any string with `labels={{ … }}`.

## 2. Prefer `parentId` (or keep `managerId`)

Canonical storage still uses `managerId`. Inputs may use either:

```ts
import { normalizeHierarchyNodes, type HierarchyNodeInput } from "@ananse/core";

const input: HierarchyNodeInput[] = [
  { id: "a", name: "A", parentId: null },
  { id: "b", name: "B", parentId: "a" },
];

// Optional — OrgChart also normalizes automatically
const nodes = normalizeHierarchyNodes(input);
```

CSV: columns `parentId` / `parent` are aliases for `managerId`.

## 3. Types

```ts
import type { HierarchyNode, HierarchyNodeInput, Employee } from "@ananse/core";

// HierarchyNode === Employee (alias)
// HierarchyNodeInput allows parentId | managerId
```

## 4. Custom faces

```tsx
<OrgChart
  data={accounts}
  domain="hierarchy"
  renderCard={(node) => (
    <div className="rounded border p-2">
      <strong>{node.name}</strong>
      <div>{node.title}</div>
    </div>
  )}
/>
```

## 5. When *not* to use OrgChart

| Need | Use instead |
|------|-------------|
| Radial brainstorm / topics | `MindMap` |
| Process / workflow DAG | `FlowBuilder` |
| Free multi-parent graph | Custom layout + edges (or Flow) |

## Related

- [Quickstart](01-quickstart.md)
- [Extensibility](08-extensibility.md)
- [Editor mode](05-editor-mode.md)
