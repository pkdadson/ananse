import type { ReactElement } from "react";

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
};

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
}: EditorToolbarProps): ReactElement {
  return (
    <div
      className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-md border border-canvas-node-border bg-canvas-node px-2 py-1.5 shadow-canvas-node"
      data-canvas-editor-toolbar
      style={{
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        maxWidth: "100%",
      }}
    >
      <button
        type="button"
        className="nodrag nopan rounded px-2 py-1 text-xs font-semibold text-canvas-node-text hover:bg-canvas-selection disabled:opacity-40"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
      >
        Undo
      </button>
      <button
        type="button"
        className="nodrag nopan rounded px-2 py-1 text-xs font-semibold text-canvas-node-text hover:bg-canvas-selection disabled:opacity-40"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
      >
        Redo
      </button>
      <span className="mx-1 h-4 w-px bg-canvas-node-border" aria-hidden />
      <button
        type="button"
        className="nodrag nopan rounded px-2 py-1 text-xs font-semibold text-canvas-node-text hover:bg-canvas-selection"
        onClick={onAddVacant}
        aria-label="Add vacant role"
      >
        + Vacant role
      </button>
      {onRemoveSelected ? (
        <button
          type="button"
          className="nodrag nopan rounded px-2 py-1 text-xs font-semibold text-canvas-node-text hover:bg-canvas-selection disabled:opacity-40"
          onClick={onRemoveSelected}
          disabled={!hasSelection}
          aria-label="Remove selected"
        >
          Remove{selectionCount > 1 ? ` (${selectionCount})` : ""}
        </button>
      ) : null}
      {onExportJson ? (
        <button
          type="button"
          className="nodrag nopan rounded px-2 py-1 text-xs font-semibold text-canvas-node-text hover:bg-canvas-selection"
          onClick={onExportJson}
          aria-label="Export JSON"
        >
          Export JSON
        </button>
      ) : null}
      {error ? (
        <span className="text-[11px] font-medium text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
