import type { CSSProperties, ReactElement } from "react";

export type EditorToolbarProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddVacant: () => void;
  onRemoveSelected?: () => void;
  hasSelection?: boolean;
  selectionCount?: number;
  onExportJson?: () => void;
  error?: string | null;
  /** Compact single-row layout for narrow viewports. */
  compact?: boolean;
  labels?: {
    undo?: string;
    redo?: string;
    addVacant?: string;
    remove?: string;
    exportJson?: string;
  };
};

const toolBtn: CSSProperties = {
  minHeight: 44,
  minWidth: 44,
  padding: "0 12px",
  borderRadius: 8,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.2,
  color: "var(--ananse-node-text)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

/**
 * Undo / redo / vacant / remove / export strip for org edit mode.
 * Buttons meet 44px min touch targets.
 */
export function EditorToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddVacant,
  onRemoveSelected,
  hasSelection = false,
  selectionCount = 0,
  onExportJson,
  error,
  compact = false,
  labels,
}: EditorToolbarProps): ReactElement {
  const undo = labels?.undo ?? "Undo";
  const redo = labels?.redo ?? "Redo";
  const addVacant = labels?.addVacant ?? "+ Vacant role";
  const remove = labels?.remove ?? "Remove";
  const exportJson = labels?.exportJson ?? "Export JSON";

  return (
    <div
      className="pointer-events-auto"
      data-ananse-editor-toolbar
      style={{
        display: "flex",
        flexWrap: compact ? "nowrap" : "wrap",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        maxWidth: "100%",
        padding: "4px 6px",
        borderRadius: 10,
        border: "1px solid var(--ananse-node-border)",
        background: "var(--ananse-node-bg)",
        boxShadow: "0 1px 2px rgb(15 23 42 / 0.06)",
        overflowX: compact ? "auto" : undefined,
        WebkitOverflowScrolling: "touch",
      }}
    >
      <button
        type="button"
        className="nodrag nopan"
        style={{ ...toolBtn, opacity: canUndo ? 1 : 0.4 }}
        onClick={onUndo}
        disabled={!canUndo}
        aria-label={undo}
      >
        {undo}
      </button>
      <button
        type="button"
        className="nodrag nopan"
        style={{ ...toolBtn, opacity: canRedo ? 1 : 0.4 }}
        onClick={onRedo}
        disabled={!canRedo}
        aria-label={redo}
      >
        {redo}
      </button>
      <span
        aria-hidden
        style={{
          width: 1,
          height: 20,
          background: "var(--ananse-node-border)",
          flexShrink: 0,
          margin: "0 2px",
        }}
      />
      <button
        type="button"
        className="nodrag nopan"
        style={toolBtn}
        onClick={onAddVacant}
        aria-label={addVacant}
      >
        {compact ? "+ Vacant" : addVacant}
      </button>
      {onRemoveSelected ? (
        <button
          type="button"
          className="nodrag nopan"
          style={{ ...toolBtn, opacity: hasSelection ? 1 : 0.4 }}
          onClick={onRemoveSelected}
          disabled={!hasSelection}
          aria-label={remove}
        >
          {remove}
          {selectionCount > 1 ? ` (${selectionCount})` : ""}
        </button>
      ) : null}
      {onExportJson ? (
        <button
          type="button"
          className="nodrag nopan"
          style={toolBtn}
          onClick={onExportJson}
          aria-label={exportJson}
        >
          {compact ? "Export" : exportJson}
        </button>
      ) : null}
      {error ? (
        <span
          className="text-[11px] font-medium text-red-600"
          role="alert"
          style={{ whiteSpace: "nowrap", padding: "0 6px" }}
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
