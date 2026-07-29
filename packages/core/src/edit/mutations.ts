import { getDescendants, getDirectReports } from "../tree/traverse.js";
import type { Employee, EmploymentType, WorkMode } from "../types.js";

export type MutationResult = { ok: true; employees: Employee[] } | { ok: false; error: string };

function cloneEmployees(employees: Employee[]): Employee[] {
  return employees.map((e) => ({
    ...e,
    ...(e.dottedLineManagerIds ? { dottedLineManagerIds: [...e.dottedLineManagerIds] } : {}),
    ...(e.meta ? { meta: { ...e.meta } } : {}),
  }));
}

/**
 * Change an employee's manager. Rejects self-parent and cycles
 * (new manager cannot be a descendant of the employee).
 */
export function reparentEmployee(
  employees: Employee[],
  employeeId: string,
  newManagerId: string | null,
): MutationResult {
  if (employeeId === newManagerId) {
    return { ok: false, error: "Cannot set an employee as their own manager" };
  }

  const subject = employees.find((e) => e.id === employeeId);
  if (!subject) {
    return { ok: false, error: `Unknown employee id: ${employeeId}` };
  }

  if (newManagerId !== null) {
    const manager = employees.find((e) => e.id === newManagerId);
    if (!manager) {
      return { ok: false, error: `Unknown manager id: ${newManagerId}` };
    }
    const descendantIds = new Set(getDescendants(employees, employeeId).map((e) => e.id));
    if (descendantIds.has(newManagerId)) {
      return { ok: false, error: "Cannot reparent under a descendant (would create a cycle)" };
    }
  }

  const next = cloneEmployees(employees).map((e) =>
    e.id === employeeId ? { ...e, managerId: newManagerId } : e,
  );
  return { ok: true, employees: next };
}

export type AddVacantRoleInput = {
  id?: string;
  title: string;
  managerId: string | null;
  department?: string;
  name?: string;
};

/**
 * Insert a vacant role node (meta.role = "vacant").
 */
export function addVacantRole(employees: Employee[], input: AddVacantRoleInput): MutationResult {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: "Vacant role requires a title" };
  }
  if (input.managerId !== null) {
    const manager = employees.find((e) => e.id === input.managerId);
    if (!manager) {
      return { ok: false, error: `Unknown manager id: ${input.managerId}` };
    }
  }

  const id = input.id ?? `vacant-${cryptoRandomId()}`;
  if (employees.some((e) => e.id === id)) {
    return { ok: false, error: `Employee id already exists: ${id}` };
  }

  const vacant: Employee = {
    id,
    name: input.name ?? "Open Role",
    title,
    managerId: input.managerId,
    meta: { role: "vacant", title },
  };
  if (input.department !== undefined) {
    vacant.department = input.department;
  }

  return { ok: true, employees: [...cloneEmployees(employees), vacant] };
}

/**
 * Remove an employee. Direct reports are re-parented to the removed node's manager.
 */
export function removeEmployee(employees: Employee[], employeeId: string): MutationResult {
  const subject = employees.find((e) => e.id === employeeId);
  if (!subject) {
    return { ok: false, error: `Unknown employee id: ${employeeId}` };
  }

  const parentId = subject.managerId ?? null;
  const reports = getDirectReports(employees, employeeId);
  const reportIds = new Set(reports.map((r) => r.id));

  const next = cloneEmployees(employees)
    .filter((e) => e.id !== employeeId)
    .map((e) => {
      if (!reportIds.has(e.id)) return e;
      return { ...e, managerId: parentId };
    })
    .map((e) => {
      if (!e.dottedLineManagerIds?.includes(employeeId)) return e;
      const dotted = e.dottedLineManagerIds.filter((id) => id !== employeeId);
      const { dottedLineManagerIds: _removed, ...rest } = e;
      if (dotted.length === 0) return rest;
      return { ...rest, dottedLineManagerIds: dotted };
    });

  return { ok: true, employees: next };
}

/**
 * Patch editable fields on an employee. Does not change id or managerId
 * (use reparentEmployee for reporting lines).
 * Pass `null` to clear an optional field.
 */
export type EmployeePatch = {
  name?: string;
  title?: string | null;
  email?: string | null;
  location?: string | null;
  department?: string | null;
  photoUrl?: string | null;
  tenureYears?: number | null;
  employmentType?: EmploymentType | null;
  workMode?: WorkMode | null;
};

export function updateEmployee(
  employees: Employee[],
  employeeId: string,
  patch: EmployeePatch,
): MutationResult {
  const subject = employees.find((e) => e.id === employeeId);
  if (!subject) {
    return { ok: false, error: `Unknown employee id: ${employeeId}` };
  }

  if (patch.name !== undefined && patch.name.trim() === "") {
    return { ok: false, error: "Name cannot be empty" };
  }

  if (patch.tenureYears !== undefined && patch.tenureYears !== null) {
    if (!Number.isFinite(patch.tenureYears) || patch.tenureYears < 0) {
      return { ok: false, error: "tenureYears must be a non-negative number" };
    }
  }

  const next = cloneEmployees(employees).map((e) => {
    if (e.id !== employeeId) return e;
    return applyPatch(e, patch);
  });

  return { ok: true, employees: next };
}

function applyPatch(employee: Employee, patch: EmployeePatch): Employee {
  const result: Employee = {
    id: employee.id,
    name: patch.name !== undefined ? patch.name.trim() : employee.name,
  };

  // Carry manager / structure fields unchanged
  if (employee.managerId !== undefined) result.managerId = employee.managerId;
  if (employee.dottedLineManagerIds !== undefined) {
    result.dottedLineManagerIds = [...employee.dottedLineManagerIds];
  }
  if (employee.meta !== undefined) result.meta = { ...employee.meta };

  setStringField(result, "title", pickString(employee.title, patch.title));
  setStringField(result, "email", pickString(employee.email, patch.email));
  setStringField(result, "location", pickString(employee.location, patch.location));
  setStringField(result, "department", pickString(employee.department, patch.department));
  setStringField(result, "photoUrl", pickString(employee.photoUrl, patch.photoUrl));

  const tenure = pickClearable(employee.tenureYears, patch.tenureYears);
  if (tenure !== undefined) result.tenureYears = tenure;

  const employmentType = pickClearable(employee.employmentType, patch.employmentType);
  if (employmentType !== undefined) result.employmentType = employmentType;

  const workMode = pickClearable(employee.workMode, patch.workMode);
  if (workMode !== undefined) result.workMode = workMode;

  if (result.meta?.role === "vacant" && patch.title !== undefined) {
    const title =
      patch.title === null || patch.title.trim() === "" ? "Open Role" : patch.title.trim();
    result.title = title;
    result.meta = { ...result.meta, title };
  }

  return result;
}

/** undefined patch → keep current; null → clear; string → set */
function pickString(
  current: string | undefined,
  patch: string | null | undefined,
): string | undefined {
  if (patch === undefined) return current;
  if (patch === null || patch.trim() === "") return undefined;
  return patch.trim();
}

function pickClearable<T>(current: T | undefined, patch: T | null | undefined): T | undefined {
  if (patch === undefined) return current;
  if (patch === null) return undefined;
  return patch;
}

function setStringField(
  target: Employee,
  key: "title" | "email" | "location" | "department" | "photoUrl",
  value: string | undefined,
): void {
  if (value !== undefined) target[key] = value;
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}
