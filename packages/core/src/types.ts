export type EmploymentType = "employee" | "contractor" | "intern";
export type WorkMode = "onsite" | "hybrid" | "remote";

/**
 * Canonical hierarchy node (stored / layout model).
 *
 * Despite the historical `Employee` name, this is a **generic tree node**:
 * people, accounts, products, regions, cost centers, etc.
 * Parent link is `managerId` (null/undefined = root).
 */
export type Employee = {
  id: string;
  name: string;
  title?: string;
  photoUrl?: string;
  department?: string;
  /** Parent node id. Null/undefined = root. (Named for HR; use for any tree.) */
  managerId?: string | null;
  dottedLineManagerIds?: string[];
  email?: string;
  location?: string;
  tenureYears?: number;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  meta?: Record<string, unknown>;
};

/**
 * Domain-neutral alias for {@link Employee}. Prefer this name in non-HR apps.
 * @example accounts, product trees, geo hierarchies
 */
export type HierarchyNode = Employee;

export type OrgChartData = Employee[];

/**
 * Loose input node: accepts either `managerId` (HR) or `parentId` (generic).
 * Pass through {@link normalizeHierarchyNodes} before layout if using `parentId`.
 */
export type HierarchyNodeInput = Omit<Employee, "managerId"> & {
  managerId?: string | null;
  /** Alias for `managerId` — preferred in non-HR domains. */
  parentId?: string | null;
};

/** Mind-map node: tree rooted at a hub (parentId null = root). */
export type MindNode = {
  id: string;
  label: string;
  parentId?: string | null;
  color?: string;
  meta?: Record<string, unknown>;
};

/** Flow-builder node: freeform process step. */
export type FlowNode = {
  id: string;
  label: string;
  kind?: "start" | "end" | "task" | "decision" | "default";
  meta?: Record<string, unknown>;
};

export type FlowLink = {
  id?: string;
  source: string;
  target: string;
  label?: string;
};

export type Position = { x: number; y: number };
export type Size = { width: number; height: number };

export type PositionedNode<T = Employee> = {
  id: string;
  position: Position;
  size: Size;
  data: T;
};

/** Built-in kinds; custom layout/extraEdges may use any string as RF edge type. */
export type LayoutEdgeKind = string;

export type LayoutEdge = {
  id: string;
  source: string;
  target: string;
  kind: LayoutEdgeKind;
  label?: string;
};

export type LayoutResult<T = unknown> = {
  nodes: PositionedNode<T>[];
  edges: LayoutEdge[];
  bounds: { width: number; height: number };
};

export type OrgChartLayoutOptions = {
  direction?: "TB" | "BT";
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
};

export type MindMapLayoutOptions = {
  nodeWidth?: number;
  nodeHeight?: number;
  /** Distance between radial rings. */
  levelSep?: number;
  /** Angular gap factor (higher = more spread). */
  siblingSep?: number;
};

export type FlowLayoutOptions = {
  direction?: "TB" | "LR";
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
};
