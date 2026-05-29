import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Check, ShieldAlert } from "lucide-react";
import { PremiumInput } from "@/components/qadeyti/PremiumInput";
import { PremiumButton } from "@/components/qadeyti/PremiumButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTrial } from "@/hooks/use-trial";
import { CASE_TYPES } from "@/lib/case-constants";
import { createNotification } from "@/lib/notifications";
import { ensureFirstSession } from "@/lib/first-session";
import { recomputeCaseStatus } from "@/lib/case-status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/cases/new")({
  component: NewCasePage,
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
}

const initial: FormState = {
  case_type: "",
  title: "",
  case_number: "",
  court_name: "",
  circuit_name: "",
  client_name: "",
  opponent_name: "",
  first_session_date: "",
  description: "",
};

const STEPS = ["النوع", "المحكمة", "الأطراف", "التفاصيل"];

function NewCasePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTrialExpired, limits } = useTrial();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF((p) => ({ ...p, [k]: v }));
  }

  const canNext =
    step === 0
      ? f.title.trim().length > 0 && f.case_type.length > 0
      : step === 1
        ? true
        : step === 2
          ? true
          : true;

  const submit = async () => {
    if (!user) return;
    if (isTrialExpired) {
      setError(
        "انتهت الفترة التجريبية. يرجى تفعيل الاشتراك المميز بالرمز الترويجي EGYPT أو تنشيط الباقة من الشريط العلوي لتتمكن من إنشاء قضايا جديدة.",
      );
      return;
    }

    const { count, error: countErr } = await supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null);

    if (!countErr && typeof count === "number" && count >= limits.maxCases) {
      setError(
        `خطتك الحالية محدودة بـ (${limits.maxCases} قضايا نشطة كحد أقصى). لقد وصلت للحد الأقصى. يرجى ترقيتك إلى الباقة الأساسية أو الاحترافية للتمكن من إدارة المزيد من القضايا.`,
      );
      return;
    }

    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from("cases")
      .insert({
        user_id: user.id,
        title: f.title.trim(),
        case_type: f.case_type || null,
        case_number: f.case_number.trim() || null,
        court_name: f.court_name.trim() || null,
        circuit_name: f.circuit_name.trim() || null,
        client_name: f.client_name.trim() || null,
        opponent_name: f.opponent_name.trim() || null,
        first_session_date: f.first_session_date || null,
        description: f.description.trim() || null,
        status: "جديدة",
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    await createNotification({
      user_id: user.id,
      type: "تحديث قضية",
      title: `قضية جديدة: ${f.title.trim()}`,
      message: f.court_name ? `تمت إضافة القضية في ${f.court_name}` : "تمت إضافة القضية بنجاح.",
      related_case_id: data.id,
      priority: "عادي",
    });
    if (f.first_session_date) {
      await ensureFirstSession({
        caseId: data.id,
        userId: user.id,
        firstSessionDate: f.first_session_date,
        courtName: f.court_name.trim() || null,
      });
      await recomputeCaseStatus(data.id);
    }
    navigate({ to: "/cases/$caseId", params: { caseId: data.id } });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <Link to="/cases" className="text-sm text-muted-foreground">
          إلغاء
        </Link>
        <h1 className="font-display text-lg font-semibold text-foreground">قضية جديدة</h1>
        <span className="w-12 text-xs text-muted-foreground text-left">
          {step + 1}/{STEPS.length}
        </span>
      </header>

      {/* Progress bar */}
      <div className="flex gap-1.5">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step
                ? "bg-gradient-to-l from-[var(--gold-soft)] to-[var(--gold)]"
                : "bg-secondary",
            )}
          />
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">{STEPS[step]}</p>

      <div className="space-y-4">
        {step === 0 && (
          <>
            <div className="space-y-2">
              <label className="block text-sm text-muted-foreground">نوع القضية</label>
              <div className="grid grid-cols-2 gap-2">
                {CASE_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("case_type", t)}
                    className={cn(
                      "h-12 rounded-xl border text-sm transition-colors",
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
              placeholder="مثال: شركة النيل ضد المقاول العام"
              value={f.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </>
        )}

        {step === 1 && (
          <>
            <PremiumInput
              label="رقم القضية"
              placeholder="مثال: 2457 / 2025"
              value={f.case_number}
              onChange={(e) => set("case_number", e.target.value)}
            />
            <PremiumInput
              label="المحكمة"
              placeholder="مثال: محكمة جنوب القاهرة الابتدائية"
              value={f.court_name}
              onChange={(e) => set("court_name", e.target.value)}
            />
            <PremiumInput
              label="الدائرة"
              placeholder="مثال: الدائرة 12 تجاري"
              value={f.circuit_name}
              onChange={(e) => set("circuit_name", e.target.value)}
            />
          </>
        )}

        {step === 2 && (
          <>
            <PremiumInput
              label="اسم الموكل"
              placeholder="الموكل الذي تمثله"
              value={f.client_name}
              onChange={(e) => set("client_name", e.target.value)}
            />
            <PremiumInput
              label="اسم الخصم"
              placeholder="الطرف الآخر في القضية"
              value={f.opponent_name}
              onChange={(e) => set("opponent_name", e.target.value)}
            />
          </>
        )}

        {step === 3 && (
          <>
            <PremiumInput
              label="تاريخ أول جلسة"
              type="date"
              value={f.first_session_date}
              onChange={(e) => set("first_session_date", e.target.value)}
            />
            <div className="space-y-2">
              <label className="block text-sm text-muted-foreground">وصف مختصر</label>
              <textarea
                value={f.description}
                onChange={(e) => set("description", e.target.value)}
                rows={5}
                placeholder="ملاحظات أو ملخص الموضوع"
                className="w-full rounded-xl border border-border bg-card p-4 text-base text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[var(--gold)]"
              />
            </div>
          </>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <PremiumButton variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
            <ArrowRight className="ml-2 h-4 w-4" /> السابق
          </PremiumButton>
        )}
        {step < STEPS.length - 1 ? (
          <PremiumButton
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
            className="flex-1"
          >
            التالي <ArrowLeft className="mr-2 h-4 w-4" />
          </PremiumButton>
        ) : (
          <PremiumButton loading={saving} onClick={submit} className="flex-1">
            حفظ القضية <Check className="mr-2 h-4 w-4" />
          </PremiumButton>
        )}
      </div>
    </div>
  );
}
