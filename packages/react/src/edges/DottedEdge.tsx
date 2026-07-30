import { BaseEdge, type EdgeProps, getSmoothStepPath } from "@xyflow/react";
import type { ReactElement } from "react";

export function DottedEdge(props: EdgeProps): ReactElement {
  const [path] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 8,
  });
  return (
    <BaseEdge
      id={props.id}
      path={path}
      {...(props.markerEnd !== undefined ? { markerEnd: props.markerEnd } : {})}
      {...(props.markerStart !== undefined ? { markerStart: props.markerStart } : {})}
      style={{
        stroke: "var(--ananse-edge-color)",
        strokeWidth: "var(--ananse-edge-width)",
        strokeDasharray: "4 4",
        ...props.style,
      }}
    />
  );
}
