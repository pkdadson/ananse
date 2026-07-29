import type { Employee } from "../types.js";

function indexByManager(employees: Employee[]): Map<string | null, Employee[]> {
  const byManager = new Map<string | null, Employee[]>();
  for (const e of employees) {
    const key = e.managerId ?? null;
    const list = byManager.get(key);
    if (list) list.push(e);
    else byManager.set(key, [e]);
  }
  return byManager;
}

export function getDirectReports(employees: Employee[], employeeId: string): Employee[] {
  return indexByManager(employees).get(employeeId) ?? [];
}

export function getDescendants(employees: Employee[], employeeId: string): Employee[] {
  const byManager = indexByManager(employees);
  const result: Employee[] = [];
  const stack: string[] = [employeeId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) break;
    const children = byManager.get(current) ?? [];
    for (const child of children) {
      result.push(child);
      stack.push(child.id);
    }
  }
  return result;
}

export function getAncestors(employees: Employee[], employeeId: string): Employee[] {
  const byId = new Map(employees.map((e) => [e.id, e]));
  const result: Employee[] = [];
  let currentId = byId.get(employeeId)?.managerId ?? null;
  while (currentId) {
    const parent = byId.get(currentId);
    if (!parent) break;
    result.push(parent);
    currentId = parent.managerId ?? null;
  }
  return result;
}

export function getSubtreeIds(employees: Employee[], rootId: string): string[] {
  return [rootId, ...getDescendants(employees, rootId).map((e) => e.id)];
}
