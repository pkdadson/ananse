import type { Employee } from "../types.js";

export function searchEmployees(employees: Employee[], query: string): Employee[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  return employees.filter((e) => {
    const haystack = [e.name, e.title ?? "", e.department ?? "", e.email ?? "", e.location ?? ""]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
