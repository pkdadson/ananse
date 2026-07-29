import Dagre from "@dagrejs/dagre";
import type {
  FlowLayoutOptions,
  FlowLink,
  FlowNode,
  LayoutEdge,
  LayoutResult,
  PositionedNode,
} from "../types.js";

const DEFAULT_W = 180;
const DEFAULT_H = 64;
const DEFAULT_RANK = 80;
const DEFAULT_NODE = 48;

/**
 * Generic DAG / process-flow layout via dagre (TB or LR).
 * Used by FlowBuilder for onboarding chains, approval flows, etc.
 */
export function layoutFlow(
  nodes: FlowNode[],
  links: FlowLink[],
  options: FlowLayoutOptions = {},
): LayoutResult<FlowNode> {
  const width = options.nodeWidth ?? DEFAULT_W;
  const height = options.nodeHeight ?? DEFAULT_H;
  const direction = options.direction ?? "LR";

  if (nodes.length === 0) {
    return { nodes: [], edges: [], bounds: { width: 0, height: 0 } };
  }

  const g = new Dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    ranksep: options.rankSep ?? DEFAULT_RANK,
    nodesep: options.nodeSep ?? DEFAULT_NODE,
  });
  g.setDefaultEdgeLabel(() => ({}));

  const ids = new Set(nodes.map((n) => n.id));
  for (const n of nodes) {
    g.setNode(n.id, { width, height });
  }

  const edges: LayoutEdge[] = [];
  for (const link of links) {
    if (!ids.has(link.source) || !ids.has(link.target)) continue;
    g.setEdge(link.source, link.target);
    edges.push({
      id: link.id ?? `flow:${link.source}->${link.target}`,
      source: link.source,
      target: link.target,
      kind: "solid",
      ...(link.label !== undefined ? { label: link.label } : {}),
    });
  }

  Dagre.layout(g);

  const positioned: PositionedNode<FlowNode>[] = nodes.map((n) => {
    const node = g.node(n.id);
    return {
      id: n.id,
      position: { x: node.x - width / 2, y: node.y - height / 2 },
      size: { width, height },
      data: n,
    };
  });

  const graphInfo = g.graph();
  return {
    nodes: positioned,
    edges,
    bounds: {
      width: graphInfo.width ?? 0,
      height: graphInfo.height ?? 0,
    },
  };
}
