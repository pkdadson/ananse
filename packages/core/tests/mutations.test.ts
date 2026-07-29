import { describe, expect, it } from "vitest";
import {
  addVacantRole,
  removeEmployee,
  reparentEmployee,
  updateEmployee,
} from "../src/edit/mutations.js";
import type { Employee } from "../src/types.js";

const base: Employee[] = [
  { id: "ceo", name: "CEO", managerId: null },
  { id: "vp", name: "VP", managerId: "ceo" },
  { id: "mgr", name: "Mgr", managerId: "vp" },
  { id: "ic", name: "IC", managerId: "mgr" },
];

describe("reparentEmployee", () => {
  it("moves a node under a new manager", () => {
    const result = reparentEmployee(base, "ic", "vp");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.employees.find((e) => e.id === "ic")?.managerId).toBe("vp");
  });

  it("rejects reparent under a descendant", () => {
    const result = reparentEmployee(base, "vp", "ic");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/cycle/i);
  });

  it("allows promoting to root", () => {
    const result = reparentEmployee(base, "vp", null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.employees.find((e) => e.id === "vp")?.managerId).toBeNull();
  });
});

describe("addVacantRole", () => {
  it("appends a vacant node under a manager", () => {
    const result = addVacantRole(base, {
      id: "open-1",
      title: "Staff Engineer",
      managerId: "vp",
      department: "engineering",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const v = result.employees.find((e) => e.id === "open-1");
    expect(v?.meta?.role).toBe("vacant");
    expect(v?.title).toBe("Staff Engineer");
    expect(v?.managerId).toBe("vp");
  });

  it("rejects empty title", () => {
    const result = addVacantRole(base, { title: "  ", managerId: "ceo" });
    expect(result.ok).toBe(false);
  });
});

describe("removeEmployee", () => {
  it("reparents children to the removed node's manager", () => {
    const result = removeEmployee(base, "mgr");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.employees.find((e) => e.id === "mgr")).toBeUndefined();
    expect(result.employees.find((e) => e.id === "ic")?.managerId).toBe("vp");
  });
});

describe("updateEmployee", () => {
  it("patches name and email", () => {
    const result = updateEmployee(base, "ic", {
      name: "Staff Engineer",
      email: "ic@example.com",
      title: "IC",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.employees.find((e) => e.id === "ic")).toMatchObject({
      name: "Staff Engineer",
      email: "ic@example.com",
      title: "IC",
      managerId: "mgr",
    });
  });

  it("clears optional fields with null", () => {
    const withEmail: Employee[] = [
      ...base.slice(0, 3),
      { id: "ic", name: "IC", managerId: "mgr", email: "ic@example.com", workMode: "remote" },
    ];
    const result = updateEmployee(withEmail, "ic", { email: null, workMode: null });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ic = result.employees.find((e) => e.id === "ic");
    expect(ic?.email).toBeUndefined();
    expect(ic?.workMode).toBeUndefined();
  });

  it("rejects empty name", () => {
    const result = updateEmployee(base, "ic", { name: "  " });
    expect(result.ok).toBe(false);
  });
});
