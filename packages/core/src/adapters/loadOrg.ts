import { employeeSchema, orgChartSchema } from "../schemas.js";
import type { Employee } from "../types.js";
import { parseEmployeesCsv } from "./csv.js";
import { type HrisRecord, type NestedHrisNode, fromHrisJson, fromNestedTree } from "./hris.js";

export type LoadOrgIssue = {
  /** Machine-readable code */
  code: string;
  /** Human-friendly message (safe to show in UI) */
  message: string;
  path?: string;
};

export type LoadOrgResult =
  | { ok: true; employees: Employee[]; warnings: string[] }
  | { ok: false; employees: Employee[]; errors: LoadOrgIssue[]; warnings: string[] };

export type LoadOrgSource =
  | { type: "employees"; data: unknown }
  | { type: "csv"; text: string }
  | { type: "hris"; data: unknown }
  | { type: "nested"; data: unknown };

function issue(code: string, message: string, path?: string): LoadOrgIssue {
  return path ? { code, message, path } : { code, message };
}

function toEmployee(partial: {
  id: string;
  name: string;
  title?: string;
  photoUrl?: string;
  department?: string;
  managerId?: string | null;
  email?: string;
  location?: string;
  tenureYears?: number;
  employmentType?: Employee["employmentType"];
  workMode?: Employee["workMode"];
  meta?: Record<string, unknown>;
}): Employee {
  const emp: Employee = { id: partial.id, name: partial.name };
  if (partial.title !== undefined) emp.title = partial.title;
  if (partial.photoUrl !== undefined) emp.photoUrl = partial.photoUrl;
  if (partial.department !== undefined) emp.department = partial.department;
  if (partial.managerId !== undefined) emp.managerId = partial.managerId;
  if (partial.email !== undefined) emp.email = partial.email;
  if (partial.location !== undefined) emp.location = partial.location;
  if (partial.tenureYears !== undefined) emp.tenureYears = partial.tenureYears;
  if (partial.employmentType !== undefined) emp.employmentType = partial.employmentType;
  if (partial.workMode !== undefined) emp.workMode = partial.workMode;
  if (partial.meta !== undefined) emp.meta = partial.meta;
  return emp;
}

/**
 * Normalize a single loose record into an Employee-shaped object.
 * Accepts common aliases (employeeId, fullName, reportsTo, …).
 */
export function normalizeEmployeeRecord(
  raw: unknown,
  index = 0,
): {
  employee?: Employee;
  errors: LoadOrgIssue[];
} {
  if (!raw || typeof raw !== "object") {
    return {
      errors: [issue("invalid_row", `Row ${index}: expected an object`, String(index))],
    };
  }
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? r.employeeId ?? r.employee_id ?? r.uuid ?? "").trim();
  const name = String(r.name ?? r.fullName ?? r.full_name ?? r.displayName ?? "").trim();
  const errors: LoadOrgIssue[] = [];
  if (!id) errors.push(issue("missing_id", `Row ${index}: missing id`, String(index)));
  if (!name) errors.push(issue("missing_name", `Row ${index}: missing name`, String(index)));
  if (errors.length) return { errors };

  const managerRaw = r.managerId ?? r.manager_id ?? r.reportsTo ?? r.reports_to ?? r.parentId;
  let managerId: string | null;
  if (managerRaw === null || managerRaw === undefined || managerRaw === "") {
    managerId = null;
  } else {
    managerId = String(managerRaw);
  }

  const title = r.title != null || r.jobTitle != null ? String(r.title ?? r.jobTitle) : undefined;
  const photoUrl =
    r.photoUrl != null || r.avatar != null || r.photo != null
      ? String(r.photoUrl ?? r.avatar ?? r.photo)
      : undefined;
  const department =
    r.department != null || r.dept != null ? String(r.department ?? r.dept) : undefined;
  const emailRaw = r.email != null ? String(r.email) : undefined;
  const email = emailRaw?.includes("@") ? emailRaw : undefined;
  const location =
    r.location != null || r.office != null ? String(r.location ?? r.office) : undefined;
  const tenureYears = typeof r.tenureYears === "number" ? r.tenureYears : undefined;

  // Soft schema check on core fields
  const parsed = employeeSchema.safeParse({
    id,
    name,
    managerId,
    ...(title !== undefined ? { title } : {}),
    ...(department !== undefined ? { department } : {}),
    ...(email !== undefined ? { email } : {}),
    ...(location !== undefined ? { location } : {}),
    ...(tenureYears !== undefined ? { tenureYears } : {}),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.issues.map((i) =>
        issue("schema", `Row ${index}: ${i.message}`, i.path.join(".") || String(index)),
      ),
    };
  }

  return {
    employee: toEmployee({
      id,
      name,
      managerId,
      ...(title !== undefined ? { title } : {}),
      ...(photoUrl !== undefined ? { photoUrl } : {}),
      ...(department !== undefined ? { department } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(tenureYears !== undefined ? { tenureYears } : {}),
      ...(r.meta && typeof r.meta === "object" ? { meta: r.meta as Record<string, unknown> } : {}),
    }),
    errors: [],
  };
}

/**
 * One-call loader: employees JSON, CSV text, HRIS records, or nested tree.
 * Always returns structured errors — never throws for bad data.
 */
export function loadOrg(source: LoadOrgSource): LoadOrgResult {
  const warnings: string[] = [];
  const errors: LoadOrgIssue[] = [];

  if (source.type === "csv") {
    try {
      const result = parseEmployeesCsv(source.text);
      warnings.push(...result.warnings);
      if (result.employees.length === 0) {
        return {
          ok: false,
          employees: [],
          errors: [
            issue(
              "empty_csv",
              result.warnings[0] ?? "No employees found in CSV. Need columns: id, name, managerId.",
            ),
          ],
          warnings,
        };
      }
      const validated = orgChartSchema.safeParse(result.employees);
      if (!validated.success) {
        for (const i of validated.error.issues) {
          errors.push(issue("org_invalid", i.message));
        }
        return { ok: false, employees: result.employees, errors, warnings };
      }
      return { ok: true, employees: validated.data as Employee[], warnings };
    } catch (err) {
      return {
        ok: false,
        employees: [],
        errors: [issue("csv_parse", err instanceof Error ? err.message : "Failed to parse CSV")],
        warnings,
      };
    }
  }

  if (source.type === "hris") {
    try {
      if (!Array.isArray(source.data)) {
        return {
          ok: false,
          employees: [],
          errors: [issue("hris_not_array", "HRIS payload must be an array of records.")],
          warnings,
        };
      }
      const result = fromHrisJson(source.data as HrisRecord[]);
      warnings.push(...result.warnings);
      if (result.employees.length === 0) {
        return {
          ok: false,
          employees: [],
          errors: [issue("empty_hris", "No employees found in HRIS payload.")],
          warnings,
        };
      }
      return { ok: true, employees: result.employees, warnings };
    } catch (err) {
      return {
        ok: false,
        employees: [],
        errors: [
          issue("hris_parse", err instanceof Error ? err.message : "Failed to parse HRIS JSON"),
        ],
        warnings,
      };
    }
  }

  if (source.type === "nested") {
    try {
      if (!source.data || typeof source.data !== "object") {
        return {
          ok: false,
          employees: [],
          errors: [issue("nested_invalid", "Nested tree must be an object with id/name/children.")],
          warnings,
        };
      }
      // API accepts a single root or an array of roots
      const roots = Array.isArray(source.data)
        ? (source.data as NestedHrisNode[])
        : [source.data as NestedHrisNode];
      const result = fromNestedTree(roots);
      warnings.push(...result.warnings);
      if (result.employees.length === 0) {
        return {
          ok: false,
          employees: [],
          errors: [issue("empty_nested", "Nested tree produced zero employees.")],
          warnings,
        };
      }
      return { ok: true, employees: result.employees, warnings };
    } catch (err) {
      return {
        ok: false,
        employees: [],
        errors: [
          issue("nested_parse", err instanceof Error ? err.message : "Failed to parse nested tree"),
        ],
        warnings,
      };
    }
  }

  // type === "employees"
  if (!Array.isArray(source.data)) {
    return {
      ok: false,
      employees: [],
      errors: [
        issue(
          "not_array",
          "Expected an array of people. Tip: use { type: 'nested', data } for a tree, or { type: 'csv', text }.",
        ),
      ],
      warnings,
    };
  }

  const employees: Employee[] = [];
  source.data.forEach((row, index) => {
    const { employee, errors: rowErrors } = normalizeEmployeeRecord(row, index);
    if (employee) employees.push(employee);
    errors.push(...rowErrors);
  });

  if (employees.length === 0) {
    return {
      ok: false,
      employees: [],
      errors:
        errors.length > 0
          ? errors
          : [issue("empty", "No valid employees. Each row needs id and name.")],
      warnings,
    };
  }

  // Dangling managers → warnings, not hard fail (layout still works)
  const ids = new Set(employees.map((e) => e.id));
  for (const e of employees) {
    if (e.managerId && !ids.has(e.managerId)) {
      warnings.push(
        `${e.name} (${e.id}) reports to unknown managerId "${e.managerId}" — treated as root.`,
      );
      e.managerId = null;
    }
  }

  const strict = orgChartSchema.safeParse(employees);
  if (!strict.success) {
    for (const i of strict.error.issues) {
      warnings.push(i.message);
    }
  }

  if (errors.length > 0 && employees.length > 0) {
    for (const e of errors) warnings.push(e.message);
    return { ok: true, employees, warnings };
  }

  if (errors.length > 0) {
    return { ok: false, employees, errors, warnings };
  }

  return { ok: true, employees, warnings };
}

/** Format load errors for UI banners / console. */
export function formatLoadOrgErrors(result: LoadOrgResult): string {
  if (result.ok) {
    return result.warnings.length ? result.warnings.join("\n") : "";
  }
  const lines = result.errors.map((e) => e.message);
  if (result.warnings.length) lines.push(...result.warnings);
  return lines.join("\n");
}
