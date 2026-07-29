# @canvas/react

React bindings for Canvas: `<OrgChart>`, HR card presets, viewer hooks, and editor mode.

## Install

```bash
pnpm add @canvas/react @canvas/core
# peers: react, react-dom
```

```ts
import "@canvas/tokens/variables.css";
```

## OrgChart

```tsx
import { OrgChart } from "@canvas/react";

<OrgChart
  data={employees}
  mode="view"
  showSearch
  showMinimap
  nodeVariant="detailed"
/>
```

### Editor mode

```tsx
import { OrgChart, useOrgChartEditor } from "@canvas/react";

const editor = useOrgChartEditor({ initialData: employees });

<OrgChart
  data={editor.data}
  mode="edit"
  editor={{
    onReparent: editor.reparent,
    onAddVacant: editor.addVacant,
    onRemove: editor.remove,
    onUndo: editor.undo,
    onRedo: editor.redo,
    canUndo: editor.canUndo,
    canRedo: editor.canRedo,
    lastError: editor.lastError,
  }}
/>
```

See [recipe 05](../../docs/recipes/05-editor-mode.md).

## Cards

`EmployeeCard`, `EmployeeCardDetailed`, `EmployeeCardCompact`, `EmployeeCardMinimal`,
`ManagerCard`, `ExecutiveCard`, `VacantRoleCard`, `EmployeeBadges`.

## Hooks

`useOrgChartState`, `useSearch`, `useFocusMode`, `useKeyboardNav`, `useOrgChartEditor`.

## License

MIT
