import type { ReactElement } from "react";

export type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps): ReactElement {
  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-md border border-canvas-node-border bg-canvas-node px-2 py-1 shadow-canvas-node">
      {/* type=text avoids the native WebKit clear control (double-× with our button) */}
      <input
        type="text"
        role="searchbox"
        aria-label="Search org chart"
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-40 bg-transparent text-sm text-canvas-node-text outline-none placeholder:text-canvas-node-text-muted"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="nodrag nopan rounded p-1 text-canvas-node-text-muted hover:bg-canvas-selection"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
