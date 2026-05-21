import { supabase } from "@/integrations/supabase/client";

/**
 * Ensure a "أول جلسة" session row exists for a case when `first_session_date` is set.
 * Idempotent: only inserts if no session with session_type = "أول جلسة" exists yet.
 */
export async function ensureFirstSession(params: {
  caseId: string;
  userId: string;
  firstSessionDate: string | null;
  courtName?: string | null;
}): Promise<void> {
  const { caseId, userId, firstSessionDate, courtName } = params;
  if (!firstSessionDate) return;

  const { data: existing } = await supabase
    .from("sessions")
    .select("id")
    .eq("case_id", caseId)
    .eq("session_type", "أول جلسة")
    .maybeSingle();
  if (existing) return;

  // Normalise to ISO timestamp at 09:00 local — most sessions start in the morning
  const iso = new Date(`${firstSessionDate}T09:00:00`).toISOString();

  await supabase.from("sessions").insert({
    case_id: caseId,
    user_id: userId,
    session_date: iso,
    session_type: "أول جلسة",
    court_name: courtName ?? null,
  });
}
