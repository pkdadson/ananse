import type { FlowLayoutOptions, FlowLink, FlowNode } from "@canvas/core";
import { downloadJson, layoutFlow } from "@canvas/core";
import {
  Background,
  Controls,
  type Edge,
  Handle,
  MarkerType,
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
import { SolidEdge } from "./edges/SolidEdge.js";
import { injectCanvasTokens } from "./styles/injectTokens.js";
import { type CanvasHeight, chartShellStyle, useZeroHeightWarning } from "./utils/mount.js";

type FlowData = { label: string; kind?: FlowNode["kind"] };

const KIND_STYLE: Record<string, { border: string; radius: number }> = {
  start: { border: "var(--canvas-dept-product)", radius: 999 },
  end: { border: "var(--canvas-dept-sales)", radius: 999 },
  decision: { border: "var(--canvas-dept-marketing)", radius: 8 },
  task: { border: "var(--canvas-edge-highlight)", radius: 10 },
  default: { border: "var(--canvas-node-border)", radius: 10 },
};

function FlowNodeView({ data }: NodeProps & { data: FlowData }): ReactElement {
  const kind = data.kind ?? "default";
  const style = KIND_STYLE[kind] ??
    KIND_STYLE.default ?? { border: "var(--canvas-node-border)", radius: 10 };
  return (
    <div
      data-canvas-flow-node={kind}
      style={{
        position: "relative",
        minWidth: 140,
        padding: "12px 16px",
        borderRadius: style.radius,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: style.border,
        background: "var(--canvas-node-bg)",
        color: "var(--canvas-node-text)",
        fontSize: 13,
        fontWeight: 600,
        textAlign: "center",
        boxShadow: "var(--canvas-node-shadow)",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      {data.label}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

const flowNodeTypes = { flow: FlowNodeView };
const flowEdgeTypes = { solid: SolidEdge };

export type FlowBuilderProps = {
  nodes: FlowNode[];
  links: FlowLink[];
  layoutOptions?: FlowLayoutOptions;
  showControls?: boolean;
  showLegend?: boolean;
  /** Allow free drag. @default true */
  editable?: boolean;
  onChange?: (payload: { nodes: FlowNode[]; links: FlowLink[] }) => void;
  showExport?: boolean;
  height?: CanvasHeight;
  className?: string;
  style?: CSSProperties;
};

const LEGEND_ITEMS: { kind: keyof typeof KIND_STYLE; label: string }[] = [
  { kind: "start", label: "Start" },
  { kind: "task", label: "Task" },
  { kind: "decision", label: "Decision" },
  { kind: "end", label: "End" },
];

function FlowLegend(): ReactElement {
  return (
    <div
      aria-label="Flow node legend"
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 10,
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        padding: "8px 12px",
        borderRadius: 8,
        background: "var(--canvas-node-bg)",
        border: "1px solid var(--canvas-node-border)",
        boxShadow: "var(--canvas-node-shadow)",
        fontSize: 12,
        color: "var(--canvas-node-text)",
      }}
    >
      {LEGEND_ITEMS.map((item) => {
        const style = KIND_STYLE[item.kind];
        if (!style) return null;
        return (
          <span key={item.kind} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              aria-hidden="true"
              style={{
                width: 14,
                height: 14,
                borderRadius: style.radius >= 999 ? 999 : 3,
                border: `2px solid ${style.border}`,
                background: "transparent",
              }}
            />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}

function FlowBuilderInner({
  nodes: flowNodes,
  links,
  layoutOptions,
  showControls = true,
  showLegend = false,
  editable = true,
  onChange,
  showExport = false,
}: FlowBuilderProps): ReactElement {
  const layout = useMemo(
    () => layoutFlow(flowNodes, links, layoutOptions),
    [flowNodes, links, layoutOptions],
  );

  const initialNodes: Node[] = useMemo(
    () =>
      layout.nodes.map((n) => ({
        id: n.id,
        type: "flow",
        position: n.position,
        width: n.size.width,
        height: n.size.height,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: n.data.label, kind: n.data.kind },
        draggable: editable,
      })),
    [layout.nodes, editable],
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      layout.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "solid",
        label: e.label,
        style: {
          stroke: "var(--canvas-edge-color)",
          strokeWidth: 2.5,
        },
        labelStyle: {
          fill: "var(--canvas-node-text)",
          fontWeight: 600,
          fontSize: 11,
        },
        labelBgStyle: {
          fill: "var(--canvas-node-bg)",
          fillOpacity: 0.95,
        },
        labelBgPadding: [4, 6] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: "var(--canvas-edge-color)",
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
    onChange?.({ nodes: flowNodes, links });
  }, [onChange, flowNodes, links]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }} data-canvas-flowbuilder>
      {showLegend ? <FlowLegend /> : null}
      {showExport ? (
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
          <button
            type="button"
            onClick={() => downloadJson("flow.json", { nodes: flowNodes, links })}
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
        nodeTypes={flowNodeTypes}
        edgeTypes={flowEdgeTypes}
        nodesDraggable={editable}
        onNodeDragStop={handleDragStop}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        onlyRenderVisibleElements
        defaultEdgeOptions={{
          type: "solid",
          style: { stroke: "var(--canvas-edge-color)", strokeWidth: 2.5 },
        }}
      >
        <Background gap={20} size={1} color="var(--canvas-node-border)" />
        {showControls ? <Controls showInteractive={false} /> : null}
      </ReactFlow>
    </div>
  );
}

export function FlowBuilder(props: FlowBuilderProps): ReactElement {
  injectCanvasTokens();
  const shellRef = useRef<HTMLDivElement>(null);
  useZeroHeightWarning(shellRef, "FlowBuilder", props.height !== undefined);
  return (
    <div
      ref={shellRef}
      className={props.className}
      style={chartShellStyle(props.height, props.style)}
      data-canvas-root="flow"
    >
      <ReactFlowProvider>
        <FlowBuilderInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
