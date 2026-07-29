import { describe, expect, it } from "vitest";
import { layoutMindMap } from "../src/layout/mindMap.js";
import type { MindNode } from "../src/types.js";

const tree: MindNode[] = [
  { id: "root", label: "Engineering", parentId: null },
  { id: "fe", label: "Frontend", parentId: "root" },
  { id: "be", label: "Backend", parentId: "root" },
  { id: "react", label: "React", parentId: "fe" },
  { id: "node", label: "Node", parentId: "be" },
];

describe("layoutMindMap", () => {
  it("positions every node", () => {
    const result = layoutMindMap(tree);
    expect(result.nodes).toHaveLength(5);
    expect(result.edges).toHaveLength(4);
  });

  it("places root near origin", () => {
    const result = layoutMindMap(tree);
    const root = result.nodes.find((n) => n.id === "root");
    expect(root).toBeDefined();
    if (!root) return;
    // Root centered at 0,0 minus half size
    expect(Math.abs(root.position.x + root.size.width / 2)).toBeLessThan(1);
    expect(Math.abs(root.position.y + root.size.height / 2)).toBeLessThan(1);
  });

  it("handles empty input", () => {
    expect(layoutMindMap([]).nodes).toHaveLength(0);
  });
});
