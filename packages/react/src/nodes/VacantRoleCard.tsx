import type { ReactElement } from "react";

export type VacantRoleCardProps = {
  title: string;
  department?: string | undefined;
};

export function VacantRoleCard({ title, department }: VacantRoleCardProps): ReactElement {
  return (
    <div
      data-ananse-role="vacant"
      aria-label={`Open role: ${title}`}
      className="flex items-center gap-3 rounded-ananse-node p-3"
      style={{
        minWidth: 220,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: "var(--ananse-role-vacant-border)",
        background: "var(--ananse-role-vacant-bg)",
      }}
    >
      <div
        aria-hidden="true"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-ananse-node-border text-xs font-semibold text-ananse-node-text-muted"
      >
        ?
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="truncate text-sm font-semibold text-ananse-node-text">{title}</div>
        <div
          aria-hidden="true"
          className="text-[11px] font-bold uppercase tracking-widest text-ananse-node-text-muted"
        >
          OPEN
        </div>
      </div>
      {department ? (
        <span
          data-ananse-dept-chip={department}
          className="h-6 w-1.5 rounded-full opacity-60"
          style={{ background: `var(--ananse-dept-${department})` }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}
