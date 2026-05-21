import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon && <span className="text-[var(--gold)]">{icon}</span>}
      </div>
      <span className="font-display text-2xl font-semibold text-foreground">{value}</span>
    </div>
  );
}
