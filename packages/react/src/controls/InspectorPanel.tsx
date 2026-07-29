import type { Employee, EmployeePatch, EmploymentType, WorkMode } from "@canvas/core";
import { type ReactElement, useEffect, useState } from "react";

export type InspectorPanelProps = {
  employee: Employee;
  onChange: (patch: EmployeePatch) => void;
  onClose: () => void;
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
  label: string,
  value: string,
  onChange: (v: string) => void,
  opts?: { type?: string; placeholder?: string },
): ReactElement {
  return (
    <label className="flex flex-col gap-0.5 text-[11px] font-medium text-canvas-node-text-muted">
      {label}
      <input
        className="nodrag nopan rounded border border-canvas-node-border bg-canvas-bg px-2 py-1 text-xs text-canvas-node-text outline-none focus:border-canvas-focus"
        value={value}
        type={opts?.type ?? "text"}
        placeholder={opts?.placeholder}
        onChange={(ev) => onChange(ev.target.value)}
      />
    </label>
  );
}

export function InspectorPanel({ employee, onChange, onClose }: InspectorPanelProps): ReactElement {
  const [form, setForm] = useState<FormState>(() => toForm(employee));

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
      email: form.email.trim() === "" ? null : form.email,
      location: form.location.trim() === "" ? null : form.location,
      department: form.department.trim() === "" ? null : form.department,
      employmentType: form.employmentType === "" ? null : (form.employmentType as EmploymentType),
      workMode: form.workMode === "" ? null : (form.workMode as WorkMode),
    };
    if (form.tenureYears.trim() === "") {
      patch.tenureYears = null;
    } else {
      const n = Number(form.tenureYears);
      if (Number.isFinite(n)) patch.tenureYears = n;
    }
    onChange(patch);
  }

  const isVacant = employee.meta?.role === "vacant";

  return (
    <aside
      data-canvas-inspector
      className="pointer-events-auto flex w-64 flex-col gap-3 rounded-md border border-canvas-node-border bg-canvas-node p-3 shadow-canvas-node"
      style={{ maxHeight: "calc(100% - 24px)", overflow: "auto" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold uppercase tracking-wide text-canvas-node-text">
          {isVacant ? "Vacant role" : "Person"}
        </div>
        <button
          type="button"
          className="nodrag nopan rounded px-1.5 py-0.5 text-xs text-canvas-node-text-muted hover:bg-canvas-selection"
          onClick={onClose}
          aria-label="Close inspector"
        >
          ×
        </button>
      </div>
      <div className="text-[10px] text-canvas-node-text-muted">id: {employee.id}</div>
      <div className="flex flex-col gap-2">
        {field("Name", form.name, (v) => set("name", v))}
        {field("Title", form.title, (v) => set("title", v))}
        {field("Email", form.email, (v) => set("email", v), { type: "email" })}
        {field("Location", form.location, (v) => set("location", v))}
        {field("Department", form.department, (v) => set("department", v))}
        {field("Tenure (years)", form.tenureYears, (v) => set("tenureYears", v), {
          type: "number",
          placeholder: "e.g. 3",
        })}
        <label className="flex flex-col gap-0.5 text-[11px] font-medium text-canvas-node-text-muted">
          Employment type
          <select
            className="nodrag nopan rounded border border-canvas-node-border bg-canvas-bg px-2 py-1 text-xs text-canvas-node-text"
            value={form.employmentType}
            onChange={(ev) => set("employmentType", ev.target.value)}
          >
            <option value="">—</option>
            <option value="employee">employee</option>
            <option value="contractor">contractor</option>
            <option value="intern">intern</option>
          </select>
        </label>
        <label className="flex flex-col gap-0.5 text-[11px] font-medium text-canvas-node-text-muted">
          Work mode
          <select
            className="nodrag nopan rounded border border-canvas-node-border bg-canvas-bg px-2 py-1 text-xs text-canvas-node-text"
            value={form.workMode}
            onChange={(ev) => set("workMode", ev.target.value)}
          >
            <option value="">—</option>
            <option value="onsite">onsite</option>
            <option value="hybrid">hybrid</option>
            <option value="remote">remote</option>
          </select>
        </label>
      </div>
      <button
        type="button"
        className="nodrag nopan rounded bg-canvas-focus px-2 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        onClick={commit}
      >
        Apply changes
      </button>
    </aside>
  );
}
