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
  Eye,
  CreditCard,
} from "lucide-react";
import { StatCard } from "@/components/qadeyti/StatCard";
import { DashboardAlerts } from "@/components/qadeyti/DashboardAlerts";
import { StatusBadge } from "@/components/qadeyti/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTrial, FirmLawyer } from "@/hooks/use-trial";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  sendLawyerInviteEmail,
  sendLawyersPerformanceReports,
  sendOwnerFinancialReport,
} from "@/lib/email.functions";

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
  assigned_lawyer_id?: string | null;
}
interface SessionRow {
  id: string;
  case_id: string;
  session_date: string;
  session_type: string | null;
  case_title?: string | null;
  case_court?: string | null;
  assigned_lawyer_id?: string | null;
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

  const callSendLawyerInvite = useServerFn(sendLawyerInviteEmail);
  const callSendLawyersPerformanceReports = useServerFn(sendLawyersPerformanceReports);
  const callSendOwnerFinancialReport = useServerFn(sendOwnerFinancialReport);

  const [cases, setCases] = useState<CaseRow[]>([]);
  const [caseCount, setCaseCount] = useState(0);
  const [upcoming, setUpcoming] = useState<SessionRow[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [lawyerName, setLawyerName] = useState<string | null>(null);

  // Deletion with Delegation states
  const [deletingLawyer, setDeletingLawyer] = useState<FirmLawyer | null>(null);
  const [delegationTargetId, setDelegationTargetId] = useState<string>("none");
  const [activeCasesOfLawyer, setActiveCasesOfLawyer] = useState<CaseRow[]>([]);

  // Modal configurations
  const [showAddLawyerModal, setShowAddLawyerModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newLawyerName, setNewLawyerName] = useState("");
  const [newLawyerEmail, setNewLawyerEmail] = useState("");
  const [newLawyerRole, setNewLawyerRole] = useState("محامٍ مشارك");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Payment popup configurations for adding new lawyer
  const [showPaymentModalForLawyer, setShowPaymentModalForLawyer] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const handleOpenDeleteDialog = async (lawyer: FirmLawyer) => {
    if (simulatedLawyerId !== "owner") {
      toast.error("عذراً، صلاحية إضافة أو حذف المحامين مقتصرة فقط على صاحب الحساب/صاحب المكتب.");
      return;
    }

    // Optimization: If the lawyer has no assigned cases, bypass querying completely
    if (lawyer.casesCount === 0) {
      if (
        confirm(
          `هل أنت متأكد من حذف وإلغاء تنشيط الحساب للمحامي (${lawyer.name}) من المكتب؟ (لا توجد قضايا نشطة بعهدته حالياً)`,
        )
      ) {
        deleteFirmLawyer(lawyer.id);
        setToastMessage(`✓ تم حذف المحامي ${lawyer.name} بنجاح.`);
        setTimeout(() => setToastMessage(null), 4000);
      }
      return;
    }

    const toastId = toast.loading("جاري فحص حالة القضايا النشطة المسندة للمحامي...");
    try {
      // Query only cases assigned to this specific lawyer to avoid full table scans/downloads
      const { data, error } = await supabase
        .from("cases")
        .select("id,title,status,assigned_lawyer_id")
        .eq("assigned_lawyer_id", lawyer.id)
        .is("archived_at", null);

      toast.dismiss(toastId);

      if (error) {
        console.error("Error loading assigned cases:", error);
        toast.error("تعذر التحقق من قضايا المحامي. يرجى إعادة المحاولة لاحقاً.");
        return;
      }

      const allCases = (data as CaseRow[]) ?? [];
      const activeAssigned = allCases.filter((c) => {
        const isActive = c.status !== "مغلقة" && c.status !== "صدر حكم";
        return isActive;
      });

      if (activeAssigned.length === 0) {
        if (
          confirm(
            `هل أنت متأكد من حذف وإلغاء تنشيط الحساب للمحامي (${lawyer.name}) من المكتب؟ (لا توجد قضايا نشطة بعهدته حالياً)`,
          )
        ) {
          deleteFirmLawyer(lawyer.id);
          setToastMessage(`✓ تم حذف المحامي ${lawyer.name} بنجاح.`);
          setTimeout(() => setToastMessage(null), 4000);
        }
      } else {
        setDeletingLawyer(lawyer);
        setActiveCasesOfLawyer(activeAssigned);

        const others = firmLawyers.filter((l) => l.id !== lawyer.id);
        if (others.length > 0) {
          setDelegationTargetId(others[0].id);
        } else {
          setDelegationTargetId("none");
        }

        setShowAddLawyerModal(false);
        setShowReportModal(false);
      }
    } catch (err) {
      toast.dismiss(toastId);
      console.error("Error setting up lawyer deletion delegation:", err);
      toast.error("حدث خطأ غير متوقع أثناء إعداد طلب حظر وحذف المحامي.");
    }
  };

  const handleConfirmDeleteWithDelegation = async () => {
    if (!deletingLawyer) return;

    try {
      const updates = activeCasesOfLawyer.map((c) => {
        const targetValue = delegationTargetId === "none" ? null : delegationTargetId;
        if (typeof window !== "undefined") {
          if (targetValue === null) {
            localStorage.removeItem(`case_lawyer_${c.id}`);
          } else {
            localStorage.setItem(`case_lawyer_${c.id}`, targetValue);
          }
        }
        return supabase.from("cases").update({ assigned_lawyer_id: targetValue }).eq("id", c.id);
      });
      await Promise.all(updates);
    } catch (e) {
      console.error("Failed to delegate cases on Supabase:", e);
    }

    deleteFirmLawyer(deletingLawyer.id);

    const targetName =
      delegationTargetId === "none"
        ? "قيد التوزيع (غير مسندة)"
        : firmLawyers.find((l) => l.id === delegationTargetId)?.name || "";

    setToastMessage(
      `✓ تم حذف المحامي ${deletingLawyer.name} وإلغاء تنشيطه بنجاح! تم تحويل وإعادة إسناد ${activeCasesOfLawyer.length} من القضايا النشطة بعهدته لكادر العمل بقسم: ${targetName}.`,
    );
    setTimeout(() => setToastMessage(null), 8500);

    setDeletingLawyer(null);
    setActiveCasesOfLawyer([]);
    setDelegationTargetId("none");
  };

  // States for Real Email Delivery Integration
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [missingApiKeyType, setMissingApiKeyType] = useState<
    "invite" | "lawyers-report" | "owner-report" | null
  >(null);
  const [showPreviewType, setShowPreviewType] = useState<
    "invite" | "lawyers-report" | "owner-report" | null
  >(null);
  const [lastSentEmailInfo, setLastSentEmailInfo] = useState<{
    to: string;
    subject: string;
    type: "invite" | "lawyers-report" | "owner-report";
    lawyerName?: string;
    lawyerRole?: string;
    details?: {
      totalIncome?: number;
      expectedIncome?: number;
      overdueCount?: number;
      activeCasesCount?: number;
      lawyers?: Array<{
        name: string;
        email: string;
        role: string;
        casesCount: number;
        aiUsage: number;
      }>;
    };
  } | null>(null);

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
      .select("id,title,court_name,case_number,status,updated_at,assigned_lawyer_id")
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        let list = (data as CaseRow[]) ?? [];
        if (simulatedLawyerId !== "owner") {
          list = list.filter((c) => (c.assigned_lawyer_id || "none") === simulatedLawyerId);
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
          .select("id,title,court_name,assigned_lawyer_id")
          .in("id", ids);
        const map = new Map((cs ?? []).map((c) => [c.id, c]));
        list.forEach((s) => {
          const c = map.get(s.case_id);
          s.case_title = c?.title ?? null;
          s.case_court = c?.court_name ?? null;
          s.assigned_lawyer_id = c?.assigned_lawyer_id ?? "none";
        });
      }

      // Filter sessions based on case assignment
      if (simulatedLawyerId !== "owner") {
        list = list.filter((s) => (s.assigned_lawyer_id || "none") === simulatedLawyerId);
      }
      setUpcoming(list.slice(0, 5));
    })();

    // Fetch and filter Today's session counts
    (async () => {
      const { data: ses } = await supabase
        .from("sessions")
        .select("id,case_id,session_date")
        .gte("session_date", startOfDay)
        .lt("session_date", endOfDay);
      let list = ses ?? [];

      if (simulatedLawyerId !== "owner" && list.length > 0) {
        const ids = Array.from(new Set(list.map((s) => s.case_id)));
        const { data: cs } = await supabase
          .from("cases")
          .select("id,assigned_lawyer_id")
          .in("id", ids);
        const map = new Map((cs ?? []).map((c) => [c.id, c]));
        list = list.filter((s) => {
          const c = map.get(s.case_id);
          return (c?.assigned_lawyer_id || "none") === simulatedLawyerId;
        });
      }
      setTodayCount(list.length);
    })();

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

  const proceedToAddLawyer = async (name: string, email: string, role: string) => {
    setIsSendingEmail(true);
    try {
      // First ensure the lawyer is added/persisted to Supabase safely before sending the email invite
      await addFirmLawyer(name, email, role);

      const result = await callSendLawyerInvite({
        data: {
          lawyerName: name,
          lawyerEmail: email,
          lawyerRole: role,
          ownerEmail: user?.email || "meetozacoin@gmail.com",
        },
      });

      if (result.success) {
        toast.success(`✓ تم إضافة المحامي وإرسال بريد تفعيل حقيقي بنجاح إلى: ${email}! 📨`, {
          duration: 7000,
          position: "top-center",
        });
        setToastMessage(`✓ تم إضافة المحامي وإرسال بريد تفعيل حقيقي بنجاح إلى: ${email}! 📨`);
        setMissingApiKeyType(null);
      } else if (result.error === "MISSING_API_KEY") {
        setMissingApiKeyType("invite");
        setLastSentEmailInfo({
          type: "invite",
          to: email,
          subject: `⚖️ دعوة انضمام وتنشيط حسابك في منظومة قضيتي - ${name}`,
          lawyerName: name,
          lawyerRole: role,
        });
        toast.success(`✓ تم إضافة المحامي "${name}" بنجاح لطاقم المكتب!`, {
          description: "⚠️ لم نرسل بريداً حقيقياً لعدم وجود مفتاح RESEND_API_KEY المبرمج.",
          duration: 7000,
          position: "top-center",
        });
        setToastMessage(
          `⚠️ تم إضافة المحامي محلياً بنجاح! ولكن لم نرسل بريداً حقيقياً لعدم وجود مفتاح RESEND_API_KEY.`,
        );
      } else {
        toast.success(`✓ تم إضافة المحامي "${name}" بنجاح!`, {
          description: `⚠️ تعذر إرسال بريد التفعيل: ${result.error}`,
          duration: 7000,
          position: "top-center",
        });
        setToastMessage(`⚠️ تم إضافة المحامي محلياً، ولكن تعذر إرسال البريد: ${result.error}`);
      }
    } catch (err: unknown) {
      console.error("Error adding lawyer or sending invite:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      const isDbError = errMsg.includes("خطأ قاعدة البيانات");

      if (isDbError) {
        toast.error(`❌ فشل حفظ المحامي بـ Supabase: ${errMsg}`, {
          duration: 9000,
          position: "top-center",
        });
        setToastMessage(`❌ فشل الحفظ في قاعدة البيانات: ${errMsg}`);
      } else {
        // Fallback gracefully for email sending issues when DB insert succeeded
        setMissingApiKeyType("invite");
        setLastSentEmailInfo({
          type: "invite",
          to: email,
          subject: `⚖️ دعوة انضمام وتنشيط حسابك في منظومة قضيتي - ${name}`,
          lawyerName: name,
          lawyerRole: role,
        });
        toast.success(`✓ تم إضافة المحامي "${name}" بنجاح!`, {
          description: "⚠️ لم نرسل بريداً حقيقياً لعدم وجود مفتاح RESEND_API_KEY المبرمج.",
          duration: 7000,
          position: "top-center",
        });
        setToastMessage(
          `⚠️ تم إضافة المحامي محلياً بنجاح! ولكن لم نرسل بريداً حقيقياً لعدم وجود مفتاح RESEND_API_KEY.`,
        );
      }
    } finally {
      setIsSendingEmail(false);
      setNewLawyerName("");
      setNewLawyerEmail("");
      setNewLawyerRole("محامٍ مشارك");
      setShowAddLawyerModal(false);
      setTimeout(() => setToastMessage(null), 8500);
    }
  };

  const handleAddNewLawyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLawyerName.trim()) return;

    if (simulatedLawyerId !== "owner") {
      toast.error("عذراً، صلاحية إضافة أو حذف المحامين مقتصرة فقط على صاحب الحساب/صاحب المكتب.");
      return;
    }

    const emailToSet = newLawyerEmail.trim().toLowerCase() || `${Date.now()}@qadeyati.com`;

    if (user?.email !== "meetozacoin@gmail.com") {
      // Intercept with payment screen
      setShowAddLawyerModal(false);
      setShowPaymentModalForLawyer({
        name: newLawyerName.trim(),
        email: emailToSet,
        role: newLawyerRole,
      });
      return;
    }

    // Bypass payment for meetozacoin@gmail.com (Test account)
    await proceedToAddLawyer(newLawyerName.trim(), emailToSet, newLawyerRole);
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
            value={`${firmLawyers.find((l) => l.id === simulatedLawyerId)?.aiUsage ?? 0}/٦٠٠`}
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
                      <span className="block text-[10px] text-slate-300">
                        الوثائق:{" "}
                        <span className="font-bold text-amber-500">{lawyer.docsCount || 0}</span>
                      </span>
                      <span className="block text-[9px] text-slate-500 font-sans">
                        الذكاء:{" "}
                        <span className="text-slate-300 font-bold">{lawyer.aiUsage}ع/٦٠٠</span>
                      </span>
                    </div>
                    {simulatedLawyerId === "owner" && (
                      <button
                        onClick={() => handleOpenDeleteDialog(lawyer)}
                        className="p-1.5 rounded-lg text-rose-500 bg-rose-500/10 hover:text-rose-400 hover:bg-rose-500/20 border border-rose-500/15 hover:border-rose-500/30 transition-all cursor-pointer shadow-sm shadow-rose-950/20"
                        title="حذف المحامي وإعادة تفويض القضايا"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {simulatedLawyerId === "owner" && (
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
                )}
              </div>
            ))}
          </div>

          {simulatedLawyerId === "owner" && (
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
          )}

          {/* Inline Deletion & Case Delegation Card */}
          {deletingLawyer && (
            <div className="rounded-2xl border border-red-500/30 bg-[#12090d] p-4 space-y-4 mt-2 animate-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between border-b border-red-950/40 pb-2">
                <div className="flex items-center gap-2 text-rose-400">
                  <Trash className="h-4 w-4 bg-red-500/10 p-0.5 rounded" />
                  <h3 className="font-bold text-[11px] text-white">
                    إعادة تفويض قضايا: {deletingLawyer.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeletingLawyer(null);
                    setActiveCasesOfLawyer([]);
                  }}
                  className="rounded-lg p-1 hover:bg-[#2c1417] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-3 font-sans text-right">
                <p className="text-[10px] text-slate-300 leading-normal">
                  ⚠️ المحامي <strong className="text-white">{deletingLawyer.name}</strong> مكلف
                  حالياً بـ{" "}
                  <strong className="text-rose-400">{activeCasesOfLawyer.length} قضية نشطة</strong>{" "}
                  لم تغلق بعد. للمحافظة على سير العمل، يرجى ترحيل وتوطين هذه الملفات القانونية لزميل
                  آخر بالمكتب:
                </p>

                {/* List of active cases to delegate */}
                <div className="rounded-xl bg-black/40 border border-red-950/40 p-2.5 max-h-24 overflow-y-auto space-y-1">
                  {activeCasesOfLawyer.map((c) => (
                    <div
                      key={c.id}
                      className="text-[9px] text-slate-400 flex items-center justify-between"
                    >
                      <span className="truncate max-w-[170px]">⚖️ {c.title}</span>
                      <span className="rounded bg-slate-900 border border-slate-800 px-1 py-0.5 font-mono leading-none">
                        نشطة
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[9px] font-bold text-slate-400 block pb-1">
                    المحامي الجديد المستلم للملفات:
                  </label>
                  <select
                    value={delegationTargetId}
                    onChange={(e) => setDelegationTargetId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-white placeholder:text-muted-foreground/60 outline-none focus:border-red-500"
                  >
                    {firmLawyers
                      .filter((l) => l.id !== deletingLawyer.id)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.role})
                        </option>
                      ))}
                    <option value="none">قيد التوزيع (غير مسندة لأحد حالياً)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-1.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingLawyer(null);
                      setActiveCasesOfLawyer([]);
                    }}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-[10px] font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    إلغاء التراجع
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteWithDelegation}
                    className="rounded-xl bg-red-600 text-white px-3 py-2 text-[10px] font-bold active:scale-[0.98] hover:bg-red-500 transition-all cursor-pointer"
                  >
                    حذف المحامي وإعادة الإسناد
                  </button>
                </div>
              </div>
            </div>
          )}

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
                    disabled={isSendingEmail}
                    className="flex-1 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 py-2.5 text-xs font-bold text-white transition-all cursor-pointer font-sans flex items-center justify-center gap-2"
                  >
                    {isSendingEmail ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>جاري الحفظ وإرسال دعوة التفعيل...</span>
                      </>
                    ) : (
                      <span>حفظ وإرسال دعوة التفعيل 📨</span>
                    )}
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

          {/* Inline Payment Modal for Adding Lawyer */}
          {showPaymentModalForLawyer && (
            <div className="rounded-2xl border border-[var(--gold)]/30 bg-[#090e18] p-5 space-y-4 mt-2 animate-in slide-in-from-top-3 duration-200 text-right">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <div className="flex items-center gap-2 text-[var(--gold-soft)]">
                  <CreditCard className="h-4 w-4" />
                  <h3 className="font-bold text-[11px] text-white font-display">
                    بوابة الدفع والتنشيط الآمنة للمحامي الفرعي
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModalForLawyer(null)}
                  className="rounded-lg p-1 hover:bg-[#1a233a] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-1 rounded-xl border border-[var(--gold)]/10 bg-[var(--gold)]/5 p-3">
                <p className="font-sans text-[10px] text-slate-400">
                  باقة المكاتب والشركات (عضو مضاف):
                </p>
                <p className="text-xs font-bold text-white">{showPaymentModalForLawyer.name}</p>
                <p className="font-sans text-[10px] text-slate-400">
                  الدور: {showPaymentModalForLawyer.role} | البريد:{" "}
                  {showPaymentModalForLawyer.email}
                </p>
                <div className="mt-2 flex items-baseline gap-1 border-t border-slate-900 pt-1">
                  <span className="font-mono text-xl font-bold text-[var(--gold-soft)]">١٩٩</span>
                  <span className="font-sans text-[10px] text-slate-300">جنيه مصري / شهرياً</span>
                </div>
                <p className="font-sans text-[9px] text-slate-500 pt-1">
                  * يحصل المحامي فور تفعيل عضويته على 600 طلب مساعد ذكي مستقل شهرياً ولوحة منفصلة.
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsProcessingPayment(true);
                  setTimeout(async () => {
                    setIsProcessingPayment(false);
                    const name = showPaymentModalForLawyer.name;
                    const email = showPaymentModalForLawyer.email;
                    const role = showPaymentModalForLawyer.role;
                    setShowPaymentModalForLawyer(null);
                    setCardNumber("");
                    setCardHolder("");
                    setCardExpiry("");
                    setCardCvv("");
                    await proceedToAddLawyer(name, email, role);
                  }, 2000);
                }}
                className="space-y-3 text-right font-sans"
              >
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-300">
                    رقم البطاقة الائتمانية:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
                        setCardNumber(formatted.substring(0, 19));
                      }}
                      placeholder="4000 1234 5678 9010"
                      className="w-full rounded-xl border border-slate-800 bg-[#06080d] px-3 py-2 text-left font-mono text-xs text-white outline-none focus:border-[var(--gold)]"
                      dir="ltr"
                    />
                    <CreditCard className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-300">
                      تاريخ الانتهاء:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        if (val.length > 2) {
                          val = val.substring(0, 2) + "/" + val.substring(2, 4);
                        }
                        setCardExpiry(val.substring(0, 5));
                      }}
                      className="w-full rounded-xl border border-slate-800 bg-[#06080d] px-3 py-2 text-center font-mono text-xs text-white outline-none focus:border-[var(--gold)]"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-300">
                      الرمز السري (CVV):
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                      placeholder="•••"
                      className="w-full rounded-xl border border-slate-800 bg-[#06080d] px-3 py-2 text-center font-mono text-xs text-white outline-none focus:border-[var(--gold)]"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-300">
                    اسم صاحب البطاقة:
                  </label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="الاسم كما يظهر على البطاقة"
                    className="w-full rounded-xl border border-slate-800 bg-[#06080d] px-3 py-2 text-right font-sans text-xs text-white outline-none focus:border-[var(--gold)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="w-full rounded-xl bg-gradient-to-r from-[var(--gold-soft)] to-[var(--gold)] text-[#090e18] hover:opacity-90 disabled:opacity-50 py-2.5 text-xs font-bold active:scale-[0.98] transition-all cursor-pointer font-sans flex items-center justify-center gap-2 mt-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#090e18] border-t-transparent" />
                      <span>جاري معالجة الدفع والخصم الآمن...</span>
                    </>
                  ) : (
                    <span>تأكيد دفع ١٩٩ جنيه مصري وتفعيل العضوية 💳</span>
                  )}
                </button>
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

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={async () => {
                    setShowReportModal(false);
                    setIsSendingEmail(true);
                    try {
                      const mappedLawyers = firmLawyers.map((l) => ({
                        name: l.name,
                        email: l.email,
                        role: l.role,
                        casesCount: l.casesCount,
                        aiUsage: l.aiUsage,
                      }));

                      const result = await callSendLawyersPerformanceReports({
                        data: {
                          lawyers: mappedLawyers,
                        },
                      });

                      if (result.success) {
                        setToastMessage(
                          `✓ تم إرسال تقارير الأداء الحقيقية بنجاح إلى إيميلات المحامين المسجلين! (تم إرسال ${result.successCount} بريد بنجاح)`,
                        );
                        setMissingApiKeyType(null);
                      } else if (result.error === "MISSING_API_KEY") {
                        setMissingApiKeyType("lawyers-report");
                        setLastSentEmailInfo({
                          type: "lawyers-report",
                          to: "جميع المحامين المسجلين بالمكتب",
                          subject: `📊 تقارير الأداء العملي للمحامين العاملين`,
                          details: { lawyers: mappedLawyers },
                        });
                        setToastMessage(
                          "⚠️ تم توليد التقارير ولكن لم نرسلها حقيقياً لبريدهم لعدم وجود مفتاح RESEND_API_KEY المبرمج.",
                        );
                      } else {
                        setToastMessage(`⚠️ فشل إرسال التقارير لبعض المحامين: ${result.error}`);
                      }
                    } catch (err) {
                      console.error("Error sending performance reports:", err);
                      setMissingApiKeyType("lawyers-report");
                      setLastSentEmailInfo({
                        type: "lawyers-report",
                        to: "جميع المحامين المسجلين بالمكتب",
                        subject: `📊 تقارير الأداء العملي للمحامين العاملين`,
                        details: { lawyers: mappedLawyers },
                      });
                      setToastMessage(
                        "⚠️ تم توليد التقارير ولكن لم نرسلها حقيقياً لبريدهم لعدم وجود مفتاح RESEND_API_KEY المبرمج.",
                      );
                    } finally {
                      setIsSendingEmail(false);
                      setTimeout(() => setToastMessage(null), 8500);
                    }
                  }}
                  className="w-full rounded-xl bg-[#06080d] border border-slate-800 hover:bg-slate-800 text-slate-100 p-3 text-xs text-right font-medium flex flex-col gap-1 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="font-bold text-[10.5px] flex items-center gap-1.5 text-blue-400 text-right">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    ١. إرسال تقارير الأداء العملي للمحامين العاملين {isSendingEmail && "..."}
                  </span>
                  <span className="text-[9px] text-slate-400 leading-normal text-right">
                    يولد تقريراً تخصصياً كلاً بمحاميه وقضاياه وجلساته مرسلاً لإيميلهم (بدون أرقام
                    مالية).
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={async () => {
                    setShowReportModal(false);
                    setIsSendingEmail(true);

                    const totalActiveCases = caseCount;
                    const overduePaymentsCount = overdueCount;
                    let totalIncome = 0;
                    let expectedIncome = 0;

                    try {
                      // Fetch live payments from Supabase
                      const { data: paymentsData } = await supabase
                        .from("payments")
                        .select("total_amount, paid_amount");

                      if (paymentsData) {
                        const sumPaid = (sum: number, p: { paid_amount: number }) =>
                          sum + Number(p.paid_amount ?? 0);
                        const sumRemaining = (
                          sum: number,
                          p: { total_amount: number; paid_amount: number },
                        ) =>
                          sum +
                          Math.max(Number(p.total_amount ?? 0) - Number(p.paid_amount ?? 0), 0);

                        totalIncome = paymentsData.reduce(sumPaid, 0);
                        expectedIncome = paymentsData.reduce(sumRemaining, 0);
                      }

                      const result = await callSendOwnerFinancialReport({
                        data: {
                          ownerEmail: user?.email || "meetozacoin@gmail.com",
                          totalIncome,
                          expectedIncome,
                          overdueCount: overduePaymentsCount,
                          activeCasesCount: totalActiveCases,
                        },
                      });

                      if (result.success) {
                        setToastMessage(
                          `✓ تم توليد التقرير المالي والإداري الشامل بنجاح وإرساله حقيقياً إلى بريدك المسجل: ${user?.email || "meetozacoin@gmail.com"}`,
                        );
                        setMissingApiKeyType(null);
                      } else if (result.error === "MISSING_API_KEY") {
                        setMissingApiKeyType("owner-report");
                        setLastSentEmailInfo({
                          type: "owner-report",
                          to: user?.email || "info@qadeyati.com",
                          subject: `📈 التقرير والبيان المالي الشامل لمكتب المحاماة والشركاء`,
                          details: {
                            totalIncome,
                            expectedIncome,
                            overdueCount: overduePaymentsCount,
                            activeCasesCount: totalActiveCases,
                          },
                        });
                        setToastMessage(
                          `⚠️ تم توليد التقرير، ولكن تعذر إرساله بريدياً لعدم وجود مفتاح تفعيل الحساب RESEND_API_KEY.`,
                        );
                      } else {
                        setToastMessage(
                          `⚠️ فشل إرسال التقرير المالي والعملي الشامل: ${result.error}`,
                        );
                      }
                    } catch (err) {
                      console.error("Error sending financial report:", err);
                      setMissingApiKeyType("owner-report");
                      setLastSentEmailInfo({
                        type: "owner-report",
                        to: user?.email || "info@qadeyati.com",
                        subject: `📈 التقرير والبيان المالي الشامل لمكتب المحاماة والشركاء`,
                        details: {
                          totalIncome,
                          expectedIncome,
                          overdueCount: overduePaymentsCount,
                          activeCasesCount: totalActiveCases,
                        },
                      });
                      setToastMessage(
                        `⚠️ تم توليد التقرير، ولكن تعذر إرساله بريدياً لعدم وجود مفتاح تفعيل الحساب RESEND_API_KEY.`,
                      );
                    } finally {
                      setIsSendingEmail(false);
                      setTimeout(() => setToastMessage(null), 8500);
                    }
                  }}
                  className="w-full rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-300 p-3 text-xs text-right font-medium flex flex-col gap-1 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="font-bold text-[10.5px] flex items-center gap-1.5 text-amber-400 text-right">
                    <Shield className="h-3.5 w-3.5 shrink-0" />
                    ٢. طلب التقرير المالي والعملي الشامل للمكتب {isSendingEmail && "..."}
                  </span>
                  <span className="text-[9px] text-blue-300 leading-normal text-right">
                    شيت تفصيلي شامل للإيرادات وتوزيع العمل يرسل لمدير المكتب وصاحب العمل فقط.
                  </span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Sandbox Simulated Mailbox */}
      {lastSentEmailInfo && (
        <section className="rounded-2xl border border-amber-500/30 bg-[#0c0f1d] p-5 space-y-4 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Mail className="h-4 w-4" />
              <h3 className="font-bold text-xs text-white">
                صندوق بريد المنظومة المحاكي (Sandbox Simulated Mailbox)
              </h3>
            </div>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/20">
              وضع المحاكاة نشط
            </span>
          </div>

          <div className="rounded-xl bg-orange-500/5 border border-orange-500/10 p-3 text-xs leading-normal text-slate-300">
            <span className="font-bold text-amber-500 block mb-1">
              💡 كيف تفعل الإرسال الحقيقي؟
            </span>
            لحل هذه المشكلة وإرسال إيميلات حقيقية مباشرة للمحامين، يرجى ملء مفتاح
            <code className="mx-1 px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400 font-mono">
              RESEND_API_KEY
            </code>
            من خلال إعدادات البيئة في لوحة تحكم التطبيق بالمنصة (Settings &gt; Secrets)، أو في ملف{" "}
            <code className="font-mono">.env</code> الخاص بك.
            <p className="mt-1.5 text-slate-400">
              وتسهيلاً لك ومراعاة لخصوصية حسابك أثناء التجريب، قام النظام بمحاكاة وتوليد محتوى
              البريد الإلكتروني بالكامل لتتمكن من فحص الروابط ونظام العمل فوراً دون الحاجة لأي
              تهيئة:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-900 bg-slate-950/60 p-3 text-right">
              <span className="text-slate-500 block uppercase font-mono text-[10px]">
                المرسل إليه (To)
              </span>
              <strong className="text-white font-mono">{lastSentEmailInfo.to}</strong>
            </div>
            <div className="rounded-xl border border-slate-900 bg-slate-950/60 p-3 text-right">
              <span className="text-slate-500 block uppercase font-mono text-[10px]">
                عنوان الرسالة (Subject)
              </span>
              <strong className="text-amber-300">{lastSentEmailInfo.subject}</strong>
            </div>
          </div>

          <div className="rounded-xl border border-slate-900 bg-[#060810] p-4 text-xs space-y-3 text-right">
            <span className="text-slate-400 font-semibold block border-b border-slate-900 pb-2">
              📂 محتوى البريد الإلكتروني الناتج:
            </span>

            {lastSentEmailInfo.type === "invite" && (
              <div className="space-y-3 font-sans leading-relaxed">
                <p className="text-slate-300">
                  مرحباً بك الزميل العزيز{" "}
                  <strong className="text-[var(--gold)]">{lastSentEmailInfo.lawyerName}</strong>،
                  لقد تم دعوتك بصفة{" "}
                  <strong className="text-blue-400">{lastSentEmailInfo.lawyerRole}</strong> للانضمام
                  إلى مكتب المحاماة ببريد تفعيل:{" "}
                  <code className="bg-slate-900 px-1 py-0.5 rounded text-white font-mono">
                    {lastSentEmailInfo.to}
                  </code>
                  .
                </p>
                <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-3 text-slate-400 space-y-2">
                  <p className="font-bold text-slate-300">خطوات تشغيل المحاكي والتحقق السريع:</p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] pr-2">
                    <li>يمكنك تسجيل الدخول بالبريد المدعو وتجربة النظام فوراً.</li>
                    <li>رابط تسجيل الحساب المولد لدعوة المحامي هو (اضغط نسخ أو افتحه مباشرة):</li>
                  </ul>
                  <div className="mt-2 flex gap-1.5 items-center bg-slate-950 p-2 rounded-lg border border-slate-900 justify-between">
                    <button
                      onClick={() => {
                        const val = `${window?.location?.origin || ""}/signup?email=${encodeURIComponent(lastSentEmailInfo.to)}&role=${encodeURIComponent(lastSentEmailInfo.lawyerRole || "")}`;
                        navigator.clipboard.writeText(val);
                        setToastMessage("✓ تم نسخ الرابط بنجاح! 📋");
                        setTimeout(() => setToastMessage(null), 3500);
                      }}
                      className="rounded bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1 text-[10px] cursor-pointer font-bold shrink-0"
                    >
                      نسخ الرابط
                    </button>
                    <input
                      readOnly
                      value={`${window?.location?.origin || ""}/signup?email=${encodeURIComponent(lastSentEmailInfo.to)}&role=${encodeURIComponent(lastSentEmailInfo.lawyerRole || "")}`}
                      className="flex-1 bg-transparent text-left font-mono text-[10px] text-zinc-400 outline-none select-all mr-2"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}

            {lastSentEmailInfo.type === "lawyers-report" && (
              <div className="space-y-2">
                <p className="text-slate-300">
                  تقرير إجمالي المحامين العاملين بالمكتب، يتضمن أعداد القضايا ومعدلات إنجاز الذكاء
                  الاصطناعي المسندة لكل زميل بخصوصية تامة:
                </p>
                <div className="overflow-x-auto rounded-lg border border-slate-900 bg-slate-950/40">
                  <table className="w-full text-right text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                        <th className="p-2">المحامي</th>
                        <th className="p-2 text-center">البريد</th>
                        <th className="p-2 text-center">القضايا مخصصة</th>
                        <th className="p-2 text-center">استخدام AI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastSentEmailInfo.details?.lawyers?.map((l, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-slate-900 hover:bg-slate-900/30 text-slate-300"
                        >
                          <td className="p-2 font-bold text-white">{l.name}</td>
                          <td className="p-2 font-mono text-center text-slate-400">{l.email}</td>
                          <td className="p-2 text-center text-blue-400 font-bold">
                            {l.casesCount} قضية
                          </td>
                          <td className="p-2 text-center text-emerald-400">{l.aiUsage} استشارة</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {lastSentEmailInfo.type === "owner-report" && (
              <div className="space-y-3 text-slate-300">
                <p>
                  بيان إجمالي تحليلي موجه لإدارة المكتب يتضمن المقاييس المالية والأقساط المتأخرة
                  والفاعلية التشغيلية الإجمالية:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-900 text-right">
                    <span className="text-slate-500 block">الإيرادات المحصلة بالفعل</span>
                    <strong className="text-emerald-400 text-xs font-mono">
                      {lastSentEmailInfo.details.totalIncome?.toLocaleString()} ج.م
                    </strong>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-900 text-right">
                    <span className="text-slate-500 block">مستحقات معلقة</span>
                    <strong className="text-blue-400 text-xs font-mono">
                      {lastSentEmailInfo.details.expectedIncome?.toLocaleString()} ج.م
                    </strong>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-900 text-right">
                    <span className="text-slate-500 block">أقساط متأخرة</span>
                    <strong className="text-red-400 text-xs font-bold">
                      {lastSentEmailInfo.details.overdueCount} أقساط فواتير
                    </strong>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-900 text-right">
                    <span className="text-slate-500 block">إجمالي الدعاوى النشطة</span>
                    <strong className="text-amber-400 text-xs font-bold">
                      {lastSentEmailInfo.details.activeCasesCount} قضية حية
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1 font-sans">
            <button
              onClick={() => setLastSentEmailInfo(null)}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black px-4 py-1.5 text-xs font-bold transition-all cursor-pointer font-sans"
            >
              فهمت، إغلاق المعاينة ✕
            </button>
          </div>
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
