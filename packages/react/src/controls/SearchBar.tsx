import type { ReactElement } from "react";

export type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  matchCount?: number;
};

export function SearchBar({ value, onChange, matchCount }: SearchBarProps): ReactElement {
  const hasQuery = value.trim().length > 0;
  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-md border border-canvas-node-border bg-canvas-node px-2 py-1 shadow-canvas-node">
      <svg
        width="14"
        height="14"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className="shrink-0 text-canvas-node-text-muted"
      >
        <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M13.5 13.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {/* type=text avoids the native WebKit clear control (double-× with our button) */}
      <input
        type="text"
        role="searchbox"
        aria-label="Search org chart"
        placeholder="Search people..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-40 bg-transparent text-sm text-canvas-node-text outline-none placeholder:text-canvas-node-text-muted"
      />
      {hasQuery && typeof matchCount === "number" ? (
        <span
          aria-live="polite"
          className="shrink-0 whitespace-nowrap text-xs text-canvas-node-text-muted"
        >
          {matchCount} {matchCount === 1 ? "match" : "matches"}
        </span>
      ) : null}
      {hasQuery ? (
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
