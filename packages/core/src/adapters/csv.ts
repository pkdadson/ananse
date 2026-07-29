import type { Employee, EmploymentType, WorkMode } from "../types.js";

export type ParseEmployeesCsvOptions = {
  /** When true (default), first row is headers. */
  hasHeader?: boolean;
};

export type ParseEmployeesCsvResult = {
  employees: Employee[];
  /** Non-fatal row issues (skipped or partial). */
  warnings: string[];
};

const EMPLOYMENT_TYPES = new Set<EmploymentType>(["employee", "contractor", "intern"]);
const WORK_MODES = new Set<WorkMode>(["onsite", "hybrid", "remote"]);

/** Normalize header keys: "Manager ID" → "managerid", "e-mail" → "email". */
function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

const HEADER_ALIASES: Record<string, keyof Employee | "dottedlinemanagerids"> = {
  id: "id",
  employeeid: "id",
  empid: "id",
  name: "name",
  fullname: "name",
  displayname: "name",
  title: "title",
  jobtitle: "title",
  position: "title",
  photourl: "photoUrl",
  photo: "photoUrl",
  avatar: "photoUrl",
  department: "department",
  dept: "department",
  managerid: "managerId",
  manager: "managerId",
  reportsto: "managerId",
  email: "email",
  mail: "email",
  location: "location",
  office: "location",
  city: "location",
  tenureyears: "tenureYears",
  tenure: "tenureYears",
  yearsoftenure: "tenureYears",
  employmenttype: "employmentType",
  employeetype: "employmentType",
  type: "employmentType",
  workmode: "workMode",
  remotestatus: "workMode",
  workarrangement: "workMode",
  dottedlinemanagerids: "dottedlinemanagerids",
  dottedline: "dottedlinemanagerids",
};

/**
 * Minimal RFC4180-ish CSV row parser (handles quotes and commas inside quotes).
 */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    // Skip completely empty trailing lines
    if (row.length === 1 && row[0] === "" && rows.length > 0) {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text.charAt(i);
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      pushField();
      i += 1;
      continue;
    }
    if (ch === "\n") {
      pushField();
      pushRow();
      i += 1;
      continue;
    }
    if (ch === "\r") {
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  // last field/row
  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }
  return rows;
}

function emptyToUndefined(v: string): string | undefined {
  const t = v.trim();
  return t === "" ? undefined : t;
}

function parseEmploymentType(raw: string | undefined): EmploymentType | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase() as EmploymentType;
  return EMPLOYMENT_TYPES.has(v) ? v : undefined;
}

function parseWorkMode(raw: string | undefined): WorkMode | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase() as WorkMode;
  return WORK_MODES.has(v) ? v : undefined;
}

/**
 * Parse a CSV string into Employee[].
 * Required columns (by alias): id, name.
 * Optional: title, photoUrl, department, managerId, email, location,
 * tenureYears, employmentType, workMode, dottedLineManagerIds (semicolon-separated).
 */
export function parseEmployeesCsv(
  csv: string,
  options: ParseEmployeesCsvOptions = {},
): ParseEmployeesCsvResult {
  const hasHeader = options.hasHeader ?? true;
  const rows = parseCsvRows(csv.trim());
  const warnings: string[] = [];

  if (rows.length === 0) {
    return { employees: [], warnings: ["CSV is empty"] };
  }

  let headers: string[];
  let dataRows: string[][];

  if (hasHeader) {
    headers = (rows[0] ?? []).map(normalizeHeader);
    dataRows = rows.slice(1);
  } else {
    headers = ["id", "name", "title", "managerid", "department", "email"];
    dataRows = rows;
  }

  const colIndex = new Map<string, number>();
  headers.forEach((h, idx) => {
    const mapped = HEADER_ALIASES[h];
    if (mapped) colIndex.set(mapped, idx);
  });

  if (!colIndex.has("id") || !colIndex.has("name")) {
    return {
      employees: [],
      warnings: ["CSV must include id and name columns (or aliases like employeeId, fullName)"],
    };
  }

  const employees: Employee[] = [];

  dataRows.forEach((cells, rowIdx) => {
    const line = rowIdx + (hasHeader ? 2 : 1);
    const get = (key: string): string | undefined => {
      const idx = colIndex.get(key);
      if (idx === undefined) return undefined;
      return emptyToUndefined(cells[idx] ?? "");
    };

    const id = get("id");
    const name = get("name");
    if (!id || !name) {
      warnings.push(`Row ${line}: skipped — missing id or name`);
      return;
    }

    const tenureRaw = get("tenureYears");
    let tenureYears: number | undefined;
    if (tenureRaw !== undefined) {
      const n = Number(tenureRaw);
      if (Number.isFinite(n) && n >= 0) tenureYears = n;
      else warnings.push(`Row ${line}: ignored invalid tenureYears "${tenureRaw}"`);
    }

    const employmentRaw = get("employmentType");
    const employmentType = parseEmploymentType(employmentRaw);
    if (employmentRaw && !employmentType) {
      warnings.push(`Row ${line}: ignored invalid employmentType "${employmentRaw}"`);
    }

    const workRaw = get("workMode");
    const workMode = parseWorkMode(workRaw);
    if (workRaw && !workMode) {
      warnings.push(`Row ${line}: ignored invalid workMode "${workRaw}"`);
    }

    const dottedRaw = get("dottedlinemanagerids");
    const dottedLineManagerIds = dottedRaw
      ? dottedRaw
          .split(/[;|]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    // If the manager column exists: empty / "null" → root (null); else manager id string.
    // If the column is absent entirely: leave managerId unset.
    let managerId: string | null | undefined;
    if (colIndex.has("managerId")) {
      const idx = colIndex.get("managerId");
      const raw = (idx === undefined ? "" : (cells[idx] ?? "")).trim();
      managerId = raw === "" || raw.toLowerCase() === "null" ? null : raw;
    }

    const employee: Employee = { id, name };
    const title = get("title");
    if (title !== undefined) employee.title = title;
    const photoUrl = get("photoUrl");
    if (photoUrl !== undefined) employee.photoUrl = photoUrl;
    const department = get("department");
    if (department !== undefined) employee.department = department;
    if (managerId !== undefined) employee.managerId = managerId;
    const email = get("email");
    if (email !== undefined) employee.email = email;
    const location = get("location");
    if (location !== undefined) employee.location = location;
    if (tenureYears !== undefined) employee.tenureYears = tenureYears;
    if (employmentType !== undefined) employee.employmentType = employmentType;
    if (workMode !== undefined) employee.workMode = workMode;
    if (dottedLineManagerIds && dottedLineManagerIds.length > 0) {
      employee.dottedLineManagerIds = dottedLineManagerIds;
    }

    employees.push(employee);
  });

  return { employees, warnings };
}
