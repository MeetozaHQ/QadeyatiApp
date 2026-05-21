export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--gold-soft)] text-[color:var(--primary-foreground)] font-display font-bold shadow-gold">
        ق
      </div>
      <span className="font-display text-lg font-semibold tracking-tight text-foreground">
        قضيتي
      </span>
    </div>
  );
}
