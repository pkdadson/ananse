import { getDescendants, getDirectReports } from "../tree/traverse.js";
import type { Employee } from "../types.js";

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
    // Drop dangling dotted-line refs to the removed id
    .map((e) => {
      if (!e.dottedLineManagerIds?.includes(employeeId)) return e;
      const dotted = e.dottedLineManagerIds.filter((id) => id !== employeeId);
      const { dottedLineManagerIds: _removed, ...rest } = e;
      if (dotted.length === 0) return rest;
      return { ...rest, dottedLineManagerIds: dotted };
    });

  return { ok: true, employees: next };
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}
