import type { Employee } from "@ananse/core";
import type { ReactElement } from "react";
import { initialsOf } from "./initials.js";

export type EmployeeCardCompactProps = { data: Employee };

export function EmployeeCardCompact({ data }: EmployeeCardCompactProps): ReactElement {
  return (
    <div
      data-ananse-card="compact"
      className="flex items-center gap-2 rounded-lg border border-ananse-node-border bg-ananse-node px-2.5 py-2 shadow-sm"
      style={{ minWidth: 168, minHeight: 56, boxSizing: "border-box" }}
    >
      <div
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ananse-node-border text-[10px] font-semibold text-ananse-node-text"
      >
        {initialsOf(data.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold text-ananse-node-text">{data.name}</div>
        {data.title ? (
          <div className="truncate text-[10px] text-ananse-node-text-muted">{data.title}</div>
        ) : null}
      </div>
      {data.department ? (
        <span
          data-ananse-dept-chip={data.department}
          className="h-4 w-1 rounded-full"
          style={{ background: `var(--ananse-dept-${data.department})` }}
          aria-label={`Department: ${data.department}`}
        />
      ) : null}
    </div>
  );
}
