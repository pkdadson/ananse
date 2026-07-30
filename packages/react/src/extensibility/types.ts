import type {
  Employee,
  FlowLayoutOptions,
  FlowLink,
  FlowNode,
  LayoutEdge,
  LayoutResult,
  MindMapLayoutOptions,
  MindNode,
  OrgChartLayoutOptions,
} from "@ananse/core";
import type { EdgeTypes, NodeTypes } from "@xyflow/react";
import type { ReactNode } from "react";
import type { AddVacantDialogProps } from "../controls/AddVacantDialog.js";
import type { InspectorPanelProps } from "../controls/InspectorPanel.js";
import type { AnanseOrgLabels } from "../i18n/labels.js";

/** Free graph edge beyond managerId / dottedLineManagerIds. */
export type ExtraOrgEdge = {
  id?: string;
  source: string;
  target: string;
  /** Maps to built-in edge types unless you register a custom type. @default "solid" */
  kind?: "solid" | "dotted" | (string & {});
};

export type OrgLayoutFn = (
  employees: Employee[],
  options: OrgChartLayoutOptions,
) => LayoutResult<Employee>;

export type MindLayoutFn = (
  data: MindNode[],
  options: MindMapLayoutOptions,
) => LayoutResult<MindNode>;

export type FlowLayoutFn = (
  nodes: FlowNode[],
  links: FlowLink[],
  options: FlowLayoutOptions,
) => LayoutResult<FlowNode>;

/**
 * Light plugin: merge labels and RF type maps without forking OrgChart.
 * Register custom node/edge components, then return their type names from `getNodeType`.
 */
export type OrgChartPlugin = {
  id: string;
  labels?: Partial<AnanseOrgLabels>;
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
};

export type ResolveOrgNodeTypeContext = {
  isManager: boolean;
  /** Built-in pick: employee | manager | executive | vacant */
  defaultType: string;
};

export type RenderInspectorFn = (props: InspectorPanelProps) => ReactNode;
export type RenderAddVacantFn = (props: AddVacantDialogProps) => ReactNode;

/** True when a type map is missing or empty (use built-ins as-is). */
export function isEmptyTypeMap(map: Record<string, unknown> | null | undefined): boolean {
  return !map || Object.keys(map).length === 0;
}

/**
 * Merge built-in + plugin + prop type maps (later wins).
 * Returns the original `base` reference when no layer adds keys — critical for
 * React Flow #002 (nodeTypes/edgeTypes must keep a stable identity).
 */
export function mergeTypeMaps<T extends Record<string, unknown>>(
  base: T,
  ...layers: Array<Partial<T> | undefined>
): T {
  let out: T = base;
  let changed = false;
  for (const layer of layers) {
    if (layer && Object.keys(layer).length > 0) {
      out = changed ? { ...out, ...layer } : { ...base, ...layer };
      changed = true;
    }
  }
  return out;
}

/** Append free edges to a layout result (ids must exist in nodes). */
export function appendExtraEdges<T>(
  layout: LayoutResult<T>,
  extra: ExtraOrgEdge[] | undefined,
  nodeIds: Set<string>,
): LayoutResult<T> {
  if (!extra || extra.length === 0) return layout;
  const edges: LayoutEdge[] = [...layout.edges];
  for (const e of extra) {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
    const kind = (e.kind ?? "solid") as LayoutEdge["kind"];
    edges.push({
      id: e.id ?? `${String(kind)}:${e.source}->${e.target}`,
      source: e.source,
      target: e.target,
      kind,
    });
  }
  return { ...layout, edges };
}
