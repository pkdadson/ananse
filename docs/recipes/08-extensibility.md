# Recipe: Extensibility

Close the product gaps: i18n, custom nodes/edges, BYO layout, free edges, replaceable chrome, and light plugins.

## 1. i18n (`labels`)

```tsx
import { OrgChart, type AnanseOrgLabels } from "@ananse/react";

const de: Partial<AnanseOrgLabels> = {
  searchPlaceholder: "Personen suchen…",
  undo: "Rückgängig",
  redo: "Wiederholen",
  addVacant: "+ Offene Stelle",
  applyChanges: "Übernehmen",
  cancel: "Abbrechen",
  addRole: "Stelle hinzufügen",
};

<OrgChart defaultData={people} showSearch labels={de} />
```

MindMap / FlowBuilder accept `labels` from `AnanseChartLabels` (search, export, legend).

## 2. Custom cards without replacing RF types

```tsx
<OrgChart
  data={people}
  renderCard={(person, ctx) => (
    <div data-role={ctx.isExecutive ? "exec" : "ic"}>
      <strong>{person.name}</strong>
      {person.title}
    </div>
  )}
/>
```

MindMap / Flow:

```tsx
<MindMap data={nodes} renderNode={(n) => <MyBubble label={n.label} />} />
<FlowBuilder nodes={steps} links={edges} renderNode={(n) => <MyStep {...n} />} />
```

## 3. Custom React Flow node / edge types

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { OrgChart, SolidEdge } from "@ananse/react";

function SquadNode({ data }: NodeProps) {
  return (
    <div className="squad-card">
      <Handle type="target" position={Position.Top} />
      {(data as { employee: { name: string } }).employee.name}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function ProjectEdge(props) {
  return <SolidEdge {...props} style={{ stroke: "magenta", strokeDasharray: "4 4" }} />;
}

<OrgChart
  data={people}
  nodeTypes={{ squad: SquadNode }}
  edgeTypes={{ project: ProjectEdge }}
  // Prefer ctx.defaultType for built-ins: employee | manager | executive | vacant
  getNodeType={(e, ctx) => (e.meta?.squad ? "squad" : ctx.defaultType)}
  extraEdges={[{ source: "eng-1", target: "design-1", kind: "project" }]}
/>
```

## 4. Free edges (matrix / non-tree links)

Tree structure still comes from `managerId`. Extra visual/logic edges:

```tsx
extraEdges={[
  { source: "cto", target: "cfo", kind: "dotted" },
  { id: "proj-a", source: "eng-1", target: "des-1", kind: "project" },
]}
```

Dotted reporting also works via `Employee.dottedLineManagerIds` without `extraEdges`.

## 5. Bring-your-own layout

```tsx
import { layoutOrgChart, type OrgLayoutFn } from "@ananse/core";
// or implement LayoutResult yourself

const gridLayout: OrgLayoutFn = (employees) => ({
  nodes: employees.map((e, i) => ({
    id: e.id,
    position: { x: (i % 5) * 220, y: Math.floor(i / 5) * 140 },
    size: { width: 200, height: 100 },
    data: e,
  })),
  edges: employees
    .filter((e) => e.managerId)
    .map((e) => ({
      id: `${e.managerId}->${e.id}`,
      source: e.managerId!,
      target: e.id,
      kind: "solid" as const,
    })),
  bounds: { width: 1100, height: 800 },
});

<OrgChart data={people} layout={gridLayout} />
```

Same pattern: `MindMap layout={…}`, `FlowBuilder layout={…}`.

## 6. Replace inspector / vacant dialog

```tsx
<OrgChart
  mode="edit"
  onChange={setPeople}
  defaultData={people}
  showInspector
  renderInspector={({ employee, onChange, onClose }) => (
    <MySideSheet person={employee} onSave={onChange} onClose={onClose} />
  )}
  renderAddVacant={({ open, onConfirm, onCancel }) =>
    open ? <MyModal onOk={onConfirm} onCancel={onCancel} /> : null
  }
/>
```

Hide stock chrome: `showInspector={false}` / `showEditorToolbar={false}` and drive `editor` / `useOrgChartEditor` yourself.

## 7. Light plugins

```tsx
const dePlugin = {
  id: "i18n-de",
  labels: { undo: "Rückgängig", redo: "Wiederholen" },
};

const squadPlugin = {
  id: "squad-nodes",
  nodeTypes: { squad: SquadNode },
};

<OrgChart data={people} plugins={[dePlugin, squadPlugin]} getNodeType={…} />
```

Prop-level `labels` / `nodeTypes` / `edgeTypes` win over plugins.

## Related

- [Theming](02-themed-org-chart.md)
- [Editor mode](05-editor-mode.md)
- [Persist & API](07-persist-and-api.md)
