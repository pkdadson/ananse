import { describe, expect, it } from "vitest";
import {
  getAncestors,
  getDescendants,
  getDirectReports,
  getSubtreeIds,
} from "../src/tree/traverse.js";
import type { Employee } from "../src/types.js";

const employees: Employee[] = [
  { id: "ceo", name: "CEO", managerId: null },
  { id: "vp1", name: "VP1", managerId: "ceo" },
  { id: "vp2", name: "VP2", managerId: "ceo" },
  { id: "mgr1", name: "Mgr1", managerId: "vp1" },
  { id: "ic1", name: "IC1", managerId: "mgr1" },
];

describe("getDirectReports", () => {
  it("returns immediate children only", () => {
    expect(
      getDirectReports(employees, "ceo")
        .map((e) => e.id)
        .sort(),
    ).toEqual(["vp1", "vp2"]);
  });

  it("returns empty for a leaf", () => {
    expect(getDirectReports(employees, "ic1")).toEqual([]);
  });
});

describe("getDescendants", () => {
  it("returns all reports transitively", () => {
    const ids = getDescendants(employees, "vp1")
      .map((e) => e.id)
      .sort();
    expect(ids).toEqual(["ic1", "mgr1"]);
  });

  it("returns empty for a leaf", () => {
    expect(getDescendants(employees, "ic1")).toEqual([]);
  });
});

describe("getAncestors", () => {
  it("returns the chain up to root", () => {
    expect(getAncestors(employees, "ic1").map((e) => e.id)).toEqual(["mgr1", "vp1", "ceo"]);
  });

  it("returns empty for a root", () => {
    expect(getAncestors(employees, "ceo")).toEqual([]);
  });
});

describe("getSubtreeIds", () => {
  it("includes the root and all descendants", () => {
    expect(getSubtreeIds(employees, "vp1").sort()).toEqual(["ic1", "mgr1", "vp1"]);
  });
});
