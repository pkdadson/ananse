import type { Employee } from "@canvas/core";
import type { ReactElement } from "react";
import { initialsOf } from "./initials.js";

export type EmployeeCardCompactProps = { data: Employee };

export function EmployeeCardCompact({ data }: EmployeeCardCompactProps): ReactElement {
  return (
    <div
      data-canvas-card="compact"
      className="flex items-center gap-2 rounded-lg border border-canvas-node-border bg-canvas-node px-2 py-1.5 shadow-sm"
      style={{ minWidth: 160 }}
    >
      <div
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas-node-border text-[10px] font-semibold text-canvas-node-text"
      >
        {initialsOf(data.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold text-canvas-node-text">{data.name}</div>
        {data.title ? (
          <div className="truncate text-[10px] text-canvas-node-text-muted">{data.title}</div>
        ) : null}
      </div>
      {data.department ? (
        <span
          data-canvas-dept-chip={data.department}
          className="h-4 w-1 rounded-full"
          style={{ background: `var(--canvas-dept-${data.department})` }}
          aria-label={`Department: ${data.department}`}
        />
      ) : null}
    </div>
  );
}
