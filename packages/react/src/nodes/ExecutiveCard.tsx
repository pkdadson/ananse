import type { Employee } from "@canvas/core";
import type { ReactElement } from "react";
import { EmployeeFace, type NodeVariant } from "./employeeFace.js";

export type ExecutiveCardProps = {
  data: Employee;
  variant?: NodeVariant;
};

export function ExecutiveCard({ data, variant = "default" }: ExecutiveCardProps): ReactElement {
  return (
    <div
      data-canvas-role="executive"
      className="rounded-canvas-node border-2 shadow-canvas-executive"
      style={{ borderColor: "var(--canvas-role-executive-border)" }}
    >
      <EmployeeFace data={data} variant={variant} />
    </div>
  );
}
