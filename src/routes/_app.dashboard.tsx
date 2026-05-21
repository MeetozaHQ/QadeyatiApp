import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Briefcase, AlertCircle, Sparkles, ChevronLeft } from "lucide-react";
import { StatCard } from "@/components/qadeyti/StatCard";
import { DashboardAlerts } from "@/components/qadeyti/DashboardAlerts";
import { StatusBadge } from "@/components/qadeyti/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

interface CaseRow {
  id: string;
  title: string;
  court_name: string | null;
  case_number: string | null;
  status: string;
  updated_at: string;
}
interface SessionRow {
  id: string;
  case_id: string;
  session_date: string;
  session_type: string | null;
  case_title?: string | null;
  case_court?: string | null;
}

function Dashboard() {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [caseCount, setCaseCount] = useState(0);
  const [upcoming, setUpcoming] = useState<SessionRow[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [lawyerName, setLawyerName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("lawyer_profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setLawyerName(data?.full_name?.trim() || null));

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    supabase
      .from("cases")
      .select("id,title,court_name,case_number,status,updated_at")
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setCases((data as CaseRow[]) ?? []));

    supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null)
      .then(({ count }) => setCaseCount(count ?? 0));

    (async () => {
      const { data: ses } = await supabase
        .from("sessions")
        .select("id,case_id,session_date,session_type")
        .gte("session_date", now.toISOString())
        .order("session_date", { ascending: true })
        .limit(5);
      const list = (ses as SessionRow[]) ?? [];
      const ids = Array.from(new Set(list.map((s) => s.case_id)));
      if (ids.length) {
        const { data: cs } = await supabase
          .from("cases")
          .select("id,title,court_name")
          .in("id", ids);
        const map = new Map((cs ?? []).map((c) => [c.id, c]));
        list.forEach((s) => {
          const c = map.get(s.case_id);
          s.case_title = c?.title ?? null;
          s.case_court = c?.court_name ?? null;
        });
      }
      setUpcoming(list);
    })();

    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .gte("session_date", startOfDay)
      .lt("session_date", endOfDay)
      .then(({ count }) => setTodayCount(count ?? 0));

    supabase
      .from("payment_installments")
      .select("id", { count: "exact", head: true })
      .neq("status", "مدفوع")
      .lt("due_date", new Date().toISOString().slice(0, 10))
      .then(({ count }) => setOverdueCount(count ?? 0));
  }, [user]);

  const nextSession = upcoming[0];

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <p className="text-sm text-muted-foreground">أهلاً بك</p>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {lawyerName
            ? `أستاذ ${lawyerName.split(" ")[0]}`
            : (user?.email?.split("@")[0] ?? "محامي")}
        </h1>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">ملخّص يومك</p>
        <p className="mt-1 font-display text-xl font-semibold text-foreground">
          لديك <span className="text-[var(--gold)]">{todayCount} جلسات</span> اليوم
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <StatCard
          label="جلسات اليوم"
          value={String(todayCount)}
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          label="القضايا"
          value={String(caseCount)}
          icon={<Briefcase className="h-4 w-4" />}
        />
        <StatCard
          label="المتأخرات"
          value={String(overdueCount)}
          icon={<AlertCircle className="h-4 w-4" />}
        />
      </section>

      <DashboardAlerts />

      {nextSession && (
        <section className="space-y-3">
          <h2 className="font-display text-base font-semibold text-foreground">الجلسة القادمة</h2>
          <Link
            to="/cases/$caseId"
            params={{ caseId: nextSession.case_id }}
            className="relative block overflow-hidden rounded-2xl border border-[var(--gold)]/40 bg-gradient-to-br from-card to-card/40 p-5 shadow-gold"
          >
            <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold)]" />
            <p className="text-xs text-[var(--gold-soft)]">
              {new Date(nextSession.session_date).toLocaleString("ar-EG", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <h3 className="mt-2 font-display text-lg font-semibold text-foreground">
              {nextSession.case_title ?? "—"}
            </h3>
            {nextSession.case_court && (
              <p className="mt-1 text-sm text-muted-foreground">{nextSession.case_court}</p>
            )}
          </Link>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-foreground">آخر القضايا</h2>
          <Link to="/cases" className="flex items-center gap-1 text-sm text-[var(--gold)]">
            عرض الكل <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {cases.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
              لا توجد قضايا بعد.
            </p>
          ) : (
            cases.map((c) => (
              <Link
                key={c.id}
                to="/cases/$caseId"
                params={{ caseId: c.id }}
                className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-[var(--gold)]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-semibold text-foreground">
                      {c.title}
                    </h3>
                    {c.court_name && (
                      <p className="mt-1 text-sm text-muted-foreground">{c.court_name}</p>
                    )}
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                {c.case_number && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    رقم القضية: {c.case_number}
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </section>

      <section>
        <Link
          to="/ai"
          className="group flex w-full items-center gap-4 rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-l from-[var(--gold)]/10 to-transparent p-4 text-right transition-colors hover:border-[var(--gold)]/60"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold)] text-[color:var(--primary-foreground)] shadow-gold">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block font-display text-base font-semibold text-foreground">
              اسأل المستشار الذكي
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              صياغة مذكرة، بحث تشريعي، تلخيص ملف
            </span>
          </span>
        </Link>
      </section>
    </div>
  );
}
