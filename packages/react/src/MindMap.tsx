import type { MindMapLayoutOptions, MindNode } from "@ananse/core";
import { downloadJson, layoutMindMap } from "@ananse/core";
import {
  Background,
  Controls,
  type Edge,
  type EdgeTypes,
  Handle,
  type Node,
  type NodeProps,
  type NodeTypes,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
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
import { SearchBar } from "./controls/SearchBar.js";
import { StraightEdge } from "./edges/StraightEdge.js";
import type { MindLayoutFn } from "./extensibility/types.js";
import { mergeTypeMaps } from "./extensibility/types.js";
import type { AnanseChartLabels } from "./i18n/labels.js";
import { mergeChartLabels } from "./i18n/labels.js";
import { injectAnanseTokens } from "./styles/injectTokens.js";
import {
  type AnanseHeight,
  chartShellStyle,
  useContainerWidth,
  useZeroHeightWarning,
} from "./utils/mount.js";

export type MindNodeRenderContext = {
  isRoot: boolean;
  searchDim: boolean;
};

type MindData = {
  label: string;
  color?: string | undefined;
  isRoot?: boolean;
  searchDim?: boolean;
  node: MindNode;
  renderNode?: ((node: MindNode, ctx: MindNodeRenderContext) => ReactNode) | undefined;
};

function MindNodeView({ data }: NodeProps & { data: MindData }): ReactElement {
  const isRoot = Boolean(data.isRoot);
  const dim = Boolean(data.searchDim);
  const accent = data.color ?? "var(--ananse-edge-highlight)";

  if (data.renderNode) {
    return (
      <div
        data-ananse-mind-node={isRoot ? "root" : "branch"}
        style={{ position: "relative", opacity: dim ? 0.3 : 1, transition: "opacity 150ms ease" }}
      >
        <Handle type="target" id="t" position={Position.Top} style={{ opacity: 0 }} />
        <Handle type="target" id="r" position={Position.Right} style={{ opacity: 0 }} />
        <Handle type="target" id="b" position={Position.Bottom} style={{ opacity: 0 }} />
        <Handle type="target" id="l" position={Position.Left} style={{ opacity: 0 }} />
        {data.renderNode(data.node, { isRoot, searchDim: dim })}
        <Handle type="source" id="st" position={Position.Top} style={{ opacity: 0 }} />
        <Handle type="source" id="sr" position={Position.Right} style={{ opacity: 0 }} />
        <Handle type="source" id="sb" position={Position.Bottom} style={{ opacity: 0 }} />
        <Handle type="source" id="sl" position={Position.Left} style={{ opacity: 0 }} />
      </div>
    );
  }

  return (
    <div
      data-ananse-mind-node={isRoot ? "root" : "branch"}
      style={{
        position: "relative",
        minWidth: isRoot ? 160 : 120,
        padding: isRoot ? "14px 18px" : "10px 14px",
        borderRadius: isRoot ? 14 : 999,
        borderWidth: isRoot ? 3 : 2,
        borderStyle: "solid",
        borderColor: accent,
        background: isRoot ? "hsl(221 83% 97%)" : "var(--ananse-node-bg)",
        color: "var(--ananse-node-text)",
        fontSize: isRoot ? 14 : 13,
        fontWeight: 600,
        textAlign: "center",
        boxShadow: isRoot ? "0 4px 16px rgb(37 99 235 / 0.18)" : "var(--ananse-node-shadow)",
        lineHeight: 1.25,
        opacity: dim ? 0.3 : 1,
        transition: "opacity 150ms ease",
      }}
    >
      <Handle type="target" id="t" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="target" id="r" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="target" id="b" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" id="l" position={Position.Left} style={{ opacity: 0 }} />
      {data.label}
      <Handle type="source" id="st" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" id="sr" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="source" id="sb" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="source" id="sl" position={Position.Left} style={{ opacity: 0 }} />
    </div>
  );
}

const mindNodeTypes = { mind: MindNodeView };
const mindEdgeTypes = { straight: StraightEdge };

export type MindMapProps = {
  data: MindNode[];
  layoutOptions?: MindMapLayoutOptions;
  /** Bring-your-own layout. Defaults to `layoutMindMap`. */
  layout?: MindLayoutFn;
  showControls?: boolean;
  /** Allow free drag of nodes. @default true */
  editable?: boolean;
  /** Called when the user finishes dragging a node (positions are visual only). */
  onChange?: (nodes: MindNode[]) => void;
  /** Show Export JSON control. @default false */
  showExport?: boolean;
  /** Show label search bar. @default false */
  showSearch?: boolean;
  /** Custom node face (handles stay on the wrapper). */
  renderNode?: (node: MindNode, ctx: MindNodeRenderContext) => ReactNode;
  /** Merge RF node types (default: `mind`). */
  nodeTypes?: NodeTypes;
  /** Merge RF edge types (default: `straight`). */
  edgeTypes?: EdgeTypes;
  /** Map node → RF type name. @default () => "mind" */
  getNodeType?: (node: MindNode) => string;
  labels?: Partial<AnanseChartLabels>;
  height?: AnanseHeight;
  className?: string;
  style?: CSSProperties;
};

function MindMapInner({
  data,
  layoutOptions,
  layout: layoutFn,
  showControls = true,
  editable = true,
  onChange,
  showExport = false,
  showSearch = false,
  renderNode,
  nodeTypes: nodeTypesProp,
  edgeTypes: edgeTypesProp,
  getNodeType,
  labels: labelsPartial,
  containerRef,
}: MindMapProps & { containerRef: React.RefObject<HTMLDivElement | null> }): ReactElement {
  const labels = mergeChartLabels({
    searchAriaLabel: "Search mind map",
    searchPlaceholder: "Search topics...",
    ...labelsPartial,
  });
  const layout = useMemo(() => {
    const run = layoutFn ?? layoutMindMap;
    return run(data, layoutOptions ?? {});
  }, [data, layoutOptions, layoutFn]);
  const containerWidth = useContainerWidth(containerRef);
  const isNarrow = containerWidth !== null && containerWidth < 640;
  const [query, setQuery] = useState("");
  const resolvedNodeTypes = useMemo(
    () => mergeTypeMaps(mindNodeTypes as NodeTypes, nodeTypesProp),
    [nodeTypesProp],
  );
  const resolvedEdgeTypes = useMemo(
    () => mergeTypeMaps(mindEdgeTypes as EdgeTypes, edgeTypesProp),
    [edgeTypesProp],
  );
  const fitViewOptions = useMemo(
    () => ({ padding: 0.2, minZoom: isNarrow ? 0.65 : 0.2, maxZoom: 1.5 }),
    [isNarrow],
  );
  const defaultEdgeOptions = useMemo(
    () => ({
      type: "straight" as const,
      style: { stroke: "var(--ananse-edge-highlight)", strokeWidth: 2.25 },
    }),
    [],
  );
  const rfProOptions = useMemo(() => ({ hideAttribution: true }), []);

  const matchIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return new Set<string>();
    return new Set(data.filter((n) => n.label.toLowerCase().includes(q)).map((n) => n.id));
  }, [data, query]);

  const rootId = useMemo(() => {
    const explicit = data.find((n) => n.parentId == null);
    return explicit?.id ?? data[0]?.id;
  }, [data]);

  const initialNodes: Node[] = useMemo(() => {
    const isSearchActive = query.trim().length > 0;
    const real = layout.nodes.map((n) => {
      const data: MindData = {
        label: n.data.label,
        isRoot: n.id === rootId,
        searchDim: isSearchActive && !matchIds.has(n.id),
        node: n.data,
      };
      if (n.data.color !== undefined) data.color = n.data.color;
      if (renderNode) data.renderNode = renderNode;
      return {
        id: n.id,
        type: getNodeType?.(n.data) ?? "mind",
        position: n.position,
        width: n.size.width,
        height: n.size.height,
        ariaLabel: n.data.label,
        data,
        draggable: editable,
      };
    });
    // Radial layouts are asymmetric when branches are uneven — the bbox center
    // drifts away from root and fitView pushes the map off to one side. Insert
    // 4 invisible anchor nodes at the max radius so the bbox stays centered.
    let maxR = 0;
    for (const n of layout.nodes) {
      const cx = n.position.x + n.size.width / 2;
      const cy = n.position.y + n.size.height / 2;
      const r = Math.max(Math.abs(cx), Math.abs(cy));
      if (r > maxR) maxR = r;
    }
    if (maxR > 0) {
      const anchors: Node[] = ["nw", "ne", "sw", "se"].map((corner) => {
        const dx = corner.includes("e") ? maxR : -maxR;
        const dy = corner.includes("s") ? maxR : -maxR;
        return {
          id: `__anchor_${corner}`,
          type: "mind",
          position: { x: dx, y: dy },
          width: 1,
          height: 1,
          data: {
            label: "",
            isRoot: false,
            searchDim: false,
            node: { id: `__anchor_${corner}`, label: "" },
          } satisfies MindData,
          draggable: false,
          selectable: false,
          focusable: false,
          style: { opacity: 0, pointerEvents: "none" as const, visibility: "hidden" as const },
        };
      });
      return [...real, ...anchors];
    }
    return real;
  }, [layout.nodes, rootId, editable, query, matchIds, renderNode, getNodeType]);

  const initialEdges: Edge[] = useMemo(
    () =>
      layout.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        // Built-in mind edges use kind "solid" from layoutMindMap → map to "straight"
        type: e.kind === "solid" || !e.kind ? "straight" : e.kind,
        style: {
          stroke: "var(--ananse-edge-highlight)",
          strokeWidth: 2.25,
          opacity: 0.85,
        },
      })),
    [layout.edges],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleDragStop = useCallback(() => {
    if (!onChange) return;
    onChange(data);
  }, [onChange, data]);

  useEffect(() => {
    if (!showSearch) return;
    function isEditableTarget(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false;
      if (el.isContentEditable) return true;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    }
    function handle(event: KeyboardEvent): void {
      if (event.key === "/" && !isEditableTarget(event.target)) {
        const input =
          containerRef.current?.querySelector<HTMLInputElement>('input[role="searchbox"]');
        if (input) {
          event.preventDefault();
          input.focus();
          input.select();
        }
      }
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [showSearch, containerRef]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      data-ananse-mindmap
    >
      {showSearch || showExport ? (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
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
          {showExport ? (
            <div style={{ marginLeft: isNarrow ? 0 : "auto" }}>
              <button
                type="button"
                onClick={() => downloadJson("mind-map.json", data)}
                style={{
                  minHeight: 44,
                  minWidth: 44,
                  padding: "0 12px",
                  borderRadius: 8,
                  border: "1px solid var(--ananse-node-border)",
                  background: "var(--ananse-node-bg)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {labels.exportJson}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={resolvedNodeTypes}
          edgeTypes={resolvedEdgeTypes}
          nodesDraggable={editable}
          onNodeDragStop={handleDragStop}
          fitView
          fitViewOptions={fitViewOptions}
          minZoom={isNarrow ? 0.3 : 0.2}
          maxZoom={2}
          proOptions={rfProOptions}
          onlyRenderVisibleElements
          defaultEdgeOptions={defaultEdgeOptions}
        >
          <Background gap={24} size={1} color="var(--ananse-node-border)" />
          {showControls ? <Controls showInteractive={false} /> : null}
        </ReactFlow>
      </div>
    </div>
  );
}

export function MindMap(props: MindMapProps): ReactElement {
  injectAnanseTokens();
  const shellRef = useRef<HTMLDivElement>(null);
  useZeroHeightWarning(shellRef, "MindMap", props.height !== undefined);
  return (
    <div
      ref={shellRef}
      className={props.className}
      style={chartShellStyle(props.height, props.style)}
      data-ananse-root="mind"
    >
      <ReactFlowProvider>
        <MindMapInner {...props} containerRef={shellRef} />
      </ReactFlowProvider>
    </div>
  );
}
