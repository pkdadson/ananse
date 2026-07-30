import type {
  AddVacantRoleInput,
  Employee,
  EmployeePatch,
  HierarchyNodeInput,
  LayoutResult,
  OrgChartLayoutOptions,
  OrgMutationEvent,
} from "@ananse/core";
import {
  getDescendants,
  getDirectReports,
  layoutOrgChart,
  loadOrgFromStorage,
  normalizeHierarchyNodes,
  saveOrgToStorage,
} from "@ananse/core";
import {
  Background,
  Controls,
  type Edge,
  type EdgeTypes,
  MiniMap,
  type Node,
  type NodeProps,
  type NodeTypes,
  type OnNodeDrag,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import {
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "@xyflow/react/dist/style.css";
import { AddVacantDialog } from "./controls/AddVacantDialog.js";
import { EditorToolbar } from "./controls/EditorToolbar.js";
import { InspectorPanel } from "./controls/InspectorPanel.js";
import { SearchBar } from "./controls/SearchBar.js";
import { DottedEdge } from "./edges/DottedEdge.js";
import { SolidEdge } from "./edges/SolidEdge.js";
import {
  type ExtraOrgEdge,
  type OrgChartPlugin,
  type OrgLayoutFn,
  type RenderAddVacantFn,
  type RenderInspectorFn,
  type ResolveOrgNodeTypeContext,
  appendExtraEdges,
  mergeTypeMaps,
} from "./extensibility/types.js";
import { useFocusMode } from "./hooks/useFocusMode.js";
import { useKeyboardNav } from "./hooks/useKeyboardNav.js";
import { useOrgChartEditor } from "./hooks/useOrgChartEditor.js";
import { useOrgChartState } from "./hooks/useOrgChartState.js";
import { useSearch } from "./hooks/useSearch.js";
import type { AnanseOrgLabels } from "./i18n/labels.js";
import { DEFAULT_HIERARCHY_LABELS, HIERARCHY_CARD_FIELDS, mergeOrgLabels } from "./i18n/labels.js";
import { ExecutiveCard } from "./nodes/ExecutiveCard.js";
import { ManagerCard } from "./nodes/ManagerCard.js";
import { NodeShell } from "./nodes/NodeShell.js";
import { VacantRoleCard } from "./nodes/VacantRoleCard.js";
import { EmployeeFace, type NodeVariant } from "./nodes/employeeFace.js";
import { injectAnanseTokens } from "./styles/injectTokens.js";
import {
  type AnanseHeight,
  chartShellStyle,
  useContainerWidth,
  useZeroHeightWarning,
} from "./utils/mount.js";

/** Toggle people-card fields without writing a custom renderer. */
export type CardFieldsConfig = {
  email?: boolean;
  location?: boolean;
  badges?: boolean;
  department?: boolean;
  photo?: boolean;
};

export type RenderCardContext = {
  variant: NodeVariant;
  isManager: boolean;
  isExecutive: boolean;
  isVacant: boolean;
  directReportCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export type OrgChartNodeData = {
  employee: Employee;
  title: string;
  department?: string | undefined;
  directReportCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  searchDim: boolean;
  focusDim: boolean;
  nodeVariant: NodeVariant;
  fields?: CardFieldsConfig | undefined;
  renderCard?: ((employee: Employee, ctx: RenderCardContext) => ReactNode) | undefined;
  isExecutive?: boolean;
  isVacant?: boolean;
  reportSingular?: string;
  reportPlural?: string;
  hideReports?: string;
  showReports?: string;
};

/** UI domain: people org chart vs generic hierarchy (accounts, products, geo…). */
export type OrgChartDomain = "people" | "hierarchy";

function applyFields(employee: Employee, fields?: CardFieldsConfig): Employee {
  if (!fields) return employee;
  const next: Employee = { id: employee.id, name: employee.name };
  if (fields.photo !== false && employee.photoUrl !== undefined) next.photoUrl = employee.photoUrl;
  if (employee.title !== undefined) next.title = employee.title;
  if (fields.department !== false && employee.department !== undefined) {
    next.department = employee.department;
  }
  if (employee.managerId !== undefined) next.managerId = employee.managerId;
  if (employee.dottedLineManagerIds !== undefined) {
    next.dottedLineManagerIds = employee.dottedLineManagerIds;
  }
  if (fields.email !== false && employee.email !== undefined) next.email = employee.email;
  if (fields.location !== false && employee.location !== undefined) {
    next.location = employee.location;
  }
  if (fields.badges !== false) {
    if (employee.tenureYears !== undefined) next.tenureYears = employee.tenureYears;
    if (employee.employmentType !== undefined) next.employmentType = employee.employmentType;
    if (employee.workMode !== undefined) next.workMode = employee.workMode;
  }
  if (employee.meta !== undefined) next.meta = employee.meta;
  return next;
}

function renderNodeFace(data: OrgChartNodeData): ReactNode {
  const employee = applyFields(data.employee, data.fields);
  const ctx: RenderCardContext = {
    variant: data.nodeVariant,
    isManager: data.directReportCount > 0,
    isExecutive: Boolean(data.isExecutive),
    isVacant: Boolean(data.isVacant),
    directReportCount: data.directReportCount,
    collapsed: data.collapsed,
    onToggleCollapse: data.onToggleCollapse,
  };
  if (data.renderCard) return data.renderCard(employee, ctx);
  if (data.isVacant) {
    return (
      <VacantRoleCard
        title={data.title}
        {...(employee.department !== undefined ? { department: employee.department } : {})}
      />
    );
  }
  if (data.isExecutive) {
    return <ExecutiveCard data={employee} variant={data.nodeVariant} />;
  }
  if (data.directReportCount > 0) {
    return (
      <ManagerCard
        data={employee}
        directReportCount={data.directReportCount}
        collapsed={data.collapsed}
        onToggleCollapse={data.onToggleCollapse}
        variant={data.nodeVariant}
        {...(data.reportSingular ? { reportSingular: data.reportSingular } : {})}
        {...(data.reportPlural ? { reportPlural: data.reportPlural } : {})}
        {...(data.hideReports ? { hideLabel: data.hideReports } : {})}
        {...(data.showReports ? { showLabel: data.showReports } : {})}
      />
    );
  }
  return <EmployeeFace data={employee} variant={data.nodeVariant} />;
}

function EmployeeNode({ data }: NodeProps & { data: OrgChartNodeData }): ReactElement {
  const dim = data.searchDim || data.focusDim;
  return (
    <NodeShell searchDim={data.searchDim} dim={dim}>
      {renderNodeFace(data)}
    </NodeShell>
  );
}

function ExecutiveNode({ data }: NodeProps & { data: OrgChartNodeData }): ReactElement {
  const dim = data.searchDim || data.focusDim;
  return (
    <NodeShell searchDim={data.searchDim} dim={dim}>
      {renderNodeFace({ ...data, isExecutive: true })}
    </NodeShell>
  );
}

function VacantNode({ data }: NodeProps & { data: OrgChartNodeData }): ReactElement {
  const dim = data.searchDim || data.focusDim;
  return (
    <NodeShell searchDim={data.searchDim} dim={dim}>
      {renderNodeFace({ ...data, isVacant: true })}
    </NodeShell>
  );
}

function ManagerNode({ data }: NodeProps & { data: OrgChartNodeData }): ReactElement {
  const dim = data.searchDim || data.focusDim;
  return (
    <NodeShell searchDim={data.searchDim} dim={dim}>
      {renderNodeFace(data)}
    </NodeShell>
  );
}

// Module-level — avoids React Flow warning #002 (unstable nodeTypes/edgeTypes)
const orgNodeTypes = {
  employee: EmployeeNode,
  executive: ExecutiveNode,
  vacant: VacantNode,
  manager: ManagerNode,
};

const orgEdgeTypes = { solid: SolidEdge, dotted: DottedEdge };

type NodeTypeName = keyof typeof orgNodeTypes;

function pickNodeType(e: Employee, isManager: boolean): NodeTypeName {
  if (e.meta?.role === "vacant") return "vacant";
  if (e.meta?.role === "executive" || e.managerId === null) return "executive";
  if (isManager) return "manager";
  return "employee";
}

/** Accessible name for a person / vacant node in the graph. */
function orgNodeAriaLabel(employee: Employee, isVacant: boolean, vacantTitle: string): string {
  if (isVacant) return `Open role: ${vacantTitle}`;
  const title = employee.title?.trim();
  return title ? `${employee.name}, ${title}` : employee.name;
}

/** Optional advanced editor integration (pair with `useOrgChartEditor`). */
export type OrgChartEditorApi = {
  onReparent: (employeeId: string, newManagerId: string | null) => boolean | undefined;
  onAddVacant?: (input: AddVacantRoleInput) => boolean | undefined;
  onRemove?: (employeeId: string) => boolean | undefined;
  onUpdate?: (employeeId: string, patch: EmployeePatch) => boolean | undefined;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  lastError?: string | null;
};

export type OrgChartProps = {
  /**
   * Controlled tree data. Accepts canonical nodes or loose input with `parentId`.
   * Pair with `onChange` in edit mode.
   */
  data?: HierarchyNodeInput[];
  /**
   * Uncontrolled initial data (simple path).
   * @example <OrgChart defaultData={nodes} mode="edit" onChange={setNodes} />
   */
  defaultData?: HierarchyNodeInput[];
  /**
   * UI preset: people (HR labels + full inspector) vs hierarchy (neutral labels,
   * hide employment badges/email by default).
   * @default "people"
   */
  domain?: OrgChartDomain;
  /** @default "view" */
  mode?: "view" | "edit";
  /** Fires after every successful edit (reparent, remove, undo, …). */
  onChange?: (employees: Employee[]) => void;
  /** Granular mutation stream for API sync. */
  onMutation?: (event: OrgMutationEvent) => void;
  layoutOptions?: OrgChartLayoutOptions;
  /**
   * Bring-your-own layout (free topology / custom positioning).
   * Defaults to `layoutOrgChart` from `@ananse/core`.
   */
  layout?: OrgLayoutFn;
  /**
   * Free graph edges beyond `managerId` / `dottedLineManagerIds`
   * (matrix reporting, project links, custom RF edge types).
   */
  extraEdges?: ExtraOrgEdge[];
  /** Override React Flow fitView options (padding / zoom bounds). */
  fitViewOptions?: { padding?: number; minZoom?: number; maxZoom?: number };
  /** Absolute min zoom. Large orgs default lower automatically. */
  minZoom?: number;
  showSearch?: boolean;
  showMinimap?: boolean;
  showControls?: boolean;
  nodeVariant?: NodeVariant;
  /**
   * Advanced: wire your own editor. Prefer `mode="edit"` + `onChange`
   * which auto-creates undo/redo/reparent for you.
   */
  editor?: OrgChartEditorApi;
  showEditorToolbar?: boolean;
  /** Side panel to edit selected person fields (edit mode). Default true. */
  showInspector?: boolean;
  /** CSS height — number (px) or any CSS string. Default minHeight 480. */
  height?: AnanseHeight;
  className?: string;
  style?: CSSProperties;
  /** Show/hide card fields without a custom renderer. */
  fields?: CardFieldsConfig;
  /** Full card escape hatch. */
  renderCard?: (employee: Employee, ctx: RenderCardContext) => ReactNode;
  /**
   * Persist edits to localStorage under this key (demo / prototype).
   * Loads on mount when using defaultData.
   */
  persistKey?: string;
  /** i18n: override chrome strings (search, toolbar, inspector, dialog). */
  labels?: Partial<AnanseOrgLabels>;
  /**
   * Merge custom React Flow node types with built-ins
   * (`employee`, `manager`, `executive`, `vacant`).
   */
  nodeTypes?: NodeTypes;
  /**
   * Merge custom React Flow edge types with built-ins (`solid`, `dotted`).
   */
  edgeTypes?: EdgeTypes;
  /**
   * Map an employee to an RF node type name. Use with `nodeTypes` for custom cards.
   */
  getNodeType?: (employee: Employee, ctx: ResolveOrgNodeTypeContext) => string;
  /** Replace the default inspector (return null to hide). */
  renderInspector?: RenderInspectorFn;
  /** Replace the vacant-role dialog. */
  renderAddVacant?: RenderAddVacantFn;
  /**
   * Light plugins: merge labels + nodeTypes + edgeTypes.
   * Prop-level maps win over plugins.
   */
  plugins?: OrgChartPlugin[];
};

function nodeSize(n: Node): { w: number; h: number } {
  return {
    w: n.measured?.width ?? n.width ?? 240,
    h: n.measured?.height ?? n.height ?? 120,
  };
}

/**
 * Resolve reparent target: prefer node under pointer; else nearest node center
 * within a generous threshold (so drop-near still works).
 */
function findDropTargetId(
  draggedId: string,
  flowX: number,
  flowY: number,
  nodes: Node[],
  employees: Employee[],
  draggedPosition?: { x: number; y: number },
): string | null {
  const forbidden = new Set([draggedId, ...getDescendants(employees, draggedId).map((e) => e.id)]);

  // 1) Exact hit under pointer (last match = top-most in array order)
  let hit: string | null = null;
  for (const n of nodes) {
    if (forbidden.has(n.id)) continue;
    const { w, h } = nodeSize(n);
    const x = n.position.x;
    const y = n.position.y;
    if (flowX >= x && flowX <= x + w && flowY >= y && flowY <= y + h) {
      hit = n.id;
    }
  }
  if (hit) return hit;

  // 2) Nearest node center to pointer (or dragged node center)
  const refX = flowX;
  const refY = flowY;
  const NEAR_PX = 160;
  let best: { id: string; dist: number } | null = null;
  for (const n of nodes) {
    if (forbidden.has(n.id)) continue;
    const { w, h } = nodeSize(n);
    const cx = n.position.x + w / 2;
    const cy = n.position.y + h / 2;
    const dist = Math.hypot(cx - refX, cy - refY);
    if (dist <= NEAR_PX && (!best || dist < best.dist)) {
      best = { id: n.id, dist };
    }
  }
  if (best) return best.id;

  // 3) Fallback: nearest to dragged node center after drop
  if (draggedPosition) {
    const dragged = nodes.find((n) => n.id === draggedId);
    const { w: dw, h: dh } = dragged ? nodeSize(dragged) : { w: 240, h: 120 };
    const dx = draggedPosition.x + dw / 2;
    const dy = draggedPosition.y + dh / 2;
    let nearest: { id: string; dist: number } | null = null;
    for (const n of nodes) {
      if (forbidden.has(n.id)) continue;
      const { w, h } = nodeSize(n);
      const cx = n.position.x + w / 2;
      const cy = n.position.y + h / 2;
      const dist = Math.hypot(cx - dx, cy - dy);
      if (dist <= NEAR_PX && (!nearest || dist < nearest.dist)) {
        nearest = { id: n.id, dist };
      }
    }
    return nearest?.id ?? null;
  }

  return null;
}

type OrgChartInnerProps = {
  data: Employee[];
  mode: "view" | "edit";
  layoutOptions?: OrgChartLayoutOptions;
  layoutFn?: OrgLayoutFn;
  extraEdges?: ExtraOrgEdge[];
  fitViewOptions?: { padding?: number; minZoom?: number; maxZoom?: number };
  minZoom?: number;
  showSearch?: boolean;
  showMinimap?: boolean;
  showControls?: boolean;
  nodeVariant?: NodeVariant;
  editor?: OrgChartEditorApi;
  showEditorToolbar?: boolean;
  showInspector?: boolean;
  fields?: CardFieldsConfig;
  renderCard?: (employee: Employee, ctx: RenderCardContext) => ReactNode;
  labels: AnanseOrgLabels;
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  getNodeType?: (employee: Employee, ctx: ResolveOrgNodeTypeContext) => string;
  renderInspector?: RenderInspectorFn;
  renderAddVacant?: RenderAddVacantFn;
};

function OrgChartInner({
  data,
  mode,
  layoutOptions,
  layoutFn,
  extraEdges,
  fitViewOptions: fitViewOptionsProp,
  minZoom: minZoomProp,
  showSearch = false,
  showMinimap = true,
  showControls = true,
  nodeVariant = "default",
  editor,
  showEditorToolbar = true,
  showInspector = true,
  fields,
  renderCard,
  labels,
  nodeTypes: nodeTypesProp,
  edgeTypes: edgeTypesProp,
  getNodeType,
  renderInspector,
  renderAddVacant,
}: OrgChartInnerProps): ReactElement {
  const isEdit = mode === "edit" && editor !== undefined;
  const largeOrg = data.length >= 100;
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);
  // Narrow viewport → readable cards win over fitting the whole tree
  const isNarrow = containerWidth !== null && containerWidth < 640;
  // Keep built-in map identity when no custom types (avoids React Flow #002).
  const resolvedNodeTypes = useMemo(
    () => mergeTypeMaps(orgNodeTypes as NodeTypes, nodeTypesProp),
    [nodeTypesProp],
  );
  const resolvedEdgeTypes = useMemo(
    () => mergeTypeMaps(orgEdgeTypes as EdgeTypes, edgeTypesProp),
    [edgeTypesProp],
  );
  // Primitive deps so parent inline `{ padding: … }` objects don't thrash fitView.
  const fitPad = fitViewOptionsProp?.padding;
  const fitMinZ = fitViewOptionsProp?.minZoom;
  const fitMaxZ = fitViewOptionsProp?.maxZoom;
  const resolvedFitView = useMemo(
    () => ({
      // Narrow: prefer readable (~44px) cards over fitting the entire tree
      padding: fitPad ?? (largeOrg ? 0.08 : isNarrow ? 0.08 : 0.15),
      minZoom: fitMinZ ?? (isNarrow ? 0.95 : largeOrg ? 0.35 : 0.1),
      maxZoom: fitMaxZ ?? (largeOrg ? 1.2 : 1.5),
    }),
    [largeOrg, isNarrow, fitPad, fitMinZ, fitMaxZ],
  );
  const defaultEdgeOptions = useMemo(
    () => ({
      type: "solid" as const,
      style: {
        stroke: "var(--ananse-edge-color)",
        strokeWidth: largeOrg ? 1.25 : 2,
      },
    }),
    [largeOrg],
  );
  const rfProOptions = useMemo(() => ({ hideAttribution: true }), []);
  // Absolute zoom-out ceiling still allows manual pinch-zoom past fit floor
  const minZoom = minZoomProp ?? (largeOrg ? 0.05 : isNarrow ? 0.45 : 0.1);
  const { visibleIds, isCollapsed, toggleCollapse } = useOrgChartState(data);
  const { query, setQuery, matchIds } = useSearch(data);
  const { focusedIds, focusedId, setFocus, clearFocus } = useFocusMode(data);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [vacantDialogOpen, setVacantDialogOpen] = useState(false);
  const selectedId = selectedIds[selectedIds.length - 1] ?? null;
  /** Free-drag positions that override dagre until reparent or explicit reset. */
  const [pinnedPositions, setPinnedPositions] = useState<Record<string, { x: number; y: number }>>(
    {},
  );
  const { screenToFlowPosition, getNodes, fitView } = useReactFlow();
  const selectedEmployee = useMemo(
    () => (selectedId ? (data.find((e) => e.id === selectedId) ?? null) : null),
    [data, selectedId],
  );

  // Keep keyboard focus path and RF selection in sync for clear feedback.
  const onFocus = useCallback(
    (id: string) => {
      setFocus(id);
      setSelectedIds([id]);
    },
    [setFocus],
  );
  useKeyboardNav({ employees: data, focusedId, onFocus });

  // Leaving edit clears multi-select / inspector so View mode and mobile
  // chrome don't keep a stale "Remove (N)" selection.
  useEffect(() => {
    if (!isEdit) {
      setSelectedIds([]);
      setVacantDialogOpen(false);
    }
  }, [isEdit]);

  useEffect(() => {
    function isEditableTarget(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false;
      if (el.isContentEditable) return true;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    }
    function handle(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && isEdit) {
        event.preventDefault();
        if (event.shiftKey) editor?.onRedo?.();
        else editor?.onUndo?.();
        return;
      }
      if (event.key === "Escape") {
        if (vacantDialogOpen) {
          event.preventDefault();
          setVacantDialogOpen(false);
          return;
        }
        if (focusedId || selectedIds.length > 0) {
          event.preventDefault();
          clearFocus();
          setSelectedIds([]);
        }
        return;
      }
      if (event.key === "/" && showSearch && !isEditableTarget(event.target)) {
        const input =
          containerRef.current?.querySelector<HTMLInputElement>('input[role="searchbox"]');
        if (input) {
          event.preventDefault();
          input.focus();
          input.select();
        }
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        if (
          isEdit &&
          selectedIds.length > 0 &&
          editor?.onRemove &&
          !isEditableTarget(event.target)
        ) {
          event.preventDefault();
          // Bulk remove: delete deepest first so reparent chains stay valid-ish
          for (const id of [...selectedIds].reverse()) {
            editor.onRemove(id);
          }
          setSelectedIds([]);
        }
      }
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [focusedId, clearFocus, showSearch, isEdit, editor, selectedIds, vacantDialogOpen]);

  const visibleData = useMemo(() => data.filter((e) => visibleIds.has(e.id)), [data, visibleIds]);

  /** Match dagre box sizes to card density so RF node clips don't cut content. */
  const densityLayout = useMemo((): OrgChartLayoutOptions => {
    const byVariant: Record<NodeVariant, OrgChartLayoutOptions> = {
      default: { nodeWidth: 240, nodeHeight: 100, nodeSep: 40, rankSep: 72 },
      detailed: { nodeWidth: 260, nodeHeight: 148, nodeSep: 36, rankSep: 80 },
      // Compact is taller than minimal so density switch is obvious after fit-view
      compact: { nodeWidth: 196, nodeHeight: 64, nodeSep: 28, rankSep: 56 },
      // 44px min matches touch-target guidance for minimal pills
      minimal: { nodeWidth: 152, nodeHeight: 46, nodeSep: 22, rankSep: 44 },
    };
    const base = byVariant[nodeVariant];
    if (!layoutOptions) return base;
    return { ...base, ...layoutOptions };
  }, [nodeVariant, layoutOptions]);

  const layout: LayoutResult<Employee> = useMemo(() => {
    const run = layoutFn ?? layoutOrgChart;
    const base = run(visibleData, densityLayout);
    const ids = new Set(visibleData.map((e) => e.id));
    return appendExtraEdges(base, extraEdges, ids);
  }, [visibleData, densityLayout, layoutFn, extraEdges]);

  // Structural nodes only (no selection/search/focus) — safe to rebuild without killing drag.
  // pinnedPositions keep free-drag placements across rebuilds.
  const layoutNodes = useMemo((): Node[] => {
    return layout.nodes.map((n) => {
      const reportCount = getDirectReports(data, n.id).length;
      const isManager = reportCount > 0;
      const defaultType = pickNodeType(n.data, isManager);
      const type = getNodeType ? getNodeType(n.data, { isManager, defaultType }) : defaultType;
      const collapsed = isCollapsed(n.id);
      const pinned = pinnedPositions[n.id];
      const vacantTitle =
        typeof n.data.meta?.title === "string"
          ? (n.data.meta.title as string)
          : (n.data.title ?? "Open Role");
      const isVacant = type === "vacant" || n.data.meta?.role === "vacant";
      return {
        id: n.id,
        type,
        position: pinned ?? n.position,
        width: n.size.width,
        height: n.size.height,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        draggable: isEdit,
        selectable: true,
        selected: false,
        ariaLabel: orgNodeAriaLabel(n.data, Boolean(isVacant), vacantTitle),
        style: {
          pointerEvents: "all" as const,
          zIndex: 1,
          cursor: isEdit ? "grab" : "pointer",
        },
        data: {
          employee: n.data,
          title: vacantTitle,
          department: n.data.department,
          directReportCount: reportCount,
          collapsed,
          onToggleCollapse: () => toggleCollapse(n.id),
          searchDim: false,
          focusDim: false,
          nodeVariant,
          fields,
          renderCard,
          isExecutive: type === "executive" || n.data.meta?.role === "executive",
          isVacant: Boolean(isVacant),
          reportSingular: labels.reportSingular,
          reportPlural: labels.reportPlural,
          hideReports: labels.hideReports,
          showReports: labels.showReports,
        } satisfies OrgChartNodeData,
      };
    });
  }, [
    layout.nodes,
    data,
    isCollapsed,
    toggleCollapse,
    nodeVariant,
    isEdit,
    pinnedPositions,
    fields,
    renderCard,
    getNodeType,
    labels.reportSingular,
    labels.reportPlural,
    labels.hideReports,
    labels.showReports,
  ]);

  const layoutEdges = useMemo((): Edge[] => {
    return layout.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.kind,
      sourceHandle: null,
      targetHandle: null,
    }));
  }, [layout.edges]);

  // Interactive RF state — required so drag positions aren't reset every render.
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Full replace when hierarchy / collapse / density / edit mode changes
  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  // Soft patch: multi-select + dim without resetting drag positions.
  // Must return the same `prev` array when nothing changed — a new array from
  // .map() retriggers RF selection → onSelectionChange → infinite update loop.
  // `layoutNodes` is included so re-application runs after a full-replace
  // (e.g. collapse) wipes dim flags on the fresh nodes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: layoutNodes is an intentional trigger, not a body reference
  useEffect(() => {
    const isSearchActive = query.trim().length > 0;
    const isFocusActive = focusedIds.size > 0;
    const selectedSet = new Set(selectedIds);
    setNodes((prev) => {
      if (prev.length === 0) return prev;
      let changed = false;
      const next = prev.map((n) => {
        const searchDim = isSearchActive && !matchIds.has(n.id);
        const focusDim = isFocusActive && !focusedIds.has(n.id);
        const prevData = n.data as OrgChartNodeData;
        const selected = selectedSet.has(n.id);
        if (
          n.selected === selected &&
          prevData.searchDim === searchDim &&
          prevData.focusDim === focusDim
        ) {
          return n;
        }
        changed = true;
        return {
          ...n,
          selected,
          data: { ...prevData, searchDim, focusDim },
        };
      });
      return changed ? next : prev;
    });
  }, [selectedIds, query, matchIds, focusedIds, setNodes, layoutNodes]);

  const onNodeDragStop: OnNodeDrag = useCallback(
    (event, node) => {
      if (!isEdit || !editor) return;

      const point =
        "clientX" in event
          ? { x: event.clientX, y: event.clientY }
          : {
              x: event.changedTouches?.[0]?.clientX ?? 0,
              y: event.changedTouches?.[0]?.clientY ?? 0,
            };
      const flow = screenToFlowPosition(point);
      const currentNodes = getNodes();
      const targetId = findDropTargetId(node.id, flow.x, flow.y, currentNodes, data, node.position);

      if (targetId) {
        const ok = editor.onReparent(node.id, targetId);
        if (ok === false) {
          // Reparent rejected (e.g. cycle) — keep free placement where the user left it.
          setPinnedPositions((prev) => ({
            ...prev,
            [node.id]: { x: node.position.x, y: node.position.y },
          }));
          return;
        }
        // Successful reparent: clear pin so dagre can place the node in the new tree.
        setPinnedPositions((prev) => {
          if (!(node.id in prev)) return prev;
          const next = { ...prev };
          delete next[node.id];
          return next;
        });
        return;
      }

      // Free move: pin the drop position so it is not wiped by later layout rebuilds.
      setPinnedPositions((prev) => ({
        ...prev,
        [node.id]: { x: node.position.x, y: node.position.y },
      }));
    },
    [isEdit, editor, screenToFlowPosition, getNodes, data],
  );

  const handleAddVacant = useCallback(() => {
    if (!editor?.onAddVacant) return;
    setVacantDialogOpen(true);
  }, [editor]);

  const confirmAddVacant = useCallback(
    (title: string) => {
      if (!editor?.onAddVacant) return;
      const parentId = selectedId ?? data.find((e) => e.managerId === null)?.id ?? null;
      editor.onAddVacant({
        title,
        managerId: parentId,
      });
      setVacantDialogOpen(false);
    },
    [editor, selectedId, data],
  );

  const showChrome = showSearch || (isEdit && showEditorToolbar && editor);
  const showInspectorPanel =
    isEdit &&
    showInspector &&
    Boolean(editor?.onUpdate) &&
    selectedEmployee !== null &&
    selectedIds.length === 1;

  // Re-fit when chrome/layout constraints change: inspector, density, or
  // narrow breakpoint (mobile fit prefers larger cards / higher minZoom).
  // biome-ignore lint/correctness/useExhaustiveDependencies: showInspectorPanel/nodeVariant/isNarrow are intentional triggers, not body references
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      fitView(resolvedFitView);
    });
    return () => cancelAnimationFrame(raf);
  }, [showInspectorPanel, nodeVariant, isNarrow, fitView, resolvedFitView]);

  return (
    <div
      ref={containerRef}
      data-ananse-orgchart
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Chrome strip reserves layout space — never overlays cards */}
      {showChrome ? (
        <div
          data-ananse-org-chrome
          style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: isNarrow ? "column" : "row",
            flexWrap: isNarrow ? "nowrap" : "wrap",
            alignItems: isNarrow ? "stretch" : "center",
            gap: isNarrow ? 6 : 8,
            padding: isNarrow ? "6px 10px" : "8px 12px",
            borderBottom: "1px solid var(--ananse-node-border)",
            background: "var(--ananse-node-bg)",
            zIndex: 10,
          }}
        >
          {showSearch ? (
            <SearchBar
              value={query}
              onChange={setQuery}
              matchCount={matchIds.size}
              aria-label={labels.searchAriaLabel}
              placeholder={labels.searchPlaceholder}
              clearLabel={labels.clearSearch}
              matchSingular={labels.matchSingular}
              matchPlural={labels.matchPlural}
              fullWidth={isNarrow}
            />
          ) : null}
          {isEdit && showEditorToolbar && editor ? (
            <div
              style={{
                marginLeft: isNarrow ? 0 : "auto",
                maxWidth: "100%",
                minWidth: 0,
                overflowX: "auto",
              }}
            >
              <EditorToolbar
                compact={isNarrow}
                canUndo={Boolean(editor.canUndo)}
                canRedo={Boolean(editor.canRedo)}
                onUndo={() => {
                  editor.onUndo?.();
                }}
                onRedo={() => {
                  editor.onRedo?.();
                }}
                onAddVacant={handleAddVacant}
                {...(editor.onRemove
                  ? {
                      onRemoveSelected: () => {
                        if (selectedIds.length === 0) return;
                        for (const id of [...selectedIds].reverse()) {
                          editor.onRemove?.(id);
                        }
                        setSelectedIds([]);
                      },
                    }
                  : {})}
                hasSelection={selectedIds.length > 0}
                selectionCount={selectedIds.length}
                onExportJson={() => {
                  void import("@ananse/core").then(({ downloadJson }) => {
                    downloadJson("org-chart.json", data);
                  });
                }}
                error={editor.lastError ?? null}
                labels={{
                  undo: labels.undo,
                  redo: labels.redo,
                  addVacant: labels.addVacant,
                  remove: labels.remove,
                  exportJson: labels.exportJson,
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ position: "relative", flex: 1, minWidth: 0, minHeight: 0 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={resolvedNodeTypes}
            edgeTypes={resolvedEdgeTypes}
            nodesDraggable={isEdit}
            nodesConnectable={false}
            elementsSelectable
            nodesFocusable
            multiSelectionKeyCode={["Meta", "Control", "Shift"]}
            selectionOnDrag={isEdit}
            selectNodesOnDrag={false}
            onNodeClick={(event, node) => {
              setFocus(node.id);
              const multi = event.shiftKey || event.metaKey || event.ctrlKey;
              if (multi) {
                setSelectedIds((prev) =>
                  prev.includes(node.id) ? prev.filter((id) => id !== node.id) : [...prev, node.id],
                );
              } else {
                setSelectedIds([node.id]);
              }
            }}
            onSelectionChange={({ nodes: sel }) => {
              if (!isEdit) return;
              // Marquee multi-select → sync. Skip no-ops to avoid setState loops.
              if (sel.length <= 1) return;
              const ids = sel.map((n) => n.id);
              setSelectedIds((prev) => {
                if (prev.length === ids.length && prev.every((id, i) => id === ids[i])) return prev;
                const prevSet = new Set(prev);
                if (ids.length === prevSet.size && ids.every((id) => prevSet.has(id))) return prev;
                return ids;
              });
            }}
            onPaneClick={() => {
              clearFocus();
              setSelectedIds([]);
            }}
            {...(isEdit ? { onNodeDragStop } : {})}
            fitView
            fitViewOptions={resolvedFitView}
            minZoom={minZoom}
            maxZoom={2}
            onlyRenderVisibleElements
            proOptions={rfProOptions}
            defaultEdgeOptions={defaultEdgeOptions}
          >
            <Background gap={20} size={1} color="var(--ananse-node-border)" />
            {showControls ? (
              <Controls showInteractive={false} fitViewOptions={resolvedFitView} />
            ) : null}
            {showMinimap ? (
              <MiniMap
                pannable
                zoomable
                nodeStrokeWidth={3}
                nodeColor={(node) => {
                  const role = (node.data as OrgChartNodeData | undefined)?.employee?.meta?.role;
                  if (role === "vacant") return "#a1a1aa";
                  if (role === "executive" || node.type === "executive") return "#f59e0b";
                  if (node.type === "manager") return "#3b82f6";
                  return "#94a3b8";
                }}
                nodeStrokeColor="#64748b"
                maskColor="rgb(15, 23, 42, 0.08)"
                style={{ background: "var(--ananse-node-bg)" }}
              />
            ) : null}
          </ReactFlow>
        </div>
        {showInspectorPanel && selectedEmployee && editor ? (
          <div
            style={{
              flexShrink: 0,
              padding: 12,
              overflow: "auto",
              borderLeft: "1px solid var(--ananse-node-border)",
              background: "var(--ananse-node-bg)",
            }}
          >
            {(() => {
              const inspectorProps = {
                employee: selectedEmployee,
                onChange: (patch: EmployeePatch) => {
                  editor.onUpdate?.(selectedEmployee.id, patch);
                },
                onClose: () => setSelectedIds([]),
                labels,
                fields,
              };
              if (renderInspector) return renderInspector(inspectorProps);
              return <InspectorPanel {...inspectorProps} />;
            })()}
          </div>
        ) : null}
      </div>
      {(() => {
        const vacantProps = {
          open: vacantDialogOpen,
          defaultTitle: "Open Role",
          onConfirm: confirmAddVacant,
          onCancel: () => setVacantDialogOpen(false),
          labels,
        };
        if (renderAddVacant) return renderAddVacant(vacantProps);
        return <AddVacantDialog {...vacantProps} />;
      })()}
    </div>
  );
}

function resolveSeed(props: OrgChartProps): Employee[] {
  if (props.persistKey) {
    const stored = loadOrgFromStorage(props.persistKey);
    if (stored && stored.length > 0) return stored;
  }
  return props.defaultData ?? props.data ?? [];
}

/**
 * Org chart viewer + editor.
 *
 * @example View
 * ```tsx
 * <OrgChart data={employees} height="100vh" showSearch />
 * ```
 *
 * @example Edit (no editor glue)
 * ```tsx
 * <OrgChart defaultData={employees} mode="edit" onChange={setEmployees} height="100vh" />
 * ```
 */
function resolveDomainFields(
  domain: OrgChartDomain,
  fields?: CardFieldsConfig,
): CardFieldsConfig | undefined {
  if (domain === "hierarchy") {
    return { ...HIERARCHY_CARD_FIELDS, ...fields };
  }
  return fields;
}

function resolveDomainLabels(
  domain: OrgChartDomain,
  pluginLabels: Partial<AnanseOrgLabels>,
  labelsProp?: Partial<AnanseOrgLabels>,
): AnanseOrgLabels {
  const base = domain === "hierarchy" ? DEFAULT_HIERARCHY_LABELS : undefined;
  return mergeOrgLabels({
    ...(base ?? {}),
    ...pluginLabels,
    ...labelsProp,
  });
}

export function OrgChart(props: OrgChartProps): ReactElement {
  injectAnanseTokens();

  const {
    data: dataProp,
    defaultData,
    domain = "people",
    mode = "view",
    onChange,
    onMutation,
    editor: editorProp,
    height,
    className,
    style,
    persistKey,
    fields: fieldsProp,
    renderCard,
    showSearch = false,
    showMinimap = true,
    showControls = true,
    showEditorToolbar = true,
    showInspector = true,
    nodeVariant = "default",
    layoutOptions,
    layout: layoutFn,
    extraEdges,
    fitViewOptions,
    minZoom,
    labels: labelsProp,
    nodeTypes,
    edgeTypes,
    getNodeType,
    renderInspector,
    renderAddVacant,
    plugins,
  } = props;

  const fields = useMemo(() => resolveDomainFields(domain, fieldsProp), [domain, fieldsProp]);

  const pluginLabels = useMemo(() => {
    const merged: Partial<AnanseOrgLabels> = {};
    for (const p of plugins ?? []) {
      if (p.labels) Object.assign(merged, p.labels);
    }
    return merged;
  }, [plugins]);

  const labels = useMemo(
    () => resolveDomainLabels(domain, pluginLabels, labelsProp),
    [domain, pluginLabels, labelsProp],
  );

  // Accept parentId or managerId — always canonicalize for layout / editor.
  const normalizedDataProp = useMemo(
    () => (dataProp !== undefined ? normalizeHierarchyNodes(dataProp) : undefined),
    [dataProp],
  );
  const normalizedDefault = useMemo(
    () => (defaultData !== undefined ? normalizeHierarchyNodes(defaultData) : undefined),
    [defaultData],
  );

  const pluginNodeTypes = useMemo(() => {
    let map: NodeTypes | undefined;
    for (const p of plugins ?? []) {
      if (p.nodeTypes && Object.keys(p.nodeTypes).length > 0) {
        map = { ...(map ?? {}), ...p.nodeTypes };
      }
    }
    return map;
  }, [plugins]);

  const pluginEdgeTypes = useMemo(() => {
    let map: EdgeTypes | undefined;
    for (const p of plugins ?? []) {
      if (p.edgeTypes && Object.keys(p.edgeTypes).length > 0) {
        map = { ...(map ?? {}), ...p.edgeTypes };
      }
    }
    return map;
  }, [plugins]);

  // Only pass custom maps when non-empty so Inner keeps module-level built-ins.
  const customNodeTypes = useMemo(() => {
    if (!pluginNodeTypes && !nodeTypes) return undefined;
    if (!pluginNodeTypes) return nodeTypes;
    if (!nodeTypes) return pluginNodeTypes;
    return { ...pluginNodeTypes, ...nodeTypes };
  }, [pluginNodeTypes, nodeTypes]);

  const customEdgeTypes = useMemo(() => {
    if (!pluginEdgeTypes && !edgeTypes) return undefined;
    if (!pluginEdgeTypes) return edgeTypes;
    if (!edgeTypes) return pluginEdgeTypes;
    return { ...pluginEdgeTypes, ...edgeTypes };
  }, [pluginEdgeTypes, edgeTypes]);

  // Hooks must run unconditionally (no early throw before hooks).
  const missingData =
    normalizedDataProp === undefined && normalizedDefault === undefined && !editorProp;

  const seedRef = useRef<Employee[] | null>(null);
  if (seedRef.current === null) {
    if (persistKey) {
      const stored = loadOrgFromStorage(persistKey);
      if (stored && stored.length > 0) seedRef.current = stored;
    }
    if (seedRef.current === null) {
      seedRef.current = normalizedDefault ?? normalizedDataProp ?? [];
    }
  }

  const autoEditor = useOrgChartEditor({
    initialData: seedRef.current,
    // Controlled when parent passes `data` and no external editor API
    ...(editorProp === undefined && normalizedDataProp !== undefined
      ? { data: normalizedDataProp }
      : {}),
    onChange: (next) => {
      onChange?.(next);
      if (persistKey) saveOrgToStorage(persistKey, next);
    },
    ...(onMutation ? { onMutation } : {}),
  });

  const resolvedData =
    editorProp !== undefined
      ? (normalizedDataProp ?? autoEditor.data)
      : normalizedDataProp !== undefined
        ? autoEditor.data
        : autoEditor.data;

  const resolvedEditor: OrgChartEditorApi | undefined = useMemo(() => {
    if (mode !== "edit") return undefined;
    if (editorProp) return editorProp;
    return {
      onReparent: autoEditor.reparent,
      onAddVacant: autoEditor.addVacant,
      onRemove: autoEditor.remove,
      onUpdate: autoEditor.update,
      onUndo: autoEditor.undo,
      onRedo: autoEditor.redo,
      canUndo: autoEditor.canUndo,
      canRedo: autoEditor.canRedo,
      lastError: autoEditor.lastError,
    };
  }, [
    mode,
    editorProp,
    autoEditor.reparent,
    autoEditor.addVacant,
    autoEditor.remove,
    autoEditor.update,
    autoEditor.undo,
    autoEditor.redo,
    autoEditor.canUndo,
    autoEditor.canRedo,
    autoEditor.lastError,
  ]);

  const shellRef = useRef<HTMLDivElement>(null);
  useZeroHeightWarning(shellRef, "OrgChart", height !== undefined);

  if (missingData) {
    return (
      <div
        role="alert"
        style={{
          ...chartShellStyle(height, style),
          display: "grid",
          placeItems: "center",
          padding: 24,
          color: "var(--ananse-node-text)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {labels.missingData}
      </div>
    );
  }

  return (
    <div
      ref={shellRef}
      className={className}
      style={chartShellStyle(height, style)}
      data-ananse-root="org"
    >
      <ReactFlowProvider>
        <OrgChartInner
          data={resolvedData}
          mode={mode}
          labels={labels}
          {...(layoutOptions ? { layoutOptions } : {})}
          {...(layoutFn ? { layoutFn } : {})}
          {...(extraEdges ? { extraEdges } : {})}
          {...(fitViewOptions ? { fitViewOptions } : {})}
          {...(minZoom !== undefined ? { minZoom } : {})}
          showSearch={showSearch}
          showMinimap={showMinimap}
          showControls={showControls}
          nodeVariant={nodeVariant}
          {...(resolvedEditor ? { editor: resolvedEditor } : {})}
          showEditorToolbar={showEditorToolbar}
          showInspector={showInspector}
          {...(fields ? { fields } : {})}
          {...(renderCard ? { renderCard } : {})}
          {...(customNodeTypes ? { nodeTypes: customNodeTypes } : {})}
          {...(customEdgeTypes ? { edgeTypes: customEdgeTypes } : {})}
          {...(getNodeType ? { getNodeType } : {})}
          {...(renderInspector ? { renderInspector } : {})}
          {...(renderAddVacant ? { renderAddVacant } : {})}
        />
      </ReactFlowProvider>
    </div>
  );
}
