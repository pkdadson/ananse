import { BaseEdge, type EdgeProps, getStraightPath } from "@xyflow/react";
import type { ReactElement } from "react";

/** Straight connector — better for radial mind maps than stepped edges. */
export function StraightEdge(props: EdgeProps): ReactElement {
  const [path] = getStraightPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  });
  return (
    <BaseEdge
      id={props.id}
      path={path}
      style={{
        stroke: "var(--canvas-edge-color)",
        strokeWidth: 2.25,
        ...props.style,
      }}
    />
  );
}
