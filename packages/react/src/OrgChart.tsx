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

const nodeTypes = {
  employee: EmployeeNode,
  executive: ExecutiveNode,
  vacant: VacantNode,
  manager: ManagerNode,
};

const edgeTypes = { solid: SolidEdge, dotted: DottedEdge };

type NodeTypeName = keyof typeof nodeTypes;

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

function findDropTargetId(
  draggedId: string,
  flowX: number,
  flowY: number,
  nodes: Node[],
  employees: Employee[],
): string | null {
  const forbidden = new Set([draggedId, ...getDescendants(employees, draggedId).map((e) => e.id)]);

  // Prefer top-most (highest z) node whose bounds contain the point
  let hit: string | null = null;
  for (const n of nodes) {
    if (forbidden.has(n.id)) continue;
    const w = n.measured?.width ?? n.width ?? 240;
    const h = n.measured?.height ?? n.height ?? 120;
    const x = n.position.x;
    const y = n.position.y;
    if (flowX >= x && flowX <= x + w && flowY >= y && flowY <= y + h) {
      hit = n.id;
    }
  }
  return hit;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
        if (isEdit && selectedId && editor?.onRemove && !isEditableTarget(event.target)) {
          event.preventDefault();
          editor.onRemove(selectedId);
          setSelectedId(null);
        }
      }
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [focusedId, clearFocus, showSearch, isEdit, editor, selectedId]);

  const visibleData = useMemo(() => data.filter((e) => visibleIds.has(e.id)), [data, visibleIds]);

  const layout: LayoutResult<Employee> = useMemo(
    () => layoutOrgChart(visibleData, layoutOptions),
    [visibleData, layoutOptions],
  );

  const rfNodes: Node[] = useMemo(
    () =>
      layout.nodes.map((n) => {
        const reportCount = getDirectReports(data, n.id).length;
        const isManager = reportCount > 0;
        const type = pickNodeType(n.data, isManager);
        const collapsed = isCollapsed(n.id);
        const isSearchActive = query.trim().length > 0;
        const isFocusActive = focusedIds.size > 0;
        const searchDim = isSearchActive && !matchIds.has(n.id);
        const focusDim = isFocusActive && !focusedIds.has(n.id);
        return {
          id: n.id,
          type,
          position: n.position,
          width: n.size.width,
          height: n.size.height,
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
          draggable: isEdit,
          selectable: true,
          selected: selectedId === n.id,
          style: { pointerEvents: "all", zIndex: 1 },
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
            searchDim,
            focusDim,
            nodeVariant,
          } satisfies OrgChartNodeData,
        };
      }),
    [
      layout.nodes,
      data,
      isCollapsed,
      toggleCollapse,
      query,
      matchIds,
      focusedIds,
      nodeVariant,
      isEdit,
      selectedId,
    ],
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      layout.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.kind,
        sourceHandle: null,
        targetHandle: null,
      })),
    [layout.edges],
  );

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
      const targetId = findDropTargetId(node.id, flow.x, flow.y, getNodes(), data);
      if (targetId) {
        editor.onReparent(node.id, targetId);
      }
      // Empty canvas drop: layout snaps back from data-driven positions on next render.
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

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {showSearch ? (
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}>
          <SearchBar value={query} onChange={setQuery} />
        </div>
      ) : null}
      {isEdit && showEditorToolbar && editor ? (
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
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
                    if (selectedId) {
                      editor.onRemove?.(selectedId);
                      setSelectedId(null);
                    }
                  },
                }
              : {})}
            hasSelection={Boolean(selectedId)}
            error={editor.lastError ?? null}
          />
        </div>
      ) : null}
      {isEdit && showInspector && editor?.onUpdate && selectedEmployee ? (
        <div style={{ position: "absolute", top: 56, right: 12, zIndex: 10 }}>
          <InspectorPanel
            employee={selectedEmployee}
            onChange={(patch) => {
              editor.onUpdate?.(selectedEmployee.id, patch);
            }}
            onClose={() => setSelectedId(null)}
          />
        </div>
      ) : null}
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={isEdit}
        nodesConnectable={false}
        elementsSelectable
        nodesFocusable
        onNodeClick={(_, node) => {
          setFocus(node.id);
          setSelectedId(node.id);
        }}
        onPaneClick={() => {
          clearFocus();
          setSelectedId(null);
        }}
        {...(isEdit ? { onNodeDragStop } : {})}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1.5 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "solid",
          style: { stroke: "var(--canvas-edge-color)", strokeWidth: 1.5 },
        }}
      >
        <Background gap={20} size={1} color="var(--canvas-node-border)" />
        {showControls ? (
          <Controls
            showInteractive={false}
            fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1.5 }}
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
            style={{ background: "var(--canvas-node-bg)" }}
          />
        ) : null}
      </ReactFlow>
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
