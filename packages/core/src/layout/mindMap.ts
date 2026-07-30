import type {
  LayoutEdge,
  LayoutResult,
  MindMapLayoutOptions,
  MindNode,
  PositionedNode,
} from "../types.js";

const DEFAULT_W = 148;
const DEFAULT_H = 48;
/** Radius step between depth rings — keeps the map dense, not sparse. */
const DEFAULT_LEVEL = 160;
/** Extra radius for the first ring so root is clearly centered. */
const ROOT_RING = 180;

function childrenOf(nodes: MindNode[], parentId: string | null): MindNode[] {
  return nodes.filter((n) => (n.parentId ?? null) === parentId);
}

/**
 * Radial mind-map layout: root at center, children fanned around a full circle
 * (weighted by subtree leaf count). Framework-agnostic — not a top-down tree.
 */
export function layoutMindMap(
  nodes: MindNode[],
  options: MindMapLayoutOptions = {},
): LayoutResult<MindNode> {
  const width = options.nodeWidth ?? DEFAULT_W;
  const height = options.nodeHeight ?? DEFAULT_H;
  const levelSep = options.levelSep ?? DEFAULT_LEVEL;
  const siblingSep = options.siblingSep ?? 1;

  if (nodes.length === 0) {
    return { nodes: [], edges: [], bounds: { width: 0, height: 0 } };
  }

  const roots = childrenOf(nodes, null);
  const first = roots[0] ?? nodes[0];
  if (!first) {
    return { nodes: [], edges: [], bounds: { width: 0, height: 0 } };
  }
  const root = first;
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Subtree leaf counts for angular weighting
  const leafCount = new Map<string, number>();
  function countLeaves(id: string): number {
    const kids = childrenOf(nodes, id);
    if (kids.length === 0) {
      leafCount.set(id, 1);
      return 1;
    }
    let sum = 0;
    for (const k of kids) sum += countLeaves(k.id);
    leafCount.set(id, sum);
    return sum;
  }
  countLeaves(root.id);

  const positions = new Map<string, { x: number; y: number }>();
  positions.set(root.id, { x: 0, y: 0 });

  /**
   * Place children in the arc [angleStart, angleEnd].
   * Uses leaf-weighted spans with a floor so single-leaf siblings still fan out.
   */
  function place(id: string, depth: number, angleStart: number, angleEnd: number): void {
    const kids = childrenOf(nodes, id);
    if (kids.length === 0) return;

    const weights = kids.map((k) => Math.max(1, leafCount.get(k.id) ?? 1));
    // Soften extremes so a large subtree doesn't squash siblings into one ray
    const softened = weights.map((w) => Math.sqrt(w));
    const total = softened.reduce((s, w) => s + w, 0);
    const arc = angleEnd - angleStart;
    // Leave a tiny gap at the ends of sub-arcs so branches don't collide
    const pad = kids.length > 1 ? Math.min(0.08, arc * 0.04) : 0;
    const usable = Math.max(arc - pad * 2, arc * 0.9);
    let cursor = angleStart + pad;

    const r = depth === 1 ? ROOT_RING : ROOT_RING + (depth - 1) * levelSep;

    for (let i = 0; i < kids.length; i++) {
      const kid = kids[i];
      if (!kid) continue;
      const soft = softened[i] ?? 1;
      const span = (usable * soft * siblingSep) / total;
      const mid = cursor + span / 2;
      positions.set(kid.id, {
        x: Math.cos(mid) * r,
        y: Math.sin(mid) * r,
      });
      // Child sector for next depth (keep a small margin inside parent span)
      const childPad = span * 0.06;
      place(kid.id, depth + 1, cursor + childPad, cursor + span - childPad);
      cursor += span;
    }
  }

  // Full circle, start at top (-π/2) so the map reads as a true radial mind map
  const start = -Math.PI / 2;
  place(root.id, 1, start, start + Math.PI * 2);

  // Place any disconnected nodes in a row below the map
  let orphanX = 0;
  for (const n of nodes) {
    if (!positions.has(n.id)) {
      positions.set(n.id, { x: orphanX, y: ROOT_RING + levelSep * 2 });
      orphanX += width + 40;
    }
  }

  const positioned: PositionedNode<MindNode>[] = nodes.map((n) => {
    const p = positions.get(n.id) ?? { x: 0, y: 0 };
    return {
      id: n.id,
      position: { x: p.x - width / 2, y: p.y - height / 2 },
      size: { width, height },
      data: n,
    };
  });

  const edges: LayoutEdge[] = [];
  for (const n of nodes) {
    if (n.parentId && byId.has(n.parentId)) {
      edges.push({
        id: `mm:${n.parentId}->${n.id}`,
        source: n.parentId,
        target: n.id,
        kind: "solid",
      });
    }
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const n of positioned) {
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + n.size.width);
    maxY = Math.max(maxY, n.position.y + n.size.height);
  }

  return {
    nodes: positioned,
    edges,
    bounds: {
      width: Number.isFinite(maxX - minX) ? maxX - minX : 0,
      height: Number.isFinite(maxY - minY) ? maxY - minY : 0,
    },
  };
}
