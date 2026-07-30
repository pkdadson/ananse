import { parseEmployeesCsv } from "@canvas/core";
import { FlowBuilder, MindMap, type NodeVariant, OrgChart, useOrgChartEditor } from "@canvas/react";
import {
  type ChangeEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type DemoProduct,
  largeOrgSample,
  sampleCompany,
  sampleFlowLinks,
  sampleFlowNodes,
  sampleMindMap,
} from "./samples.js";

const VARIANTS: { id: NodeVariant; label: string; short: string }[] = [
  { id: "default", label: "Default", short: "Def" },
  { id: "detailed", label: "Detailed", short: "Det" },
  { id: "compact", label: "Compact", short: "Cmp" },
  { id: "minimal", label: "Minimal", short: "Min" },
];

const PRODUCTS: { id: DemoProduct; label: string; short: string }[] = [
  { id: "org", label: "Org Chart", short: "Org" },
  { id: "mind", label: "Mind Map", short: "Mind" },
  { id: "flow", label: "Flow", short: "Flow" },
  { id: "stress", label: "Stress 400", short: "400" },
];

const MOBILE_QUERY = "(max-width: 900px)";

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(MOBILE_QUERY).matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const handler = (): void => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

const buttonBase: React.CSSProperties = {
  minHeight: 36,
  padding: "8px 12px",
  borderRadius: 8,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--canvas-node-border)",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  whiteSpace: "nowrap",
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
  gap: 3,
  padding: 3,
  borderRadius: 10,
  background: "hsl(240 5% 96%)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--canvas-node-border)",
  flexShrink: 0,
};

const chipStyle: React.CSSProperties = {
  margin: 0,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 500,
  color: "hsl(221 83% 30%)",
  background: "hsl(221 83% 96%)",
  borderRadius: 999,
  border: "1px solid hsl(221 83% 85%)",
  maxWidth: "100%",
};

export function App(): ReactElement {
  const isMobile = useIsMobile();
  const [product, setProduct] = useState<DemoProduct>("org");
  const [nodeVariant, setNodeVariant] = useState<NodeVariant>("detailed");
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState<boolean>(false);
  const [editHintDismissed, setEditHintDismissed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const editor = useOrgChartEditor({ initialData: sampleCompany });
  const stressEditor = useOrgChartEditor({ initialData: largeOrgSample(400) });

  const activeEditor = product === "stress" ? stressEditor : editor;
  const supportsOrgControls = product === "org" || product === "stress";

  useEffect(() => {
    if (!isMobile) setMoreOpen(false);
  }, [isMobile]);

  useEffect(() => {
    // Re-show short edit tip when entering edit mode
    if (mode === "edit") setEditHintDismissed(false);
  }, [mode]);

  /** Switch product without carrying edit chrome into mind/flow/stress. */
  const selectProduct = useCallback((next: DemoProduct) => {
    setProduct(next);
    setMode("view");
    setMoreOpen(false);
    setImportMsg(null);
  }, []);

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
        selectProduct("org");
        setImportMsg(
          `Imported ${employees.length} people${warnings.length ? ` (${warnings.length} warnings)` : ""}`,
        );
      } catch (err) {
        setImportMsg(err instanceof Error ? err.message : "Import failed");
      }
    },
    [editor, selectProduct],
  );

  const loadSampleCsv = useCallback(async () => {
    const res = await fetch("/sample-org.csv");
    const text = await res.text();
    const { employees, warnings } = parseEmployeesCsv(text);
    editor.replace(employees);
    selectProduct("org");
    setImportMsg(
      `Loaded sample CSV (${employees.length} people${warnings.length ? `, ${warnings.length} warnings` : ""})`,
    );
  }, [editor, selectProduct]);

  const resetDemo = useCallback(() => {
    editor.replace(sampleCompany);
    selectProduct("org");
    setImportMsg("Reset to built-in sample company");
  }, [editor, selectProduct]);

  const modeGroup = supportsOrgControls ? (
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
  ) : null;

  const csvGroup = supportsOrgControls ? (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: "none" }}
        onChange={onCsvFile}
      />
      <button type="button" style={btnStyle(false)} onClick={() => fileRef.current?.click()}>
        Import
      </button>
      <button type="button" style={btnStyle(false)} onClick={() => void loadSampleCsv()}>
        Sample
      </button>
      <button type="button" style={btnStyle(false)} onClick={resetDemo}>
        Reset
      </button>
    </div>
  ) : null;

  // Density only for sample org — stress forces minimal for readable fit-view
  const densityGroup =
    product === "org" ? (
      <div style={groupStyle} aria-label="Card density">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setNodeVariant(v.id)}
            style={btnStyle(nodeVariant === v.id)}
            aria-pressed={nodeVariant === v.id}
            title={v.label}
          >
            {isMobile ? v.short : v.label}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div style={{ width: "100vw", height: "100dvh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "10px 14px",
          borderBottom: "1px solid var(--canvas-node-border)",
          background: "var(--canvas-node-bg)",
          zIndex: 20,
        }}
      >
        {/* Primary row: brand + product + mode (desktop) / More (mobile) */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
          }}
        >
          <strong style={{ color: "var(--canvas-node-text)", fontSize: 15, flexShrink: 0 }}>
            Canvas
          </strong>
          <div style={groupStyle} aria-label="Product">
            {PRODUCTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProduct(p.id)}
                style={btnStyle(product === p.id)}
                aria-pressed={product === p.id}
                title={p.label}
              >
                {isMobile ? p.short : p.label}
              </button>
            ))}
          </div>
          {isMobile ? (
            supportsOrgControls ? (
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                style={{ ...btnStyle(moreOpen), marginLeft: "auto" }}
                aria-expanded={moreOpen}
                aria-controls="mobile-more-tray"
                aria-label="More controls"
              >
                ⋯ More
              </button>
            ) : null
          ) : (
            <>
              {modeGroup}
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {csvGroup}
                {densityGroup}
              </div>
            </>
          )}
        </div>

        {/* Context row: product hint / edit tip / import status */}
        {!isMobile && supportsOrgControls && mode === "edit" && !editHintDismissed ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p
              style={chipStyle}
              title="Free drag · drop on a person to reparent · Shift+click or marquee multi-select · bulk Remove · Export JSON · inspector on single select"
            >
              Edit · drag to reparent · Shift multi-select
              <button
                type="button"
                onClick={() => setEditHintDismissed(true)}
                aria-label="Dismiss edit tip"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: 1,
                  color: "hsl(221 83% 40%)",
                  padding: 0,
                }}
              >
                ×
              </button>
            </p>
          </div>
        ) : null}
        {!supportsOrgControls ? (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "var(--canvas-node-text-muted)",
            }}
          >
            {product === "mind" ? "Mind Map — radial layout demo" : "Flow — process DAG demo"}
          </p>
        ) : null}
        {product === "stress" ? (
          <p style={{ margin: 0, fontSize: 12, color: "var(--canvas-node-text-muted)" }}>
            Stress 400 · minimal cards · viewport culling · pan/zoom or Fit View
          </p>
        ) : null}
        {importMsg ? (
          <p style={{ margin: 0, fontSize: 12, color: "var(--canvas-node-text)" }}>{importMsg}</p>
        ) : null}
      </header>

      {isMobile && supportsOrgControls && moreOpen ? (
        <div
          id="mobile-more-tray"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "12px 14px",
            background: "var(--canvas-node-bg)",
            borderBottom: "1px solid var(--canvas-node-border)",
          }}
        >
          {modeGroup}
          {csvGroup}
          {densityGroup}
          {mode === "edit" ? (
            <p style={{ ...chipStyle, alignSelf: "flex-start" }} title="Full edit gestures">
              Edit · drag to reparent · Shift multi-select
            </p>
          ) : null}
        </div>
      ) : null}

      <div style={{ flex: 1, minHeight: 0 }}>
        {product === "mind" ? (
          <MindMap data={sampleMindMap} height="100%" showExport />
        ) : product === "flow" ? (
          <FlowBuilder
            nodes={sampleFlowNodes}
            links={sampleFlowLinks}
            showLegend
            showExport
            height="100%"
          />
        ) : (
          <OrgChart
            data={activeEditor.data}
            mode={mode}
            height="100%"
            showSearch
            showMinimap={!isMobile}
            showControls
            nodeVariant={product === "stress" ? "minimal" : nodeVariant}
            layoutOptions={
              product === "stress"
                ? { nodeWidth: 120, nodeHeight: 34, nodeSep: 12, rankSep: 32 }
                : undefined
            }
            fitViewOptions={
              product === "stress" ? { padding: 0.06, minZoom: 0.04, maxZoom: 1 } : undefined
            }
            minZoom={product === "stress" ? 0.04 : undefined}
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
