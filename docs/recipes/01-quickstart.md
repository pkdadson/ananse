# Recipe: Quickstart

Get a working org chart in under 10 minutes.

## 1. Install

```bash
pnpm add @ananse/react @ananse/core @ananse/tokens
```

Peers: `react` and `react-dom` **≥ 18.2**.

## 2. Mount (no CSS import required)

Tokens auto-inject on first chart render. Optional override:

```ts
import "@ananse/tokens/variables.css";
```

## 3. Five lines

```tsx
import { OrgChart } from "@ananse/react";

const data = [
  { id: "ceo", name: "Ada Lovelace", title: "CEO", managerId: null },
  { id: "cto", name: "Grace Hopper", title: "CTO", managerId: "ceo", department: "engineering" },
  { id: "eng-1", name: "Alan Turing", title: "Engineer", managerId: "cto", department: "engineering" },
];

export function App() {
  return <OrgChart defaultData={data} height="100vh" showSearch showMinimap showControls />;
}
```

## 4. Edit without glue

```tsx
import { useState } from "react";
import { OrgChart } from "@ananse/react";

export function Editable() {
  const [people, setPeople] = useState(data);
  return (
    <OrgChart data={people} mode="edit" onChange={setPeople} height="100vh" showSearch />
  );
}
```

## Blank chart?

Pass `height="100vh"` (or any CSS size). Ananse warns in development when the container height is ~0.
