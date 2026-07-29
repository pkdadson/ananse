import type { Employee } from "@canvas/core";
import type { ReactElement } from "react";
import { EmployeeBadges } from "./EmployeeBadges.js";
import { initialsOf } from "./initials.js";

export type EmployeeCardDetailedProps = { data: Employee };

export function EmployeeCardDetailed({ data }: EmployeeCardDetailedProps): ReactElement {
  return (
    <div
      data-canvas-card="detailed"
      className="flex flex-col gap-2 rounded-canvas-node border border-canvas-node-border bg-canvas-node p-3 shadow-canvas-node"
      style={{ minWidth: 240 }}
    >
      <div className="flex items-center gap-3">
        {data.photoUrl ? (
          <img
            src={data.photoUrl}
            alt={data.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas-node-border text-sm font-semibold text-canvas-node-text"
          >
            {initialsOf(data.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-canvas-node-text">{data.name}</div>
          {data.title ? (
            <div className="truncate text-xs text-canvas-node-text-muted">{data.title}</div>
          ) : null}
        </div>
        {data.department ? (
          <span
            data-canvas-dept-chip={data.department}
            className="h-6 w-1.5 rounded-full"
            style={{ background: `var(--canvas-dept-${data.department})` }}
            aria-label={`Department: ${data.department}`}
          />
        ) : null}
      </div>
      {data.email || data.location ? (
        <div className="flex flex-col gap-0.5 text-[11px] text-canvas-node-text-muted">
          {data.email ? <div className="truncate">{data.email}</div> : null}
          {data.location ? <div className="truncate">{data.location}</div> : null}
        </div>
      ) : null}
      <EmployeeBadges data={data} />
    </div>
  );
}
