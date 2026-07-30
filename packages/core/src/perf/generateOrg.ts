import type { Employee } from "../types.js";

export type GenerateOrgOptions = {
  /** Total people including root. Default 500. */
  size?: number;
  /** Average branching factor. Default 3. */
  branching?: number;
};

/** First names for stress-demo people (searchable, demo-friendly). */
const FIRST_NAMES = [
  "Ava",
  "Noah",
  "Mia",
  "Liam",
  "Zoe",
  "Ethan",
  "Iris",
  "Omar",
  "Priya",
  "Kai",
  "Sofia",
  "Marcus",
  "Elena",
  "Jordan",
  "Yuki",
  "Sam",
  "Amara",
  "Leo",
  "Nina",
  "Diego",
  "Grace",
  "Hassan",
  "Chloe",
  "Raj",
  "Maya",
  "Felix",
  "Aisha",
  "Theo",
  "Lina",
  "Ben",
] as const;

const LAST_NAMES = [
  "Chen",
  "Patel",
  "Garcia",
  "Kim",
  "Nguyen",
  "Silva",
  "Okeke",
  "Rossi",
  "Anders",
  "Park",
  "Mensah",
  "Kowalski",
  "Santos",
  "Ibrahim",
  "Murphy",
  "Sato",
  "Cohen",
  "Ali",
  "Berg",
  "Duarte",
] as const;

const DEPARTMENTS = ["engineering", "design", "product", "sales"] as const;

function personName(index: number): string {
  const first = FIRST_NAMES[index % FIRST_NAMES.length] ?? "Alex";
  const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length] ?? "Lee";
  // Disambiguate repeats once we cycle the full grid
  const cycle = Math.floor(index / (FIRST_NAMES.length * LAST_NAMES.length));
  return cycle > 0 ? `${first} ${last} ${cycle + 1}` : `${first} ${last}`;
}

/**
 * Synthetic org tree for performance benches and stress demos.
 * Names are human-readable so search demos work without opaque ids.
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
        const id = `n${nextId}`;
        const department = DEPARTMENTS[nextId % DEPARTMENTS.length] ?? "engineering";
        employees.push({
          id,
          name: personName(nextId),
          title: nextId % 7 === 0 ? "Manager" : "IC",
          managerId: parent,
          department,
        });
        nextId += 1;
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
