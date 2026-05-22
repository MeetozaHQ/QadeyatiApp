import { supabase } from "@/integrations/supabase/client";

// Outcome strings that map directly to a case status.
const OUTCOME_TO_STATUS: Record<string, string> = {
  مؤجلة: "مؤجلة",
  "محجوزة للحكم": "محجوزة للحكم",
  "صدر حكم": "صدر حكم",
};

export const SESSION_OUTCOMES = ["مؤجلة", "محجوزة للحكم", "صدر حكم", "أخرى"] as const;

/**
 * Recompute the case status from its sessions:
 * - If a future session exists → "جلسة قادمة"
 * - Else map latest past session outcome → status
 * - Else leave as-is.
 * Terminal statuses ("صدر حكم", "مغلقة") are not overwritten by future sessions.
 */
export async function recomputeCaseStatus(caseId: string): Promise<void> {
  const { data: caseRow } = await supabase
    .from("cases")
    .select("status")
    .eq("id", caseId)
    .maybeSingle();
  if (!caseRow) return;

  // Protect terminal/inactive statuses ("صدر حكم", "مغلقة") from being automatically overwritten
  if (caseRow.status === "صدر حكم" || caseRow.status === "مغلقة") {
    return;
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("session_date,outcome")
    .eq("case_id", caseId)
    .order("session_date", { ascending: false });

  const list = sessions ?? [];
  const now = Date.now();
  const future = list.filter((s) => new Date(s.session_date).getTime() > now);
  const past = list.filter((s) => new Date(s.session_date).getTime() <= now);

  let next: string | null = null;

  if (future.length > 0) {
    next = "جلسة قادمة";
  } else if (past.length > 0) {
    const outcome = past[0].outcome?.trim() ?? "";
    if (OUTCOME_TO_STATUS[outcome]) next = OUTCOME_TO_STATUS[outcome];
  }

  if (next && next !== caseRow.status) {
    await supabase.from("cases").update({ status: next }).eq("id", caseId);
  }
}
