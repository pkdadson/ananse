import type { Employee } from "@canvas/core";
import { getDescendants } from "@canvas/core";
import { useCallback, useMemo, useState } from "react";

export type UseOrgChartState = {
  visibleIds: Set<string>;
  collapsedIds: Set<string>;
  isCollapsed: (id: string) => boolean;
  toggleCollapse: (id: string) => void;
};

export function useOrgChartState(employees: Employee[]): UseOrgChartState {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

  const visibleIds = useMemo(() => {
    const hidden = new Set<string>();
    for (const id of collapsedIds) {
      for (const descendant of getDescendants(employees, id)) {
        hidden.add(descendant.id);
      }
    }
    const visible = new Set<string>();
    for (const e of employees) {
      if (!hidden.has(e.id)) visible.add(e.id);
    }
    return visible;
  }, [employees, collapsedIds]);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isCollapsed = useCallback((id: string) => collapsedIds.has(id), [collapsedIds]);

  return { visibleIds, collapsedIds, isCollapsed, toggleCollapse };
}
