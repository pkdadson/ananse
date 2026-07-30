import type { Employee } from "@ananse/core";
import type { ReactElement } from "react";
import { initialsOf } from "./initials.js";

export type EmployeeCardProps = {
  data: Employee;
};

export function EmployeeCard({ data }: EmployeeCardProps): ReactElement {
  return (
    <div
      className="flex items-center gap-3 rounded-ananse-node border border-ananse-node-border bg-ananse-node p-3 shadow-ananse-node transition duration-150 hover:-translate-y-0.5 hover:shadow-ananse-node-hover"
      style={{ minWidth: 220 }}
    >
      {data.photoUrl ? (
        <img src={data.photoUrl} alt={data.name} className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-ananse-node-border text-sm font-semibold text-ananse-node-text"
        >
          {initialsOf(data.name)}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="truncate text-sm font-semibold text-ananse-node-text">{data.name}</div>
        {data.title ? (
          <div className="truncate text-xs text-ananse-node-text-muted">{data.title}</div>
        ) : null}
      </div>
      {data.department ? (
        <span
          data-ananse-dept-chip={data.department}
          className="h-6 w-1.5 rounded-full"
          style={{ background: `var(--ananse-dept-${data.department})` }}
          aria-label={`Department: ${data.department}`}
        />
      ) : null}
    </div>
  );
}
