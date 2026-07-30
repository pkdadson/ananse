# Recipe 04 — Import CSV & HRIS JSON

Turn spreadsheet or HRIS exports into `Employee[]` for `<OrgChart>` without hand-mapping fields.

## CSV

```ts
import { parseEmployeesCsv, orgChartSchema } from "@ananse/core";
import { OrgChart } from "@ananse/react";

const csv = await fetch("/org.csv").then((r) => r.text());
const { employees, warnings } = parseEmployeesCsv(csv);

// Optional: structural validation (duplicate ids, broken manager links)
const validated = orgChartSchema.safeParse(employees);
if (!validated.success) {
  console.error(validated.error);
}

console.warn(warnings); // skipped rows, bad enums, etc.

export function App() {
  return (
    <div style={{ height: "100vh" }}>
      <OrgChart data={employees} mode="view" showSearch nodeVariant="detailed" />
    </div>
  );
}
```

### Recognized CSV headers (aliases)

| Field | Example headers |
|-------|-----------------|
| `id` | `id`, `employeeId`, `empId` |
| `name` | `name`, `fullName`, `displayName` |
| `title` | `title`, `jobTitle`, `position` |
| `managerId` | `managerId`, `manager`, `reportsTo` (empty = root) |
| `department` | `department`, `dept` |
| `email` | `email`, `mail` |
| `location` | `location`, `office`, `city` |
| `workMode` | `workMode`, `remoteStatus` (`onsite` \| `hybrid` \| `remote`) |
| `employmentType` | `employmentType`, `employeeType` (`employee` \| `contractor` \| `intern`) |
| `tenureYears` | `tenureYears`, `tenure` |
| `dottedLineManagerIds` | semicolon- or pipe-separated ids |

Quoted commas are supported (`"Lovelace, Ada"`).

## Flat HRIS JSON

```ts
import { fromHrisJson } from "@ananse/core";

const payload = await fetch("/hris-people.json").then((r) => r.json());
const { employees, warnings } = fromHrisJson(payload);
```

Maps common shapes: `employeeId`, `fullName`, `jobTitle`, `manager_id` / `reportsTo`, `workEmail`, `officeLocation`, `yearsOfService`, `employeeType`, `remoteStatus` (`wfh` → `remote`).

## Nested tree JSON

If your API returns a hierarchy with `children` / `reports` / `directReports`:

```ts
import { fromNestedTree } from "@ananse/core";

const tree = await fetch("/org-tree.json").then((r) => r.json());
const { employees } = fromNestedTree(Array.isArray(tree) ? tree : [tree]);
// managerId is derived from nesting; roots get managerId: null
```

## Tips

1. Always surface `warnings` in dev tools or a toast — adapters prefer partial success over throwing.
2. Run `orgChartSchema.safeParse(employees)` before render when data comes from untrusted files.
3. Pair with `nodeVariant="detailed"` so email / location / badges from the import show up.
