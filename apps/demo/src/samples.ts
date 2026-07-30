import type { Employee, FlowLink, FlowNode, HierarchyNodeInput, MindNode } from "@ananse/core";
import { generateOrgChart } from "@ananse/core";
import { sampleCompany } from "./sampleCompany.js";

export type DemoProduct = "org" | "accounts" | "mind" | "flow" | "stress";

export { sampleCompany };

/**
 * Account / geo hierarchy — uses `parentId` (normalized to managerId by OrgChart).
 * Demonstrates non-HR use of the org chart surface.
 */
export const sampleAccounts: HierarchyNodeInput[] = [
  {
    id: "corp",
    name: "Acme Global",
    title: "Holding",
    parentId: null,
    department: "operations",
    meta: { role: "executive" },
  },
  {
    id: "amer",
    name: "Americas",
    title: "Region",
    parentId: "corp",
    department: "sales",
    location: "New York",
  },
  {
    id: "emea",
    name: "EMEA",
    title: "Region",
    parentId: "corp",
    department: "product",
    location: "London",
  },
  {
    id: "apac",
    name: "APAC",
    title: "Region",
    parentId: "corp",
    department: "engineering",
    location: "Singapore",
  },
  {
    id: "us",
    name: "United States",
    title: "Country",
    parentId: "amer",
    department: "sales",
  },
  {
    id: "br",
    name: "Brazil",
    title: "Country",
    parentId: "amer",
    department: "sales",
  },
  {
    id: "uk",
    name: "United Kingdom",
    title: "Country",
    parentId: "emea",
    department: "product",
  },
  {
    id: "de",
    name: "Germany",
    title: "Country",
    parentId: "emea",
    department: "product",
  },
  {
    id: "sg",
    name: "Singapore",
    title: "Country",
    parentId: "apac",
    department: "engineering",
  },
  {
    id: "jp",
    name: "Japan",
    title: "Country",
    parentId: "apac",
    department: "engineering",
  },
  {
    id: "nyc",
    name: "NYC Office",
    title: "Site",
    parentId: "us",
    department: "sales",
    location: "New York",
  },
  {
    id: "sf",
    name: "SF Office",
    title: "Site",
    parentId: "us",
    department: "engineering",
    location: "San Francisco",
  },
];

export const sampleMindMap: MindNode[] = [
  {
    id: "root",
    label: "Engineering career path",
    parentId: null,
    color: "var(--ananse-edge-highlight)",
  },
  { id: "ic", label: "IC track", parentId: "root", color: "var(--ananse-dept-engineering)" },
  { id: "mgr", label: "Manager track", parentId: "root", color: "var(--ananse-dept-product)" },
  { id: "spec", label: "Specialist", parentId: "root", color: "var(--ananse-dept-design)" },
  { id: "sde1", label: "SDE I", parentId: "ic" },
  { id: "sde2", label: "SDE II", parentId: "ic" },
  { id: "senior", label: "Senior", parentId: "ic" },
  { id: "staff", label: "Staff", parentId: "senior" },
  { id: "em", label: "Eng Manager", parentId: "mgr" },
  { id: "dir", label: "Director", parentId: "mgr" },
  { id: "arch", label: "Architect", parentId: "spec" },
  { id: "sec", label: "Security", parentId: "spec" },
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
