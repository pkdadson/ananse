# Recipe 05 — Editor mode

Enable drag-to-reparent, vacant roles, undo/redo, and delete with `mode="edit"` plus `useOrgChartEditor`.

```tsx
import { OrgChart, useOrgChartEditor } from "@canvas/react";
import "@canvas/tokens/variables.css";
import type { Employee } from "@canvas/core";

const seed: Employee[] = [
  { id: "ceo", name: "Ada Lovelace", title: "CEO", managerId: null },
  { id: "cto", name: "Grace Hopper", title: "CTO", managerId: "ceo" },
];

export function EditableOrg() {
  const editor = useOrgChartEditor({ initialData: seed });

  return (
    <div style={{ height: "100vh" }}>
      <OrgChart
        data={editor.data}
        mode="edit"
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
    </div>
  );
}
```

## Behaviors

| Action | How |
|--------|-----|
| **Reparent** | Drag a node and drop it on a new manager. Cycles are rejected. |
| **Undo / Redo** | Toolbar buttons or `⌘Z` / `⌘⇧Z` (`Ctrl` on Windows) |
| **Add vacant** | Toolbar **+ Vacant role** (prompts for title; parents under selection or root) |
| **Remove** | Select a node → **Remove** or `Delete` / `Backspace`. Children reparent to the removed node’s manager. |
| **Edit fields** | Select a node → **Inspector** panel (name, title, email, location, department, badges). **Apply changes**. |

## Pure mutations (framework-agnostic)

Also available from `@canvas/core` for non-React hosts:

- `reparentEmployee(employees, id, newManagerId)`
- `addVacantRole(employees, { title, managerId, ... })`
- `removeEmployee(employees, id)`
- `updateEmployee(employees, id, patch)` — pass `null` to clear optional fields

Each returns `{ ok: true, employees }` or `{ ok: false, error }`.

## Tips

1. Keep **one** `useOrgChartEditor` as the source of truth; pass `editor.data` into `OrgChart`.
2. Persist with `onChange` on the hook options if you need autosave.
3. View mode stays fully read-only when `mode="view"` (no `editor` prop required).
