import type { MindMapLayoutOptions, MindNode } from "@canvas/core";
import { downloadJson, layoutMindMap } from "@canvas/core";
import {
  Background,
  Controls,
  type Edge,
  Handle,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import {
  type CSSProperties,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import "@xyflow/react/dist/style.css";
import { StraightEdge } from "./edges/StraightEdge.js";
import { injectCanvasTokens } from "./styles/injectTokens.js";
import { type CanvasHeight, chartShellStyle, useZeroHeightWarning } from "./utils/mount.js";

type MindData = { label: string; color?: string; isRoot?: boolean };

function MindNodeView({ data }: NodeProps & { data: MindData }): ReactElement {
  const isRoot = Boolean(data.isRoot);
  const accent = data.color ?? "var(--canvas-edge-highlight)";
  return (
    <div
      data-canvas-mind-node={isRoot ? "root" : "branch"}
      style={{
        position: "relative",
        minWidth: isRoot ? 160 : 120,
        padding: isRoot ? "14px 18px" : "10px 14px",
        borderRadius: isRoot ? 14 : 999,
        borderWidth: isRoot ? 3 : 2,
        borderStyle: "solid",
        borderColor: accent,
        background: isRoot ? "hsl(221 83% 97%)" : "var(--canvas-node-bg)",
        color: "var(--canvas-node-text)",
        fontSize: isRoot ? 14 : 13,
        fontWeight: 600,
        textAlign: "center",
        boxShadow: isRoot ? "0 4px 16px rgb(37 99 235 / 0.18)" : "var(--canvas-node-shadow)",
        lineHeight: 1.25,
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
  showControls?: boolean;
  /** Allow free drag of nodes. @default true */
  editable?: boolean;
  /** Called when the user finishes dragging a node (positions are visual only). */
  onChange?: (nodes: MindNode[]) => void;
  /** Show Export JSON control. @default false */
  showExport?: boolean;
  height?: CanvasHeight;
  className?: string;
  style?: CSSProperties;
};

function MindMapInner({
  data,
  layoutOptions,
  showControls = true,
  editable = true,
  onChange,
  showExport = false,
}: MindMapProps): ReactElement {
  const layout = useMemo(() => layoutMindMap(data, layoutOptions), [data, layoutOptions]);

  const rootId = useMemo(() => {
    const explicit = data.find((n) => n.parentId == null);
    return explicit?.id ?? data[0]?.id;
  }, [data]);

  const initialNodes: Node[] = useMemo(
    () =>
      layout.nodes.map((n) => ({
        id: n.id,
        type: "mind",
        position: n.position,
        width: n.size.width,
        height: n.size.height,
        data: {
          label: n.data.label,
          color: n.data.color,
          isRoot: n.id === rootId,
        },
        draggable: editable,
      })),
    [layout.nodes, rootId, editable],
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      layout.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "straight",
        style: {
          stroke: "var(--canvas-edge-highlight)",
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
    // Positions are visual — parent still owns the tree model
    onChange(data);
  }, [onChange, data]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }} data-canvas-mindmap>
      {showExport ? (
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
          <button
            type="button"
            onClick={() => downloadJson("mind-map.json", data)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid var(--canvas-node-border)",
              background: "var(--canvas-node-bg)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Export JSON
          </button>
        </div>
      ) : null}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={mindNodeTypes}
        edgeTypes={mindEdgeTypes}
        nodesDraggable={editable}
        onNodeDragStop={handleDragStop}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        onlyRenderVisibleElements
        defaultEdgeOptions={{
          type: "straight",
          style: { stroke: "var(--canvas-edge-highlight)", strokeWidth: 2.25 },
        }}
      >
        <Background gap={24} size={1} color="var(--canvas-node-border)" />
        {showControls ? <Controls showInteractive={false} /> : null}
      </ReactFlow>
    </div>
  );
}

export function MindMap(props: MindMapProps): ReactElement {
  injectCanvasTokens();
  const shellRef = useRef<HTMLDivElement>(null);
  useZeroHeightWarning(shellRef, "MindMap", props.height !== undefined);
  return (
    <div
      ref={shellRef}
      className={props.className}
      style={chartShellStyle(props.height, props.style)}
      data-canvas-root="mind"
    >
      <ReactFlowProvider>
        <MindMapInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
