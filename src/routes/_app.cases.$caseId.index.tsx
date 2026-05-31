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

  const [assignedLawyerIds, setAssignedLawyerIds] = useState<string[]>(() => {
    return c.assigned_lawyer_id ? c.assigned_lawyer_id.split(",").filter(Boolean) : [];
  });

  useEffect(() => {
    const ids = c.assigned_lawyer_id ? c.assigned_lawyer_id.split(",").filter(Boolean) : [];
    setAssignedLawyerIds(ids);
  }, [c.assigned_lawyer_id]);

  const handleToggleLawyer = async (lawyerId: string) => {
    if (!isOwner) return;
    let nextIds: string[];
    if (assignedLawyerIds.includes(lawyerId)) {
      nextIds = assignedLawyerIds.filter((id) => id !== lawyerId);
    } else {
      nextIds = [...assignedLawyerIds, lawyerId];
    }
    setAssignedLawyerIds(nextIds);

    const dbValue = nextIds.length === 0 ? null : nextIds.join(",");
    if (typeof window !== "undefined") {
      if (dbValue === null) {
        localStorage.removeItem(`case_lawyer_${caseId}`);
      } else {
        localStorage.setItem(`case_lawyer_${caseId}`, dbValue);
      }
    }
    try {
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
  const assignedLawyers = safeFirmLawyers.filter((l) => assignedLawyerIds.includes(l.id));
  const showDelegationBox = isOwner || assignedLawyers.length > 0;

  return (
    <div className="space-y-4">
      {showDelegationBox && (plan === "enterprise" || safeFirmLawyers.length > 0) && (
        <div className="rounded-2xl border border-[var(--gold)]/20 bg-[#0c101a] p-4 text-right space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 font-display">
              توزيع المهام والعمل الجماعي بالملف
            </h3>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-400 font-sans">
              {isOwner ? "لوحة الشركاء" : "تكليف رسمي"}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {isOwner ? (
              <>
                <label className="text-xs text-slate-400 font-semibold font-sans mb-1 block">
                  تكليف وتوجيه القضية لمحامي أو فريق عمل من المكتب:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {safeFirmLawyers.map((lawyer) => {
                    const isChecked = assignedLawyerIds.includes(lawyer.id);
                    return (
                      <label
                        key={lawyer.id}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl border text-right transition-all cursor-pointer select-none",
                          isChecked
                            ? "bg-blue-500/10 border-blue-500/35 text-slate-250"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-755 hover:text-slate-300",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleLawyer(lawyer.id)}
                          className="accent-[var(--gold)] h-4 w-4 rounded"
                        />
                        <div className="flex-1 text-xs">
                          <span className="font-bold block text-slate-200">{lawyer.name}</span>
                          <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                            {lawyer.role}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            ) : (
              assignedLawyers.length > 0 && (
                <div className="text-xs text-slate-400 font-semibold font-sans mb-1">
                  المحامون المكلفون بالعمل على هذا الملف:
                </div>
              )
            )}
          </div>

          {assignedLawyers.length > 0 ? (
            <div className="space-y-2 pt-2 border-t border-slate-800/50">
              <div className="text-[10px] text-slate-500 font-semibold font-sans">
                فريق العمل القانوني المشارك ({assignedLawyers.length}):
              </div>
              <div className="grid grid-cols-1 gap-2">
                {assignedLawyers.map((lawyer) => (
                  <div
                    key={lawyer.id}
                    className="rounded-xl bg-slate-900/60 border border-slate-800/40 p-2.5 text-xs text-slate-300 flex items-start gap-2.5 leading-normal"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs text-blue-400 font-bold font-sans">
                      {lawyer.avatarLetter}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2.5">
                        <p className="font-semibold text-slate-200">{lawyer.name}</p>
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-sans">
                          {lawyer.role}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-450 font-sans leading-relaxed">
                        {isOwner
                          ? "يعمل حالياً كعضو فريق مكلف بهذا الملف القانوني تحت إشرافك المباشر."
                          : lawyer.id === simulatedLawyerId
                            ? "تعمل على هذا الملف المكلف إليك رسمياً من الشريك المدير للمكتب."
                            : "زميل مشارك مكلف بالتعاون والعمل الفني المشترك على هذا الملف."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            isOwner && (
              <p className="text-[11px] text-amber-500 bg-amber-500/5 px-3 py-2 rounded-lg border border-amber-500/15 inline-block font-sans">
                ⚠️ لا يوجد محامون مكلفون حالياً بالملف (تتولى أنت الإشراف المباشر كشريك رئيسي)
              </p>
            )
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
