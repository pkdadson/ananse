import type { FlowLayoutOptions, FlowLink, FlowNode } from "@canvas/core";
import { layoutFlow } from "@canvas/core";
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
import { type ReactElement, useEffect, useMemo } from "react";
import "@xyflow/react/dist/style.css";
import { SolidEdge } from "./edges/SolidEdge.js";

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

const nodeTypes = { flow: FlowNodeView };
const edgeTypes = { solid: SolidEdge };

export type FlowBuilderProps = {
  nodes: FlowNode[];
  links: FlowLink[];
  layoutOptions?: FlowLayoutOptions;
  showControls?: boolean;
};

function FlowBuilderInner({
  nodes: flowNodes,
  links,
  layoutOptions,
  showControls = true,
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
        draggable: true,
      })),
    [layout.nodes],
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      layout.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "solid",
        label: e.label,
      })),
    [layout.edges],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div style={{ width: "100%", height: "100%" }} data-canvas-flowbuilder>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        onlyRenderVisibleElements
      >
        <Background gap={20} size={1} color="var(--canvas-node-border)" />
        {showControls ? <Controls showInteractive={false} /> : null}
      </ReactFlow>
    </div>
  );
}

export function FlowBuilder(props: FlowBuilderProps): ReactElement {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}
