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
      className="rounded-canvas-node shadow-canvas-executive"
      style={{
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "var(--canvas-role-executive-border)",
      }}
    >
      <EmployeeFace data={data} variant={variant} />
    </div>
  );
}
