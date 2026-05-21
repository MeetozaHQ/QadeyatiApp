import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "@/lib/case-constants";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status] ?? "bg-secondary text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg border px-2.5 py-1 text-xs font-medium",
        style,
        className,
      )}
    >
      {status}
    </span>
  );
}
