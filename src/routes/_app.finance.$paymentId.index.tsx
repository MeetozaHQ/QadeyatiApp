import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Plus, Trash2, Check, Printer, MessageCircle, Pencil } from "lucide-react";
import { PremiumButton } from "@/components/qadeyti/PremiumButton";
import { PremiumInput } from "@/components/qadeyti/PremiumInput";
import { EmptyState } from "@/components/qadeyti/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  PAYMENT_STATUS_STYLES,
  computeStatus,
  fmtEGP,
  buildWhatsAppLink,
  reminderMessage,
} from "@/lib/finance-constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/finance/$paymentId/")({
  component: PaymentDetailPage,
});

type Payment = {
  id: string;
  client_name: string;
  client_phone: string | null;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  notes: string | null;
  case_id: string | null;
  created_at: string;
  cases?: { title: string | null } | null;
};

type Installment = {
  id: string;
  amount: number;
  due_date: string | null;
  status: string;
  paid_at: string | null;
};

function PaymentDetailPage() {
  const { paymentId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [iAmount, setIAmount] = useState("");
  const [iDue, setIDue] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);

  const load = useCallback(async () => {
    const { data: p } = await supabase
      .from("payments")
      .select("*,cases(title)")
      .eq("id", paymentId)
      .maybeSingle();
    setPayment(p as unknown as Payment);
    const { data: ins } = await supabase
      .from("payment_installments")
      .select("*")
      .eq("payment_id", paymentId)
      .order("due_date", { ascending: true });
    setInstallments((ins as Installment[]) ?? []);
  }, [paymentId]);

  useEffect(() => {
    load();
  }, [load]);

  const recalc = async (rows: Installment[], basePaid?: number) => {
    if (!payment) return;
    const today = new Date().toISOString().slice(0, 10);
    const hasOverdue = rows.some((r) => r.status !== "مدفوع" && r.due_date && r.due_date < today);
    const paid = basePaid ?? Number(payment.paid_amount);
    const status = computeStatus(Number(payment.total_amount), paid, hasOverdue);
    if (status !== payment.payment_status || paid !== Number(payment.paid_amount)) {
      await supabase
        .from("payments")
        .update({ payment_status: status, paid_amount: paid })
        .eq("id", payment.id);
    }
  };

  const addInstallment = async () => {
    if (!user || !payment) return;
    const amt = Number(iAmount) || 0;
    if (amt <= 0) return;
    if (editingId) {
      await supabase
        .from("payment_installments")
        .update({ amount: amt, due_date: iDue || null })
        .eq("id", editingId);
    } else {
      await supabase.from("payment_installments").insert({
        payment_id: payment.id,
        user_id: user.id,
        amount: amt,
        due_date: iDue || null,
        status: "غير مدفوع",
      });
    }
    setIAmount("");
    setIDue("");
    setShowAdd(false);
    setEditingId(null);
    await load();
  };

  const togglePaid = async (i: Installment) => {
    const nextStatus = i.status === "مدفوع" ? "غير مدفوع" : "مدفوع";
    const paidAt = nextStatus === "مدفوع" ? new Date().toISOString() : null;
    await supabase
      .from("payment_installments")
      .update({ status: nextStatus, paid_at: paidAt })
      .eq("id", i.id);
    const updated = installments.map((x) =>
      x.id === i.id ? { ...x, status: nextStatus, paid_at: paidAt } : x,
    );
    setInstallments(updated);
    const delta = (nextStatus === "مدفوع" ? 1 : -1) * Number(i.amount);
    const newPaid = Math.max(Number(payment?.paid_amount ?? 0) + delta, 0);
    await recalc(updated, newPaid);
    await load();
  };

  const removeInstallment = async (id: string) => {
    if (!confirm("حذف هذا القسط؟")) return;
    await supabase.from("payment_installments").delete().eq("id", id);
    await load();
  };

  const deletePayment = async () => {
    if (!payment) return;
    if (!confirm("حذف الدفعة نهائيًا؟")) return;
    await supabase.from("payments").delete().eq("id", payment.id);
    navigate({ to: "/finance" });
  };

  if (!payment) {
    return <p className="text-center text-sm text-muted-foreground">جاري التحميل...</p>;
  }

  const remaining = Math.max(Number(payment.total_amount) - Number(payment.paid_amount), 0);
  const statusStyle =
    PAYMENT_STATUS_STYLES[payment.payment_status] ??
    "bg-secondary text-muted-foreground border-border";

  if (showReceipt) {
    return <Receipt payment={payment} onClose={() => setShowReceipt(false)} />;
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <Link to="/finance" className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowRight className="h-4 w-4" /> رجوع
        </Link>
        <button onClick={deletePayment} className="text-sm text-red-400">
          حذف
        </button>
      </header>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold text-foreground">
              {payment.client_name}
            </h1>
            {payment.cases?.title && (
              <p className="mt-1 text-sm text-muted-foreground">{payment.cases.title}</p>
            )}
          </div>
          <span className={cn("rounded-lg border px-2.5 py-1 text-xs font-medium", statusStyle)}>
            {payment.payment_status}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[11px] text-muted-foreground">الإجمالي</p>
            <p className="font-display text-base font-semibold text-foreground">
              {fmtEGP(payment.total_amount)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">المدفوع</p>
            <p className="font-display text-base font-semibold text-emerald-300">
              {fmtEGP(payment.paid_amount)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">المتبقي</p>
            <p className="font-display text-base font-semibold text-[var(--gold-soft)]">
              {fmtEGP(remaining)}
            </p>
          </div>
        </div>

        {payment.notes && (
          <p className="mt-4 rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
            {payment.notes}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <PremiumButton variant="outline" onClick={() => setShowReceipt(true)}>
            <Printer className="ml-2 h-4 w-4" /> إيصال
          </PremiumButton>
          {payment.client_phone ? (
            <a
              href={buildWhatsAppLink(
                payment.client_phone,
                reminderMessage({
                  clientName: payment.client_name,
                  amount: remaining,
                  caseTitle: payment.cases?.title ?? null,
                }),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-6 font-display text-base font-semibold text-emerald-300"
            >
              <MessageCircle className="ml-2 h-4 w-4" /> تذكير
            </a>
          ) : (
            <PremiumButton variant="outline" disabled title="أضف رقم واتساب">
              <MessageCircle className="ml-2 h-4 w-4" /> تذكير
            </PremiumButton>
          )}
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">الأقساط</h2>
          <button
            onClick={() => {
              setShowAdd(true);
              setEditingId(null);
              setIAmount("");
              setIDue("");
            }}
            className="flex h-9 items-center gap-1 rounded-lg border border-[var(--gold)]/40 px-3 text-xs text-[var(--gold-soft)]"
          >
            <Plus className="h-3.5 w-3.5" /> إضافة
          </button>
        </div>

        {showAdd && (
          <div className="space-y-3 rounded-2xl border border-[var(--gold)]/30 bg-card p-4">
            <PremiumInput
              label="المبلغ (ج.م)"
              inputMode="decimal"
              value={iAmount}
              onChange={(e) => setIAmount(e.target.value)}
            />
            <PremiumInput
              label="تاريخ الاستحقاق"
              type="date"
              value={iDue}
              onChange={(e) => setIDue(e.target.value)}
            />
            <div className="flex gap-2">
              <PremiumButton
                variant="outline"
                onClick={() => {
                  setShowAdd(false);
                  setEditingId(null);
                }}
              >
                إلغاء
              </PremiumButton>
              <PremiumButton onClick={addInstallment}>{editingId ? "تحديث" : "حفظ"}</PremiumButton>
            </div>
          </div>
        )}

        {installments.length === 0 && !showAdd ? (
          <EmptyState title="لا توجد أقساط" description="أضف أقساطًا لتتبع الدفعات الجزئية." />
        ) : (
          <ul className="space-y-2">
            {installments.map((i) => {
              const today = new Date().toISOString().slice(0, 10);
              const overdue = i.status !== "مدفوع" && i.due_date && i.due_date < today;
              const paid = i.status === "مدفوع";
              return (
                <li
                  key={i.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border bg-card p-3",
                    paid
                      ? "border-emerald-500/30"
                      : overdue
                        ? "border-red-500/40"
                        : "border-border",
                  )}
                >
                  <button
                    onClick={() => togglePaid(i)}
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                      paid
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                        : "border-border text-muted-foreground",
                    )}
                    aria-label="تبديل الحالة"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn("font-semibold", paid ? "text-emerald-300" : "text-foreground")}
                    >
                      {fmtEGP(i.amount)}
                    </p>
                    <p
                      className={cn("text-xs", overdue ? "text-red-300" : "text-muted-foreground")}
                    >
                      {i.due_date ? `استحقاق ${i.due_date}` : "بدون تاريخ"}
                      {overdue && " · متأخر"}
                      {paid && i.paid_at && ` · دُفع`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingId(i.id);
                      setIAmount(String(i.amount));
                      setIDue(i.due_date ?? "");
                      setShowAdd(true);
                    }}
                    className="p-2 text-muted-foreground hover:text-foreground"
                    aria-label="تعديل"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeInstallment(i.id)}
                    className="p-2 text-muted-foreground hover:text-red-400"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Receipt({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const today = new Date().toLocaleDateString("ar-EG");
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between print:hidden">
        <button onClick={onClose} className="text-sm text-muted-foreground">
          رجوع
        </button>
        <PremiumButton onClick={() => window.print()} className="w-auto px-4">
          <Printer className="ml-2 h-4 w-4" /> طباعة
        </PremiumButton>
      </header>

      <div className="rounded-2xl border-2 border-[var(--gold)]/40 bg-card p-6 print:border-black print:bg-white print:text-black">
        <div className="border-b border-border pb-4 text-center print:border-black">
          <h2 className="font-display text-2xl font-bold text-[var(--gold-soft)] print:text-black">
            قضيتي
          </h2>
          <p className="mt-1 text-xs text-muted-foreground print:text-black">مكتب المحاماة</p>
        </div>

        <h3 className="mt-5 text-center font-display text-lg font-semibold text-foreground print:text-black">
          إيصال استلام مبلغ
        </h3>

        <dl className="mt-5 space-y-3 text-sm">
          <Row label="التاريخ" value={today} />
          <Row label="الموكل" value={payment.client_name} />
          {payment.cases?.title && <Row label="القضية" value={payment.cases.title} />}
          <Row label="إجمالي الأتعاب" value={fmtEGP(payment.total_amount)} />
          <Row label="المبلغ المدفوع" value={fmtEGP(payment.paid_amount)} highlight />
          <Row
            label="المتبقي"
            value={fmtEGP(Math.max(Number(payment.total_amount) - Number(payment.paid_amount), 0))}
          />
        </dl>

        <div className="mt-8 flex justify-between text-xs text-muted-foreground print:text-black">
          <div className="border-t border-border pt-2 print:border-black">توقيع المحامي</div>
          <div className="border-t border-border pt-2 print:border-black">توقيع الموكل</div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 print:border-black/30">
      <dt className="text-muted-foreground print:text-black">{label}</dt>
      <dd
        className={cn(
          "font-semibold",
          highlight
            ? "text-[var(--gold-soft)] print:text-black"
            : "text-foreground print:text-black",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
