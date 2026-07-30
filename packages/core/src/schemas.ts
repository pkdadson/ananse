import { z } from "zod";

export const employmentTypeSchema = z.enum(["employee", "contractor", "intern"]);
export const workModeSchema = z.enum(["onsite", "hybrid", "remote"]);

export const employeeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().optional(),
  photoUrl: z.string().url().optional(),
  department: z.string().optional(),
  managerId: z.string().nullable().optional(),
  dottedLineManagerIds: z.array(z.string()).optional(),
  email: z.string().email().optional(),
  location: z.string().optional(),
  tenureYears: z.number().nonnegative().optional(),
  employmentType: employmentTypeSchema.optional(),
  workMode: workModeSchema.optional(),
  meta: z.record(z.unknown()).optional(),
});

/** Domain-neutral alias — same shape as {@link employeeSchema}. */
export const hierarchyNodeSchema = employeeSchema;

/**
 * Loose input: `parentId` and/or `managerId`. Prefer normalizing with
 * `normalizeHierarchyNodes` before layout.
 */
export const hierarchyNodeInputSchema = employeeSchema.omit({ managerId: true }).extend({
  managerId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
});

export const orgChartSchema = z.array(employeeSchema).superRefine((employees, ctx) => {
  const ids = new Set<string>();
  for (const e of employees) {
    if (ids.has(e.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate node id: ${e.id}`,
        path: [],
      });
    }
    ids.add(e.id);
  }
  for (const e of employees) {
    if (e.managerId && !ids.has(e.managerId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Node ${e.id} references unknown parent/managerId ${e.managerId}`,
        path: [],
      });
    }
  }
});

/** Alias for non-HR docs. */
export const hierarchyChartSchema = orgChartSchema;
