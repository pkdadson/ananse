# Recipe: Persist edits (localStorage + REST)

## 15-line localStorage prototype

```tsx
import { OrgChart } from "@ananse/react";
import { loadOrgFromStorage } from "@ananse/core";

const KEY = "my-org-v1";
const seed = loadOrgFromStorage(KEY) ?? [
  { id: "ceo", name: "Ada", title: "CEO", managerId: null },
];

export function App() {
  return (
    <OrgChart
      defaultData={seed}
      mode="edit"
      persistKey={KEY}
      height="100vh"
      showSearch
    />
  );
}
```

`persistKey` loads on mount and saves after every mutation.

## Debounced REST save

```tsx
import { useMemo, useState } from "react";
import { OrgChart } from "@ananse/react";
import type { Employee, OrgMutationEvent } from "@ananse/core";

function useDebouncedSave(url: string, ms = 500) {
  return useMemo(() => {
    let t: ReturnType<typeof setTimeout>;
    return (employees: Employee[]) => {
      clearTimeout(t);
      t = setTimeout(() => {
        void fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(employees),
        });
      }, ms);
    };
  }, [url, ms]);
}

export function EditableOrg({ initial }: { initial: Employee[] }) {
  const [people, setPeople] = useState(initial);
  const save = useDebouncedSave("/api/org");

  return (
    <OrgChart
      data={people}
      mode="edit"
      height="100vh"
      onChange={(next) => {
        setPeople(next);
        save(next);
      }}
      onMutation={(event: OrgMutationEvent) => {
        // Optional: granular analytics / optimistic API
        console.debug("org mutation", event.type);
      }}
    />
  );
}
```

## Decision tree

| You want… | Use |
|-----------|-----|
| Demo / offline | `persistKey` |
| Controlled React state | `data` + `onChange` |
| Wire to backend | `onChange` (full snapshot) and/or `onMutation` (typed events) |
| Custom undo stack | `useOrgChartEditor` + `editor` prop |
