import type { Employee } from "@canvas/core";
import { getAncestors, getDirectReports } from "@canvas/core";
import { useEffect } from "react";

export type UseKeyboardNavOptions = {
  employees: Employee[];
  focusedId: string | null;
  onFocus: (id: string) => void;
};

export function useKeyboardNav({ employees, focusedId, onFocus }: UseKeyboardNavOptions): void {
  useEffect(() => {
    function handle(event: KeyboardEvent): void {
      if (!focusedId) return;
      const current = employees.find((e) => e.id === focusedId);
      if (!current) return;

      switch (event.key) {
        case "ArrowDown": {
          const [firstChild] = getDirectReports(employees, focusedId);
          if (firstChild) {
            event.preventDefault();
            onFocus(firstChild.id);
          }
          break;
        }
        case "ArrowUp": {
          const [parent] = getAncestors(employees, focusedId);
          if (parent) {
            event.preventDefault();
            onFocus(parent.id);
          }
          break;
        }
        case "ArrowRight":
        case "ArrowLeft": {
          const parentId = current.managerId ?? null;
          if (!parentId) break;
          const siblings = getDirectReports(employees, parentId);
          const index = siblings.findIndex((s) => s.id === focusedId);
          const nextIndex = event.key === "ArrowRight" ? index + 1 : index - 1;
          const next = siblings[nextIndex];
          if (next) {
            event.preventDefault();
            onFocus(next.id);
          }
          break;
        }
      }
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [employees, focusedId, onFocus]);
}
