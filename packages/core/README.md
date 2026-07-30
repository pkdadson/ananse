# @ananse/core

[![npm](https://img.shields.io/npm/v/@ananse/core.svg)](https://www.npmjs.com/package/@ananse/core)
[![downloads](https://img.shields.io/npm/dm/@ananse/core.svg)](https://www.npmjs.com/package/@ananse/core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@ananse/core)](https://bundlephobia.com/package/@ananse/core)
[![license](https://img.shields.io/npm/l/@ananse/core.svg)](https://github.com/pkdadson/ananse/blob/main/LICENSE)

Framework-agnostic types, layout, schemas, and tree utilities for Ananse.

## Install

```bash
pnpm add @ananse/core
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
import { orgChartSchema } from "@ananse/core";

const parsed = orgChartSchema.safeParse(rawRows);
```

### Layout

- `layoutOrgChart(employees, options?)` — hierarchical org layout (dagre)

### Tree utils

- `getDirectReports`, traversal helpers
- `searchEmployees` — match name, title, department, email, location

### Data adapters

- `parseEmployeesCsv(csv)` — spreadsheet → `Employee[]` (+ warnings)
- `fromHrisJson(records)` — flat HRIS JSON with field aliases
- `fromNestedTree(roots)` — nested `children`/`reports` → flat `managerId` graph

```ts
import { parseEmployeesCsv, fromHrisJson, fromNestedTree } from "@ananse/core";

const { employees } = parseEmployeesCsv(csvText);
// or fromHrisJson(await res.json())
// or fromNestedTree([rootNode])
```

See the [CSV / HRIS recipe](https://github.com/pkdadson/ananse/blob/main/docs/recipes/04-import-csv-and-hris.md).

### Edit mutations

- `reparentEmployee(employees, id, newManagerId)` — cycle-safe
- `addVacantRole(employees, { title, managerId, ... })`
- `removeEmployee(employees, id)` — children reparent to grandparent

Each returns `{ ok: true, employees }` or `{ ok: false, error }`.

## Example

```ts
import { layoutOrgChart, searchEmployees } from "@ananse/core";

const layout = layoutOrgChart(employees, { direction: "TB" });
const hits = searchEmployees(employees, "grace@");
```

## License

MIT
