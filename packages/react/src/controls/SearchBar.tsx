import type { ReactElement } from "react";

export type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  matchCount?: number;
  /** Accessible name for the searchbox. @default "Search org chart" */
  "aria-label"?: string;
  /** Input placeholder. @default "Search people..." */
  placeholder?: string;
  /** Clear button accessible name. @default "Clear search" */
  clearLabel?: string;
  /** Word for "1 match" / "N matches". */
  matchSingular?: string;
  matchPlural?: string;
  /** Stretch to fill the chrome row (mobile). @default false */
  fullWidth?: boolean;
};

/**
 * Search field with match count + clear.
 * Min control height 44px for comfortable touch / pointer targets.
 */
export function SearchBar({
  value,
  onChange,
  matchCount,
  "aria-label": ariaLabel = "Search org chart",
  placeholder = "Search people...",
  clearLabel = "Clear search",
  matchSingular = "match",
  matchPlural = "matches",
  fullWidth = false,
}: SearchBarProps): ReactElement {
  const hasQuery = value.trim().length > 0;
  return (
    <div
      data-ananse-search
      className="pointer-events-auto flex items-center gap-2 rounded-md border border-ananse-node-border bg-ananse-node px-3 shadow-ananse-node"
      style={{
        minHeight: 44,
        width: fullWidth ? "100%" : undefined,
        boxSizing: "border-box",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className="shrink-0 text-ananse-node-text-muted"
      >
        <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M13.5 13.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {/* type=text avoids the native WebKit clear control (double-× with our button) */}
      <input
        type="text"
        role="searchbox"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm text-ananse-node-text outline-none placeholder:text-ananse-node-text-muted"
        style={{
          minHeight: 40,
          width: fullWidth ? "100%" : 160,
          minWidth: 0,
          flex: fullWidth ? 1 : undefined,
          border: "none",
          padding: "4px 0",
        }}
      />
      {hasQuery && typeof matchCount === "number" ? (
        <span
          aria-live="polite"
          className="shrink-0 whitespace-nowrap text-xs text-ananse-node-text-muted"
        >
          {matchCount} {matchCount === 1 ? matchSingular : matchPlural}
        </span>
      ) : null}
      {hasQuery ? (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => onChange("")}
          className="nodrag nopan shrink-0 rounded text-ananse-node-text-muted hover:bg-ananse-selection"
          style={{
            minWidth: 40,
            minHeight: 40,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
