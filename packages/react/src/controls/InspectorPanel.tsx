import type { Employee, EmployeePatch, EmploymentType, WorkMode } from "@ananse/core";
import { type ReactElement, useEffect, useState } from "react";
import type { AnanseOrgLabels } from "../i18n/labels.js";
import { DEFAULT_ORG_LABELS } from "../i18n/labels.js";

/** Mirrors OrgChart CardFieldsConfig — kept local to avoid circular imports. */
export type InspectorFieldsConfig = {
  email?: boolean;
  location?: boolean;
  badges?: boolean;
  department?: boolean;
  photo?: boolean;
};

export type InspectorPanelProps = {
  employee: Employee;
  onChange: (patch: EmployeePatch) => void;
  onClose: () => void;
  /** Override chrome / field labels (i18n). */
  labels?: Partial<AnanseOrgLabels> | undefined;
  /**
   * Hide people-only fields for hierarchy domain.
   * `email` / `location` / `badges` (tenure, employment, work mode) honored.
   */
  fields?: InspectorFieldsConfig | undefined;
};

type FormState = {
  name: string;
  title: string;
  email: string;
  location: string;
  department: string;
  tenureYears: string;
  employmentType: string;
  workMode: string;
};

function toForm(e: Employee): FormState {
  return {
    name: e.name,
    title: e.title ?? "",
    email: e.email ?? "",
    location: e.location ?? "",
    department: e.department ?? "",
    tenureYears: e.tenureYears !== undefined ? String(e.tenureYears) : "",
    employmentType: e.employmentType ?? "",
    workMode: e.workMode ?? "",
  };
}

function field(
  id: string,
  label: string,
  value: string,
  onChange: (v: string) => void,
  opts?: { type?: string; placeholder?: string },
): ReactElement {
  return (
    <div className="flex flex-col gap-0.5 text-[11px] font-medium text-ananse-node-text-muted">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        className="nodrag nopan rounded border border-ananse-node-border bg-ananse-bg px-2 py-1 text-xs text-ananse-node-text outline-none focus:border-ananse-focus"
        value={value}
        type={opts?.type ?? "text"}
        placeholder={opts?.placeholder}
        onChange={(ev) => onChange(ev.target.value)}
      />
    </div>
  );
}

export function InspectorPanel({
  employee,
  onChange,
  onClose,
  labels: labelsPartial,
  fields,
}: InspectorPanelProps): ReactElement {
  const labels = { ...DEFAULT_ORG_LABELS, ...labelsPartial };
  const showEmail = fields?.email !== false;
  const showLocation = fields?.location !== false;
  const showDepartment = fields?.department !== false;
  const showBadges = fields?.badges !== false;
  const [form, setForm] = useState<FormState>(() => toForm(employee));
  const baseId = `inspector-${employee.id}`;

  useEffect(() => {
    setForm(toForm(employee));
  }, [employee]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function commit(): void {
    const patch: EmployeePatch = {
      name: form.name,
      title: form.title.trim() === "" ? null : form.title,
    };
    if (showEmail) {
      patch.email = form.email.trim() === "" ? null : form.email;
    }
    if (showLocation) {
      patch.location = form.location.trim() === "" ? null : form.location;
    }
    if (showDepartment) {
      patch.department = form.department.trim() === "" ? null : form.department;
    }
    if (showBadges) {
      patch.employmentType =
        form.employmentType === "" ? null : (form.employmentType as EmploymentType);
      patch.workMode = form.workMode === "" ? null : (form.workMode as WorkMode);
      if (form.tenureYears.trim() === "") {
        patch.tenureYears = null;
      } else {
        const n = Number(form.tenureYears);
        if (Number.isFinite(n)) patch.tenureYears = n;
      }
    }
    onChange(patch);
  }

  const isVacant = employee.meta?.role === "vacant";

  return (
    <aside
      data-ananse-inspector
      aria-label={isVacant ? labels.inspectorVacant : labels.inspectorPerson}
      className="pointer-events-auto flex w-64 flex-col gap-3 rounded-md border border-ananse-node-border bg-ananse-node p-3 shadow-ananse-node"
      style={{ maxHeight: "calc(100% - 24px)", overflow: "auto" }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-xs font-bold uppercase tracking-wide text-ananse-node-text">
          {isVacant ? labels.vacantRole : labels.person}
        </h2>
        <button
          type="button"
          className="nodrag nopan rounded px-1.5 py-0.5 text-xs text-ananse-node-text-muted hover:bg-ananse-selection"
          onClick={onClose}
          aria-label={labels.closeInspector}
        >
          ×
        </button>
      </div>
      <div className="text-[10px] text-ananse-node-text-muted">id: {employee.id}</div>
      <div className="flex flex-col gap-2">
        {field(`${baseId}-name`, labels.name, form.name, (v) => set("name", v))}
        {field(`${baseId}-title`, labels.title, form.title, (v) => set("title", v))}
        {showEmail
          ? field(`${baseId}-email`, labels.email, form.email, (v) => set("email", v), {
              type: "email",
            })
          : null}
        {showLocation
          ? field(`${baseId}-location`, labels.location, form.location, (v) => set("location", v))
          : null}
        {showDepartment
          ? field(`${baseId}-department`, labels.department, form.department, (v) =>
              set("department", v),
            )
          : null}
        {showBadges ? (
          <>
            {field(
              `${baseId}-tenure`,
              labels.tenureYears,
              form.tenureYears,
              (v) => set("tenureYears", v),
              {
                type: "number",
                placeholder: "e.g. 3",
              },
            )}
            <div className="flex flex-col gap-0.5 text-[11px] font-medium text-ananse-node-text-muted">
              <label htmlFor={`${baseId}-employment`}>{labels.employmentType}</label>
              <select
                id={`${baseId}-employment`}
                name={`${baseId}-employment`}
                className="nodrag nopan rounded border border-ananse-node-border bg-ananse-bg px-2 py-1 text-xs text-ananse-node-text"
                value={form.employmentType}
                onChange={(ev) => set("employmentType", ev.target.value)}
              >
                <option value="">—</option>
                <option value="employee">employee</option>
                <option value="contractor">contractor</option>
                <option value="intern">intern</option>
              </select>
            </div>
            <div className="flex flex-col gap-0.5 text-[11px] font-medium text-ananse-node-text-muted">
              <label htmlFor={`${baseId}-workmode`}>{labels.workMode}</label>
              <select
                id={`${baseId}-workmode`}
                name={`${baseId}-workmode`}
                className="nodrag nopan rounded border border-ananse-node-border bg-ananse-bg px-2 py-1 text-xs text-ananse-node-text"
                value={form.workMode}
                onChange={(ev) => set("workMode", ev.target.value)}
              >
                <option value="">—</option>
                <option value="onsite">onsite</option>
                <option value="hybrid">hybrid</option>
                <option value="remote">remote</option>
              </select>
            </div>
          </>
        ) : null}
      </div>
      <button
        type="button"
        className="nodrag nopan rounded bg-ananse-focus px-2 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        onClick={commit}
      >
        {labels.applyChanges}
      </button>
    </aside>
  );
}
