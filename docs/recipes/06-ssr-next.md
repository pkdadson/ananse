# Recipe: Next.js / SSR

React Flow needs the browser DOM. Render Ananse charts **client-only**.

## App Router

```tsx
// app/org/page.tsx
import dynamic from "next/dynamic";

const OrgChart = dynamic(
  () => import("@ananse/react").then((m) => m.OrgChart),
  { ssr: false, loading: () => <p>Loading org chart…</p> },
);

const people = [
  { id: "ceo", name: "Ada Lovelace", title: "CEO", managerId: null },
  { id: "cto", name: "Grace Hopper", title: "CTO", managerId: "ceo" },
];

export default function OrgPage() {
  return <OrgChart defaultData={people} height="100vh" showSearch mode="view" />;
}
```

## Or mark the whole file client

```tsx
"use client";

import { OrgChart } from "@ananse/react";

export function OrgClient({ people }: { people: /* Employee[] */ unknown[] }) {
  return (
    <OrgChart
      data={people as import("@ananse/core").Employee[]}
      height="calc(100vh - 64px)"
      showSearch
    />
  );
}
```

## SSR checklist

| Issue | Fix |
|-------|-----|
| `window is not defined` | `dynamic(..., { ssr: false })` or `"use client"` |
| Blank chart | Pass `height="100vh"` or a real parent height |
| Missing styles | Tokens auto-inject; optional: `import "@ananse/tokens/variables.css"` in `layout.tsx` |
| RSC props | Fetch people on the server, pass serializable JSON into the client chart |

## Remix

```tsx
import { ClientOnly } from "remix-utils/client-only";
import { OrgChart } from "@ananse/react";

export default function Org() {
  return (
    <ClientOnly fallback={<p>Loading…</p>}>
      {() => <OrgChart defaultData={people} height="100vh" />}
    </ClientOnly>
  );
}
```
