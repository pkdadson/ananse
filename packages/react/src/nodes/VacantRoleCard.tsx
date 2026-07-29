import type { ReactElement } from "react";

export type VacantRoleCardProps = {
  title: string;
  department?: string | undefined;
};

export function VacantRoleCard({ title, department }: VacantRoleCardProps): ReactElement {
  return (
    <div
      data-canvas-role="vacant"
      className="flex items-center gap-3 rounded-canvas-node border-2 border-dashed p-3"
      style={{
        borderColor: "var(--canvas-role-vacant-border)",
        background: "var(--canvas-role-vacant-bg)",
        minWidth: 220,
      }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas-node-border text-xs font-semibold text-canvas-node-text-muted">
        ?
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="truncate text-sm font-semibold text-canvas-node-text-muted">{title}</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-canvas-node-text-muted">
          OPEN
        </div>
      </div>
      {department ? (
        <span
          data-canvas-dept-chip={department}
          className="h-6 w-1.5 rounded-full opacity-60"
          style={{ background: `var(--canvas-dept-${department})` }}
        />
      ) : null}
    </div>
  );
}
