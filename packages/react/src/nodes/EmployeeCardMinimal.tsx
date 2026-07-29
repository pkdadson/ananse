import type { Employee } from "@canvas/core";
import type { ReactElement } from "react";
import { initialsOf } from "./initials.js";

export type EmployeeCardMinimalProps = { data: Employee };

export function EmployeeCardMinimal({ data }: EmployeeCardMinimalProps): ReactElement {
  return (
    <div
      data-canvas-card="minimal"
      className="flex items-center gap-1.5 rounded-full border border-canvas-node-border bg-canvas-node px-2 py-1 shadow-sm"
    >
      <div
        aria-hidden="true"
        className="flex h-6 w-6 items-center justify-center rounded-full bg-canvas-node-border text-[9px] font-bold text-canvas-node-text"
      >
        {initialsOf(data.name)}
      </div>
      <span className="max-w-[100px] truncate text-[11px] font-medium text-canvas-node-text">
        {data.name}
      </span>
    </div>
  );
}
