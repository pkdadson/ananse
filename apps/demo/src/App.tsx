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

type ButtonVariant = "secondary" | "primary";

// Use longhand border* only — mixing `border` + `borderColor` triggers React warnings.
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
  transition: "background-color 120ms ease, color 120ms ease, border-color 120ms ease",
};

function btnStyle(active: boolean, variant: ButtonVariant = "secondary"): React.CSSProperties {
  if (active) {
    return {
      ...buttonBase,
      background: "hsl(221 83% 53%)",
      color: "#fff",
      borderColor: "hsl(221 83% 45%)",
    };
  }
  return {
    ...buttonBase,
    background: variant === "primary" ? "hsl(221 83% 53%)" : "transparent",
    color: variant === "primary" ? "#fff" : "var(--canvas-node-text)",
    borderColor: variant === "primary" ? "hsl(221 83% 45%)" : "var(--canvas-node-border)",
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

const groupButton = (active: boolean): React.CSSProperties => ({
  minHeight: 30,
  padding: "6px 12px",
  borderRadius: 7,
  border: "1px solid transparent",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1,
  background: active ? "#fff" : "transparent",
  color: active ? "hsl(221 83% 40%)" : "var(--canvas-node-text)",
  boxShadow: active ? "0 1px 2px rgb(0 0 0 / 0.08)" : "none",
  transition: "background-color 120ms ease, color 120ms ease, box-shadow 120ms ease",
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
          gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid var(--canvas-node-border)",
          background: "var(--canvas-node-bg)",
          zIndex: 20,
        }}
      >
        <strong
          style={{
            color: "var(--canvas-node-text)",
            fontSize: 15,
            marginRight: 4,
          }}
        >
          Canvas — Org Chart Kit
        </strong>
        <div style={groupStyle} aria-label="Mode">
          {(["view", "edit"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={groupButton(mode === m)}
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
            }}
          >
            Download CSV
          </a>
        </div>
        <div style={{ ...groupStyle, marginLeft: "auto" }} aria-label="Card density">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setNodeVariant(v.id)}
              style={groupButton(nodeVariant === v.id)}
              aria-pressed={nodeVariant === v.id}
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
            padding: "8px 16px",
            fontSize: 13,
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
            padding: "8px 16px",
            fontSize: 13,
            color: "hsl(221 83% 30%)",
            borderBottom: "1px solid var(--canvas-node-border)",
            background: "hsl(221 83% 96%)",
          }}
        >
          Edit mode: drag cards freely (they stay put) · drop onto another person to reparent ·
          select for inspector · Undo/Redo/Vacant in toolbar · Delete removes selection
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
