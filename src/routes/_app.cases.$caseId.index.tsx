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
}

function CaseDetailsPage() {
  const { caseId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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

      {tab === "overview" && <OverviewTab c={c} />}
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

function OverviewTab({ c }: { c: CaseRow }) {
  const rows: Array<[string, string | null]> = [
    ["النوع", c.case_type],
    ["المحكمة", c.court_name],
    ["الدائرة", c.circuit_name],
    ["الموكل", c.client_name],
    ["الخصم", c.opponent_name],
    ["أول جلسة", c.first_session_date],
  ];
  return (
    <div className="space-y-4">
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
