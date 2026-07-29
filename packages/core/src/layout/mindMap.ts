import type {
  LayoutEdge,
  LayoutResult,
  MindMapLayoutOptions,
  MindNode,
  PositionedNode,
} from "../types.js";

const DEFAULT_W = 160;
const DEFAULT_H = 56;
const DEFAULT_LEVEL = 140;
const DEFAULT_SIBLING = 1;

function childrenOf(nodes: MindNode[], parentId: string | null): MindNode[] {
  return nodes.filter((n) => (n.parentId ?? null) === parentId);
}

/**
 * Radial mind-map layout: root at center, children fanned left/right by subtree.
 * Framework-agnostic — differentiator vs plain top-down trees.
 */
export function layoutMindMap(
  nodes: MindNode[],
  options: MindMapLayoutOptions = {},
): LayoutResult<MindNode> {
  const width = options.nodeWidth ?? DEFAULT_W;
  const height = options.nodeHeight ?? DEFAULT_H;
  const levelSep = options.levelSep ?? DEFAULT_LEVEL;
  const siblingSep = options.siblingSep ?? DEFAULT_SIBLING;

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

  function place(id: string, depth: number, angleStart: number, angleEnd: number): void {
    const kids = childrenOf(nodes, id);
    if (kids.length === 0) return;
    const total = kids.reduce((s, k) => s + (leafCount.get(k.id) ?? 1), 0);
    let cursor = angleStart;
    for (const kid of kids) {
      const w = (leafCount.get(kid.id) ?? 1) / total;
      const span = (angleEnd - angleStart) * w * siblingSep;
      // Center angle for this child
      const mid = cursor + span / 2;
      const r = depth * levelSep;
      positions.set(kid.id, {
        x: Math.cos(mid) * r,
        y: Math.sin(mid) * r,
      });
      place(kid.id, depth + 1, cursor, cursor + span);
      cursor += span;
    }
  }

  // Fan children across full circle, slightly biased to open sides
  place(root.id, 1, -Math.PI * 0.85, Math.PI * 0.85);

  // Place any disconnected nodes below
  let orphanX = 0;
  for (const n of nodes) {
    if (!positions.has(n.id)) {
      positions.set(n.id, { x: orphanX, y: levelSep * 3 });
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
