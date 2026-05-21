import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
      {icon && <div className="text-[var(--gold)]">{icon}</div>}
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
