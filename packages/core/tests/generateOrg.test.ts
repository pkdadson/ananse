import { describe, expect, it } from "vitest";
import { layoutOrgChart } from "../src/layout/orgChart.js";
import { generateOrgChart } from "../src/perf/generateOrg.js";

describe("generateOrgChart", () => {
  it("creates the requested size", () => {
    const people = generateOrgChart({ size: 50, branching: 3 });
    expect(people).toHaveLength(50);
    expect(people.filter((p) => p.managerId == null)).toHaveLength(1);
  });

  it("is layoutable", () => {
    const people = generateOrgChart({ size: 100 });
    const layout = layoutOrgChart(people);
    expect(layout.nodes).toHaveLength(100);
  });
});
