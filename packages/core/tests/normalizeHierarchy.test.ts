import { describe, expect, it } from "vitest";
import { normalizeHierarchyNode, normalizeHierarchyNodes } from "../src/tree/normalizeHierarchy.js";

describe("normalizeHierarchyNode", () => {
  it("maps parentId to managerId", () => {
    expect(
      normalizeHierarchyNode({
        id: "eu",
        name: "Europe",
        title: "Region",
        parentId: "corp",
      }),
    ).toEqual({
      id: "eu",
      name: "Europe",
      title: "Region",
      managerId: "corp",
    });
  });

  it("prefers managerId when both are set", () => {
    expect(
      normalizeHierarchyNode({
        id: "a",
        name: "A",
        parentId: "x",
        managerId: "y",
      }).managerId,
    ).toBe("y");
  });

  it("preserves null parent as root", () => {
    expect(
      normalizeHierarchyNode({ id: "root", name: "Root", parentId: null }).managerId,
    ).toBeNull();
  });
});

describe("normalizeHierarchyNodes", () => {
  it("normalizes an account tree", () => {
    const nodes = normalizeHierarchyNodes([
      { id: "corp", name: "Acme Corp", title: "Holding", parentId: null },
      { id: "eu", name: "Europe", title: "Region", parentId: "corp", department: "product" },
      { id: "de", name: "Germany", title: "Country", parentId: "eu" },
    ]);
    expect(nodes.map((n) => n.managerId)).toEqual([null, "corp", "eu"]);
  });
});
