import { useEffect, useState } from "react";
import { Plus, Calendar, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PremiumButton } from "./PremiumButton";
import { PremiumInput } from "./PremiumInput";
import { EmptyState } from "./EmptyState";
import { recomputeCaseStatus, SESSION_OUTCOMES } from "@/lib/case-status";

interface Session {
  id: string;
  session_date: string;
  session_type: string | null;
  outcome: string | null;
  notes: string | null;
}

export function SessionsTab({
  caseId,
  userId,
  onChange,
}: {
  caseId: string;
  userId: string;
  onChange?: () => void;
}) {
  const [items, setItems] = useState<Session[] | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ session_date: "", session_type: "", outcome: "", notes: "" });

  const load = () => {
    supabase
      .from("sessions")
      .select("id,session_date,session_type,outcome,notes")
      .eq("case_id", caseId)
      .order("session_date", { ascending: false })
      .then(({ data }) => setItems((data as Session[]) ?? []));
  };

  useEffect(load, [caseId]);

  const add = async () => {
    if (!form.session_date) return;
    setSaving(true);
    const payload = {
      session_date: new Date(form.session_date).toISOString(),
      session_type: form.session_type || null,
      outcome: form.outcome || null,
      notes: form.notes || null,
    };
    if (editingId) {
      await supabase.from("sessions").update(payload).eq("id", editingId);
    } else {
      await supabase.from("sessions").insert({ case_id: caseId, user_id: userId, ...payload });
    }
    await recomputeCaseStatus(caseId);
    setSaving(false);
    setForm({ session_date: "", session_type: "", outcome: "", notes: "" });
    setEditingId(null);
    setOpen(false);
    load();
    onChange?.();
  };

  const startEdit = (s: Session) => {
    setEditingId(s.id);
    setForm({
      session_date: new Date(s.session_date).toISOString().slice(0, 16),
      session_type: s.session_type ?? "",
      outcome: s.outcome ?? "",
      notes: s.notes ?? "",
    });
    setOpen(true);
  };

  const remove = async (id: string) => {
    if (!confirm("حذف الجلسة؟")) return;
    await supabase.from("sessions").delete().eq("id", id);
    await recomputeCaseStatus(caseId);
    load();
    onChange?.();
  };

  return (
    <div className="space-y-4">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--gold)]/40 bg-card/40 py-3 text-sm text-[var(--gold-soft)] hover:bg-[var(--gold)]/5"
        >
          <Plus className="h-4 w-4" /> إضافة جلسة
        </button>
      )}

      {open && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <PremiumInput
            label="تاريخ الجلسة"
            type="datetime-local"
            value={form.session_date}
            onChange={(e) => setForm({ ...form, session_date: e.target.value })}
          />
          <PremiumInput
            label="نوع الجلسة"
            placeholder="مرافعة، مداولة، حكم"
            value={form.session_type}
            onChange={(e) => setForm({ ...form, session_type: e.target.value })}
          />
          <div className="space-y-1.5">
            <label className="block text-xs text-muted-foreground">النتيجة</label>
            <div className="grid grid-cols-2 gap-2">
              {SESSION_OUTCOMES.map((o) => {
                const active = form.outcome === o;
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setForm({ ...form, outcome: active ? "" : o })}
                    className={
                      "rounded-lg border px-2 py-2 text-xs transition-colors " +
                      (active
                        ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]"
                        : "border-border text-foreground hover:border-[var(--gold)]/40")
                    }
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="ملاحظات الجلسة"
            className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[var(--gold)]"
          />
          <div className="flex gap-2">
            <PremiumButton
              variant="outline"
              onClick={() => {
                setOpen(false);
                setEditingId(null);
                setForm({ session_date: "", session_type: "", outcome: "", notes: "" });
              }}
              className="flex-1"
            >
              إلغاء
            </PremiumButton>
            <PremiumButton loading={saving} onClick={add} className="flex-1">
              حفظ
            </PremiumButton>
          </div>
        </div>
      )}

      {items === null ? (
        <div className="h-24 animate-pulse rounded-2xl border border-border bg-card/50" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-7 w-7" />}
          title="لا توجد جلسات"
          description="أضف أول جلسة لهذه القضية."
        />
      ) : (
        <ol className="relative space-y-4 border-r-2 border-[var(--gold)]/30 pr-5">
          {items.map((s) => (
            <li key={s.id} className="relative">
              <span className="absolute -right-[27px] top-1.5 h-3 w-3 rounded-full bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold)] shadow-gold" />
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-[var(--gold-soft)]">
                    {new Date(s.session_date).toLocaleString("ar-EG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <div className="flex gap-3 text-muted-foreground">
                    <button aria-label="تعديل" onClick={() => startEdit(s)}>
                      <Pencil className="h-4 w-4 hover:text-foreground" />
                    </button>
                    <button aria-label="حذف" onClick={() => remove(s.id)}>
                      <Trash2 className="h-4 w-4 hover:text-destructive" />
                    </button>
                  </div>
                </div>
                {s.session_type && (
                  <p className="mt-1 text-sm font-semibold text-foreground">{s.session_type}</p>
                )}
                {s.outcome && <p className="mt-2 text-sm text-foreground">{s.outcome}</p>}
                {s.notes && (
                  <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                    {s.notes}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
