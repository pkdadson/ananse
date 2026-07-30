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

  it("fans first-level children around the root (not a flat LTR row)", () => {
    const result = layoutMindMap(tree);
    const root = result.nodes.find((n) => n.id === "root");
    const fe = result.nodes.find((n) => n.id === "fe");
    const be = result.nodes.find((n) => n.id === "be");
    expect(root && fe && be).toBeTruthy();
    if (!root || !fe || !be) return;
    const rcx = root.position.x + root.size.width / 2;
    const rcy = root.position.y + root.size.height / 2;
    const fex = fe.position.x + fe.size.width / 2;
    const fey = fe.position.y + fe.size.height / 2;
    const bex = be.position.x + be.size.width / 2;
    const bey = be.position.y + be.size.height / 2;
    // Both children sit on a ring away from root
    expect(Math.hypot(fex - rcx, fey - rcy)).toBeGreaterThan(100);
    expect(Math.hypot(bex - rcx, bey - rcy)).toBeGreaterThan(100);
    // Angular separation — not stacked on the same ray
    const a1 = Math.atan2(fey - rcy, fex - rcx);
    const a2 = Math.atan2(bey - rcy, bex - rcx);
    let delta = Math.abs(a1 - a2);
    if (delta > Math.PI) delta = 2 * Math.PI - delta;
    expect(delta).toBeGreaterThan(0.4);
  });

  it("handles empty input", () => {
    expect(layoutMindMap([]).nodes).toHaveLength(0);
  });
});
