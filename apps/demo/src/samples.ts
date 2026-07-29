import type { Employee, FlowLink, FlowNode, MindNode } from "@canvas/core";
import { generateOrgChart } from "@canvas/core";
import { sampleCompany } from "./sampleCompany.js";

export type DemoProduct = "org" | "mind" | "flow" | "stress";

export { sampleCompany };

export const sampleMindMap: MindNode[] = [
  {
    id: "root",
    label: "Engineering career path",
    parentId: null,
    color: "var(--canvas-edge-highlight)",
  },
  { id: "ic", label: "IC track", parentId: "root", color: "var(--canvas-dept-engineering)" },
  { id: "mgr", label: "Manager track", parentId: "root", color: "var(--canvas-dept-product)" },
  { id: "sde1", label: "SDE I", parentId: "ic" },
  { id: "sde2", label: "SDE II", parentId: "ic" },
  { id: "senior", label: "Senior", parentId: "ic" },
  { id: "staff", label: "Staff", parentId: "senior" },
  { id: "em", label: "Eng Manager", parentId: "mgr" },
  { id: "dir", label: "Director", parentId: "mgr" },
];

export const sampleFlowNodes: FlowNode[] = [
  { id: "start", label: "Offer accepted", kind: "start" },
  { id: "it", label: "IT provisioning", kind: "task" },
  { id: "hr", label: "HR paperwork", kind: "task" },
  { id: "mgr", label: "Manager 1:1?", kind: "decision" },
  { id: "buddy", label: "Assign buddy", kind: "task" },
  { id: "done", label: "Day-1 ready", kind: "end" },
];

export const sampleFlowLinks: FlowLink[] = [
  { source: "start", target: "it" },
  { source: "start", target: "hr" },
  { source: "it", target: "mgr" },
  { source: "hr", target: "mgr" },
  { source: "mgr", target: "buddy", label: "yes" },
  { source: "buddy", target: "done" },
  { source: "mgr", target: "done", label: "skip" },
];

export function largeOrgSample(size = 400): Employee[] {
  return generateOrgChart({ size, branching: 4 });
}
