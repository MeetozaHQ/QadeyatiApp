import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Calendar,
  Briefcase,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  Users,
  Shield,
  UserCheck,
  Plus,
  Clock,
  Trash,
} from "lucide-react";
import { StatCard } from "@/components/qadeyti/StatCard";
import { DashboardAlerts } from "@/components/qadeyti/DashboardAlerts";
import { StatusBadge } from "@/components/qadeyti/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTrial } from "@/hooks/use-trial";

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

// Simulated data for auxiliary lawyers inside the Law Firm
interface FirmLawyer {
  id: string;
  name: string;
  role: string;
  status: "active" | "offline";
  casesCount: number;
  aiUsage: number;
  avatarLetter: string;
}

function Dashboard() {
  const { user } = useAuth();
  const { plan, limits, firmLawyers, addFirmLawyer, deleteFirmLawyer } = useTrial();
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
      .eq("user_id", user.id)
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

      {/* Subscription Status or Active Package Info Badge */}
      <section className="rounded-2xl border border-slate-800 bg-[#090C15]/40 p-3.5 flex items-center justify-between">
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-mono">الباقة المفعّلة حالياً</p>
          <span className="text-xs font-bold text-[var(--gold)]">{limits.label}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold text-orange-400">
          <Shield className="h-3.5 w-3.5" />
          <span>حساب نشط</span>
        </div>
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

      {/* Enterprise Master Dashboard Panel — ONLY RENDERED IF PLAN IS ENTERPRISE */}
      {plan === "enterprise" && (
        <section className="rounded-3xl border-2 border-dashed border-blue-500/30 bg-[#070b13] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Users className="h-4 w-4" />
              </span>
              <h2 className="font-display text-sm font-bold text-white">
                لوحة تحكم صاحب المكتب والشركاء (الرئيسية)
              </h2>
            </div>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
              باقة الشركات 🏢
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            بصفتك مديراً للمكتب، يمكنك تتبع قضايا وجلسات جميع المحامين العاملين لديك واستهلاكهم
            للمستشار الذكي لحظياً:
          </p>

          {/* Members list */}
          <div className="space-y-2 pt-1">
            {firmLawyers.map((lawyer) => (
              <div
                key={lawyer.id}
                className="flex items-center justify-between rounded-xl bg-[#0d121f] p-3 border border-slate-900"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-bold text-blue-300">
                    {lawyer.avatarLetter}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{lawyer.name}</h4>
                    <p className="text-[9.5px] text-slate-500 leading-none mt-0.5">{lawyer.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left space-y-1">
                    <span className="block text-[10px] text-slate-300">
                      قضايا: <span className="font-bold text-blue-400">{lawyer.casesCount}</span>
                    </span>
                    <span className="block text-[9px] text-slate-500 font-sans">
                      المساعد الذكي:{" "}
                      <span className="text-slate-300 font-bold">{lawyer.aiUsage}ع/٤٠٠</span>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `هل أنت متأكد من إلغاء تنشيط وحذف المحامي (${lawyer.name}) من المكتب؟`,
                        )
                      ) {
                        deleteFirmLawyer(lawyer.id);
                      }
                    }}
                    className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                    title="حذف المحامي"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                const name = prompt("أدخل اسم المحامي الجديد للانضمام إلى المكتب:");
                if (name) {
                  addFirmLawyer(name, "محامٍ مشارك");
                }
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 py-2.5 text-xs font-bold text-blue-400 hover:bg-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>إضافة محامي للمكتب</span>
            </button>
            <button
              onClick={() =>
                alert("سيتم إرسال تقرير الأداء المالي والعملي لجميع المحامين بريدياً.")
              }
              className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>تقارير النشاط</span>
            </button>
          </div>
        </section>
      )}

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
