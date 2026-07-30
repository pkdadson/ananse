import type { FlowLayoutOptions, FlowLink, FlowNode } from "@ananse/core";
import { downloadJson, layoutFlow } from "@ananse/core";
import {
  Background,
  Controls,
  type Edge,
  type EdgeTypes,
  Handle,
  MarkerType,
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
} from "react";
import "@xyflow/react/dist/style.css";
import { SolidEdge } from "./edges/SolidEdge.js";
import type { FlowLayoutFn } from "./extensibility/types.js";
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

export type FlowNodeRenderContext = {
  kind: NonNullable<FlowNode["kind"]> | "default";
};

type FlowData = {
  label: string;
  kind?: FlowNode["kind"] | undefined;
  node: FlowNode;
  renderNode?: ((node: FlowNode, ctx: FlowNodeRenderContext) => ReactNode) | undefined;
};

const KIND_STYLE: Record<string, { border: string; radius: number }> = {
  start: { border: "var(--ananse-dept-product)", radius: 999 },
  end: { border: "var(--ananse-dept-sales)", radius: 999 },
  decision: { border: "var(--ananse-dept-marketing)", radius: 8 },
  task: { border: "var(--ananse-edge-highlight)", radius: 10 },
  default: { border: "var(--ananse-node-border)", radius: 10 },
};

function FlowNodeView({ data }: NodeProps & { data: FlowData }): ReactElement {
  const kind = data.kind ?? "default";
  const style = KIND_STYLE[kind] ??
    KIND_STYLE.default ?? { border: "var(--ananse-node-border)", radius: 10 };

  if (data.renderNode) {
    return (
      <div data-ananse-flow-node={kind} style={{ position: "relative" }}>
        <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
        {data.renderNode(data.node, { kind: kind as FlowNodeRenderContext["kind"] })}
        <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      </div>
    );
  }

  return (
    <div
      data-ananse-flow-node={kind}
      style={{
        position: "relative",
        minWidth: 140,
        padding: "12px 16px",
        borderRadius: style.radius,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: style.border,
        background: "var(--ananse-node-bg)",
        color: "var(--ananse-node-text)",
        fontSize: 13,
        fontWeight: 600,
        textAlign: "center",
        boxShadow: "var(--ananse-node-shadow)",
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
  /** Bring-your-own layout. Defaults to `layoutFlow`. */
  layout?: FlowLayoutFn;
  showControls?: boolean;
  showLegend?: boolean;
  /** Allow free drag. @default true */
  editable?: boolean;
  onChange?: (payload: { nodes: FlowNode[]; links: FlowLink[] }) => void;
  showExport?: boolean;
  /** Custom node face. */
  renderNode?: (node: FlowNode, ctx: FlowNodeRenderContext) => ReactNode;
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  getNodeType?: (node: FlowNode) => string;
  labels?: Partial<AnanseChartLabels>;
  height?: AnanseHeight;
  className?: string;
  style?: CSSProperties;
};

const LEGEND_KEYS = ["start", "task", "decision", "end"] as const;

function FlowLegend({ labels }: { labels: AnanseChartLabels }): ReactElement {
  const legendLabels: Record<(typeof LEGEND_KEYS)[number], string> = {
    start: labels.legendStart,
    task: labels.legendTask,
    decision: labels.legendDecision,
    end: labels.legendEnd,
  };
  return (
    <div
      aria-label={labels.legendAriaLabel}
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
        background: "var(--ananse-node-bg)",
        border: "1px solid var(--ananse-node-border)",
        boxShadow: "var(--ananse-node-shadow)",
        fontSize: 12,
        color: "var(--ananse-node-text)",
      }}
    >
      {LEGEND_KEYS.map((kind) => {
        const style = KIND_STYLE[kind];
        if (!style) return null;
        return (
          <span key={kind} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
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
            {legendLabels[kind]}
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
  layout: layoutFn,
  showControls = true,
  showLegend = false,
  editable = true,
  onChange,
  showExport = false,
  renderNode,
  nodeTypes: nodeTypesProp,
  edgeTypes: edgeTypesProp,
  getNodeType,
  labels: labelsPartial,
  containerRef,
}: FlowBuilderProps & { containerRef: React.RefObject<HTMLDivElement | null> }): ReactElement {
  const labels = mergeChartLabels(labelsPartial);
  const containerWidth = useContainerWidth(containerRef);
  const isNarrow = containerWidth !== null && containerWidth < 640;
  const layout = useMemo(() => {
    const run = layoutFn ?? layoutFlow;
    return run(flowNodes, links, layoutOptions ?? {});
  }, [flowNodes, links, layoutOptions, layoutFn]);

  const resolvedNodeTypes = useMemo(
    () => mergeTypeMaps(flowNodeTypes as NodeTypes, nodeTypesProp),
    [nodeTypesProp],
  );
  const resolvedEdgeTypes = useMemo(
    () => mergeTypeMaps(flowEdgeTypes as EdgeTypes, edgeTypesProp),
    [edgeTypesProp],
  );
  const fitViewOptions = useMemo(
    () => ({ padding: 0.15, minZoom: isNarrow ? 0.45 : 0.2, maxZoom: 1.5 }),
    [isNarrow],
  );
  const defaultEdgeOptions = useMemo(
    () => ({
      type: "solid" as const,
      style: { stroke: "var(--ananse-edge-color)", strokeWidth: 2.5 },
    }),
    [],
  );
  const rfProOptions = useMemo(() => ({ hideAttribution: true }), []);

  const initialNodes: Node[] = useMemo(
    () =>
      layout.nodes.map((n) => {
        const kind = n.data.kind ?? "task";
        const label = n.data.label;
        const data: FlowData = {
          label,
          node: n.data,
        };
        if (n.data.kind !== undefined) data.kind = n.data.kind;
        if (renderNode) data.renderNode = renderNode;
        return {
          id: n.id,
          type: getNodeType?.(n.data) ?? "flow",
          position: n.position,
          width: n.size.width,
          height: n.size.height,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          ariaLabel: `${kind}: ${label}`,
          data,
          draggable: editable,
        };
      }),
    [layout.nodes, editable, renderNode, getNodeType],
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      layout.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.kind ?? "solid",
        label: e.label,
        style: {
          stroke: "var(--ananse-edge-color)",
          strokeWidth: 2.5,
        },
        labelStyle: {
          fill: "var(--ananse-node-text)",
          fontWeight: 600,
          fontSize: 11,
        },
        labelBgStyle: {
          fill: "var(--ananse-node-bg)",
          fillOpacity: 0.95,
        },
        labelBgPadding: [4, 6] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: "var(--ananse-edge-color)",
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
    <div style={{ position: "relative", width: "100%", height: "100%" }} data-ananse-flowbuilder>
      {showLegend ? <FlowLegend labels={labels} /> : null}
      {showExport ? (
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
          <button
            type="button"
            onClick={() => downloadJson("flow.json", { nodes: flowNodes, links })}
            style={{
              padding: "6px 12px",
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
        minZoom={0.2}
        maxZoom={2}
        proOptions={rfProOptions}
        onlyRenderVisibleElements
        defaultEdgeOptions={defaultEdgeOptions}
      >
        <Background gap={20} size={1} color="var(--ananse-node-border)" />
        {showControls ? <Controls showInteractive={false} /> : null}
      </ReactFlow>
    </div>
  );
}

export function FlowBuilder(props: FlowBuilderProps): ReactElement {
  injectAnanseTokens();
  const shellRef = useRef<HTMLDivElement>(null);
  useZeroHeightWarning(shellRef, "FlowBuilder", props.height !== undefined);
  return (
    <div
      ref={shellRef}
      className={props.className}
      style={chartShellStyle(props.height, props.style)}
      data-ananse-root="flow"
    >
      <ReactFlowProvider>
        <FlowBuilderInner {...props} containerRef={shellRef} />
      </ReactFlowProvider>
    </div>
  );
}
