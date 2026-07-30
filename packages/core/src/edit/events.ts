import type { Employee } from "../types.js";
import type { AddVacantRoleInput, EmployeePatch } from "./mutations.js";

/** Granular mutation events for API sync / analytics. */
export type OrgMutationEvent =
  | {
      type: "reparent";
      employeeId: string;
      newManagerId: string | null;
      next: Employee[];
    }
  | {
      type: "addVacant";
      input: AddVacantRoleInput;
      next: Employee[];
    }
  | {
      type: "remove";
      employeeId: string;
      next: Employee[];
    }
  | {
      type: "update";
      employeeId: string;
      patch: EmployeePatch;
      next: Employee[];
    }
  | {
      type: "replace";
      next: Employee[];
    }
  | {
      type: "undo";
      next: Employee[];
    }
  | {
      type: "redo";
      next: Employee[];
    };
