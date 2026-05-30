import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Trash2,
  Calendar,
  FileText,
  Paperclip,
  StickyNote,
  Pencil,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTrial, FirmLawyer } from "@/hooks/use-trial";
import { StatusBadge } from "@/components/qadeyti/StatusBadge";
import { CASE_STATUSES } from "@/lib/case-constants";
import { SessionsTab } from "@/components/qadeyti/SessionsTab";
import { NotesTab } from "@/components/qadeyti/NotesTab";
import { AttachmentsTab } from "@/components/qadeyti/AttachmentsTab";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/cases/$caseId/")({
  component: CaseDetailsPage,
});

type Tab = "overview" | "sessions" | "attachments" | "notes";

interface CaseRow {
  id: string;
  title: string;
  case_number: string | null;
  case_type: string | null;
  court_name: string | null;
  circuit_name: string | null;
  client_name: string | null;
  opponent_name: string | null;
  description: string | null;
  status: string;
  first_session_date: string | null;
  assigned_lawyer_id?: string | null;
}

function CaseDetailsPage() {
  const { caseId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, firmLawyers } = useTrial();
  const [c, setC] = useState<CaseRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [statusOpen, setStatusOpen] = useState(false);

  const reload = () => {
    supabase
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .maybeSingle()
      .then(({ data }) => {
        setC(data as CaseRow | null);
        setLoading(false);
      });
  };

  useEffect(reload, [caseId]);

  const updateStatus = async (status: string) => {
    if (!c) return;
    setC({ ...c, status });
    setStatusOpen(false);
    await supabase.from("cases").update({ status }).eq("id", c.id);
  };

  const remove = async () => {
    if (!c) return;
    if (!confirm("تأكيد حذف القضية؟ لا يمكن التراجع.")) return;
    await supabase.from("cases").update({ archived_at: new Date().toISOString() }).eq("id", c.id);
    navigate({ to: "/cases" });
  };

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl border border-border bg-card/50" />;
  }
  if (!c) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">القضية غير موجودة.</p>
        <Link to="/cases" className="text-[var(--gold)]">
          العودة للقضايا
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Sticky header */}
      <div className="-mx-4 sticky top-14 z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <Link to="/cases" className="text-muted-foreground">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="flex-1 truncate text-center font-display text-base font-semibold text-foreground">
            {c.title}
          </h1>
          <div className="flex items-center gap-3">
            <Link
              to="/cases/$caseId/edit"
              params={{ caseId: c.id }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="تعديل"
            >
              <Pencil className="h-5 w-5" />
            </Link>
            <button onClick={remove} className="text-destructive" aria-label="حذف">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <button onClick={() => setStatusOpen((o) => !o)}>
            <StatusBadge status={c.status} />
          </button>
          {c.case_number && (
            <span className="text-xs text-muted-foreground">رقم {c.case_number}</span>
          )}
        </div>
        {statusOpen && (
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-2">
            {CASE_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-xs",
                  s === c.status
                    ? "border-[var(--gold)] text-[var(--gold-soft)]"
                    : "border-border text-foreground hover:border-[var(--gold)]/40",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
        <TabBtn
          icon={<FileText className="h-4 w-4" />}
          active={tab === "overview"}
          onClick={() => setTab("overview")}
        >
          نظرة عامة
        </TabBtn>
        <TabBtn
          icon={<Calendar className="h-4 w-4" />}
          active={tab === "sessions"}
          onClick={() => setTab("sessions")}
        >
          الجلسات
        </TabBtn>
        <TabBtn
          icon={<Paperclip className="h-4 w-4" />}
          active={tab === "attachments"}
          onClick={() => setTab("attachments")}
        >
          الوثائق
        </TabBtn>
        <TabBtn
          icon={<StickyNote className="h-4 w-4" />}
          active={tab === "notes"}
          onClick={() => setTab("notes")}
        >
          ملاحظات
        </TabBtn>
      </div>

      {tab === "overview" && (
        <OverviewTab c={c} plan={plan} firmLawyers={firmLawyers} caseId={c.id} />
      )}
      {tab === "overview" && (
        <Link
          to="/ai"
          search={{ caseId: c.id }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold)] font-display text-base font-semibold text-[color:var(--primary-foreground)] shadow-gold"
        >
          <Sparkles className="h-5 w-5" /> اسأل المساعد
        </Link>
      )}
      {tab === "sessions" && user && (
        <SessionsTab caseId={c.id} userId={user.id} onChange={reload} />
      )}
      {tab === "attachments" && user && <AttachmentsTab caseId={c.id} userId={user.id} />}
      {tab === "notes" && user && <NotesTab caseId={c.id} userId={user.id} />}
    </div>
  );
}

function TabBtn({
  icon,
  active,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
        active
          ? "bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold)] text-[color:var(--primary-foreground)]"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon} {children}
    </button>
  );
}

function OverviewTab({
  c,
  plan,
  firmLawyers,
  caseId,
}: {
  c: CaseRow;
  plan: string;
  firmLawyers: FirmLawyer[];
  caseId: string;
}) {
  const { simulatedLawyerId } = useTrial();
  const isOwner = simulatedLawyerId === "owner";

  const [assignedLawyerId, setAssignedLawyerId] = useState<string>(() => {
    return c.assigned_lawyer_id || "none";
  });

  useEffect(() => {
    setAssignedLawyerId(c.assigned_lawyer_id || "none");
  }, [c.assigned_lawyer_id]);

  const handleAssign = async (lawyerId: string) => {
    if (!isOwner) return; // Prevent unauthorized assignment calls
    setAssignedLawyerId(lawyerId);
    if (typeof window !== "undefined") {
      localStorage.setItem(`case_lawyer_${caseId}`, lawyerId);
    }
    try {
      const dbValue = lawyerId === "none" ? null : lawyerId;
      const { error } = await supabase
        .from("cases")
        .update({ assigned_lawyer_id: dbValue })
        .eq("id", caseId);

      if (error) {
        console.error("Error setting case assignment on Supabase:", error);
      }
    } catch (err) {
      console.error("Error updating assignment in Supabase:", err);
    }
  };

  const rows: Array<[string, string | null]> = [
    ["النوع", c.case_type],
    ["المحكمة", c.court_name],
    ["الدائرة", c.circuit_name],
    ["الموكل", c.client_name],
    ["الخصم", c.opponent_name],
    ["أول جلسة", c.first_session_date],
  ];

  const safeFirmLawyers = firmLawyers || [];
  const assignedLawyer = safeFirmLawyers.find((l) => l.id === assignedLawyerId);
  const showDelegationBox = isOwner || (assignedLawyerId !== "none" && assignedLawyer);

  return (
    <div className="space-y-4">
      {showDelegationBox && (plan === "enterprise" || safeFirmLawyers.length > 0) && (
        <div className="rounded-2xl border border-[var(--gold)]/20 bg-[#0c101a] p-4 text-right space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-450 font-display">
              توزيع المهام والرقابة المركزية
            </h3>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-400 font-sans">
              {isOwner ? "لوحة الشركاء" : "تكليف رسمي"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {isOwner ? (
              <>
                <label className="text-xs text-slate-400 font-medium font-sans">
                  توجيه القضية وتكليف محامٍ فرعي:
                </label>
                <select
                  value={assignedLawyerId}
                  onChange={(e) => handleAssign(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-foreground outline-none focus:border-[var(--gold)]"
                >
                  <option value="none">⚠️ غير مكلف لأي محامٍ فرعي (تولى أنت الإدارة)</option>
                  {safeFirmLawyers.map((lawyer) => (
                    <option key={lawyer.id} value={lawyer.id}>
                      👤 {lawyer.name} ({lawyer.role})
                    </option>
                  ))}
                </select>
              </>
            ) : (
              assignedLawyer && (
                <div className="text-xs text-slate-400 font-medium font-sans mb-1">
                  المحامي المكلف بالملف:
                </div>
              )
            )}
          </div>

          {assignedLawyerId !== "none" && assignedLawyer && (
            <div className="mt-3 rounded-xl bg-slate-900/60 border border-slate-800 p-2.5 text-xs text-slate-300 flex items-start gap-2.5 leading-normal">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs text-blue-400 font-bold">
                {assignedLawyer.avatarLetter}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-slate-200">{assignedLawyer.name}</p>
                <p className="mt-0.5 text-slate-400 font-sans">
                  {isOwner
                    ? "يعمل على الملف الآن. المخرجات ومسودات الجلسات تخضع للمراجعة المركزية التلقائية."
                    : "تعمل على هذا الملف المكلف إليك رسمياً من الشريك المدير للمكتب."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <dl className="divide-y divide-border">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="text-sm text-foreground">{v || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
      {c.description && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-xs text-muted-foreground">الوصف</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {c.description}
          </p>
        </div>
      )}
    </div>
  );
}
