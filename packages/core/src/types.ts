export type Employee = {
  id: string;
  name: string;
  title?: string;
  photoUrl?: string;
  department?: string;
  managerId?: string | null;
  dottedLineManagerIds?: string[];
  meta?: Record<string, unknown>;
};

export type OrgChartData = Employee[];

export type Position = { x: number; y: number };
export type Size = { width: number; height: number };

export type PositionedNode<T = Employee> = {
  id: string;
  position: Position;
  size: Size;
  data: T;
};

export type LayoutEdgeKind = 'solid' | 'dotted';

export type LayoutEdge = {
  id: string;
  source: string;
  target: string;
  kind: LayoutEdgeKind;
};

export type LayoutResult<T = Employee> = {
  nodes: PositionedNode<T>[];
  edges: LayoutEdge[];
  bounds: { width: number; height: number };
};

export type OrgChartLayoutOptions = {
  direction?: 'TB' | 'BT';
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
};
