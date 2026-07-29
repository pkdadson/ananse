import type { Employee } from "@canvas/core";
import type { ReactElement } from "react";
import { EmployeeCard } from "./EmployeeCard.js";

export type ManagerCardProps = {
  data: Employee;
  directReportCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function ManagerCard({
  data,
  directReportCount,
  collapsed,
  onToggleCollapse,
}: ManagerCardProps): ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <EmployeeCard data={data} />
      <div className="flex items-center justify-between rounded-md bg-canvas-selection px-2 py-1 text-xs text-canvas-node-text">
        <span>{directReportCount} reports</span>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded px-2 py-0.5 font-semibold hover:bg-white/20"
          aria-label={collapsed ? "Expand subtree" : "Collapse subtree"}
        >
          {collapsed ? "+" : "−"}
        </button>
      </div>
    </div>
  );
}
