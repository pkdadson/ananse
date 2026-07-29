import type { Employee } from "@canvas/core";
import type { ReactElement } from "react";
import { EmployeeCard } from "./EmployeeCard.js";

export type ManagerCardProps = {
  data: Employee;
  directReportCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

function reportsLabel(count: number): string {
  return count === 1 ? "1 report" : `${count} reports`;
}

export function ManagerCard({
  data,
  directReportCount,
  collapsed,
  onToggleCollapse,
}: ManagerCardProps): ReactElement {
  return (
    <div className="flex flex-col gap-2" style={{ pointerEvents: "all" }}>
      <EmployeeCard data={data} />
      <div className="flex items-center justify-between rounded-md bg-canvas-selection px-2 py-1 text-xs text-canvas-node-text">
        <span>{reportsLabel(directReportCount)}</span>
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
          className="nodrag nopan rounded px-2 py-0.5 font-semibold hover:bg-white/20"
          aria-label={collapsed ? "Expand subtree" : "Collapse subtree"}
        >
          {collapsed ? "+" : "−"}
        </button>
      </div>
    </div>
  );
}
