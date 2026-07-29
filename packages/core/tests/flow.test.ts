import { describe, expect, it } from "vitest";
import { layoutFlow } from "../src/layout/flow.js";
import type { FlowLink, FlowNode } from "../src/types.js";

const nodes: FlowNode[] = [
  { id: "s", label: "Start", kind: "start" },
  { id: "a", label: "Review", kind: "task" },
  { id: "b", label: "Approve?", kind: "decision" },
  { id: "e", label: "Done", kind: "end" },
];

const links: FlowLink[] = [
  { source: "s", target: "a" },
  { source: "a", target: "b" },
  { source: "b", target: "e" },
];

describe("layoutFlow", () => {
  it("layouts a linear process left-to-right", () => {
    const result = layoutFlow(nodes, links, { direction: "LR" });
    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toHaveLength(3);
    const s = result.nodes.find((n) => n.id === "s");
    const e = result.nodes.find((n) => n.id === "e");
    expect(s).toBeDefined();
    expect(e).toBeDefined();
    if (!s || !e) return;
    expect(s.position.x).toBeLessThan(e.position.x);
  });

  it("handles empty", () => {
    expect(layoutFlow([], []).nodes).toHaveLength(0);
  });
});
