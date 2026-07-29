import { type NodeVariant, OrgChart } from "@canvas/react";
import { type ReactElement, useState } from "react";
import { sampleCompany } from "./sampleCompany.js";

const VARIANTS: { id: NodeVariant; label: string }[] = [
  { id: "default", label: "Default" },
  { id: "detailed", label: "Detailed" },
  { id: "compact", label: "Compact" },
  { id: "minimal", label: "Minimal" },
];

export function App(): ReactElement {
  const [nodeVariant, setNodeVariant] = useState<NodeVariant>("detailed");

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          borderBottom: "1px solid var(--canvas-node-border)",
          background: "var(--canvas-node-bg)",
          zIndex: 20,
        }}
      >
        <strong style={{ color: "var(--canvas-node-text)" }}>Canvas — Org Chart Kit</strong>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setNodeVariant(v.id)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid var(--canvas-node-border)",
                background: nodeVariant === v.id ? "var(--canvas-selection-bg)" : "transparent",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <OrgChart
          data={sampleCompany}
          mode="view"
          showSearch
          showMinimap
          showControls
          nodeVariant={nodeVariant}
        />
      </div>
    </div>
  );
}
