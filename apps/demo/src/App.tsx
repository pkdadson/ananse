import { parseEmployeesCsv } from "@canvas/core";
import { type NodeVariant, OrgChart, useOrgChartEditor } from "@canvas/react";
import { type ChangeEvent, type ReactElement, useCallback, useRef, useState } from "react";
import { sampleCompany } from "./sampleCompany.js";

const VARIANTS: { id: NodeVariant; label: string }[] = [
  { id: "default", label: "Default" },
  { id: "detailed", label: "Detailed" },
  { id: "compact", label: "Compact" },
  { id: "minimal", label: "Minimal" },
];

const btnStyle = (active: boolean): React.CSSProperties => ({
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid var(--canvas-node-border)",
  background: active ? "var(--canvas-selection-bg)" : "transparent",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
});

export function App(): ReactElement {
  const [nodeVariant, setNodeVariant] = useState<NodeVariant>("detailed");
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editor = useOrgChartEditor({ initialData: sampleCompany });

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
    setImportMsg(
      `Loaded sample CSV (${employees.length} people${warnings.length ? `, ${warnings.length} warnings` : ""})`,
    );
  }, [editor]);

  const resetDemo = useCallback(() => {
    editor.replace(sampleCompany);
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
          padding: "10px 16px",
          borderBottom: "1px solid var(--canvas-node-border)",
          background: "var(--canvas-node-bg)",
          zIndex: 20,
        }}
      >
        <strong style={{ color: "var(--canvas-node-text)" }}>Canvas — Org Chart Kit</strong>
        <div style={{ display: "flex", gap: 6 }}>
          {(["view", "edit"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} style={btnStyle(mode === m)}>
              {m}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={onCsvFile}
          />
          <button type="button" style={btnStyle(false)} onClick={() => fileRef.current?.click()}>
            Import CSV
          </button>
          <button type="button" style={btnStyle(false)} onClick={() => void loadSampleCsv()}>
            Sample CSV
          </button>
          <button type="button" style={btnStyle(false)} onClick={resetDemo}>
            Reset
          </button>
          <a
            href="/sample-org.csv"
            download
            style={{
              ...btnStyle(false),
              textDecoration: "none",
              color: "inherit",
              display: "inline-block",
            }}
          >
            Download CSV
          </a>
        </div>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setNodeVariant(v.id)}
              style={btnStyle(nodeVariant === v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </header>
      {importMsg ? (
        <p
          style={{
            margin: 0,
            padding: "6px 16px",
            fontSize: 12,
            color: "var(--canvas-node-text)",
            borderBottom: "1px solid var(--canvas-node-border)",
            background: "var(--canvas-bg)",
          }}
        >
          {importMsg}
        </p>
      ) : null}
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
          Edit mode: drag onto a manager to reparent · select to open inspector · toolbar for
          undo/redo/vacant · Delete removes selection
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
                  onUpdate: editor.update,
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
