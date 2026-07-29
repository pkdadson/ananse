# @canvas/core

Framework-agnostic types, layout, schemas, and tree utilities for Canvas.

## Install

```bash
pnpm add @canvas/core
```

## What you get

### Types

- `Employee`, `OrgChartData`
- `EmploymentType` (`employee` | `contractor` | `intern`)
- `WorkMode` (`onsite` | `hybrid` | `remote`)
- Layout types: `PositionedNode`, `LayoutEdge`, `LayoutResult`, `OrgChartLayoutOptions`

### Schemas (Zod)

- `employeeSchema` / `orgChartSchema`
- `employmentTypeSchema` / `workModeSchema`

Validate inbound HR data before rendering:

```ts
import { orgChartSchema } from "@canvas/core";

const parsed = orgChartSchema.safeParse(rawRows);
```

### Layout

- `layoutOrgChart(employees, options?)` — hierarchical org layout (dagre)

### Tree utils

- `getDirectReports`, traversal helpers
- `searchEmployees` — match name, title, department, email, location

## Example

```ts
import { layoutOrgChart, searchEmployees } from "@canvas/core";

const layout = layoutOrgChart(employees, { direction: "TB" });
const hits = searchEmployees(employees, "grace@");
```

## License

MIT
