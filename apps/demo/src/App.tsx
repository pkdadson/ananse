import { normalizeHierarchyNodes, parseEmployeesCsv } from "@ananse/core";
import { FlowBuilder, MindMap, type NodeVariant, OrgChart, useOrgChartEditor } from "@ananse/react";
import {
  type ChangeEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type DemoProduct,
  largeOrgSample,
  sampleAccounts,
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
  { id: "accounts", label: "Accounts", short: "Acct" },
  { id: "mind", label: "Mind Map", short: "Mind" },
  { id: "flow", label: "Flow", short: "Flow" },
  { id: "stress", label: "Stress 400", short: "Stress" },
];

const MOBILE_QUERY = "(max-width: 900px)";
/** Short-lived so status never steals vertical canvas for long. */
const STATUS_DISMISS_MS = 3200;

type StatusTone = "info" | "warn" | "error";

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

function initialDensity(): NodeVariant {
  if (typeof window === "undefined") return "detailed";
  return window.matchMedia(MOBILE_QUERY).matches ? "compact" : "detailed";
}

const buttonBase: React.CSSProperties = {
  // 44px meets common mobile touch-target guidance
  minHeight: 44,
  minWidth: 44,
  padding: "10px 14px",
  borderRadius: 8,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--ananse-node-border)",
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
    color: active ? "#fff" : "var(--ananse-node-text)",
    borderColor: active ? "hsl(221 83% 45%)" : "var(--ananse-node-border)",
  };
}

const groupStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  padding: 3,
  margin: 0,
  border: 0,
  minInlineSize: 0,
  borderRadius: 10,
  background: "hsl(240 5% 96%)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--ananse-node-border)",
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

function statusStyle(tone: StatusTone): React.CSSProperties {
  if (tone === "error") {
    return {
      ...chipStyle,
      color: "hsl(0 72% 35%)",
      background: "hsl(0 86% 97%)",
      border: "1px solid hsl(0 70% 80%)",
    };
  }
  if (tone === "warn") {
    return {
      ...chipStyle,
      color: "hsl(32 90% 28%)",
      background: "hsl(40 100% 95%)",
      border: "1px solid hsl(38 90% 70%)",
    };
  }
  return chipStyle;
}

function formatWarningsSuffix(warnings: string[]): string {
  if (warnings.length === 0) return "";
  const preview = warnings.slice(0, 2).join("; ");
  const more = warnings.length > 2 ? "…" : "";
  const label = warnings.length === 1 ? "warning" : "warnings";
  return ` · ${warnings.length} ${label}: ${preview}${more}`;
}

export function App(): ReactElement {
  const isMobile = useIsMobile();
  const [product, setProduct] = useState<DemoProduct>("org");
  const [nodeVariant, setNodeVariant] = useState<NodeVariant>(initialDensity);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importTone, setImportTone] = useState<StatusTone>("info");
  const [moreOpen, setMoreOpen] = useState<boolean>(false);
  const [editHintDismissed, setEditHintDismissed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const editor = useOrgChartEditor({ initialData: sampleCompany });
  const accountsEditor = useOrgChartEditor({
    initialData: normalizeHierarchyNodes(sampleAccounts),
  });
  const stressEditor = useOrgChartEditor({ initialData: largeOrgSample(400) });

  const activeEditor =
    product === "stress" ? stressEditor : product === "accounts" ? accountsEditor : editor;
  const supportsOrgControls = product === "org" || product === "accounts" || product === "stress";
  const isHierarchyDomain = product === "accounts";
  const showDensity = product === "org" || product === "accounts";
  const showCsvTools = product === "org" || product === "stress";

  const showStatus = useCallback((msg: string, tone: StatusTone = "info") => {
    setImportMsg(msg);
    setImportTone(tone);
  }, []);

  const clearStatus = useCallback(() => {
    setImportMsg(null);
  }, []);

  // Auto-dismiss status chips so they don't permanently eat header height.
  useEffect(() => {
    if (!importMsg) return;
    const t = window.setTimeout(() => setImportMsg(null), STATUS_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [importMsg]);

  useEffect(() => {
    if (!isMobile) setMoreOpen(false);
  }, [isMobile]);

  // Prefer compact cards on narrow screens when still on desktop "Detailed".
  useEffect(() => {
    if (isMobile) {
      setNodeVariant((v) => (v === "detailed" ? "compact" : v));
    }
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
          showStatus(warnings[0] ?? "No employees found in CSV", "error");
          return;
        }
        editor.replace(employees);
        selectProduct("org");
        showStatus(
          `Imported ${employees.length} people${formatWarningsSuffix(warnings)}`,
          warnings.length > 0 ? "warn" : "info",
        );
      } catch (err) {
        showStatus(err instanceof Error ? err.message : "Import failed", "error");
      }
    },
    [editor, selectProduct, showStatus],
  );

  const loadSampleCsv = useCallback(async () => {
    const res = await fetch("/sample-org.csv");
    const text = await res.text();
    const { employees, warnings } = parseEmployeesCsv(text);
    editor.replace(employees);
    selectProduct("org");
    showStatus(
      `Loaded sample CSV (${employees.length} people)${formatWarningsSuffix(warnings)}`,
      warnings.length > 0 ? "warn" : "info",
    );
  }, [editor, selectProduct, showStatus]);

  const resetDemo = useCallback(() => {
    editor.replace(sampleCompany);
    selectProduct("org");
    showStatus("Reset to built-in sample company");
  }, [editor, selectProduct, showStatus]);

  const setModeAndCloseMore = useCallback((m: "view" | "edit") => {
    setMode(m);
    setMoreOpen(false);
  }, []);

  const setDensityAndCloseMore = useCallback((v: NodeVariant) => {
    setNodeVariant(v);
    setMoreOpen(false);
  }, []);

  const modeGroup = supportsOrgControls ? (
    <fieldset style={groupStyle} aria-label="Mode">
      {(["view", "edit"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setModeAndCloseMore(m)}
          style={btnStyle(mode === m)}
          aria-pressed={mode === m}
        >
          {m === "view" ? "View" : "Edit"}
        </button>
      ))}
    </fieldset>
  ) : null;

  const csvGroup = showCsvTools ? (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
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
        onClick={() => {
          setMoreOpen(false);
          fileRef.current?.click();
        }}
      >
        Import
      </button>
      <button
        type="button"
        style={btnStyle(false)}
        onClick={() => {
          setMoreOpen(false);
          void loadSampleCsv();
        }}
      >
        Sample
      </button>
      <button
        type="button"
        style={btnStyle(false)}
        onClick={() => {
          setMoreOpen(false);
          resetDemo();
        }}
      >
        Reset
      </button>
    </div>
  ) : product === "accounts" ? (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      <button
        type="button"
        style={btnStyle(false)}
        onClick={() => {
          setMoreOpen(false);
          accountsEditor.replace(normalizeHierarchyNodes(sampleAccounts));
          showStatus("Reset account hierarchy");
        }}
      >
        Reset
      </button>
    </div>
  ) : null;

  // Density for sample org + accounts — stress forces minimal for readable fit-view.
  const densityGroup = showDensity ? (
    <fieldset style={groupStyle} aria-label="Card density">
      {VARIANTS.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => setDensityAndCloseMore(v.id)}
          style={btnStyle(nodeVariant === v.id)}
          aria-pressed={nodeVariant === v.id}
        >
          {v.label}
        </button>
      ))}
    </fieldset>
  ) : null;

  const statusChip =
    importMsg !== null ? (
      <output
        style={{
          ...statusStyle(importTone),
          // Mobile: floating toast — does not grow the header / shrink the canvas
          ...(isMobile
            ? {
                position: "fixed",
                left: 12,
                right: 12,
                bottom: 16,
                zIndex: 50,
                maxWidth: "calc(100vw - 24px)",
                margin: "0 auto",
                boxShadow: "0 8px 28px rgb(15 23 42 / 0.18)",
              }
            : { alignSelf: "flex-start" as const }),
        }}
      >
        <span
          style={{
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {importMsg}
        </span>
        <button
          type="button"
          onClick={clearStatus}
          aria-label="Dismiss status"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 14,
            lineHeight: 1,
            color: "inherit",
            padding: 0,
            minWidth: 28,
            minHeight: 28,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </output>
    ) : null;

  const orgFitViewOptions = useMemo(() => {
    if (product === "stress") {
      return {
        padding: 0.08,
        minZoom: isMobile ? 0.65 : 0.4,
        maxZoom: 1,
      };
    }
    if (isMobile) {
      return { padding: 0.08, minZoom: 0.95, maxZoom: 1.5 };
    }
    return undefined;
  }, [product, isMobile]);

  const orgLayoutOptions = useMemo(
    () =>
      product === "stress"
        ? { nodeWidth: 140, nodeHeight: 48, nodeSep: 12, rankSep: 32 }
        : undefined,
    [product],
  );

  const orgEditorApi = useMemo(() => {
    if (mode !== "edit") return undefined;
    return {
      onReparent: activeEditor.reparent,
      onAddVacant: activeEditor.addVacant,
      onRemove: activeEditor.remove,
      onUpdate: activeEditor.update,
      onUndo: activeEditor.undo,
      onRedo: activeEditor.redo,
      canUndo: activeEditor.canUndo,
      canRedo: activeEditor.canRedo,
      lastError: activeEditor.lastError,
    };
  }, [mode, activeEditor]);

  return (
    <div style={{ width: "100vw", height: "100dvh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 6 : 8,
          padding: isMobile ? "8px 8px" : "10px 14px",
          borderBottom: "1px solid var(--ananse-node-border)",
          background: "var(--ananse-node-bg)",
          zIndex: 20,
        }}
      >
        {/* Primary row: brand + product + mode (desktop) / More (mobile) */}
        <div
          style={{
            display: "flex",
            flexWrap: "nowrap",
            alignItems: "center",
            gap: isMobile ? 6 : 10,
            minWidth: 0,
          }}
        >
          <h1
            style={{
              margin: 0,
              color: "var(--ananse-node-text)",
              fontSize: isMobile ? 13 : 15,
              fontWeight: 700,
              flexShrink: 0,
              lineHeight: 1.2,
            }}
          >
            {isMobile ? "A" : "Ananse"}
          </h1>
          <fieldset
            style={{
              ...groupStyle,
              flex: 1,
              minWidth: 0,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
            aria-label="Product"
          >
            {PRODUCTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProduct(p.id)}
                style={{
                  ...btnStyle(product === p.id),
                  flexShrink: 0,
                  ...(isMobile ? { minWidth: 44, padding: "10px 8px", fontSize: 11 } : {}),
                }}
                aria-pressed={product === p.id}
                aria-label={p.label}
                title={p.label}
              >
                {isMobile ? p.short : p.label}
              </button>
            ))}
          </fieldset>
          {isMobile ? (
            supportsOrgControls ? (
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                style={{
                  ...btnStyle(moreOpen),
                  flexShrink: 0,
                  minWidth: 44,
                  padding: "10px 10px",
                  fontSize: 12,
                }}
                aria-expanded={moreOpen}
                aria-controls="mobile-more-tray"
                aria-label="More controls"
              >
                ⋯
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
              title="Free drag · drop on a node to reparent · Shift/Cmd/Ctrl+click or marquee multi-select · bulk Remove · Export JSON · inspector on single select"
            >
              Edit · drag to reparent · Shift/Cmd multi-select
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
                  minWidth: 28,
                  minHeight: 28,
                }}
              >
                ×
              </button>
            </p>
          </div>
        ) : null}
        {/* Long product subtitles only on desktop — free vertical space on mobile */}
        {!isMobile && !supportsOrgControls ? (
          <h2
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ananse-node-text-muted)",
            }}
          >
            {product === "mind" ? "Mind Map — radial layout demo" : "Flow — process DAG demo"}
          </h2>
        ) : null}
        {!isMobile && product === "accounts" ? (
          <h2
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ananse-node-text-muted)",
            }}
          >
            Accounts · geo hierarchy · domain=&quot;hierarchy&quot; · parentId input
          </h2>
        ) : null}
        {!isMobile && product === "stress" ? (
          <h2
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ananse-node-text-muted)",
            }}
          >
            Stress 400 · minimal cards · viewport culling · pan/zoom or Fit View
          </h2>
        ) : null}
        {product === "org" || product === "accounts" ? (
          <h2
            className="sr-only"
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: "hidden",
              clip: "rect(0,0,0,0)",
              whiteSpace: "nowrap",
              border: 0,
            }}
          >
            {product === "accounts" ? "Account hierarchy demo" : "Org Chart demo"}
          </h2>
        ) : null}
        {/* Desktop only: status in header. Mobile uses fixed toast (rendered below). */}
        {!isMobile ? statusChip : null}
      </header>
      {isMobile ? statusChip : null}

      {isMobile && supportsOrgControls && moreOpen ? (
        <section
          id="mobile-more-tray"
          aria-label="More controls"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "12px 14px",
            background: "var(--ananse-node-bg)",
            borderBottom: "1px solid var(--ananse-node-border)",
            boxShadow: "0 8px 24px rgb(15 23 42 / 0.08)",
          }}
        >
          {modeGroup}
          {csvGroup}
          {densityGroup}
          {mode === "edit" ? (
            <p style={{ ...chipStyle, alignSelf: "flex-start" }} title="Full edit gestures">
              Edit · drag to reparent · Shift/Cmd multi-select
            </p>
          ) : null}
        </section>
      ) : null}

      <div style={{ flex: 1, minHeight: 0 }}>
        {product === "mind" ? (
          <MindMap data={sampleMindMap} height="100%" showExport showSearch />
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
            key={product}
            data={activeEditor.data}
            domain={isHierarchyDomain ? "hierarchy" : "people"}
            mode={mode}
            height="100%"
            showSearch
            showMinimap={!isMobile}
            showControls
            nodeVariant={product === "stress" ? "minimal" : nodeVariant}
            {...(orgLayoutOptions ? { layoutOptions: orgLayoutOptions } : {})}
            {...(orgFitViewOptions ? { fitViewOptions: orgFitViewOptions } : {})}
            minZoom={product === "stress" ? (isMobile ? 0.08 : 0.04) : undefined}
            {...(orgEditorApi ? { editor: orgEditorApi } : {})}
          />
        )}
      </div>
    </div>
  );
}
