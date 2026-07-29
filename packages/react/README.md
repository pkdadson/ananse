# @canvas/react

React bindings for Canvas: production org chart viewer, people cards, and hooks.

## Install

```bash
pnpm add @canvas/react @canvas/core
# peer: react, react-dom
```

Import tokens in your app entry:

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
  showControls
  nodeVariant="detailed"
/>
```

### Props

| Prop | Description |
|------|-------------|
| `data` | `Employee[]` from `@canvas/core` |
| `mode` | `"view"` \| `"edit"` (`edit` reserved; viewer ships in v0.1) |
| `showSearch` | Search bar (name, title, dept, email, location) |
| `showMinimap` | MiniMap overlay |
| `showControls` | Zoom / fit controls |
| `nodeVariant` | Density: `default` \| `detailed` \| `compact` \| `minimal` |
| `layoutOptions` | Optional layout overrides |

## Cards

- `EmployeeCard` — default density face
- `EmployeeCardDetailed` — email, location, badges
- `EmployeeCardCompact` — dense name/title
- `EmployeeCardMinimal` — avatar + name
- `EmployeeBadges` — work mode / employment type / tenure chips
- `ManagerCard` / `ExecutiveCard` — compose a face + role chrome; accept `variant?: NodeVariant`
- `VacantRoleCard` — open role placeholder

## Hooks

- `useOrgChartState` — collapse / expand visibility
- `useSearch` — query + match ids
- `useFocusMode` — focus chain highlighting
- `useKeyboardNav` — arrow navigation across the tree

## Other exports

- `SearchBar`
- `SolidEdge` / `DottedEdge`
- `NodeVariant` type

## License

MIT
