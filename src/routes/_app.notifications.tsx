import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Check, CheckCheck, Briefcase, Wallet } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { EmptyState } from "@/components/qadeyti/EmptyState";
import { LoadingSkeleton } from "@/components/qadeyti/LoadingSkeleton";
import { PRIORITY_STYLES, timeAgoArabic, type NotificationRow } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
});

const TABS = [
  { id: "all" as const, label: "الكل" },
  { id: "unread" as const, label: "غير مقروء" },
  { id: "critical" as const, label: "حرج" },
];

function NotificationsPage() {
  const [tab, setTab] = useState<"all" | "unread" | "critical">("all");
  const { items, loading, reload } = useNotifications(tab);
  const { user } = useAuth();

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    reload();
  };

  const markOne = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    reload();
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">الإشعارات</h1>
        <button
          type="button"
          onClick={markAllRead}
          className="flex items-center gap-1 text-xs text-[var(--gold)] hover:text-[var(--gold-soft)]"
        >
          <CheckCheck className="h-4 w-4" />
          تعليم الكل كمقروء
        </button>
      </header>

      <div className="flex gap-2 rounded-2xl border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-xl px-3 py-2 text-sm transition-colors",
              tab === t.id
                ? "bg-gradient-to-l from-[var(--gold-soft)] to-[var(--gold)] text-[color:var(--primary-foreground)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <LoadingSkeleton className="h-20" />
          <LoadingSkeleton className="h-20" />
          <LoadingSkeleton className="h-20" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title="لا توجد إشعارات حالياً"
          description="ستظهر هنا التذكيرات بالجلسات والأقساط المتأخرة."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <NotificationCard key={n.id} n={n} onRead={markOne} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationCard({ n, onRead }: { n: NotificationRow; onRead: (id: string) => void }) {
  return (
    <li
      className={cn(
        "rounded-2xl border bg-card p-4 transition-colors",
        n.is_read ? "border-border" : "border-[var(--gold)]/40 bg-card/80",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block rounded-md border px-2 py-0.5 text-[10px]",
                PRIORITY_STYLES[n.priority] ?? PRIORITY_STYLES["عادي"],
              )}
            >
              {n.priority}
            </span>
            <span className="text-[10px] text-muted-foreground">{n.type}</span>
            {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />}
          </div>
          <h3 className="font-display text-sm font-semibold text-foreground">{n.title}</h3>
          {n.message && <p className="text-xs text-muted-foreground">{n.message}</p>}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-muted-foreground">{timeAgoArabic(n.created_at)}</span>
            <div className="flex items-center gap-3">
              {n.related_case_id && (
                <Link
                  to="/cases/$caseId"
                  params={{ caseId: n.related_case_id }}
                  className="flex items-center gap-1 text-xs text-[var(--gold)]"
                >
                  <Briefcase className="h-3.5 w-3.5" /> فتح القضية
                </Link>
              )}
              {n.related_payment_id && (
                <Link
                  to="/finance/$paymentId"
                  params={{ paymentId: n.related_payment_id }}
                  className="flex items-center gap-1 text-xs text-[var(--gold)]"
                >
                  <Wallet className="h-3.5 w-3.5" /> فتح الدفعة
                </Link>
              )}
            </div>
          </div>
        </div>
        {!n.is_read && (
          <button
            type="button"
            onClick={() => onRead(n.id)}
            aria-label="تعليم كمقروء"
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}
