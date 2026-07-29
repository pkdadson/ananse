import type { MindMapLayoutOptions, MindNode } from "@canvas/core";
import { layoutMindMap } from "@canvas/core";
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

type MindData = { label: string; color?: string };

function MindNodeView({ data }: NodeProps & { data: MindData }): ReactElement {
  return (
    <div
      data-canvas-mind-node
      style={{
        position: "relative",
        minWidth: 120,
        padding: "10px 14px",
        borderRadius: 999,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: data.color ?? "var(--canvas-edge-highlight)",
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

const nodeTypes = { mind: MindNodeView };
const edgeTypes = { solid: SolidEdge };

export type MindMapProps = {
  data: MindNode[];
  layoutOptions?: MindMapLayoutOptions;
  showControls?: boolean;
};

function MindMapInner({ data, layoutOptions, showControls = true }: MindMapProps): ReactElement {
  const layout = useMemo(() => layoutMindMap(data, layoutOptions), [data, layoutOptions]);

  const initialNodes: Node[] = useMemo(
    () =>
      layout.nodes.map((n) => ({
        id: n.id,
        type: "mind",
        position: n.position,
        width: n.size.width,
        height: n.size.height,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: n.data.label, color: n.data.color },
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
    <div style={{ width: "100%", height: "100%" }} data-canvas-mindmap>
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

export function MindMap(props: MindMapProps): ReactElement {
  return (
    <ReactFlowProvider>
      <MindMapInner {...props} />
    </ReactFlowProvider>
  );
}
