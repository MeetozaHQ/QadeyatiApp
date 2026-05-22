export const PAYMENT_STATUSES = ["مدفوع", "جزئي", "متأخر", "غير مدفوع"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_STYLES: Record<string, string> = {
  مدفوع: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  جزئي: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  متأخر: "bg-red-500/10 text-red-300 border-red-500/30",
  "غير مدفوع": "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",
};

export const INSTALLMENT_STATUSES = ["مدفوع", "متأخر", "غير مدفوع"] as const;

export function fmtEGP(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return `${v.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`;
}

export function computeStatus(
  total: number,
  paid: number,
  hasOverdue: boolean,
): "مدفوع" | "جزئي" | "متأخر" | "غير مدفوع" {
  if (total > 0 && paid >= total) return "مدفوع";
  if (hasOverdue) return "متأخر";
  if (paid > 0) return "جزئي";
  return "غير مدفوع";
}

interface MinimalPayment {
  paid_amount: number;
  total_amount: number;
}

interface MinimalInstallment {
  status: string;
  due_date: string | null;
  amount: number;
}

export function computeFinanceStats(
  payments: MinimalPayment[],
  installments: MinimalInstallment[],
) {
  const today = new Date().toISOString().slice(0, 10);
  const collected = payments.reduce((sum, p) => sum + Number(p.paid_amount ?? 0), 0);
  const remaining = payments.reduce(
    (sum, p) => sum + Math.max(Number(p.total_amount ?? 0) - Number(p.paid_amount ?? 0), 0),
    0,
  );
  const overdueTotal = installments.reduce((sum, ins) => {
    const isOverdue = ins.status !== "مدفوع" && ins.due_date && ins.due_date < today;
    return sum + (isOverdue ? Number(ins.amount ?? 0) : 0);
  }, 0);
  return { collected, remaining, overdueTotal };
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const clean = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function reminderMessage(opts: {
  clientName: string;
  amount?: number;
  dueDate?: string | null;
  caseTitle?: string | null;
}): string {
  const parts = [
    `السيد/ة ${opts.clientName}،`,
    `تذكير ودّي بخصوص القسط المستحق${opts.caseTitle ? ` لقضية: ${opts.caseTitle}` : ""}.`,
  ];
  if (opts.amount) parts.push(`المبلغ: ${fmtEGP(opts.amount)}`);
  if (opts.dueDate) parts.push(`تاريخ الاستحقاق: ${opts.dueDate}`);
  parts.push("نشكر تعاونكم.");
  return parts.join("\n");
}
