import { Link } from "@tanstack/react-router";
import { AlertTriangle, Bell, ChevronLeft } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { PRIORITY_STYLES } from "@/lib/notifications";

export function DashboardAlerts() {
  const { items, loading } = useNotifications("unread");
  if (loading || items.length === 0) return null;
  const top = items.slice(0, 3);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-foreground">تذكيرات اليوم</h2>
        <Link to="/notifications" className="flex items-center gap-1 text-xs text-[var(--gold)]">
          الكل <ChevronLeft className="h-3 w-3" />
        </Link>
      </div>
      <ul className="space-y-2">
        {top.map((n) => (
          <li
            key={n.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border bg-card p-3",
              n.priority === "حرج"
                ? "border-red-500/30"
                : n.priority === "مهم"
                  ? "border-[var(--gold)]/30"
                  : "border-border",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                PRIORITY_STYLES[n.priority] ?? PRIORITY_STYLES["عادي"],
              )}
            >
              {n.priority === "حرج" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
              {n.message && <p className="truncate text-xs text-muted-foreground">{n.message}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
