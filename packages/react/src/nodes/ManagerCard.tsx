import type { Employee } from "@ananse/core";
import type { ReactElement } from "react";
import { EmployeeFace, type NodeVariant } from "./employeeFace.js";

export type ManagerCardProps = {
  data: Employee;
  directReportCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  variant?: NodeVariant;
  /** Override collapse copy (people: report/reports, hierarchy: child/children). */
  reportSingular?: string;
  reportPlural?: string;
  hideLabel?: string;
  showLabel?: string;
};

function countLabel(count: number, singular: string, plural: string): string {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

function Chevron({ collapsed }: { collapsed: boolean }): ReactElement {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      style={{
        transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
        transition: "transform 150ms ease",
      }}
    >
      <path
        d="M5 8l5 5 5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ManagerCard({
  data,
  directReportCount,
  collapsed,
  onToggleCollapse,
  variant = "default",
  reportSingular = "report",
  reportPlural = "reports",
  hideLabel = "Hide",
  showLabel = "Show",
}: ManagerCardProps): ReactElement {
  const countText = countLabel(directReportCount, reportSingular, reportPlural);
  const label = collapsed ? `${showLabel} ${countText}` : `${hideLabel} ${countText}`;
  return (
    <div className="flex flex-col gap-2" style={{ pointerEvents: "all" }}>
      <EmployeeFace data={data} variant={variant} />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          onToggleCollapse();
        }}
        onPointerDown={(event) => {
          // Keep RF pan/drag from swallowing the control.
          event.stopPropagation();
        }}
        className="nodrag nopan ananse-focus-ring flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-ananse-node-border bg-ananse-selection px-3 py-2 text-xs font-semibold text-ananse-node-text transition hover:bg-ananse-selection/80"
        aria-label={label}
        aria-expanded={!collapsed}
      >
        <span>
          {collapsed ? showLabel : hideLabel} {countText}
        </span>
        <Chevron collapsed={collapsed} />
      </button>
    </div>
  );
}
