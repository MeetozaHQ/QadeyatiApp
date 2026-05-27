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
  X,
  Mail,
  CheckCircle,
  Lock,
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

function Dashboard() {
  const { user } = useAuth();
  const {
    plan,
    limits,
    firmLawyers,
    addFirmLawyer,
    deleteFirmLawyer,
    simulatedLawyerId,
    impersonateLawyer,
    cancelImpersonation,
  } = useTrial();

  const [cases, setCases] = useState<CaseRow[]>([]);
  const [caseCount, setCaseCount] = useState(0);
  const [upcoming, setUpcoming] = useState<SessionRow[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [lawyerName, setLawyerName] = useState<string | null>(null);

  // Modal configurations
  const [showAddLawyerModal, setShowAddLawyerModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newLawyerName, setNewLawyerName] = useState("");
  const [newLawyerEmail, setNewLawyerEmail] = useState("");
  const [newLawyerRole, setNewLawyerRole] = useState("محامٍ مشارك");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync details dynamically depending on current simulated account
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

    // Fetch all cases in order to filter by assignment in frontend
    supabase
      .from("cases")
      .select("id,title,court_name,case_number,status,updated_at")
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        let list = (data as CaseRow[]) ?? [];
        if (simulatedLawyerId !== "owner") {
          list = list.filter(
            (c) => localStorage.getItem(`case_lawyer_${c.id}`) === simulatedLawyerId,
          );
        }
        setCases(list.slice(0, 5));
        setCaseCount(list.length);
      });

    // Fetch upcoming sessions and map case details
    (async () => {
      const { data: ses } = await supabase
        .from("sessions")
        .select("id,case_id,session_date,session_type")
        .gte("session_date", now.toISOString())
        .order("session_date", { ascending: true })
        .limit(10);
      let list = (ses as SessionRow[]) ?? [];
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

      // Filter sessions based on case assignment
      if (simulatedLawyerId !== "owner") {
        list = list.filter(
          (s) => localStorage.getItem(`case_lawyer_${s.case_id}`) === simulatedLawyerId,
        );
      }
      setUpcoming(list.slice(0, 5));
    })();

    // Fetch and filter Today's session counts
    supabase
      .from("sessions")
      .select("id,case_id,session_date")
      .gte("session_date", startOfDay)
      .lt("session_date", endOfDay)
      .then(({ data }) => {
        let list = data ?? [];
        if (simulatedLawyerId !== "owner") {
          list = list.filter(
            (s) => localStorage.getItem(`case_lawyer_${s.case_id}`) === simulatedLawyerId,
          );
        }
        setTodayCount(list.length);
      });

    // Overdue payments belong exclusively to owner view
    if (simulatedLawyerId === "owner") {
      supabase
        .from("payment_installments")
        .select("id, count:id", { count: "exact" })
        .eq("user_id", user.id)
        .neq("status", "مدفوع")
        .lt("due_date", new Date().toISOString().slice(0, 10))
        .then(({ count }) => setOverdueCount(count ?? 0));
    }
  }, [user, simulatedLawyerId, firmLawyers]);

  const handleAddNewLawyerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLawyerName.trim()) return;

    const emailToSet = newLawyerEmail.trim() || `${Date.now()}@qadeyti.eg`;
    addFirmLawyer(newLawyerName.trim(), emailToSet, newLawyerRole);

    // Reset states
    setNewLawyerName("");
    setNewLawyerEmail("");
    setNewLawyerRole("محامٍ مشارك");
    setShowAddLawyerModal(false);

    // Show temporary mock toast
    setToastMessage(
      `📨 تم إضافة المحامي بنجاح وإرسال بريد تأكيد وتعيين كلمة المرور للمحامي: ${newLawyerName}`,
    );
    setTimeout(() => setToastMessage(null), 5500);
  };

  const nextSession = upcoming[0];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Toast Alert Box */}
      {toastMessage && (
        <div className="fixed top-20 left-4 right-4 z-50 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in duration-350">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <section className="space-y-1">
        <p className="text-sm text-muted-foreground">أهلاً بك</p>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {simulatedLawyerId !== "owner"
            ? firmLawyers.find((l) => l.id === simulatedLawyerId)?.name
            : lawyerName
              ? `أستاذ ${lawyerName.split(" ")[0]}`
              : (user?.email?.split("@")[0] ?? "محامي")}
        </h1>
      </section>

      {/* Subscription Status or Active Package Info Badge */}
      <section className="rounded-2xl border border-slate-800 bg-[#090C15]/40 p-3.5 flex items-center justify-between">
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-mono">
            الباقة المفعّلة حالياً للمكتب
          </p>
          <span className="text-xs font-bold text-[var(--gold)]">{limits.label}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold text-orange-400">
          <Shield className="h-3.5 w-3.5" />
          <span>حساب المكتب نشط</span>
        </div>
      </section>

      {/* Metric Cards - Dynamically hides sensitive metrics from sub-lawyers */}
      <section className="grid grid-cols-3 gap-3">
        <StatCard
          label="جلسات اليوم"
          value={String(todayCount)}
          icon={<Calendar className="h-4 w-4 text-blue-400" />}
        />
        <StatCard
          label={simulatedLawyerId === "owner" ? "القضايا" : "قضاياك الموكلة"}
          value={String(caseCount)}
          icon={<Briefcase className="h-4 w-4 text-emerald-400" />}
        />
        {simulatedLawyerId === "owner" ? (
          <StatCard
            label="المتأخرات"
            value={String(overdueCount)}
            icon={<AlertCircle className="h-4 w-4 text-rose-400" />}
          />
        ) : (
          <StatCard
            label="مستشارك الذكي"
            value={`${firmLawyers.find((l) => l.id === simulatedLawyerId)?.aiUsage ?? 0}/٤٠٠`}
            icon={<Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />}
          />
        )}
      </section>

      {simulatedLawyerId === "owner" && <DashboardAlerts />}

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
              إدارة طاقَم العمل 🏢
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            بصفتك مديراً للمكتب، يمكنك تتبع قضايا وجلسات جميع المحامين العاملين لديك واستهلاكهم
            للمستشار الذكي لحظياً، كما يمكنك تجربة ودخول النظام بصلاحيات أي محامٍ لتجربة واختبار
            الواجهات:
          </p>

          {/* Members list */}
          <div className="space-y-2 pt-1 font-sans">
            {firmLawyers.map((lawyer) => (
              <div
                key={lawyer.id}
                className="flex flex-col gap-2 rounded-xl bg-[#0d121f] p-4 border border-slate-900 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-bold text-blue-300">
                      {lawyer.avatarLetter}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{lawyer.name}</h4>
                      <p className="text-[9px] text-slate-500 leading-none mt-0.5 font-mono">
                        {lawyer.email}
                      </p>
                      <p className="text-[9.5px] text-blue-400 leading-none mt-1">{lawyer.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-left space-y-1 pl-1">
                      <span className="block text-[10px] text-slate-300">
                        قضايا: <span className="font-bold text-blue-400">{lawyer.casesCount}</span>
                      </span>
                      <span className="block text-[9px] text-slate-500 font-sans">
                        الذكاء:{" "}
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
                      className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                      title="حذف المحامي"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-1.5 border-t border-slate-900">
                  <button
                    onClick={() => {
                      impersonateLawyer(lawyer.id);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1 text-[10px] font-bold text-blue-400 transition-all cursor-pointer"
                    title="دخول ومحاكاة صلاحيات هذا الحساب"
                  >
                    <UserCheck className="h-3 w-3" />
                    <span>دخول ومحاكاة حساب المحامي ↩️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
            <button
              onClick={() => {
                setShowAddLawyerModal(true);
                setShowReportModal(false);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold active:scale-[0.98] transition-all cursor-pointer ${
                showAddLawyerModal
                  ? "bg-blue-500 text-white border border-blue-400"
                  : "bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>إضافة محامي للمكتب</span>
            </button>
            <button
              onClick={() => {
                setShowReportModal(true);
                setShowAddLawyerModal(false);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer ${
                showReportModal
                  ? "bg-amber-500 text-black border border-amber-400"
                  : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>تقارير النشاط</span>
            </button>
          </div>

          {/* Inline Add Lawyer Card inside the panel */}
          {showAddLawyerModal && (
            <div className="rounded-2xl border border-blue-500/30 bg-[#090e18] p-4 space-y-3.5 mt-2 animate-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <div className="flex items-center gap-2 text-blue-400">
                  <Plus className="h-4 w-4" />
                  <h3 className="font-bold text-[11px] text-white">
                    إضافة محامٍ جديد لطاقَم المكتب
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddLawyerModal(false)}
                  className="rounded-lg p-1 hover:bg-[#1a233a] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <form
                onSubmit={handleAddNewLawyerSubmit}
                className="space-y-3.5 font-sans text-right"
              >
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-slate-300 block">
                    اسم المحامي (مثال: أ. محمد العشري):
                  </label>
                  <input
                    type="text"
                    required
                    value={newLawyerName}
                    onChange={(e) => setNewLawyerName(e.target.value)}
                    placeholder="الاسم الثلاثي واللقب للمحامي"
                    className="text-right w-full rounded-xl border border-slate-800 bg-[#06080d] px-3 py-2 text-xs text-white outline-none focus:border-blue-500 font-sans"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-slate-300 block">
                    البريد الإلكتروني الخاص به (لتسجيل الدخول):
                  </label>
                  <input
                    type="email"
                    required
                    value={newLawyerEmail}
                    onChange={(e) => setNewLawyerEmail(e.target.value)}
                    placeholder="work@lawfirm.eg"
                    className="w-full rounded-xl border border-slate-800 bg-[#06080d] px-3 py-2 text-xs text-white outline-none focus:border-blue-500 font-mono text-left"
                    dir="ltr"
                  />
                  <span className="text-[9px] text-slate-500 leading-tight block mt-0.5 font-sans">
                    * سنقوم بتوليد الحساب والـ login الخاص بالمحامي فوراً للتجريب والمحاكاة.
                  </span>
                </div>

                <div className="space-y-1 text-right font-sans">
                  <label className="text-[10px] font-bold text-slate-300 block">
                    الدور الفني للمحامي بالمكتب:
                  </label>
                  <select
                    value={newLawyerRole}
                    onChange={(e) => setNewLawyerRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-[#06080d] px-3 py-2 text-xs text-[#F5F1E8] outline-none focus:border-blue-500 font-sans cursor-pointer text-right"
                  >
                    <option value="محامٍ شريك">محامٍ شريك (Partner)</option>
                    <option value="محامٍ استئناف">محامٍ استئناف (Appellate Lawyer)</option>
                    <option value="محامٍ قضائي">محامٍ قضائي (Litigation specialist)</option>
                    <option value="محامٍ تحت التمرين">محامٍ تحت التمرين (Trainee)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-blue-500 hover:bg-blue-600 py-2.5 text-xs font-bold text-white transition-all cursor-pointer font-sans"
                  >
                    حفظ وإرسال دعوة التفعيل 📨
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddLawyerModal(false)}
                    className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Inline Activity Reports Card inside the panel */}
          {showReportModal && (
            <div className="rounded-2xl border border-amber-500/30 bg-[#090e18] p-4 space-y-3.5 mt-2 animate-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <div className="flex items-center gap-2 text-amber-500">
                  <Clock className="h-4 w-4" />
                  <h3 className="font-bold text-[11px] text-white">إصدار تقارير النشاط والأداء</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="rounded-lg p-1 hover:bg-[#1a233a] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-3 font-sans text-right">
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-2.5 flex gap-2 text-right">
                  <Lock className="h-3.5 w-3.5 text-amber-505 shrink-0 mt-0.5" />
                  <p className="text-[9.5px] text-slate-300 leading-normal text-right">
                    <strong>نظام الحماية والسرية التامّة 🔒:</strong> البيانات المالية والإيرادات هي
                    أسرار خاصة بصاحب المكتب. لذلك لا تشمل التقارير المرسلة للمحامين أي أرقام مالية،
                    بل أداءً عملياً فقط.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReportModal(false);
                      setToastMessage(
                        "✓ تم توليد تقارير الأداء العملي وإرسالها بنجاح إلى إيميلات جميع المحامين فرداً فرداً، مؤمّنة بالكامل وبدون أي أرقام مالية للمكتب.",
                      );
                      setTimeout(() => setToastMessage(null), 5500);
                    }}
                    className="w-full rounded-xl bg-[#06080d] border border-slate-800 hover:bg-slate-800 text-slate-100 p-3 text-xs text-right font-medium flex flex-col gap-1 transition-all cursor-pointer"
                  >
                    <span className="font-bold text-[10.5px] flex items-center gap-1.5 text-blue-400 text-right">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      ١. إرسال تقارير الأداء العملي للمحامين العاملين
                    </span>
                    <span className="text-[9px] text-slate-400 leading-normal text-right">
                      يولد تقريراً تخصصياً كلاً بمحاميه وقضاياه وجلساته مرسلاً لإيميلهم (بدون أرقام
                      مالية).
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowReportModal(false);
                      setToastMessage(
                        "✓ تم توليد التقرير المالي والإداري الشامل للمكتب والشركاء بنجاح وإرساله حصرياً إلى بريدك المسجل: meetozacoin@gmail.com",
                      );
                      setTimeout(() => setToastMessage(null), 5500);
                    }}
                    className="w-full rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-300 p-3 text-xs text-right font-medium flex flex-col gap-1 transition-all cursor-pointer"
                  >
                    <span className="font-bold text-[10.5px] flex items-center gap-1.5 text-amber-400 text-right">
                      <Shield className="h-3.5 w-3.5 shrink-0" />
                      ٢. طلب التقرير المالي والعملي الشامل للمكتب
                    </span>
                    <span className="text-[9px] text-blue-300 leading-normal text-right">
                      شيت اكسل تفصيلي شامل للإيرادات وتوزيع العمل يرسل لمدير المكتب وصاحب العمل فقط.
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Next session view */}
      {nextSession && (
        <section className="space-y-3">
          <h2 className="font-display text-base font-semibold text-foreground text-right">
            الجلسة القادمة
          </h2>
          <Link
            to="/cases/$caseId"
            params={{ caseId: nextSession.case_id }}
            className="relative block overflow-hidden rounded-2xl border border-[var(--gold)]/40 bg-gradient-to-br from-card to-card/40 p-5 shadow-gold text-right"
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
          <h2 className="font-display text-base font-semibold text-foreground text-right">
            {simulatedLawyerId === "owner" ? "آخر القضايا بالمكتب" : "قضاياك المكلف بها"}
          </h2>
          <Link to="/cases" className="flex items-center gap-1 text-sm text-[var(--gold)]">
            عرض الكل <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {cases.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground font-sans">
              لا توجد قضايا مخصصة أو مضافة حالياً.
            </p>
          ) : (
            cases.map((c) => (
              <Link
                key={c.id}
                to="/cases/$caseId"
                params={{ caseId: c.id }}
                className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-[var(--gold)]/40 text-right font-sans"
              >
                <div className="flex items-start justify-between gap-3 text-right">
                  <div className="min-w-0 text-right">
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
                  <div className="mt-3 text-xs text-muted-foreground text-right">
                    رقم القضية: {c.case_number}
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </section>

      {/* AI Consulting Button */}
      <section>
        <Link
          to="/ai"
          className="group flex w-full items-center gap-4 rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-l from-[var(--gold)]/10 to-transparent p-4 transition-colors hover:border-[var(--gold)]/60 text-right"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold)] text-[color:var(--primary-foreground)] shadow-gold">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="flex-1 text-right">
            <span className="block font-display text-base font-semibold text-foreground">
              المستشار الذكي (المساعد AI)
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground font-sans">
              صياغة مذكرات دفاع، بحث تشريعي، ومراجعة نصوص العقود بالذكاء الاصطناعي مخصصة لك
            </span>
          </span>
        </Link>
      </section>
    </div>
  );
}
