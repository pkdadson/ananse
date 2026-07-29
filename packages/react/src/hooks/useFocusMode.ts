import type { Employee } from "@canvas/core";
import { getAncestors, getSubtreeIds } from "@canvas/core";
import { useCallback, useMemo, useState } from "react";

export type UseFocusMode = {
  focusedId: string | null;
  focusedIds: Set<string>;
  setFocus: (id: string) => void;
  clearFocus: () => void;
};

export function useFocusMode(employees: Employee[]): UseFocusMode {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const focusedIds = useMemo(() => {
    if (!focusedId) return new Set<string>();
    const set = new Set<string>();
    for (const id of getSubtreeIds(employees, focusedId)) set.add(id);
    for (const ancestor of getAncestors(employees, focusedId)) set.add(ancestor.id);
    return set;
  }, [employees, focusedId]);

  const setFocus = useCallback((id: string) => setFocusedId(id), []);
  const clearFocus = useCallback(() => setFocusedId(null), []);

  return { focusedId, focusedIds, setFocus, clearFocus };
}
