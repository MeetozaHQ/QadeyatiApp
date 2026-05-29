import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PremiumInput } from "@/components/qadeyti/PremiumInput";
import { PremiumButton } from "@/components/qadeyti/PremiumButton";
import { CASE_TYPES, CASE_STATUSES } from "@/lib/case-constants";
import { ensureFirstSession } from "@/lib/first-session";
import { recomputeCaseStatus } from "@/lib/case-status";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/cases/$caseId/edit")({
  component: EditCasePage,
});

interface FormState {
  case_type: string;
  title: string;
  case_number: string;
  court_name: string;
  circuit_name: string;
  client_name: string;
  opponent_name: string;
  first_session_date: string;
  description: string;
  status: string;
}

const empty: FormState = {
  case_type: "",
  title: "",
  case_number: "",
  court_name: "",
  circuit_name: "",
  client_name: "",
  opponent_name: "",
  first_session_date: "",
  description: "",
  status: "جديدة",
};

function EditCasePage() {
  const { caseId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [f, setF] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setF(empty);
          return;
        }
        setF({
          case_type: data.case_type ?? "",
          title: data.title ?? "",
          case_number: data.case_number ?? "",
          court_name: data.court_name ?? "",
          circuit_name: data.circuit_name ?? "",
          client_name: data.client_name ?? "",
          opponent_name: data.opponent_name ?? "",
          first_session_date: data.first_session_date ?? "",
          description: data.description ?? "",
          status: data.status ?? "جديدة",
        });
      });
  }, [caseId]);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF((p) => (p ? { ...p, [k]: v } : p));
  }

  const save = async () => {
    if (!f) return;
    if (!f.title.trim()) {
      setError("عنوان القضية مطلوب");
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("cases")
      .update({
        title: f.title.trim(),
        case_type: f.case_type || null,
        case_number: f.case_number.trim() || null,
        court_name: f.court_name.trim() || null,
        circuit_name: f.circuit_name.trim() || null,
        client_name: f.client_name.trim() || null,
        opponent_name: f.opponent_name.trim() || null,
        first_session_date: f.first_session_date || null,
        description: f.description.trim() || null,
        status: f.status || "جديدة",
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseId);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (user && f.first_session_date) {
      await ensureFirstSession({
        caseId,
        userId: user.id,
        firstSessionDate: f.first_session_date,
        courtName: f.court_name.trim() || null,
      });
      await recomputeCaseStatus(caseId);
    }
    navigate({ to: "/cases/$caseId", params: { caseId } });
  };

  if (!f) {
    return <div className="h-40 animate-pulse rounded-2xl border border-border bg-card/50" />;
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <Link to="/cases/$caseId" params={{ caseId }} className="text-muted-foreground">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-lg font-semibold text-foreground">تعديل القضية</h1>
        <span className="w-5" />
      </header>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm text-muted-foreground">نوع القضية</label>
          <div className="grid grid-cols-2 gap-2">
            {CASE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("case_type", t)}
                className={cn(
                  "h-11 rounded-xl border text-sm transition-colors",
                  f.case_type === t
                    ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]"
                    : "border-border bg-card text-foreground hover:border-[var(--gold)]/40",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <PremiumInput
          label="عنوان القضية"
          value={f.title}
          onChange={(e) => set("title", e.target.value)}
        />
        <PremiumInput
          label="رقم القضية"
          value={f.case_number}
          onChange={(e) => set("case_number", e.target.value)}
        />
        <PremiumInput
          label="المحكمة"
          value={f.court_name}
          onChange={(e) => set("court_name", e.target.value)}
        />
        <PremiumInput
          label="الدائرة"
          value={f.circuit_name}
          onChange={(e) => set("circuit_name", e.target.value)}
        />
        <PremiumInput
          label="اسم الموكل"
          value={f.client_name}
          onChange={(e) => set("client_name", e.target.value)}
        />
        <PremiumInput
          label="اسم الخصم"
          value={f.opponent_name}
          onChange={(e) => set("opponent_name", e.target.value)}
        />
        <PremiumInput
          label="تاريخ أول جلسة"
          type="date"
          value={f.first_session_date}
          onChange={(e) => set("first_session_date", e.target.value)}
        />
        <div className="space-y-2">
          <label className="block text-sm text-muted-foreground">حالة القضية</label>
          <select
            value={f.status}
            onChange={(e) => set("status", e.target.value)}
            className="h-14 w-full rounded-xl border border-border bg-card px-4 text-base text-foreground outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20 cursor-pointer"
          >
            {CASE_STATUSES.map((status) => (
              <option key={status} value={status} className="bg-card text-foreground">
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm text-muted-foreground">وصف مختصر</label>
          <textarea
            value={f.description}
            onChange={(e) => set("description", e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-border bg-card p-4 text-base text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[var(--gold)]"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
            {error}
          </p>
        )}
      </div>

      <PremiumButton loading={saving} onClick={save} className="w-full">
        حفظ التعديلات <Check className="mr-2 h-4 w-4" />
      </PremiumButton>
    </div>
  );
}
