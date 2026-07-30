import { describe, expect, it } from "vitest";
import { layoutOrgChart } from "../src/layout/orgChart.js";
import { generateOrgChart } from "../src/perf/generateOrg.js";

describe("generateOrgChart", () => {
  it("creates the requested size", () => {
    const people = generateOrgChart({ size: 50, branching: 3 });
    expect(people).toHaveLength(50);
    expect(people.filter((p) => p.managerId == null)).toHaveLength(1);
  });

  it("uses human-readable names for search demos", () => {
    const people = generateOrgChart({ size: 30, branching: 3 });
    const root = people.find((p) => p.managerId == null);
    expect(root?.name).toBe("Root Leader");
    const child = people.find((p) => p.id === "n1");
    expect(child?.name).toMatch(/^[A-Za-z]+ [A-Za-z]+/);
    expect(child?.name).not.toMatch(/^Employee n/);
  });

  it("is layoutable", () => {
    const people = generateOrgChart({ size: 100 });
    const layout = layoutOrgChart(people);
    expect(layout.nodes).toHaveLength(100);
  });
});
