import type { Employee } from "@canvas/core";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useOrgChartState } from "../src/hooks/useOrgChartState.js";

const data: Employee[] = [
  { id: "ceo", name: "CEO", managerId: null },
  { id: "vp", name: "VP", managerId: "ceo" },
  { id: "mgr", name: "Mgr", managerId: "vp" },
  { id: "ic", name: "IC", managerId: "mgr" },
];

describe("useOrgChartState", () => {
  it("starts with all nodes visible", () => {
    const { result } = renderHook(() => useOrgChartState(data));
    expect(result.current.visibleIds.size).toBe(4);
  });

  it("collapses a subtree — hides all descendants of a collapsed node", () => {
    const { result } = renderHook(() => useOrgChartState(data));
    act(() => result.current.toggleCollapse("vp"));
    expect(result.current.visibleIds.has("vp")).toBe(true);
    expect(result.current.visibleIds.has("mgr")).toBe(false);
    expect(result.current.visibleIds.has("ic")).toBe(false);
  });

  it("expands a previously collapsed subtree", () => {
    const { result } = renderHook(() => useOrgChartState(data));
    act(() => result.current.toggleCollapse("vp"));
    act(() => result.current.toggleCollapse("vp"));
    expect(result.current.visibleIds.size).toBe(4);
  });

  it("reports collapse state per node id", () => {
    const { result } = renderHook(() => useOrgChartState(data));
    expect(result.current.isCollapsed("vp")).toBe(false);
    act(() => result.current.toggleCollapse("vp"));
    expect(result.current.isCollapsed("vp")).toBe(true);
  });
});
