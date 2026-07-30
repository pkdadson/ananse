import type { Employee, HierarchyNodeInput } from "../types.js";

/**
 * Map a loose hierarchy record (`parentId` and/or `managerId`) onto the
 * canonical {@link Employee} / {@link HierarchyNode} shape used by layout + OrgChart.
 *
 * - If both are set, `managerId` wins.
 * - `parentId` is not preserved on the output (only `managerId`).
 */
export function normalizeHierarchyNode(node: HierarchyNodeInput): Employee {
  const { parentId, managerId, ...rest } = node;
  const parent =
    managerId !== undefined ? managerId : parentId !== undefined ? parentId : undefined;
  const out: Employee = {
    id: rest.id,
    name: rest.name,
  };
  if (rest.title !== undefined) out.title = rest.title;
  if (rest.photoUrl !== undefined) out.photoUrl = rest.photoUrl;
  if (rest.department !== undefined) out.department = rest.department;
  if (rest.dottedLineManagerIds !== undefined) out.dottedLineManagerIds = rest.dottedLineManagerIds;
  if (rest.email !== undefined) out.email = rest.email;
  if (rest.location !== undefined) out.location = rest.location;
  if (rest.tenureYears !== undefined) out.tenureYears = rest.tenureYears;
  if (rest.employmentType !== undefined) out.employmentType = rest.employmentType;
  if (rest.workMode !== undefined) out.workMode = rest.workMode;
  if (rest.meta !== undefined) out.meta = rest.meta;
  if (parent !== undefined) out.managerId = parent;
  return out;
}

/** Normalize an array of hierarchy inputs (idempotent for already-canonical nodes). */
export function normalizeHierarchyNodes(nodes: HierarchyNodeInput[]): Employee[] {
  return nodes.map(normalizeHierarchyNode);
}
