import type { Employee, EmploymentType, WorkMode } from "../types.js";

/**
 * Loose HRIS-shaped record. Field names match common exports (Workday-ish / Bamboo-ish).
 * Unknown keys are ignored; nested reports are handled by {@link fromNestedTree}.
 */
export type HrisRecord = {
  id?: string | number;
  employeeId?: string | number;
  employee_id?: string | number;
  name?: string;
  fullName?: string;
  displayName?: string;
  title?: string;
  jobTitle?: string;
  department?: string;
  dept?: string;
  managerId?: string | number | null;
  manager_id?: string | number | null;
  reportsTo?: string | number | null;
  email?: string;
  workEmail?: string;
  location?: string;
  officeLocation?: string;
  photoUrl?: string;
  photoURL?: string;
  tenureYears?: number;
  yearsOfService?: number;
  employmentType?: string;
  employeeType?: string;
  workMode?: string;
  remoteStatus?: string;
  dottedLineManagerIds?: Array<string | number>;
  dotted_line_manager_ids?: Array<string | number>;
  [key: string]: unknown;
};

export type NestedHrisNode = HrisRecord & {
  children?: NestedHrisNode[];
  reports?: NestedHrisNode[];
  directReports?: NestedHrisNode[];
};

function asId(v: string | number | null | undefined): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

function pickId(r: HrisRecord): string | undefined {
  return asId(r.id) ?? asId(r.employeeId) ?? asId(r.employee_id);
}

function pickName(r: HrisRecord): string | undefined {
  const n = r.name ?? r.fullName ?? r.displayName;
  if (typeof n !== "string") return undefined;
  const t = n.trim();
  return t === "" ? undefined : t;
}

function pickManagerId(r: HrisRecord): string | null | undefined {
  if ("managerId" in r) {
    if (r.managerId === null) return null;
    return asId(r.managerId) ?? null;
  }
  if ("manager_id" in r) {
    if (r.manager_id === null) return null;
    return asId(r.manager_id) ?? null;
  }
  if ("reportsTo" in r) {
    if (r.reportsTo === null) return null;
    return asId(r.reportsTo) ?? null;
  }
  return undefined;
}

const EMPLOYMENT = new Set(["employee", "contractor", "intern"]);
const WORK = new Set(["onsite", "hybrid", "remote"]);

function asEmployment(v: unknown): EmploymentType | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim().toLowerCase();
  return EMPLOYMENT.has(s) ? (s as EmploymentType) : undefined;
}

function asWorkMode(v: unknown): WorkMode | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim().toLowerCase();
  // common aliases
  if (s === "wfh" || s === "work from home") return "remote";
  return WORK.has(s) ? (s as WorkMode) : undefined;
}

/**
 * Map a single HRIS-like record to Employee. Returns null if id or name missing.
 */
export function hrisRecordToEmployee(r: HrisRecord): Employee | null {
  const id = pickId(r);
  const name = pickName(r);
  if (!id || !name) return null;

  const title =
    typeof r.title === "string" ? r.title : typeof r.jobTitle === "string" ? r.jobTitle : undefined;
  const department =
    typeof r.department === "string"
      ? r.department
      : typeof r.dept === "string"
        ? r.dept
        : undefined;
  const email =
    typeof r.email === "string"
      ? r.email
      : typeof r.workEmail === "string"
        ? r.workEmail
        : undefined;
  const location =
    typeof r.location === "string"
      ? r.location
      : typeof r.officeLocation === "string"
        ? r.officeLocation
        : undefined;
  const photoUrl =
    typeof r.photoUrl === "string"
      ? r.photoUrl
      : typeof r.photoURL === "string"
        ? r.photoURL
        : undefined;

  const tenureYears =
    typeof r.tenureYears === "number"
      ? r.tenureYears
      : typeof r.yearsOfService === "number"
        ? r.yearsOfService
        : undefined;

  const employmentType = asEmployment(r.employmentType ?? r.employeeType);
  const workMode = asWorkMode(r.workMode ?? r.remoteStatus);

  const dottedSrc = r.dottedLineManagerIds ?? r.dotted_line_manager_ids;
  const dottedLineManagerIds = Array.isArray(dottedSrc)
    ? dottedSrc.map((x) => String(x)).filter(Boolean)
    : undefined;

  const managerId = pickManagerId(r);

  const employee: Employee = { id, name };
  if (title !== undefined) employee.title = title;
  if (department !== undefined) employee.department = department;
  if (email !== undefined) employee.email = email;
  if (location !== undefined) employee.location = location;
  if (photoUrl !== undefined) employee.photoUrl = photoUrl;
  if (tenureYears !== undefined) employee.tenureYears = tenureYears;
  if (employmentType !== undefined) employee.employmentType = employmentType;
  if (workMode !== undefined) employee.workMode = workMode;
  if (managerId !== undefined) employee.managerId = managerId;
  if (dottedLineManagerIds && dottedLineManagerIds.length > 0) {
    employee.dottedLineManagerIds = dottedLineManagerIds;
  }
  return employee;
}

export type FromHrisResult = {
  employees: Employee[];
  warnings: string[];
};

/**
 * Convert a flat array of HRIS-shaped records into Employee[].
 */
export function fromHrisJson(records: HrisRecord[]): FromHrisResult {
  const warnings: string[] = [];
  const employees: Employee[] = [];
  records.forEach((r, i) => {
    const e = hrisRecordToEmployee(r);
    if (!e) {
      warnings.push(`Record ${i}: skipped — missing id or name`);
      return;
    }
    employees.push(e);
  });
  return { employees, warnings };
}

/**
 * Flatten a nested org tree (children / reports / directReports) into Employee[]
 * with managerId edges. Root nodes get managerId: null.
 */
export function fromNestedTree(roots: NestedHrisNode[]): FromHrisResult {
  const warnings: string[] = [];
  const employees: Employee[] = [];
  const seen = new Set<string>();

  function walk(node: NestedHrisNode, parentId: string | null): void {
    const base = hrisRecordToEmployee(node);
    if (!base) {
      warnings.push(`Nested node skipped — missing id or name (parent=${parentId ?? "root"})`);
      return;
    }
    if (seen.has(base.id)) {
      warnings.push(`Duplicate id "${base.id}" in nested tree — skipped`);
      return;
    }
    seen.add(base.id);

    // Nested structure wins over any manager field on the node
    employees.push({ ...base, managerId: parentId });

    const kids = node.children ?? node.reports ?? node.directReports ?? [];
    for (const child of kids) {
      walk(child, base.id);
    }
  }

  for (const root of roots) {
    walk(root, null);
  }

  return { employees, warnings };
}
