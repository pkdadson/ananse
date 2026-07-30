import type {
  AddVacantRoleInput,
  Employee,
  EmployeePatch,
  LayoutResult,
  OrgChartLayoutOptions,
} from "@canvas/core";
import { getDescendants, getDirectReports, layoutOrgChart } from "@canvas/core";
import {
  Background,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeProps,
  type OnNodeDrag,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";
import { EditorToolbar } from "./controls/EditorToolbar.js";
import { InspectorPanel } from "./controls/InspectorPanel.js";
import { SearchBar } from "./controls/SearchBar.js";
import { DottedEdge } from "./edges/DottedEdge.js";
import { SolidEdge } from "./edges/SolidEdge.js";
import { useFocusMode } from "./hooks/useFocusMode.js";
import { useKeyboardNav } from "./hooks/useKeyboardNav.js";
import { useOrgChartState } from "./hooks/useOrgChartState.js";
import { useSearch } from "./hooks/useSearch.js";
import { ExecutiveCard } from "./nodes/ExecutiveCard.js";
import { ManagerCard } from "./nodes/ManagerCard.js";
import { NodeShell } from "./nodes/NodeShell.js";
import { VacantRoleCard } from "./nodes/VacantRoleCard.js";
import { EmployeeFace, type NodeVariant } from "./nodes/employeeFace.js";

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
};

function EmployeeNode({ data }: NodeProps & { data: OrgChartNodeData }): ReactElement {
  const dim = data.searchDim || data.focusDim;
  return (
    <NodeShell searchDim={data.searchDim} dim={dim}>
      <EmployeeFace data={data.employee} variant={data.nodeVariant} />
    </NodeShell>
  );
}

function ExecutiveNode({ data }: NodeProps & { data: OrgChartNodeData }): ReactElement {
  const dim = data.searchDim || data.focusDim;
  return (
    <NodeShell searchDim={data.searchDim} dim={dim}>
      <ExecutiveCard data={data.employee} variant={data.nodeVariant} />
    </NodeShell>
  );
}

function VacantNode({ data }: NodeProps & { data: OrgChartNodeData }): ReactElement {
  const dim = data.searchDim || data.focusDim;
  return (
    <NodeShell searchDim={data.searchDim} dim={dim}>
      <VacantRoleCard
        title={data.title}
        {...(data.department !== undefined ? { department: data.department } : {})}
      />
    </NodeShell>
  );
}

function ManagerNode({ data }: NodeProps & { data: OrgChartNodeData }): ReactElement {
  const dim = data.searchDim || data.focusDim;
  return (
    <NodeShell searchDim={data.searchDim} dim={dim}>
      <ManagerCard
        data={data.employee}
        directReportCount={data.directReportCount}
        collapsed={data.collapsed}
        onToggleCollapse={data.onToggleCollapse}
        variant={data.nodeVariant}
      />
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

/** Optional editor integration (pair with `useOrgChartEditor`). */
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
  data: Employee[];
  mode: "view" | "edit";
  layoutOptions?: OrgChartLayoutOptions;
  showSearch?: boolean;
  showMinimap?: boolean;
  showControls?: boolean;
  nodeVariant?: NodeVariant;
  /** When mode is edit, wire mutations from useOrgChartEditor. */
  editor?: OrgChartEditorApi;
  showEditorToolbar?: boolean;
  /** Side panel to edit selected person fields (edit mode). Default true when editor provided. */
  showInspector?: boolean;
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

function OrgChartInner({
  data,
  mode,
  layoutOptions,
  showSearch = false,
  showMinimap = true,
  showControls = true,
  nodeVariant = "default",
  editor,
  showEditorToolbar = true,
  showInspector = true,
}: OrgChartProps): ReactElement {
  const isEdit = mode === "edit" && editor !== undefined;
  const { visibleIds, isCollapsed, toggleCollapse } = useOrgChartState(data);
  const { query, setQuery, matchIds } = useSearch(data);
  const { focusedIds, focusedId, setFocus, clearFocus } = useFocusMode(data);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedId = selectedIds[selectedIds.length - 1] ?? null;
  /** Free-drag positions that override dagre until reparent or explicit reset. */
  const [pinnedPositions, setPinnedPositions] = useState<Record<string, { x: number; y: number }>>(
    {},
  );
  const { screenToFlowPosition, getNodes } = useReactFlow();
  const selectedEmployee = useMemo(
    () => (selectedId ? (data.find((e) => e.id === selectedId) ?? null) : null),
    [data, selectedId],
  );

  const onFocus = useCallback((id: string) => setFocus(id), [setFocus]);
  useKeyboardNav({ employees: data, focusedId, onFocus });

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
      if (event.key === "Escape" && focusedId) {
        event.preventDefault();
        clearFocus();
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
  }, [focusedId, clearFocus, showSearch, isEdit, editor, selectedIds]);

  const visibleData = useMemo(() => data.filter((e) => visibleIds.has(e.id)), [data, visibleIds]);

  /** Match dagre box sizes to card density so RF node clips don't cut content. */
  const densityLayout = useMemo((): OrgChartLayoutOptions => {
    const byVariant: Record<NodeVariant, OrgChartLayoutOptions> = {
      default: { nodeWidth: 240, nodeHeight: 100, nodeSep: 40, rankSep: 72 },
      detailed: { nodeWidth: 260, nodeHeight: 148, nodeSep: 36, rankSep: 80 },
      compact: { nodeWidth: 188, nodeHeight: 56, nodeSep: 28, rankSep: 56 },
      minimal: { nodeWidth: 148, nodeHeight: 40, nodeSep: 24, rankSep: 48 },
    };
    return { ...byVariant[nodeVariant], ...layoutOptions };
  }, [nodeVariant, layoutOptions]);

  const layout: LayoutResult<Employee> = useMemo(
    () => layoutOrgChart(visibleData, densityLayout),
    [visibleData, densityLayout],
  );

  // Structural nodes only (no selection/search/focus) — safe to rebuild without killing drag.
  // pinnedPositions keep free-drag placements across rebuilds.
  const layoutNodes = useMemo((): Node[] => {
    return layout.nodes.map((n) => {
      const reportCount = getDirectReports(data, n.id).length;
      const isManager = reportCount > 0;
      const type = pickNodeType(n.data, isManager);
      const collapsed = isCollapsed(n.id);
      const pinned = pinnedPositions[n.id];
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
        style: {
          pointerEvents: "all" as const,
          zIndex: 1,
          cursor: isEdit ? "grab" : "pointer",
        },
        data: {
          employee: n.data,
          title:
            typeof n.data.meta?.title === "string"
              ? (n.data.meta.title as string)
              : (n.data.title ?? "Open Role"),
          department: n.data.department,
          directReportCount: reportCount,
          collapsed,
          onToggleCollapse: () => toggleCollapse(n.id),
          searchDim: false,
          focusDim: false,
          nodeVariant,
        } satisfies OrgChartNodeData,
      };
    });
  }, [layout.nodes, data, isCollapsed, toggleCollapse, nodeVariant, isEdit, pinnedPositions]);

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
  }, [selectedIds, query, matchIds, focusedIds, setNodes]);

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
    const parentId = selectedId ?? data.find((e) => e.managerId === null)?.id ?? null;
    const title =
      typeof window !== "undefined"
        ? window.prompt("Title for vacant role", "Open Role")
        : "Open Role";
    if (!title) return;
    editor.onAddVacant({
      title,
      managerId: parentId,
    });
  }, [editor, selectedId, data]);

  const showChrome = showSearch || (isEdit && showEditorToolbar && editor);
  const showInspectorPanel =
    isEdit &&
    showInspector &&
    Boolean(editor?.onUpdate) &&
    selectedEmployee !== null &&
    selectedIds.length === 1;

  return (
    <div
      ref={containerRef}
      data-canvas-orgchart
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
          data-canvas-org-chrome
          style={{
            flexShrink: 0,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderBottom: "1px solid var(--canvas-node-border)",
            background: "var(--canvas-node-bg)",
            zIndex: 10,
          }}
        >
          {showSearch ? (
            <SearchBar value={query} onChange={setQuery} matchCount={matchIds.size} />
          ) : null}
          {isEdit && showEditorToolbar && editor ? (
            <div style={{ marginLeft: "auto", maxWidth: "100%", overflowX: "auto" }}>
              <EditorToolbar
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
                  void import("@canvas/core").then(({ downloadJson }) => {
                    downloadJson("org-chart.json", data);
                  });
                }}
                error={editor.lastError ?? null}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        {showInspectorPanel && selectedEmployee && editor ? (
          <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
            <InspectorPanel
              employee={selectedEmployee}
              onChange={(patch) => {
                editor.onUpdate?.(selectedEmployee.id, patch);
              }}
              onClose={() => setSelectedIds([])}
            />
          </div>
        ) : null}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={orgNodeTypes}
          edgeTypes={orgEdgeTypes}
          nodesDraggable={isEdit}
          nodesConnectable={false}
          elementsSelectable
          nodesFocusable
          multiSelectionKeyCode="Shift"
          selectionOnDrag={isEdit}
          selectNodesOnDrag={false}
          onNodeClick={(event, node) => {
            setFocus(node.id);
            if (event.shiftKey) {
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
          fitViewOptions={{ padding: 0.15, minZoom: 0.1, maxZoom: 1.5 }}
          minZoom={0.1}
          maxZoom={2}
          onlyRenderVisibleElements
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: "solid",
            style: { stroke: "var(--canvas-edge-color)", strokeWidth: 2 },
          }}
        >
          <Background gap={20} size={1} color="var(--canvas-node-border)" />
          {showControls ? (
            <Controls
              showInteractive={false}
              fitViewOptions={{ padding: 0.15, minZoom: 0.1, maxZoom: 1.5 }}
            />
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
              style={{
                background: "var(--canvas-node-bg)",
                right: showInspectorPanel ? 288 : undefined,
              }}
            />
          ) : null}
        </ReactFlow>
      </div>
    </div>
  );
}

export function OrgChart(props: OrgChartProps): ReactElement {
  return (
    <ReactFlowProvider>
      <OrgChartInner {...props} />
    </ReactFlowProvider>
  );
}
