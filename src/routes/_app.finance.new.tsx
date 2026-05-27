import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { PremiumInput } from "@/components/qadeyti/PremiumInput";
import { PremiumButton } from "@/components/qadeyti/PremiumButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTrial } from "@/hooks/use-trial";
import { computeStatus } from "@/lib/finance-constants";

export const Route = createFileRoute("/_app/finance/new")({
  component: NewPaymentPage,
});

type CaseOpt = { id: string; title: string; client_name: string | null };

function NewPaymentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { limits } = useTrial();
  const [cases, setCases] = useState<CaseOpt[]>([]);
  const [caseId, setCaseId] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [total, setTotal] = useState("");
  const [paid, setPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!limits.hasFinancials) return;
    supabase
      .from("cases")
      .select("id,title,client_name")
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .then(({ data }) => setCases((data as CaseOpt[]) ?? []));
  }, [limits.hasFinancials]);

  const onPickCase = (id: string) => {
    setCaseId(id);
    const c = cases.find((x) => x.id === id);
    if (c?.client_name && !clientName) setClientName(c.client_name);
  };

  const submit = async () => {
    if (!user) return;
    if (!clientName.trim()) {
      setError("اسم الموكل مطلوب");
      return;
    }
    const t = Number(total) || 0;
    const p = Number(paid) || 0;
    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        case_id: caseId || null,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim() || null,
        total_amount: t,
        paid_amount: p,
        payment_status: computeStatus(t, p, false),
        notes: notes.trim() || null,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/finance/$paymentId", params: { paymentId: data.id } });
  };

  if (!limits.hasFinancials) {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-4 text-center max-w-md mx-auto h-[70vh] space-y-6">
        <div className="bg-[var(--gold)]/15 border border-[var(--gold)]/30 rounded-2xl p-4 text-[var(--gold-soft)] shadow-md">
          <Lock className="h-10 w-10 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-foreground">
            الوصول للميزات المالية مقيد
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed font-sans">
            إضافة الدفعات المالية وتتبع مستحقات الموكلين هي ميزة مخصصة لمشتركي الباقة الفردية أو
            المكاتب القانونية.
          </p>
        </div>
        <Link
          to="/finance"
          className="rounded-xl border border-border bg-slate-900/40 px-5 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold"
        >
          العودة لوحة التحكم المالي
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <Link to="/finance" className="text-sm text-muted-foreground">
          إلغاء
        </Link>
        <h1 className="font-display text-lg font-semibold text-foreground">دفعة جديدة</h1>
        <span className="w-12" />
      </header>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm text-muted-foreground">القضية (اختياري)</label>
          <select
            value={caseId}
            onChange={(e) => onPickCase(e.target.value)}
            className="h-14 w-full rounded-xl border border-border bg-card px-4 text-base text-foreground outline-none focus:border-[var(--gold)]"
          >
            <option value="">— بدون ربط —</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <PremiumInput
          label="اسم الموكل"
          placeholder="مثال: أحمد محمد"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
        <PremiumInput
          label="رقم واتساب (اختياري)"
          placeholder="مثال: 201001234567"
          inputMode="tel"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
        />
        <PremiumInput
          label="إجمالي الأتعاب (ج.م)"
          placeholder="0"
          inputMode="decimal"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />
        <PremiumInput
          label="المدفوع الآن (ج.م)"
          placeholder="0"
          inputMode="decimal"
          value={paid}
          onChange={(e) => setPaid(e.target.value)}
        />

        <div className="space-y-2">
          <label className="block text-sm text-muted-foreground">ملاحظات</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-card p-4 text-base text-foreground outline-none focus:border-[var(--gold)]"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
            {error}
          </p>
        )}

        <PremiumButton loading={saving} onClick={submit}>
          حفظ <Check className="mr-2 h-4 w-4" />
        </PremiumButton>
      </div>
    </div>
  );
}
