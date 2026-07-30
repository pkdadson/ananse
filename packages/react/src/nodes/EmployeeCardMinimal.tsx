import type { Employee } from "@ananse/core";
import type { ReactElement } from "react";
import { initialsOf } from "./initials.js";

export type EmployeeCardMinimalProps = { data: Employee };

/**
 * Compact pill card. Min 44px height keeps a usable touch target even when
 * the chart is fitted into a narrow viewport.
 */
export function EmployeeCardMinimal({ data }: EmployeeCardMinimalProps): ReactElement {
  return (
    <div
      data-ananse-card="minimal"
      className="flex items-center gap-2 rounded-full border border-ananse-node-border bg-ananse-node px-2.5 shadow-sm"
      style={{
        minHeight: 44,
        minWidth: 44,
        boxSizing: "border-box",
      }}
    >
      <div
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ananse-node-border text-[10px] font-bold text-ananse-node-text"
      >
        {initialsOf(data.name)}
      </div>
      <span className="max-w-[120px] truncate text-xs font-medium text-ananse-node-text">
        {data.name}
      </span>
    </div>
  );
}
