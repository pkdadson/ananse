import { describe, expect, it } from "vitest";
import { parseCsvRows, parseEmployeesCsv } from "../src/adapters/csv.js";

describe("parseCsvRows", () => {
  it("parses simple rows", () => {
    expect(parseCsvRows("a,b\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("handles quoted commas", () => {
    expect(parseCsvRows('id,name\n1,"Lovelace, Ada"')).toEqual([
      ["id", "name"],
      ["1", "Lovelace, Ada"],
    ]);
  });
});

describe("parseEmployeesCsv", () => {
  it("accepts parentId as manager alias for generic hierarchies", () => {
    const csv = ["id,name,title,parentId", "corp,Acme,Holding,", "eu,Europe,Region,corp"].join(
      "\n",
    );
    const { employees, warnings } = parseEmployeesCsv(csv);
    expect(warnings).toEqual([]);
    expect(employees).toEqual([
      { id: "corp", name: "Acme", title: "Holding", managerId: null },
      { id: "eu", name: "Europe", title: "Region", managerId: "corp" },
    ]);
  });

  it("parses header aliases into employees", () => {
    const csv = [
      "employeeId,fullName,jobTitle,managerId,department,email,workMode,employmentType,tenureYears",
      "ceo,Ada Lovelace,CEO,,operations,ada@example.com,hybrid,employee,12",
      "cto,Grace Hopper,CTO,ceo,engineering,grace@example.com,remote,employee,8",
    ].join("\n");

    const { employees, warnings } = parseEmployeesCsv(csv);
    expect(warnings).toEqual([]);
    expect(employees).toHaveLength(2);
    expect(employees[0]).toMatchObject({
      id: "ceo",
      name: "Ada Lovelace",
      title: "CEO",
      managerId: null,
      department: "operations",
      email: "ada@example.com",
      workMode: "hybrid",
      employmentType: "employee",
      tenureYears: 12,
    });
    expect(employees[1]).toMatchObject({
      id: "cto",
      name: "Grace Hopper",
      managerId: "ceo",
      workMode: "remote",
    });
  });

  it("warns and skips rows missing id or name", () => {
    const csv = "id,name\n,Orphan\nok,Valid Person";
    const { employees, warnings } = parseEmployeesCsv(csv);
    expect(employees).toHaveLength(1);
    expect(employees[0]?.id).toBe("ok");
    expect(warnings.some((w) => w.includes("skipped"))).toBe(true);
  });

  it("returns warning when required columns missing", () => {
    const { employees, warnings } = parseEmployeesCsv("foo,bar\n1,2");
    expect(employees).toHaveLength(0);
    expect(warnings[0]).toMatch(/id and name/i);
  });

  it("parses dotted-line manager ids", () => {
    const csv = "id,name,managerId,dottedLineManagerIds\nic,Engineer,mgr,vp1;vp2";
    const { employees } = parseEmployeesCsv(csv);
    expect(employees[0]?.dottedLineManagerIds).toEqual(["vp1", "vp2"]);
  });
});
