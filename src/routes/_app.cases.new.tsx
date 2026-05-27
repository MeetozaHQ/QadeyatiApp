import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, AlertCircle, FileText, Scale, User, Mail, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useTrial } from "@/hooks/use-trial";

export const Route = createFileRoute("/_app/cases/new")({
  component: NewCasePage,
});

interface FormState {
  title: string;
  case_number: string;
  court_name: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  notes: string;
}

const initial: FormState = {
  title: "",
  case_number: "",
  court_name: "",
  client_name: "",
  client_email: "",
  client_phone: "",
  notes: "",
};

function NewCasePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTrialExpired, limits } = useTrial();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

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
        title: f.title,
        case_number: f.case_number || null,
        court_name: f.court_name || null,
        notes: f.notes || null,
      })
      .select()
      .single();

    if (error) {
      setError("فشل في إنشاء القضية. يرجى المحاولة مرة أخرى.");
      setSaving(false);
      return;
    }

    if (f.client_name) {
      await supabase.from("contacts").insert({
        user_id: user.id,
        case_id: data.id,
        full_name: f.client_name,
        email: f.client_email || null,
        phone_number: f.client_phone || null,
        role: "خصم / موكل",
      });
    }

    setStep(2);
    setSaving(false);
  };

  return (
    <div className="space-y-6" dir="rtl text-right">
      <div className="flex items-center gap-3">
        <button
          onClick={() => (step === 1 ? setStep(0) : navigate({ to: "/cases" }))}
          className="rounded-xl border border-slate-900 bg-secondary p-2.5 text-slate-400 hover:text-white"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-lg font-bold text-foreground">إضافة قضية جديدة</h1>
          <p className="text-xs text-muted-foreground">قم بإدخال بيانات الدعوى والعميل المرتبط بها</p>
        </div>
      </div>

      {/* Progress timeline indicator */}
      {step < 2 && (
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-1.5 rounded-full bg-[var(--gold)]" />
          <div className={`flex-1 h-1.5 rounded-full ${step === 1 ? "bg-[var(--gold)]" : "bg-slate-900"}`} />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 text-right">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--gold-soft)] border-b border-border pb-3 mb-1">
              <Scale className="h-4 w-4" />
              <span>تفاصيل الملف القضائي والدعوى</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">موضوع أو عنوان القضية *</label>
              <input
                type="text"
                value={f.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="مثال: دعوى فسخ عقد إيجار المحل"
                className="w-full rounded-xl border border-slate-800 bg-[#0C101A] px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:border-[var(--gold)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 font-sans">رقم القضية / الجدول</label>
                <input
                  type="text"
                  value={f.case_number}
                  onChange={(e) => set("case_number", e.target.value)}
                  placeholder="مثال: ١٢٩٤ لسنة ٢٠٢٦"
                  className="w-full rounded-xl border border-slate-800 bg-[#0C101A] px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:border-[var(--gold)] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">المحكمة المختصة</label>
                <input
                  type="text"
                  value={f.court_name}
                  onChange={(e) => set("court_name", e.target.value)}
                  placeholder="محكمة شمال القاهرة"
                  className="w-full rounded-xl border border-slate-800 bg-[#0C101A] px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:border-[var(--gold)] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">ملخص أو مذكرات تمهيدية</label>
              <textarea
                value={f.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
                placeholder="تفاصيل الدعوى، الدفوع المبدئية أو الملاحظات الهامة..."
                className="w-full rounded-xl border border-slate-800 bg-[#0C101A] px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:border-[var(--gold)] focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => {
              if (!f.title.trim()) {
                setError("يرجى إدخال عنوان القضية الأساسي للمتابعة.");
                return;
              }
              setError(null);
              setStep(1);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[var(--gold)] to-[var(--accent)] text-black font-bold py-3.5 text-xs hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>الخطوة التالية (بيانات العميل)</span>
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 text-right">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--gold-soft)] border-b border-border pb-3 mb-1">
              <User className="h-4 w-4" />
              <span>معلومات العميل أو صاحب القضية</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">اسم الموكل كامل</label>
              <input
                type="text"
                value={f.client_name}
                onChange={(e) => set("client_name", e.target.value)}
                placeholder="مثال: ممدوح عبد الرحمن الشاذلي"
                className="w-full rounded-xl border border-slate-800 bg-[#0C101A] px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:border-[var(--gold)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={f.client_email}
                  onChange={(e) => set("client_email", e.target.value)}
                  placeholder="name@server.com"
                  className="w-full rounded-xl border border-slate-800 bg-[#0C101A] px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:border-[var(--gold)] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">رقم الهاتف الجوال</label>
                <input
                  type="text"
                  value={f.client_phone}
                  onChange={(e) => set("client_phone", e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full rounded-xl border border-slate-800 bg-[#0C101A] px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:border-[var(--gold)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="flex-1 rounded-2xl bg-secondary border border-border py-3.5 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
            >
              السابق
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[var(--gold)] to-[var(--accent)] text-black font-bold py-3.5 text-xs hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer"
            >
              {saving ? "جاري الحفظ والإنشاء..." : "إنشاء وحفظ القضية"}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center space-y-5 animate-in fade-in zoom-in duration-300">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <Check className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">تم إنشاء القضية والملف بنجاح!</h3>
            <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              لقد سجلنا القضية وفتحنا ملف إلكتروني متكامل. يمكنك الآن البدء في صياغة الجلسات وتتبع المواعيد وربط المستندات بـ Google Drive.
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/cases" })}
            className="rounded-2xl bg-emerald-500 text-black px-8 py-3.5 text-xs font-bold hover:bg-emerald-400 active:scale-[0.98] transition-all cursor-pointer"
          >
            الانتقال لقائمة الملفات والقضايا
          </button>
        </div>
      )}
    </div>
  );
}