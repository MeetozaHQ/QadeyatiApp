import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Briefcase, Plus, Search, ChevronLeft } from "lucide-react";
import { EmptyState } from "@/components/qadeyti/EmptyState";
import { StatusBadge } from "@/components/qadeyti/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { CASE_STATUSES } from "@/lib/case-constants";
import { cn } from "@/lib/utils";

import { useTrial } from "@/hooks/use-trial";

type Row = {
  id: string;
  case_number: string | null;
  title: string;
  court_name: string | null;
  client_name: string | null;
  status: string;
  updated_at: string;
  first_session_date: string | null;
  hasFutureSession?: boolean;
};

export const Route = createFileRoute("/_app/cases/")({
  component: CasesPage,
});

function CasesPage() {
  const { simulatedLawyerId } = useTrial();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("cases")
        .select("id,case_number,title,court_name,client_name,status,updated_at,first_session_date")
        .is("archived_at", null)
        .order("updated_at", { ascending: false });
      let list = (data as Row[]) ?? [];

      if (simulatedLawyerId !== "owner") {
        list = list.filter((r) => {
          const assigned = localStorage.getItem(`case_lawyer_${r.id}`);
          return assigned === simulatedLawyerId;
        });
      }
      const ids = list.map((r) => r.id);
      if (ids.length) {
        const { data: futureSessions } = await supabase
          .from("sessions")
          .select("case_id")
          .in("case_id", ids)
          .gt("session_date", new Date().toISOString());
        const futureSet = new Set((futureSessions ?? []).map((s) => s.case_id));
        list.forEach((r) => {
          r.hasFutureSession = futureSet.has(r.id);
        });
      }
      setRows(list);
    })();
  }, [simulatedLawyerId]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const text = q.trim();
    return rows.filter((r) => {
      if (statusFilter) {
        if (statusFilter === "جلسة قادمة") {
          const isUpcoming =
            r.status === "جلسة قادمة" ||
            (!!r.hasFutureSession && r.status !== "صدر حكم" && r.status !== "مغلقة");
          if (!isUpcoming) return false;
        } else {
          if (r.status !== statusFilter) return false;
        }
      }
      if (!text) return true;
      const hay = `${r.title} ${r.case_number ?? ""} ${r.court_name ?? ""} ${r.client_name ?? ""}`;
      return hay.includes(text);
    });
  }, [rows, q, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    if (!rows) return c;

    CASE_STATUSES.forEach((s) => {
      c[s] = 0;
    });

    rows.forEach((r) => {
      if (c[r.status] !== undefined) {
        c[r.status]++;
      }
      const isUpcomingNotTerminal =
        !!r.hasFutureSession &&
        r.status !== "صدر حكم" &&
        r.status !== "مغلقة" &&
        r.status !== "جلسة قادمة";
      if (isUpcomingNotTerminal) {
        c["جلسة قادمة"] = (c["جلسة قادمة"] ?? 0) + 1;
      }
    });

    return c;
  }, [rows]);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">القضايا</h1>
        <Link
          to="/cases/new"
          className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold)] px-3 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-gold"
        >
          <Plus className="h-4 w-4" /> قضية جديدة
        </Link>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث برقم القضية أو الاسم"
          className="h-12 w-full rounded-xl border border-border bg-card pr-10 pl-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[var(--gold)]"
        />
      </div>

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2">
          <FilterChip active={statusFilter === null} onClick={() => setStatusFilter(null)}>
            الكل {rows ? `(${rows.length})` : ""}
          </FilterChip>
          {CASE_STATUSES.map((s) => (
            <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
              {s} {counts[s] ? `(${counts[s]})` : ""}
            </FilterChip>
          ))}
        </div>
      </div>

      {rows === null ? (
        <div className="space-y-3">
          <p className="text-center text-xs text-muted-foreground">جاري تحميل القضايا...</p>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-border bg-card/50"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-8 w-8" />}
          title={
            rows.length === 0
              ? "لا توجد قضايا بعد"
              : statusFilter
                ? `لا توجد قضايا ${statusFilter}`
                : "لا نتائج مطابقة"
          }
          description={
            rows.length === 0
              ? "أضف أول قضية خلال أقل من دقيقة."
              : statusFilter
                ? `لم يتم العثور على قضايا مصنفة كـ "${statusFilter}" حالياً.`
                : "جرّب تغيير كلمات البحث أو إزالة الفلتر."
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                to="/cases/$caseId"
                params={{ caseId: c.id }}
                className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-[var(--gold)]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base font-semibold text-foreground line-clamp-1">
                      {c.title}
                    </h3>
                    {c.court_name && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                        {c.court_name}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.case_number ? `رقم ${c.case_number}` : "بدون رقم"}</span>
                  <span className="flex items-center gap-1 text-[var(--gold)]">
                    تفاصيل <ChevronLeft className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition-colors",
        active
          ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
