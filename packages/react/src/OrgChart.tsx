import {
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { type ReactElement, useCallback, useMemo } from "react";
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
import { EmployeeCard } from "./nodes/EmployeeCard.js";
import { ExecutiveCard } from "./nodes/ExecutiveCard.js";
import { ManagerCard } from "./nodes/ManagerCard.js";
import { VacantRoleCard } from "./nodes/VacantRoleCard.js";

type NodeData = {
  employee: Employee;
  title: string;
  department?: string | undefined;
  directReportCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  searchDim: boolean;
  focusDim: boolean;
};

function wrapDim(children: ReactElement, dim: boolean, isSearchDim: boolean): ReactElement {
  return (
    <div
      data-canvas-search-dim={isSearchDim ? "true" : "false"}
      style={{ opacity: dim ? 0.3 : 1, transition: "opacity 150ms ease" }}
    >
      {children}
    </div>
  );
}

const nodeTypes = {
  employee: ({ data }: { data: NodeData }) =>
    wrapDim(<EmployeeCard data={data.employee} />, data.searchDim || data.focusDim, data.searchDim),
  executive: ({ data }: { data: NodeData }) =>
    wrapDim(
      <ExecutiveCard data={data.employee} />,
      data.searchDim || data.focusDim,
      data.searchDim,
    ),
  vacant: ({ data }: { data: NodeData }) =>
    wrapDim(
      <VacantRoleCard
        title={data.title}
        {...(data.department !== undefined ? { department: data.department } : {})}
      />,
      data.searchDim || data.focusDim,
      data.searchDim,
    ),
  manager: ({ data }: { data: NodeData }) =>
    wrapDim(
      <ManagerCard
        data={data.employee}
        directReportCount={data.directReportCount}
        collapsed={data.collapsed}
        onToggleCollapse={data.onToggleCollapse}
      />,
      data.searchDim || data.focusDim,
      data.searchDim,
    ),
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
};

function OrgChartInner({
  data,
  mode,
  layoutOptions,
  showSearch = false,
  showMinimap = true,
  showControls = true,
}: OrgChartProps): ReactElement {
  const { visibleIds, isCollapsed, toggleCollapse } = useOrgChartState(data);
  const { query, setQuery, matchIds } = useSearch(data);
  const { focusedIds, focusedId, setFocus } = useFocusMode(data);

  const onFocus = useCallback((id: string) => setFocus(id), [setFocus]);
  useKeyboardNav({ employees: data, focusedId, onFocus });

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
          draggable: false,
          selectable: mode === "edit",
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
          } satisfies NodeData,
        };
      }),
    [layout.nodes, data, isCollapsed, toggleCollapse, mode, query, matchIds, focusedIds],
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      layout.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.kind,
      })),
    [layout.edges],
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
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
        fitView
        proOptions={{ hideAttribution: true }}
      >
        {showControls ? <Controls showInteractive={false} /> : null}
        {showMinimap ? <MiniMap pannable zoomable /> : null}
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
