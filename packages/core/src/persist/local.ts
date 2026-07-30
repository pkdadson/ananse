import type { Employee } from "../types.js";

/**
 * Read org chart JSON from localStorage. Returns null if missing/invalid.
 */
export function loadOrgFromStorage(key: string): Employee[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as Employee[];
  } catch {
    return null;
  }
}

/**
 * Persist employees to localStorage. Returns false if storage unavailable.
 */
export function saveOrgToStorage(key: string, employees: Employee[]): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(employees));
    return true;
  } catch {
    return false;
  }
}

export function clearOrgStorage(key: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Debounced saver for onChange handlers.
 *
 * @example
 * const save = createDebouncedOrgSaver("org-v1", 400);
 * <OrgChart defaultData={…} mode="edit" onChange={save} />
 */
export function createDebouncedOrgSaver(key: string, ms = 400): (employees: Employee[]) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (employees: Employee[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      saveOrgToStorage(key, employees);
    }, ms);
  };
}
