import type { Employee } from "@canvas/core";
import type { ReactElement } from "react";
import { EmployeeCard } from "./EmployeeCard.js";
import { EmployeeCardCompact } from "./EmployeeCardCompact.js";
import { EmployeeCardDetailed } from "./EmployeeCardDetailed.js";
import { EmployeeCardMinimal } from "./EmployeeCardMinimal.js";

export type NodeVariant = "default" | "detailed" | "compact" | "minimal";

export function EmployeeFace({
  data,
  variant = "default",
}: {
  data: Employee;
  variant?: NodeVariant;
}): ReactElement {
  switch (variant) {
    case "detailed":
      return <EmployeeCardDetailed data={data} />;
    case "compact":
      return <EmployeeCardCompact data={data} />;
    case "minimal":
      return <EmployeeCardMinimal data={data} />;
    default:
      return <EmployeeCard data={data} />;
  }
}
