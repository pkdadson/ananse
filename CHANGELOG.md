# Changelog

## 0.1.0 — 2026-07-30

First installable milestone of the Canvas org-chart kit.

### Demo & packaging
- Demo CSV import / sample CSV / reset
- MIT `LICENSE`, package keywords, `prepublishOnly`, `pnpm publish:check`

### `@canvas/core`
- Types: `Employee` with people fields (email, location, tenure, employment type, work mode)
- Zod schemas with enum validation
- Dagre org layout, tree traversal, search
- Data adapters: `parseEmployeesCsv`, `fromHrisJson`, `fromNestedTree`
- Edit mutations: `reparentEmployee`, `addVacantRole`, `removeEmployee`, `updateEmployee`

### `@canvas/react`
- `<OrgChart mode="view" | "edit">` on React Flow
- Viewer: pan/zoom, collapse, search, focus, keyboard, minimap
- Density kit: default / detailed / compact / minimal cards + badges
- Editor: drag reparent, vacant roles, undo/redo, delete, **inspector panel**
- Hooks: `useOrgChartEditor`, `useOrgChartState`, `useSearch`, `useFocusMode`, `useKeyboardNav`

### `@canvas/tokens`
- CSS variables + Tailwind preset (including badge colors)

### Docs
- Root README, package READMEs
- Recipes: quickstart, theming, density, CSV/HRIS, editor mode
