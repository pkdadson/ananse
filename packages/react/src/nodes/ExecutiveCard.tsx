import type { Employee } from "@canvas/core";
import type { ReactElement } from "react";
import { EmployeeCard } from "./EmployeeCard.js";

export type ExecutiveCardProps = { data: Employee };

export function ExecutiveCard({ data }: ExecutiveCardProps): ReactElement {
  return (
    <div
      data-canvas-role="executive"
      className="rounded-canvas-node border-2 shadow-canvas-executive"
      style={{ borderColor: "var(--canvas-role-executive-border)" }}
    >
      <EmployeeCard data={data} />
    </div>
  );
}
