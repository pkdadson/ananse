import Dagre from "@dagrejs/dagre";
import type {
  Employee,
  LayoutEdge,
  LayoutResult,
  OrgChartLayoutOptions,
  PositionedNode,
} from "../types.js";

const DEFAULT_NODE_WIDTH = 240;
const DEFAULT_NODE_HEIGHT = 120;
const DEFAULT_RANK_SEP = 80;
const DEFAULT_NODE_SEP = 40;

export function layoutOrgChart(
  employees: Employee[],
  options: OrgChartLayoutOptions = {},
): LayoutResult<Employee> {
  const width = options.nodeWidth ?? DEFAULT_NODE_WIDTH;
  const height = options.nodeHeight ?? DEFAULT_NODE_HEIGHT;
  const direction = options.direction ?? "TB";

  if (employees.length === 0) {
    return { nodes: [], edges: [], bounds: { width: 0, height: 0 } };
  }

  const g = new Dagre.graphlib.Graph<{ employee: Employee }>();
  g.setGraph({
    rankdir: direction,
    ranksep: options.rankSep ?? DEFAULT_RANK_SEP,
    nodesep: options.nodeSep ?? DEFAULT_NODE_SEP,
  });
  g.setDefaultEdgeLabel(() => ({}));

  const ids = new Set(employees.map((e) => e.id));

  for (const e of employees) {
    g.setNode(e.id, { width, height, employee: e });
  }

  const edges: LayoutEdge[] = [];

  for (const e of employees) {
    if (e.managerId && ids.has(e.managerId)) {
      g.setEdge(e.managerId, e.id);
      edges.push({
        id: `solid:${e.managerId}->${e.id}`,
        source: e.managerId,
        target: e.id,
        kind: "solid",
      });
    }
    for (const dottedId of e.dottedLineManagerIds ?? []) {
      if (ids.has(dottedId)) {
        edges.push({
          id: `dotted:${dottedId}->${e.id}`,
          source: dottedId,
          target: e.id,
          kind: "dotted",
        });
      }
    }
  }

  Dagre.layout(g);

  const nodes: PositionedNode<Employee>[] = employees.map((e) => {
    const node = g.node(e.id);
    return {
      id: e.id,
      position: { x: node.x - width / 2, y: node.y - height / 2 },
      size: { width, height },
      data: e,
    };
  });

  const graphInfo = g.graph();
  const bounds = {
    width: graphInfo.width ?? 0,
    height: graphInfo.height ?? 0,
  };

  return { nodes, edges, bounds };
}
