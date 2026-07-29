import type { Employee } from "@canvas/core";
import type { ReactElement } from "react";
import { EmployeeFace, type NodeVariant } from "./employeeFace.js";

export type ManagerCardProps = {
  data: Employee;
  directReportCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  variant?: NodeVariant;
};

function reportsLabel(count: number): string {
  return count === 1 ? "1 report" : `${count} reports`;
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
}: ManagerCardProps): ReactElement {
  const label = collapsed
    ? `Show ${reportsLabel(directReportCount)}`
    : `Hide ${reportsLabel(directReportCount)}`;
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
        className="nodrag nopan canvas-focus-ring flex min-h-8 w-full items-center justify-between gap-2 rounded-md border border-canvas-node-border bg-canvas-selection px-3 py-1.5 text-xs font-semibold text-canvas-node-text transition hover:bg-canvas-selection/80"
        aria-label={label}
        aria-expanded={!collapsed}
      >
        <span>
          {collapsed ? "Show" : "Hide"} {reportsLabel(directReportCount)}
        </span>
        <Chevron collapsed={collapsed} />
      </button>
    </div>
  );
}
