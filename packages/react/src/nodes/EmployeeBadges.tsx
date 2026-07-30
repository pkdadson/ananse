import type { Employee } from "@ananse/core";
import type { ReactElement } from "react";

export type EmployeeBadgesProps = { data: Employee };

export function EmployeeBadges({ data }: EmployeeBadgesProps): ReactElement {
  const chips: { key: string; label: string; colorVar: string }[] = [];

  if (data.workMode && data.workMode !== "onsite") {
    chips.push({
      key: "workMode",
      label: data.workMode,
      colorVar: `var(--ananse-badge-${data.workMode})`,
    });
  }
  if (data.employmentType && data.employmentType !== "employee") {
    chips.push({
      key: "employmentType",
      label: data.employmentType,
      colorVar: `var(--ananse-badge-${data.employmentType})`,
    });
  }
  if (data.tenureYears !== undefined) {
    chips.push({
      key: "tenure",
      label: `${data.tenureYears}y`,
      colorVar: "var(--ananse-badge-tenure)",
    });
  }

  return (
    <div data-ananse-badges className="flex flex-wrap gap-1">
      {chips.map((c) => (
        <span
          key={c.key}
          className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{
            background: "var(--ananse-badge-bg)",
            color: "var(--ananse-badge-text)",
            boxShadow: `inset 0 0 0 1px ${c.colorVar}`,
          }}
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}
