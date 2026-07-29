import { Handle, Position } from "@xyflow/react";
import type { ReactElement, ReactNode } from "react";

export type NodeShellProps = {
  children: ReactNode;
  searchDim: boolean;
  dim: boolean;
};

/**
 * Wraps every org-chart node with React Flow connection handles and dim styling.
 * Handles are required for edges to render (RF error #008 without them).
 */
export function NodeShell({ children, searchDim, dim }: NodeShellProps): ReactElement {
  return (
    <div
      className="canvas-org-node"
      data-canvas-search-dim={searchDim ? "true" : "false"}
      style={{
        position: "relative",
        pointerEvents: "all",
        opacity: dim ? 0.3 : 1,
        transition: "opacity 150ms ease",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={{
          width: 8,
          height: 8,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
      {children}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        style={{
          width: 8,
          height: 8,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
