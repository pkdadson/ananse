import { type NodeVariant, OrgChart, useOrgChartEditor } from "@canvas/react";
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
  const [mode, setMode] = useState<"view" | "edit">("view");
  const editor = useOrgChartEditor({ initialData: sampleCompany });

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
        <div style={{ display: "flex", gap: 6 }}>
          {(["view", "edit"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid var(--canvas-node-border)",
                background: mode === m ? "var(--canvas-selection-bg)" : "transparent",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {m}
            </button>
          ))}
        </div>
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
      {mode === "edit" ? (
        <p
          style={{
            margin: 0,
            padding: "6px 16px",
            fontSize: 12,
            color: "var(--canvas-node-text-muted)",
            borderBottom: "1px solid var(--canvas-node-border)",
            background: "var(--canvas-selection-bg)",
          }}
        >
          Edit mode: drag a person onto a new manager to reparent · toolbar for undo/redo/vacant ·
          Delete removes selection
        </p>
      ) : null}
      <div style={{ flex: 1, minHeight: 0 }}>
        <OrgChart
          data={editor.data}
          mode={mode}
          showSearch
          showMinimap
          showControls
          nodeVariant={nodeVariant}
          editor={
            mode === "edit"
              ? {
                  onReparent: editor.reparent,
                  onAddVacant: editor.addVacant,
                  onRemove: editor.remove,
                  onUndo: editor.undo,
                  onRedo: editor.redo,
                  canUndo: editor.canUndo,
                  canRedo: editor.canRedo,
                  lastError: editor.lastError,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
