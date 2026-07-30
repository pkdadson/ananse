# Recipe: Editor mode

## Simple (recommended)

```tsx
import { useState } from "react";
import { OrgChart } from "@canvas/react";

export function App({ initial }) {
  const [people, setPeople] = useState(initial);
  return (
    <OrgChart
      data={people}
      mode="edit"
      onChange={setPeople}
      onMutation={(e) => console.log(e.type, e)}
      height="100vh"
      showSearch
    />
  );
}
```

Built-in: free drag, reparent on drop, Shift/marquee multi-select, bulk remove, vacant roles, inspector, undo/redo, export JSON.

## Uncontrolled + localStorage

```tsx
<OrgChart defaultData={initial} mode="edit" persistKey="org-v1" height="100vh" />
```

## Advanced: own the editor hook

```tsx
import { OrgChart, useOrgChartEditor } from "@canvas/react";

const editor = useOrgChartEditor({
  initialData: people,
  onChange: save,
  onMutation: track,
});

<OrgChart
  data={editor.data}
  mode="edit"
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
  height="100vh"
/>
```

Use this when you need `replace()` for CSV import or custom toolbar wiring.
