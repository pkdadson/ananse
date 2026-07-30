import type { Employee } from "@ananse/core";
import { fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useKeyboardNav } from "../src/hooks/useKeyboardNav.js";

const data: Employee[] = [
  { id: "ceo", name: "CEO", managerId: null },
  { id: "vp1", name: "VP1", managerId: "ceo" },
  { id: "vp2", name: "VP2", managerId: "ceo" },
  { id: "mgr", name: "Mgr", managerId: "vp1" },
];

describe("useKeyboardNav", () => {
  it("ArrowDown moves focus from parent to first child", () => {
    const onFocus = vi.fn();
    renderHook(() => useKeyboardNav({ employees: data, focusedId: "ceo", onFocus }));
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(onFocus).toHaveBeenCalledWith("vp1");
  });

  it("ArrowUp moves focus from child to parent", () => {
    const onFocus = vi.fn();
    renderHook(() => useKeyboardNav({ employees: data, focusedId: "mgr", onFocus }));
    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(onFocus).toHaveBeenCalledWith("vp1");
  });

  it("ArrowRight moves focus to next sibling", () => {
    const onFocus = vi.fn();
    renderHook(() => useKeyboardNav({ employees: data, focusedId: "vp1", onFocus }));
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(onFocus).toHaveBeenCalledWith("vp2");
  });

  it("ArrowLeft moves focus to previous sibling", () => {
    const onFocus = vi.fn();
    renderHook(() => useKeyboardNav({ employees: data, focusedId: "vp2", onFocus }));
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(onFocus).toHaveBeenCalledWith("vp1");
  });

  it("does not error when no focus is set", () => {
    const onFocus = vi.fn();
    renderHook(() => useKeyboardNav({ employees: data, focusedId: null, onFocus }));
    expect(() => fireEvent.keyDown(window, { key: "ArrowDown" })).not.toThrow();
  });
});
