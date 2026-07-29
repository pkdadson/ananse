import type { Employee } from "@canvas/core";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFocusMode } from "../src/hooks/useFocusMode.js";

const data: Employee[] = [
  { id: "ceo", name: "CEO", managerId: null },
  { id: "vp1", name: "VP1", managerId: "ceo" },
  { id: "vp2", name: "VP2", managerId: "ceo" },
  { id: "mgr", name: "Mgr", managerId: "vp1" },
];

describe("useFocusMode", () => {
  it("marks all nodes as unfocused when no focus is set", () => {
    const { result } = renderHook(() => useFocusMode(data));
    expect(result.current.focusedIds.size).toBe(0);
  });

  it("focus on a node includes ancestors and descendants", () => {
    const { result } = renderHook(() => useFocusMode(data));
    act(() => result.current.setFocus("vp1"));
    expect(result.current.focusedIds).toEqual(new Set(["ceo", "vp1", "mgr"]));
  });

  it("clearFocus resets the focus set", () => {
    const { result } = renderHook(() => useFocusMode(data));
    act(() => result.current.setFocus("vp1"));
    act(() => result.current.clearFocus());
    expect(result.current.focusedIds.size).toBe(0);
  });
});
