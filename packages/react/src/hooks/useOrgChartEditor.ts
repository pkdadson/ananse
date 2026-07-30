import type { AddVacantRoleInput, Employee, EmployeePatch, OrgMutationEvent } from "@canvas/core";
import {
  addVacantRole as applyAddVacant,
  removeEmployee as applyRemove,
  reparentEmployee as applyReparent,
  updateEmployee as applyUpdate,
} from "@canvas/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const HISTORY_LIMIT = 50;

export type UseOrgChartEditorOptions = {
  /**
   * Uncontrolled initial data (first mount only).
   * Prefer `defaultData` on `<OrgChart>` for the simple path.
   */
  initialData?: Employee[];
  /**
   * Controlled data — when set, editor state mirrors this array and
   * mutations only fire `onChange` / `onMutation` (parent owns state).
   */
  data?: Employee[];
  /** Fires after every successful mutation (including undo/redo). */
  onChange?: (employees: Employee[]) => void;
  /** Granular mutation stream for API sync / analytics. */
  onMutation?: (event: OrgMutationEvent) => void;
};

export type UseOrgChartEditor = {
  data: Employee[];
  canUndo: boolean;
  canRedo: boolean;
  reparent: (employeeId: string, newManagerId: string | null) => boolean;
  addVacant: (input: AddVacantRoleInput) => boolean;
  remove: (employeeId: string) => boolean;
  update: (employeeId: string, patch: EmployeePatch) => boolean;
  undo: () => void;
  redo: () => void;
  /** Replace present state and push history (e.g. bulk import). */
  replace: (employees: Employee[]) => void;
  lastError: string | null;
  clearError: () => void;
  /** True when `data` prop is driving state. */
  controlled: boolean;
};

function sameData(a: Employee[], b: Employee[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useOrgChartEditor({
  initialData,
  data: controlledData,
  onChange,
  onMutation,
}: UseOrgChartEditorOptions): UseOrgChartEditor {
  const controlled = controlledData !== undefined;
  const seed = controlledData ?? initialData ?? [];

  const [past, setPast] = useState<Employee[][]>([]);
  const [present, setPresent] = useState<Employee[]>(() => seed);
  const [future, setFuture] = useState<Employee[][]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const onChangeRef = useRef(onChange);
  const onMutationRef = useRef(onMutation);
  onChangeRef.current = onChange;
  onMutationRef.current = onMutation;

  // Mirror controlled data into present (no history push)
  useEffect(() => {
    if (!controlled || controlledData === undefined) return;
    setPresent((prev) => (sameData(prev, controlledData) ? prev : controlledData));
  }, [controlled, controlledData]);

  const live = controlled ? (controlledData ?? present) : present;

  const commit = useCallback(
    (next: Employee[], event: OrgMutationEvent) => {
      if (!controlled) {
        setPast((p) => {
          const stacked = [...p, present];
          return stacked.length > HISTORY_LIMIT ? stacked.slice(-HISTORY_LIMIT) : stacked;
        });
        setPresent(next);
        setFuture([]);
      } else {
        // Controlled: parent updates `data`; still track history for undo if they re-render
        setPast((p) => {
          const stacked = [...p, live];
          return stacked.length > HISTORY_LIMIT ? stacked.slice(-HISTORY_LIMIT) : stacked;
        });
        setFuture([]);
      }
      onChangeRef.current?.(next);
      onMutationRef.current?.(event);
    },
    [controlled, present, live],
  );

  const reparent = useCallback(
    (employeeId: string, newManagerId: string | null): boolean => {
      const result = applyReparent(live, employeeId, newManagerId);
      if (!result.ok) {
        setLastError(result.error);
        return false;
      }
      if (sameData(live, result.employees)) return true;
      setLastError(null);
      commit(result.employees, {
        type: "reparent",
        employeeId,
        newManagerId,
        next: result.employees,
      });
      return true;
    },
    [live, commit],
  );

  const addVacant = useCallback(
    (input: AddVacantRoleInput): boolean => {
      const result = applyAddVacant(live, input);
      if (!result.ok) {
        setLastError(result.error);
        return false;
      }
      setLastError(null);
      commit(result.employees, { type: "addVacant", input, next: result.employees });
      return true;
    },
    [live, commit],
  );

  const remove = useCallback(
    (employeeId: string): boolean => {
      const result = applyRemove(live, employeeId);
      if (!result.ok) {
        setLastError(result.error);
        return false;
      }
      setLastError(null);
      commit(result.employees, { type: "remove", employeeId, next: result.employees });
      return true;
    },
    [live, commit],
  );

  const update = useCallback(
    (employeeId: string, patch: EmployeePatch): boolean => {
      const result = applyUpdate(live, employeeId, patch);
      if (!result.ok) {
        setLastError(result.error);
        return false;
      }
      if (sameData(live, result.employees)) return true;
      setLastError(null);
      commit(result.employees, {
        type: "update",
        employeeId,
        patch,
        next: result.employees,
      });
      return true;
    },
    [live, commit],
  );

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      if (previous === undefined) return p;
      setFuture((f) => [live, ...f]);
      if (!controlled) setPresent(previous);
      onChangeRef.current?.(previous);
      onMutationRef.current?.({ type: "undo", next: previous });
      return p.slice(0, -1);
    });
    setLastError(null);
  }, [live, controlled]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const [next, ...rest] = f;
      if (!next) return f;
      setPast((p) => [...p, live]);
      if (!controlled) setPresent(next);
      onChangeRef.current?.(next);
      onMutationRef.current?.({ type: "redo", next });
      return rest;
    });
    setLastError(null);
  }, [live, controlled]);

  const replace = useCallback(
    (employees: Employee[]) => {
      if (sameData(live, employees)) return;
      setLastError(null);
      commit(employees, { type: "replace", next: employees });
    },
    [live, commit],
  );

  const clearError = useCallback(() => setLastError(null), []);

  return useMemo(
    () => ({
      data: live,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      reparent,
      addVacant,
      remove,
      update,
      undo,
      redo,
      replace,
      lastError,
      clearError,
      controlled,
    }),
    [
      live,
      past.length,
      future.length,
      reparent,
      addVacant,
      remove,
      update,
      undo,
      redo,
      replace,
      lastError,
      clearError,
      controlled,
    ],
  );
}
