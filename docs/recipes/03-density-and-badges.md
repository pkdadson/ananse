# Recipe: Density and badges

Switch card density with `nodeVariant` and surface people metadata as chips.

## Density table

| Variant | Best for | Content |
|---------|----------|---------|
| `default` | Everyday viewer | Name, title, department |
| `detailed` | HR / people detail | Email, location, badges |
| `compact` | Wide trees | Smaller name + title |
| `minimal` | Executive overview | Initials + name |

```tsx
import { OrgChart, type NodeVariant } from "@ananse/react";

const variant: NodeVariant = "detailed";

<OrgChart data={employees} mode="view" nodeVariant={variant} showSearch />
```

Manager and executive nodes compose the same face helper, so density applies across role types. Vacant roles keep a dedicated vacant card.

## Badge fields on Employee

Optional fields on `@ananse/core` `Employee`:

| Field | Values / type | Badge behavior |
|-------|----------------|----------------|
| `workMode` | `onsite` \| `hybrid` \| `remote` | Chip shown when not `onsite` |
| `employmentType` | `employee` \| `contractor` \| `intern` | Chip shown when not `employee` |
| `tenureYears` | non-negative number | Chip like `8y` |
| `email` | string | Shown on detailed cards; searchable |
| `location` | string | Shown on detailed cards; searchable |

## Example employee

```ts
const cto = {
  id: "cto",
  name: "Grace Hopper",
  title: "CTO",
  managerId: "ceo",
  department: "engineering",
  email: "grace@example.com",
  location: "Remote",
  tenureYears: 8,
  employmentType: "employee",
  workMode: "remote",
  meta: { role: "executive" },
};

const contractor = {
  id: "sr-eng-2",
  name: "Guido van Rossum",
  title: "Staff Engineer",
  managerId: "vp-eng-platform",
  department: "engineering",
  employmentType: "contractor",
  workMode: "hybrid",
  tenureYears: 2,
};
```

With `nodeVariant="detailed"`, Grace shows a **remote** and **8y** badge; Guido shows **hybrid**, **contractor**, and **2y**.

## Using cards directly

```tsx
import {
  EmployeeCardDetailed,
  EmployeeBadges,
  ManagerCard,
} from "@ananse/react";

<EmployeeCardDetailed data={employee} />
<EmployeeBadges data={employee} />
<ManagerCard
  data={manager}
  directReportCount={3}
  collapsed={false}
  onToggleCollapse={() => {}}
  variant="compact"
/>
```

## Related

- [Quickstart](01-quickstart.md)
- [Themed org chart](02-themed-org-chart.md)
