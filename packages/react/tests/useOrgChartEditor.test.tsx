import type { Employee } from "@canvas/core";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useOrgChartEditor } from "../src/hooks/useOrgChartEditor.js";

const initial: Employee[] = [
  { id: "ceo", name: "CEO", managerId: null },
  { id: "vp", name: "VP", managerId: "ceo" },
  { id: "ic", name: "IC", managerId: "vp" },
];

describe("useOrgChartEditor", () => {
  it("reparents and supports undo/redo", () => {
    const { result } = renderHook(() => useOrgChartEditor({ initialData: initial }));

    act(() => {
      expect(result.current.reparent("ic", "ceo")).toBe(true);
    });
    expect(result.current.data.find((e) => e.id === "ic")?.managerId).toBe("ceo");
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.undo();
    });
    expect(result.current.data.find((e) => e.id === "ic")?.managerId).toBe("vp");
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo();
    });
    expect(result.current.data.find((e) => e.id === "ic")?.managerId).toBe("ceo");
  });

  it("rejects cyclic reparent and sets lastError", () => {
    const { result } = renderHook(() => useOrgChartEditor({ initialData: initial }));
    act(() => {
      expect(result.current.reparent("vp", "ic")).toBe(false);
    });
    expect(result.current.lastError).toMatch(/cycle/i);
    expect(result.current.data.find((e) => e.id === "vp")?.managerId).toBe("ceo");
  });

  it("adds a vacant role", () => {
    const { result } = renderHook(() => useOrgChartEditor({ initialData: initial }));
    act(() => {
      expect(
        result.current.addVacant({
          id: "open-1",
          title: "Designer",
          managerId: "ceo",
        }),
      ).toBe(true);
    });
    const v = result.current.data.find((e) => e.id === "open-1");
    expect(v?.meta?.role).toBe("vacant");
    expect(v?.title).toBe("Designer");
  });

  it("removes a node and reparents children", () => {
    const { result } = renderHook(() => useOrgChartEditor({ initialData: initial }));
    act(() => {
      expect(result.current.remove("vp")).toBe(true);
    });
    expect(result.current.data.find((e) => e.id === "vp")).toBeUndefined();
    expect(result.current.data.find((e) => e.id === "ic")?.managerId).toBe("ceo");
  });
});
