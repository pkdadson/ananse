import { describe, expect, it } from "vitest";
import { layoutOrgChart } from "../src/layout/orgChart.js";
import type { Employee } from "../src/types.js";

const ceo: Employee = { id: "ceo", name: "CEO", managerId: null };
const vpEng: Employee = { id: "vp-eng", name: "VP Eng", managerId: "ceo" };
const vpDes: Employee = { id: "vp-des", name: "VP Design", managerId: "ceo" };
const engIC: Employee = { id: "eng-1", name: "Eng IC", managerId: "vp-eng" };

describe("layoutOrgChart", () => {
  it("produces one node per employee", () => {
    const result = layoutOrgChart([ceo, vpEng]);
    expect(result.nodes).toHaveLength(2);
  });

  it("positions the CEO above direct reports (TB)", () => {
    const result = layoutOrgChart([ceo, vpEng]);
    const ceoNode = result.nodes.find((n) => n.id === "ceo");
    const vpNode = result.nodes.find((n) => n.id === "vp-eng");
    expect(ceoNode).toBeDefined();
    expect(vpNode).toBeDefined();
    expect(ceoNode?.position.y).toBeLessThan(vpNode?.position.y ?? Number.POSITIVE_INFINITY);
  });

  it("creates a solid edge from CEO to VP", () => {
    const result = layoutOrgChart([ceo, vpEng]);
    const edge = result.edges.find((e) => e.source === "ceo" && e.target === "vp-eng");
    expect(edge).toBeDefined();
    expect(edge?.kind).toBe("solid");
  });

  it("creates a dotted edge for dottedLineManagerIds", () => {
    const dotted: Employee = { ...engIC, dottedLineManagerIds: ["vp-des"] };
    const result = layoutOrgChart([ceo, vpEng, vpDes, dotted]);
    const dottedEdge = result.edges.find(
      (e) => e.source === "vp-des" && e.target === "eng-1" && e.kind === "dotted",
    );
    expect(dottedEdge).toBeDefined();
  });

  it("handles empty input", () => {
    const result = layoutOrgChart([]);
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it("respects BT direction (CEO below reports)", () => {
    const result = layoutOrgChart([ceo, vpEng], { direction: "BT" });
    const ceoNode = result.nodes.find((n) => n.id === "ceo");
    const vpNode = result.nodes.find((n) => n.id === "vp-eng");
    expect(ceoNode).toBeDefined();
    expect(vpNode).toBeDefined();
    expect(ceoNode?.position.y).toBeGreaterThan(vpNode?.position.y ?? Number.NEGATIVE_INFINITY);
  });
});
