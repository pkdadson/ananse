import type { AddVacantRoleInput, Employee, EmployeePatch } from "@canvas/core";
import {
  addVacantRole as applyAddVacant,
  removeEmployee as applyRemove,
  reparentEmployee as applyReparent,
  updateEmployee as applyUpdate,
} from "@canvas/core";
import { useCallback, useMemo, useState } from "react";

const HISTORY_LIMIT = 50;

export type UseOrgChartEditorOptions = {
  /** Initial org data (used only on first mount). */
  initialData: Employee[];
  /** Fires after every successful mutation (including undo/redo). */
  onChange?: (employees: Employee[]) => void;
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
};

function sameData(a: Employee[], b: Employee[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useOrgChartEditor({
  initialData,
  onChange,
}: UseOrgChartEditorOptions): UseOrgChartEditor {
  const [past, setPast] = useState<Employee[][]>([]);
  const [present, setPresent] = useState<Employee[]>(() => initialData);
  const [future, setFuture] = useState<Employee[][]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const commit = useCallback(
    (next: Employee[]) => {
      setPast((p) => {
        const stacked = [...p, present];
        return stacked.length > HISTORY_LIMIT ? stacked.slice(-HISTORY_LIMIT) : stacked;
      });
      setPresent(next);
      setFuture([]);
      onChange?.(next);
    },
    [present, onChange],
  );

  const reparent = useCallback(
    (employeeId: string, newManagerId: string | null): boolean => {
      const result = applyReparent(present, employeeId, newManagerId);
      if (!result.ok) {
        setLastError(result.error);
        return false;
      }
      if (sameData(present, result.employees)) return true;
      setLastError(null);
      commit(result.employees);
      return true;
    },
    [present, commit],
  );

  const addVacant = useCallback(
    (input: AddVacantRoleInput): boolean => {
      const result = applyAddVacant(present, input);
      if (!result.ok) {
        setLastError(result.error);
        return false;
      }
      setLastError(null);
      commit(result.employees);
      return true;
    },
    [present, commit],
  );

  const remove = useCallback(
    (employeeId: string): boolean => {
      const result = applyRemove(present, employeeId);
      if (!result.ok) {
        setLastError(result.error);
        return false;
      }
      setLastError(null);
      commit(result.employees);
      return true;
    },
    [present, commit],
  );

  const update = useCallback(
    (employeeId: string, patch: EmployeePatch): boolean => {
      const result = applyUpdate(present, employeeId, patch);
      if (!result.ok) {
        setLastError(result.error);
        return false;
      }
      if (sameData(present, result.employees)) return true;
      setLastError(null);
      commit(result.employees);
      return true;
    },
    [present, commit],
  );

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      if (previous === undefined) return p;
      setFuture((f) => [present, ...f]);
      setPresent(previous);
      onChange?.(previous);
      return p.slice(0, -1);
    });
    setLastError(null);
  }, [present, onChange]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const [next, ...rest] = f;
      if (!next) return f;
      setPast((p) => [...p, present]);
      setPresent(next);
      onChange?.(next);
      return rest;
    });
    setLastError(null);
  }, [present, onChange]);

  const replace = useCallback(
    (employees: Employee[]) => {
      if (sameData(present, employees)) return;
      setLastError(null);
      commit(employees);
    },
    [present, commit],
  );

  const clearError = useCallback(() => setLastError(null), []);

  return useMemo(
    () => ({
      data: present,
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
    }),
    [
      present,
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
    ],
  );
}
