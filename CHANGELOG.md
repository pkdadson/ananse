# Changelog

## 0.1.0 — 2026-07-30

First installable milestone of the Canvas org-chart kit — expanded into a multi-layout platform.

### Platform
- `layoutMindMap` + `<MindMap>` (radial hierarchies)
- `layoutFlow` + `<FlowBuilder>` (process DAGs)
- Multi-select (Shift + marquee) and bulk remove in org editor
- Export JSON from editor toolbar; `exportChartJson` / `exportElementPng` helpers
- `generateOrgChart` + `pnpm bench` layout benchmarks
- `onlyRenderVisibleElements` on large canvases; demo Stress 400 mode

### Demo & packaging
- Demo product switcher: Org · Mind · Flow · Stress
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
