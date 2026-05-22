import { supabase } from "@/integrations/supabase/client";
import { computeStatus } from "./finance-constants";

export const NOTIFICATION_TYPES = [
  "جلسة قادمة",
  "قسط متأخر",
  "تحديث قضية",
  "جلسة اليوم",
  "تذكير مهم",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotificationPriority = "عادي" | "مهم" | "حرج";

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  related_case_id: string | null;
  related_payment_id: string | null;
  priority: string;
  is_read: boolean;
  created_at: string;
}

export const PRIORITY_STYLES: Record<string, string> = {
  عادي: "bg-secondary text-muted-foreground border-border",
  مهم: "bg-[var(--gold)]/10 text-[var(--gold-soft)] border-[var(--gold)]/40",
  حرج: "bg-red-500/10 text-red-300 border-red-500/30",
};

export function timeAgoArabic(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  const days = Math.floor(diff / 86400);
  if (days < 30) return `منذ ${days} يوم`;
  return new Date(iso).toLocaleDateString("ar-EG");
}

export async function createNotification(input: {
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  related_case_id?: string | null;
  related_payment_id?: string | null;
  priority?: NotificationPriority;
}) {
  return supabase.from("notifications").insert({
    user_id: input.user_id,
    type: input.type,
    title: input.title,
    message: input.message ?? null,
    related_case_id: input.related_case_id ?? null,
    related_payment_id: input.related_payment_id ?? null,
    priority: input.priority ?? "عادي",
  });
}

/**
 * Lightweight client-side reminder generator.
 * Scans upcoming sessions and overdue installments, then inserts notifications
 * that don't already exist for today. Cheap, runs once per app load.
 */
interface InstallmentWithDetails {
  id: string;
  payment_id: string;
  due_date: string | null;
  status: string;
  amount: number;
  payments: {
    client_name: string;
    case_id: string | null;
    cases: {
      title: string | null;
    } | null;
  } | null;
}

export async function syncReminders(userId: string) {
  try {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const in2Days = new Date(today.getTime() + 2 * 86400000).toISOString();
    const startToday = new Date(todayStr + "T00:00:00").toISOString();

    // 1. STAGE: Database Status Reconciliation
    const { data: dbPayments } = await supabase
      .from("payments")
      .select("id, total_amount, paid_amount, payment_status")
      .eq("user_id", userId);

    const { data: dbInstallments } = await supabase
      .from("payment_installments")
      .select("id, payment_id, due_date, status")
      .eq("user_id", userId);

    const paymentsList = dbPayments ?? [];
    const installmentsList = dbInstallments ?? [];

    for (const ins of installmentsList) {
      let correctInsStatus = ins.status;
      if (ins.status !== "مدفوع") {
        if (ins.due_date && ins.due_date < todayStr) {
          correctInsStatus = "متأخر";
        } else {
          correctInsStatus = "غير مدفوع";
        }
      }
      if (ins.status !== correctInsStatus) {
        await supabase
          .from("payment_installments")
          .update({ status: correctInsStatus })
          .eq("id", ins.id);
        ins.status = correctInsStatus;
      }
    }

    for (const p of paymentsList) {
      const pIns = installmentsList.filter((ins) => ins.payment_id === p.id);
      const hasOverdue = pIns.some((ins) => ins.status === "متأخر");
      const correctPayStatus = computeStatus(
        Number(p.total_amount),
        Number(p.paid_amount),
        hasOverdue,
      );
      if (p.payment_status !== correctPayStatus) {
        await supabase.from("payments").update({ payment_status: correctPayStatus }).eq("id", p.id);
        p.payment_status = correctPayStatus;
      }
    }

    // 2. STAGE: Sessions reminding
    // Existing notifications today (to dedupe)
    const { data: existing } = await supabase
      .from("notifications")
      .select("type, related_case_id, related_payment_id")
      .eq("user_id", userId)
      .gte("created_at", startToday);

    const seen = new Set(
      (existing ?? []).map(
        (n) => `${n.type}:${n.related_case_id ?? ""}:${n.related_payment_id ?? ""}`,
      ),
    );

    // Upcoming / today sessions
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, case_id, session_date")
      .eq("user_id", userId)
      .gte("session_date", startToday)
      .lte("session_date", in2Days);

    for (const s of sessions ?? []) {
      const d = new Date(s.session_date);
      const isToday = d.toISOString().slice(0, 10) === todayStr;
      const type: NotificationType = isToday ? "جلسة اليوم" : "جلسة قادمة";
      const key = `${type}:${s.case_id}:`;
      if (seen.has(key)) continue;
      const time = d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
      await createNotification({
        user_id: userId,
        type,
        title: isToday
          ? `جلسة اليوم الساعة ${time}`
          : `جلسة قادمة في ${d.toLocaleDateString("ar-EG")}`,
        message: isToday ? "لا تنسَ الاستعداد قبل الموعد." : "تذكير بجلسة قريبة.",
        related_case_id: s.case_id,
        priority: isToday ? "حرج" : "مهم",
      });
    }

    // 3. STAGE: Overdue Installments Reminding
    const { data: existingOverdue } = await supabase
      .from("notifications")
      .select("related_payment_id, message")
      .eq("user_id", userId)
      .eq("type", "قسط متأخر");

    const seenOverdue = new Set(
      (existingOverdue ?? []).map((n) => `${n.related_payment_id}:${n.message ?? ""}`),
    );

    const { data: inst } = await supabase
      .from("payment_installments")
      .select(
        "id, payment_id, due_date, status, amount, payments(client_name, case_id, cases(title))",
      )
      .eq("user_id", userId)
      .neq("status", "مدفوع")
      .lt("due_date", todayStr);

    for (const i of (inst as unknown as InstallmentWithDetails[]) ?? []) {
      const p = i.payments;
      const clientName = p?.client_name ?? "الموكل";
      const caseTitle = p?.cases?.title;
      const caseId = p?.case_id;

      let msg = "";
      if (caseTitle) {
        msg = `قسط مستحق على قضية ${caseTitle} بقيمة ${Number(i.amount).toLocaleString("ar-EG")} جنيه`;
      } else {
        msg = `قسط مستحق على ${clientName} بقيمة ${Number(i.amount).toLocaleString("ar-EG")} جنيه`;
      }

      const key = `${i.payment_id}:${msg}`;
      if (seenOverdue.has(key)) continue;

      await createNotification({
        user_id: userId,
        type: "قسط متأخر",
        title: "قسط متأخر",
        message: msg,
        related_payment_id: i.payment_id,
        related_case_id: caseId || null,
        priority: "حرج",
      });
    }
  } catch (err) {
    console.warn("syncReminders failed", err);
  }
}
