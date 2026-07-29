import type { Employee } from "../types.js";

export type GenerateOrgOptions = {
  /** Total people including root. Default 500. */
  size?: number;
  /** Average branching factor. Default 3. */
  branching?: number;
};

/**
 * Synthetic org tree for performance benches and stress demos.
 */
export function generateOrgChart(options: GenerateOrgOptions = {}): Employee[] {
  const size = Math.max(1, options.size ?? 500);
  const branching = Math.max(1, options.branching ?? 3);
  const employees: Employee[] = [];
  employees.push({
    id: "n0",
    name: "Root Leader",
    title: "CEO",
    managerId: null,
    department: "operations",
    meta: { role: "executive" },
  });

  let nextId = 1;
  let frontier = ["n0"];

  while (employees.length < size && frontier.length > 0) {
    const nextFrontier: string[] = [];
    for (const parent of frontier) {
      if (employees.length >= size) break;
      const remaining = size - employees.length;
      const kids = Math.min(branching, remaining);
      for (let i = 0; i < kids; i++) {
        if (employees.length >= size) break;
        const id = `n${nextId++}`;
        const departments = ["engineering", "design", "product", "sales"] as const;
        const department = departments[nextId % 4] ?? "engineering";
        employees.push({
          id,
          name: `Employee ${id}`,
          title: nextId % 7 === 0 ? "Manager" : "IC",
          managerId: parent,
          department,
        });
        nextFrontier.push(id);
      }
    }
    frontier = nextFrontier;
    if (frontier.length === 0 && employees.length < size) {
      // fallback: attach remaining to root
      frontier = ["n0"];
    }
  }

  return employees;
}
