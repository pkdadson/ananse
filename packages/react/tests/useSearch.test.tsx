import type { Employee } from "@ananse/core";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSearch } from "../src/hooks/useSearch.js";

const data: Employee[] = [
  { id: "1", name: "Ada Lovelace", title: "CEO" },
  { id: "2", name: "Grace Hopper", title: "VP" },
];

describe("useSearch", () => {
  it("returns empty match set for empty query", () => {
    const { result } = renderHook(() => useSearch(data));
    expect(result.current.matchIds.size).toBe(0);
  });

  it("returns matching employee ids when query is set", () => {
    const { result } = renderHook(() => useSearch(data));
    act(() => result.current.setQuery("grace"));
    expect(result.current.matchIds.has("2")).toBe(true);
    expect(result.current.matchIds.has("1")).toBe(false);
  });

  it("clears matches when query is cleared", () => {
    const { result } = renderHook(() => useSearch(data));
    act(() => result.current.setQuery("grace"));
    act(() => result.current.setQuery(""));
    expect(result.current.matchIds.size).toBe(0);
  });
});
