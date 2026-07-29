import { describe, expect, it } from "vitest";
import { searchEmployees } from "../src/tree/search.js";
import type { Employee } from "../src/types.js";

const employees: Employee[] = [
  { id: "1", name: "Ada Lovelace", title: "Chief Engineer", department: "engineering" },
  { id: "2", name: "Grace Hopper", title: "VP Compilers", department: "engineering" },
  { id: "3", name: "Alan Turing", title: "Head of Research", department: "research" },
];

describe("searchEmployees", () => {
  it("matches by exact name", () => {
    expect(searchEmployees(employees, "Ada").map((e) => e.id)).toEqual(["1"]);
  });

  it("is case-insensitive", () => {
    expect(searchEmployees(employees, "GRACE").map((e) => e.id)).toEqual(["2"]);
  });

  it("matches by title substring", () => {
    expect(searchEmployees(employees, "compil").map((e) => e.id)).toEqual(["2"]);
  });

  it("matches by department", () => {
    expect(searchEmployees(employees, "research").map((e) => e.id)).toEqual(["3"]);
  });

  it("returns empty for no match", () => {
    expect(searchEmployees(employees, "zzz")).toEqual([]);
  });

  it("returns empty for blank query", () => {
    expect(searchEmployees(employees, "   ")).toEqual([]);
  });
});
