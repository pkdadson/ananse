import { describe, expect, it } from "vitest";
import { fromHrisJson, fromNestedTree, hrisRecordToEmployee } from "../src/adapters/hris.js";

describe("hrisRecordToEmployee", () => {
  it("maps Workday-ish aliases", () => {
    const e = hrisRecordToEmployee({
      employeeId: 42,
      fullName: "Ada Lovelace",
      jobTitle: "CEO",
      manager_id: null,
      workEmail: "ada@example.com",
      officeLocation: "London",
      yearsOfService: 10,
      employeeType: "employee",
      remoteStatus: "hybrid",
    });
    expect(e).toMatchObject({
      id: "42",
      name: "Ada Lovelace",
      title: "CEO",
      managerId: null,
      email: "ada@example.com",
      location: "London",
      tenureYears: 10,
      employmentType: "employee",
      workMode: "hybrid",
    });
  });

  it("returns null without id or name", () => {
    expect(hrisRecordToEmployee({ name: "No Id" })).toBeNull();
    expect(hrisRecordToEmployee({ id: "1" })).toBeNull();
  });
});

describe("fromHrisJson", () => {
  it("converts a flat list", () => {
    const { employees, warnings } = fromHrisJson([
      { id: "ceo", name: "Ada", managerId: null },
      { id: "cto", fullName: "Grace", reportsTo: "ceo" },
      { employeeId: "x" }, // invalid
    ]);
    expect(employees).toHaveLength(2);
    expect(employees[1]?.managerId).toBe("ceo");
    expect(warnings).toHaveLength(1);
  });
});

describe("fromNestedTree", () => {
  it("flattens children into managerId edges", () => {
    const { employees, warnings } = fromNestedTree([
      {
        id: "ceo",
        name: "Ada",
        title: "CEO",
        children: [
          {
            id: "cto",
            name: "Grace",
            reports: [{ id: "eng", name: "Linus" }],
          },
        ],
      },
    ]);
    expect(warnings).toEqual([]);
    expect(employees).toHaveLength(3);
    expect(employees.find((e) => e.id === "ceo")?.managerId).toBeNull();
    expect(employees.find((e) => e.id === "cto")?.managerId).toBe("ceo");
    expect(employees.find((e) => e.id === "eng")?.managerId).toBe("cto");
  });
});
