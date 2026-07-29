import {
  Background,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { type ReactElement, useCallback, useEffect, useMemo, useRef } from "react";
import "@xyflow/react/dist/style.css";
import type { Employee, LayoutResult, OrgChartLayoutOptions } from "@canvas/core";
import { getDirectReports, layoutOrgChart } from "@canvas/core";
import { SearchBar } from "./controls/SearchBar.js";
import { DottedEdge } from "./edges/DottedEdge.js";
import { SolidEdge } from "./edges/SolidEdge.js";
import { useFocusMode } from "./hooks/useFocusMode.js";
import { useKeyboardNav } from "./hooks/useKeyboardNav.js";
import { useOrgChartState } from "./hooks/useOrgChartState.js";
import { useSearch } from "./hooks/useSearch.js";
import { EmployeeFace, type NodeVariant } from "./nodes/employeeFace.js";
import { ExecutiveCard } from "./nodes/ExecutiveCard.js";
import { ManagerCard } from "./nodes/ManagerCard.js";
import { NodeShell } from "./nodes/NodeShell.js";
import { VacantRoleCard } from "./nodes/VacantRoleCard.js";

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

export type OrgChartProps = {
  data: Employee[];
  mode: "view" | "edit";
  layoutOptions?: OrgChartLayoutOptions;
  showSearch?: boolean;
  showMinimap?: boolean;
  showControls?: boolean;
  nodeVariant?: NodeVariant;
};

function OrgChartInner({
  data,
  mode,
  layoutOptions,
  showSearch = false,
  showMinimap = true,
  showControls = true,
  nodeVariant = "default",
}: OrgChartProps): ReactElement {
  const { visibleIds, isCollapsed, toggleCollapse } = useOrgChartState(data);
  const { query, setQuery, matchIds } = useSearch(data);
  const { focusedIds, focusedId, setFocus, clearFocus } = useFocusMode(data);
  const containerRef = useRef<HTMLDivElement>(null);

  const onFocus = useCallback((id: string) => setFocus(id), [setFocus]);
  useKeyboardNav({ employees: data, focusedId, onFocus });

  // Global viewer shortcuts: `/` focuses search, `Escape` clears focus mode.
  useEffect(() => {
    function isEditableTarget(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false;
      if (el.isContentEditable) return true;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    }
    function handle(event: KeyboardEvent): void {
      if (event.key === "Escape" && focusedId) {
        event.preventDefault();
        clearFocus();
        return;
      }
      if (event.key === "/" && showSearch && !isEditableTarget(event.target)) {
        const input = containerRef.current?.querySelector<HTMLInputElement>(
          'input[role="searchbox"]',
        );
        if (input) {
          event.preventDefault();
          input.focus();
          input.select();
        }
      }
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [focusedId, clearFocus, showSearch]);

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
          // Explicit size helps MiniMap render node rects before ResizeObserver runs.
          width: n.size.width,
          height: n.size.height,
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
          draggable: false,
          selectable: true,
          // Keep nodes above the pan pane for hit-testing interactive controls.
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
    [layout.nodes, data, isCollapsed, toggleCollapse, query, matchIds, focusedIds, nodeVariant],
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      layout.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.kind,
        // Smooth-step edges attach top/bottom handles.
        sourceHandle: null,
        targetHandle: null,
      })),
    [layout.edges],
  );

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {showSearch ? (
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}>
          <SearchBar value={query} onChange={setQuery} />
        </div>
      ) : null}
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={mode === "edit"}
        // Nodes stay interactive for collapse buttons even in view mode.
        nodesFocusable
        onNodeClick={(_, node) => setFocus(node.id)}
        onPaneClick={clearFocus}
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
