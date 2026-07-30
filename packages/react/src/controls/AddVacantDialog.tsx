import { type FormEvent, type ReactElement, useEffect, useId, useRef, useState } from "react";
import type { AnanseOrgLabels } from "../i18n/labels.js";
import { DEFAULT_ORG_LABELS } from "../i18n/labels.js";

export type AddVacantDialogProps = {
  open: boolean;
  defaultTitle?: string;
  onConfirm: (title: string) => void;
  onCancel: () => void;
  /** Override dialog strings (i18n). */
  labels?: Partial<AnanseOrgLabels>;
};

/**
 * Inline modal for naming a vacant role — replaces window.prompt so mobile
 * and keyboard users get a consistent, cancelable experience.
 */
export function AddVacantDialog({
  open,
  defaultTitle = "Open Role",
  onConfirm,
  onCancel,
  labels: labelsPartial,
}: AddVacantDialogProps): ReactElement | null {
  const labels = { ...DEFAULT_ORG_LABELS, ...labelsPartial };
  const titleId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(defaultTitle);

  useEffect(() => {
    if (!open) return;
    setTitle(defaultTitle);
    const raf = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(raf);
  }, [open, defaultTitle]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onCancel]);

  if (!open) return null;

  function submit(event: FormEvent): void {
    event.preventDefault();
    const next = title.trim();
    if (!next) return;
    onConfirm(next);
  }

  return (
    <div
      role="presentation"
      data-ananse-vacant-dialog-backdrop
      className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <dialog
        open
        aria-modal="true"
        aria-labelledby={titleId}
        data-ananse-vacant-dialog
        className="static m-0 w-full max-w-sm rounded-lg border border-ananse-node-border bg-ananse-node p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="m-0 text-sm font-bold text-ananse-node-text">
          {labels.addVacantDialogTitle}
        </h2>
        <p className="mt-1 mb-3 text-xs text-ananse-node-text-muted">
          {labels.addVacantDialogDescription}
        </p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label
            htmlFor={inputId}
            className="flex flex-col gap-1 text-[11px] font-medium text-ananse-node-text-muted"
          >
            {labels.vacantTitleLabel}
            <input
              ref={inputRef}
              id={inputId}
              name="vacant-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={labels.vacantTitlePlaceholder}
              required
              className="nodrag nopan rounded border border-ananse-node-border bg-ananse-bg px-2 py-2 text-sm text-ananse-node-text outline-none focus:border-ananse-focus"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="nodrag nopan rounded px-3 py-2 text-xs font-semibold text-ananse-node-text hover:bg-ananse-selection"
            >
              {labels.cancel}
            </button>
            <button
              type="submit"
              disabled={title.trim() === ""}
              className="nodrag nopan rounded bg-ananse-focus px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
            >
              {labels.addRole}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
