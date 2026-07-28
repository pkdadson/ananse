import { z } from 'zod';

export const employeeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().optional(),
  photoUrl: z.string().url().optional(),
  department: z.string().optional(),
  managerId: z.string().nullable().optional(),
  dottedLineManagerIds: z.array(z.string()).optional(),
  meta: z.record(z.unknown()).optional(),
});

export const orgChartSchema = z.array(employeeSchema).superRefine((employees, ctx) => {
  const ids = new Set<string>();
  for (const e of employees) {
    if (ids.has(e.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate employee id: ${e.id}`,
        path: [],
      });
    }
    ids.add(e.id);
  }
  for (const e of employees) {
    if (e.managerId && !ids.has(e.managerId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Employee ${e.id} references unknown managerId ${e.managerId}`,
        path: [],
      });
    }
  }
});
