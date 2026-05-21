export interface CaseItem {
  id: string;
  title: string;
  court: string;
  number: string;
  status: string;
}

export function CaseCard({ item }: { item: CaseItem }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-[var(--gold)]/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-foreground truncate">
            {item.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{item.court}</p>
        </div>
        <span className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground">
          {item.status}
        </span>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">رقم القضية: {item.number}</div>
    </div>
  );
}
