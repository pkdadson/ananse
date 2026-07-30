import { describe, expect, it } from "vitest";
import { formatLoadOrgErrors, loadOrg } from "../src/adapters/loadOrg.js";

describe("loadOrg", () => {
  it("loads a plain employees array with aliases", () => {
    const result = loadOrg({
      type: "employees",
      data: [
        { employeeId: "1", fullName: "Ada", jobTitle: "CEO" },
        { id: "2", name: "Grace", reportsTo: "1", dept: "engineering" },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.employees).toHaveLength(2);
    expect(result.employees[0]?.id).toBe("1");
    expect(result.employees[1]?.managerId).toBe("1");
    expect(result.employees[1]?.department).toBe("engineering");
  });

  it("returns friendly errors for non-arrays", () => {
    const result = loadOrg({ type: "employees", data: { nope: true } });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(formatLoadOrgErrors(result)).toMatch(/array of people/i);
  });

  it("warns and repairs dangling manager ids", () => {
    const result = loadOrg({
      type: "employees",
      data: [{ id: "a", name: "Orphan", managerId: "missing" }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.employees[0]?.managerId).toBeNull();
    expect(result.warnings.some((w) => w.includes("unknown managerId"))).toBe(true);
  });

  it("parses CSV text", () => {
    const csv = "id,name,managerId\nceo,Ada,\ncto,Grace,ceo\n";
    const result = loadOrg({ type: "csv", text: csv });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.employees).toHaveLength(2);
  });
});
