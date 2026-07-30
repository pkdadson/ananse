import { BaseEdge, type EdgeProps, getSmoothStepPath } from "@xyflow/react";
import type { ReactElement } from "react";

export function SolidEdge(props: EdgeProps): ReactElement {
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
        strokeWidth: 2,
        ...props.style,
      }}
    />
  );
}
