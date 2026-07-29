import { parseEmployeesCsv } from "@canvas/core";
import { FlowBuilder, MindMap, type NodeVariant, OrgChart, useOrgChartEditor } from "@canvas/react";
import { type ChangeEvent, type ReactElement, useCallback, useRef, useState } from "react";
import {
  type DemoProduct,
  largeOrgSample,
  sampleCompany,
  sampleFlowLinks,
  sampleFlowNodes,
  sampleMindMap,
} from "./samples.js";

const VARIANTS: { id: NodeVariant; label: string }[] = [
  { id: "default", label: "Default" },
  { id: "detailed", label: "Detailed" },
  { id: "compact", label: "Compact" },
  { id: "minimal", label: "Minimal" },
];

const PRODUCTS: { id: DemoProduct; label: string }[] = [
  { id: "org", label: "Org Chart" },
  { id: "mind", label: "Mind Map" },
  { id: "flow", label: "Flow" },
  { id: "stress", label: "Stress 400" },
];

const buttonBase: React.CSSProperties = {
  minHeight: 36,
  padding: "8px 14px",
  borderRadius: 8,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--canvas-node-border)",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

function btnStyle(active: boolean): React.CSSProperties {
  return {
    ...buttonBase,
    background: active ? "hsl(221 83% 53%)" : "transparent",
    color: active ? "#fff" : "var(--canvas-node-text)",
    borderColor: active ? "hsl(221 83% 45%)" : "var(--canvas-node-border)",
  };
}

const groupStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: 3,
  borderRadius: 10,
  background: "hsl(240 5% 96%)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--canvas-node-border)",
};

export function App(): ReactElement {
  const [product, setProduct] = useState<DemoProduct>("org");
  const [nodeVariant, setNodeVariant] = useState<NodeVariant>("detailed");
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editor = useOrgChartEditor({ initialData: sampleCompany });
  const stressEditor = useOrgChartEditor({ initialData: largeOrgSample(400) });

  const activeEditor = product === "stress" ? stressEditor : editor;

  const onCsvFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      try {
        const text = await file.text();
        const { employees, warnings } = parseEmployeesCsv(text);
        if (employees.length === 0) {
          setImportMsg(warnings[0] ?? "No employees found in CSV");
          return;
        }
        editor.replace(employees);
        setProduct("org");
        setImportMsg(
          `Imported ${employees.length} people${warnings.length ? ` (${warnings.length} warnings)` : ""}`,
        );
      } catch (err) {
        setImportMsg(err instanceof Error ? err.message : "Import failed");
      }
    },
    [editor],
  );

  const loadSampleCsv = useCallback(async () => {
    const res = await fetch("/sample-org.csv");
    const text = await res.text();
    const { employees, warnings } = parseEmployeesCsv(text);
    editor.replace(employees);
    setProduct("org");
    setImportMsg(
      `Loaded sample CSV (${employees.length} people${warnings.length ? `, ${warnings.length} warnings` : ""})`,
    );
  }, [editor]);

  const resetDemo = useCallback(() => {
    editor.replace(sampleCompany);
    setProduct("org");
    setImportMsg("Reset to built-in sample company");
  }, [editor]);

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: "1px solid var(--canvas-node-border)",
          background: "var(--canvas-node-bg)",
          zIndex: 20,
        }}
      >
        <strong style={{ color: "var(--canvas-node-text)", fontSize: 15, marginRight: 4 }}>
          Canvas Platform
        </strong>
        <div style={groupStyle} aria-label="Product">
          {PRODUCTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProduct(p.id)}
              style={btnStyle(product === p.id)}
              aria-pressed={product === p.id}
            >
              {p.label}
            </button>
          ))}
        </div>
        {(product === "org" || product === "stress") && (
          <>
            <div style={groupStyle} aria-label="Mode">
              {(["view", "edit"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  style={btnStyle(mode === m)}
                  aria-pressed={mode === m}
                >
                  {m === "view" ? "View" : "Edit"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: "none" }}
                onChange={onCsvFile}
              />
              <button
                type="button"
                style={btnStyle(false)}
                onClick={() => fileRef.current?.click()}
              >
                Import CSV
              </button>
              <button type="button" style={btnStyle(false)} onClick={() => void loadSampleCsv()}>
                Sample CSV
              </button>
              <button type="button" style={btnStyle(false)} onClick={resetDemo}>
                Reset
              </button>
            </div>
            <div style={{ ...groupStyle, marginLeft: "auto" }} aria-label="Card density">
              {VARIANTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setNodeVariant(v.id)}
                  style={btnStyle(nodeVariant === v.id)}
                  aria-pressed={nodeVariant === v.id}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </>
        )}
      </header>
      {importMsg ? (
        <p
          style={{
            margin: 0,
            padding: "8px 16px",
            fontSize: 13,
            color: "var(--canvas-node-text)",
            borderBottom: "1px solid var(--canvas-node-border)",
          }}
        >
          {importMsg}
        </p>
      ) : null}
      {product === "stress" ? (
        <p
          style={{
            margin: 0,
            padding: "8px 16px",
            fontSize: 13,
            color: "var(--canvas-node-text-muted)",
            borderBottom: "1px solid var(--canvas-node-border)",
          }}
        >
          Stress mode: 400-node synthetic org with onlyRenderVisibleElements — pan/zoom to verify
          scale.
        </p>
      ) : null}
      {mode === "edit" && (product === "org" || product === "stress") ? (
        <p
          style={{
            margin: 0,
            padding: "8px 16px",
            fontSize: 13,
            color: "hsl(221 83% 30%)",
            borderBottom: "1px solid var(--canvas-node-border)",
            background: "hsl(221 83% 96%)",
          }}
        >
          Edit: free drag · drop on a person to reparent · Shift+click multi-select · marquee select
          · bulk Remove · Export JSON · inspector on single select
        </p>
      ) : null}
      <div style={{ flex: 1, minHeight: 0 }}>
        {product === "mind" ? (
          <MindMap data={sampleMindMap} />
        ) : product === "flow" ? (
          <FlowBuilder nodes={sampleFlowNodes} links={sampleFlowLinks} />
        ) : (
          <OrgChart
            data={activeEditor.data}
            mode={mode}
            showSearch
            showMinimap
            showControls
            nodeVariant={product === "stress" ? "compact" : nodeVariant}
            editor={
              mode === "edit"
                ? {
                    onReparent: activeEditor.reparent,
                    onAddVacant: activeEditor.addVacant,
                    onRemove: activeEditor.remove,
                    onUpdate: activeEditor.update,
                    onUndo: activeEditor.undo,
                    onRedo: activeEditor.redo,
                    canUndo: activeEditor.canUndo,
                    canRedo: activeEditor.canRedo,
                    lastError: activeEditor.lastError,
                  }
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
