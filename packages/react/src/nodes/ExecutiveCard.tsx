import type { Employee } from "@ananse/core";
import type { ReactElement } from "react";
import { EmployeeFace, type NodeVariant } from "./employeeFace.js";

export type ExecutiveCardProps = {
  data: Employee;
  variant?: NodeVariant;
};

export function ExecutiveCard({ data, variant = "default" }: ExecutiveCardProps): ReactElement {
  return (
    <div
      data-ananse-role="executive"
      className="rounded-ananse-node shadow-ananse-executive"
      style={{
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "var(--ananse-role-executive-border)",
      }}
    >
      <EmployeeFace data={data} variant={variant} />
    </div>
  );
}
