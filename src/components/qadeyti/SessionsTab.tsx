import { useEffect, useState } from "react";
import { Plus, Calendar, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PremiumButton } from "./PremiumButton";
import { PremiumInput } from "./PremiumInput";
import { EmptyState } from "./EmptyState";
import { recomputeCaseStatus, SESSION_OUTCOMES } from "@/lib/case-status";
import { createNotification } from "@/lib/notifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTrial } from "@/hooks/use-trial";

interface Session {
  id: string;
  session_date: string;
  session_type: string | null;
  outcome: string | null;
  notes: string | null;
  next_session_date: string | null;
  next_session_type: string | null;
  postponed_from_session_id: string | null;
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
  const { isTrialExpired } = useTrial();
  const [items, setItems] = useState<Session[] | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasExtendedSchema, setHasExtendedSchema] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    session_date: "",
    session_type: "",
    outcome: "",
    notes: "",
    next_session_date: "",
    next_session_type: "",
    next_session_notes: "",
  });

  const load = async () => {
    if (hasExtendedSchema !== false) {
      const { data, error } = await supabase
        .from("sessions")
        .select(
          "id,session_date,session_type,outcome,notes,next_session_date,next_session_type,postponed_from_session_id",
        )
        .eq("case_id", caseId)
        .order("session_date", { ascending: false });

      if (error) {
        console.warn("Extended columns load failed, checking schema cache:", error);
        const isColumnError =
          error.code === "PGRST200" ||
          error.message?.includes("next_session_date") ||
          error.message?.includes("column");

        if (isColumnError) {
          setHasExtendedSchema(false);
          // Fall back instantly to standard columns query
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("sessions")
            .select("id,session_date,session_type,outcome,notes")
            .eq("case_id", caseId)
            .order("session_date", { ascending: false });

          if (fallbackError) {
            console.error("Fallback query failed:", fallbackError);
            toast.error(fallbackError.message);
            setItems([]);
          } else {
            setItems((fallbackData as Session[]) ?? []);
          }
          return;
        } else {
          toast.error(error.message);
          setItems([]);
          return;
        }
      }

      setHasExtendedSchema(true);
      setItems((data as Session[]) ?? []);
    } else {
      const { data, error } = await supabase
        .from("sessions")
        .select("id,session_date,session_type,outcome,notes")
        .eq("case_id", caseId)
        .order("session_date", { ascending: false });

      if (error) {
        toast.error(error.message);
        setItems([]);
      } else {
        setItems((data as Session[]) ?? []);
      }
    }
  };

  useEffect(() => {
    load();
  }, [caseId, hasExtendedSchema]);

  const add = async () => {
    if (isTrialExpired && !editingId) {
      toast.error(
        "انتهت فترتكم التجريبية المجانية لـ قضيتي (٧ أيام). يرجى الاشتراك أو التنشيط مجانًا بالرمز الترويجي EGYPT بالشريط العلوي لتتمكن من إضافة جلسات جديدة.",
      );
      return;
    }

    if (!form.session_date) {
      toast.error("يرجى إدخال تاريخ الجلسة");
      return;
    }
    if (hasExtendedSchema && form.outcome === "مؤجلة" && !form.next_session_date) {
      toast.error("يرجى تحديد تاريخ الجلسة القادمة لتأجيل الجلسة");
      return;
    }

    setSaving(true);

    try {
      const payload: Record<string, string | null> = {
        session_date: new Date(form.session_date).toISOString(),
        session_type: form.session_type || null,
        outcome: form.outcome || null,
        notes: form.notes || null,
      };

      if (hasExtendedSchema) {
        payload.next_session_date =
          form.outcome === "مؤجلة" && form.next_session_date
            ? new Date(form.next_session_date).toISOString()
            : null;
        payload.next_session_type =
          form.outcome === "مؤجلة" && form.next_session_type ? form.next_session_type : null;
      }

      if (editingId) {
        // 1. Update original session
        await supabase.from("sessions").update(payload).eq("id", editingId);

        if (hasExtendedSchema) {
          if (form.outcome === "مؤجلة" && form.next_session_date) {
            // Check if future session already exists
            const { data: child } = await supabase
              .from("sessions")
              .select("id")
              .eq("postponed_from_session_id", editingId)
              .maybeSingle();

            const childPayload = {
              case_id: caseId,
              user_id: userId,
              session_date: new Date(form.next_session_date).toISOString(),
              session_type: form.next_session_type || null,
              notes: form.next_session_notes || null,
              postponed_from_session_id: editingId,
            };

            if (child) {
              await supabase.from("sessions").update(childPayload).eq("id", child.id);
            } else {
              await supabase.from("sessions").insert(childPayload);
            }
          } else {
            // If edited outcome is no longer postponed, clean up any automatic child session
            await supabase.from("sessions").delete().eq("postponed_from_session_id", editingId);
          }
        }
      } else {
        // 1. Insert fresh main session
        const { data: origSession, error: origError } = await supabase
          .from("sessions")
          .insert({
            case_id: caseId,
            user_id: userId,
            ...payload,
          })
          .select("id")
          .single();

        if (origError) throw origError;

        const isPostponed =
          hasExtendedSchema && form.outcome === "مؤجلة" && form.next_session_date && origSession;

        if (isPostponed && origSession) {
          // 2. Automatically create upcoming connected session
          await supabase.from("sessions").insert({
            case_id: caseId,
            user_id: userId,
            session_date: new Date(form.next_session_date).toISOString(),
            session_type: form.next_session_type || null,
            notes: form.next_session_notes || null,
            postponed_from_session_id: origSession.id,
          });

          // 3. Generate instant notification
          const { data: caseRow } = await supabase
            .from("cases")
            .select("title")
            .eq("id", caseId)
            .maybeSingle();

          const caseTitle = caseRow?.title || "القضية";
          const formattedDate = new Date(form.next_session_date).toLocaleDateString("ar-EG", {
            day: "numeric",
            month: "long",
          });

          await createNotification({
            user_id: userId,
            type: "جلسة قادمة",
            title: "تذكير بجلسة مؤجلة",
            message: `لديك جلسة مؤجلة في قضية ${caseTitle} بتاريخ ${formattedDate}`,
            related_case_id: caseId,
            priority: "مهم",
          });
        }
      }

      await recomputeCaseStatus(caseId);
      toast.success("تم حفظ الجلسة بنجاح");
      setOpen(false);
      setEditingId(null);
      setForm({
        session_date: "",
        session_type: "",
        outcome: "",
        notes: "",
        next_session_date: "",
        next_session_type: "",
        next_session_notes: "",
      });
      load();
      onChange?.();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "فشل حفظ الجلسة");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (s: Session) => {
    setEditingId(s.id);
    setForm({
      session_date: s.session_date ? new Date(s.session_date).toISOString().slice(0, 16) : "",
      session_type: s.session_type ?? "",
      outcome: s.outcome ?? "",
      notes: s.notes ?? "",
      next_session_date: s.next_session_date
        ? new Date(s.next_session_date).toISOString().slice(0, 16)
        : "",
      next_session_type: s.next_session_type ?? "",
      next_session_notes: "",
    });

    if (hasExtendedSchema && s.outcome === "مؤجلة") {
      supabase
        .from("sessions")
        .select("notes")
        .eq("postponed_from_session_id", s.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.notes) {
            setForm((prev) => ({ ...prev, next_session_notes: data.notes ?? "" }));
          }
        });
    }

    setOpen(true);
  };

  const remove = async (id: string) => {
    if (!confirm("حذف الجلسة؟")) return;
    if (hasExtendedSchema) {
      // Delete any connected future postponement sessions as well to keep timeline clean
      await supabase.from("sessions").delete().eq("postponed_from_session_id", id);
    }
    await supabase.from("sessions").delete().eq("id", id);
    await recomputeCaseStatus(caseId);
    load();
    onChange?.();
  };

  return (
    <div className="space-y-4">
      {hasExtendedSchema === false && (
        <div className="rounded-2xl border border-amber-500/35 bg-amber-500/5 p-4 text-xs text-amber-200 space-y-2">
          <p className="font-semibold flex items-center gap-1.5 text-amber-400">
            <span>⚠️</span>
            <span>{"تنبيه للمطور: تحديث جدول الجلسات (Sessions) مطلوب"}</span>
          </p>
          <p className="leading-relaxed opacity-90">
            {
              "قاعدة بيانات Supabase المخصصة الخاصة بك لا تحتوي على الأعمدة الإضافية لدعم ميزة التأجيل التلقائي والربط. يمكنك حفظ وتعديل الجلسات بشكل سليم، ولكن لتفعيل الجدولة التلقائية وتذكيرات الجلسة المؤجلة، يرجى نسخ وتشغيل الأمر التالي في "
            }
            <strong>SQL Editor</strong>
            {" داخل لوحة تحكم Supabase الخاصة بك:"}
          </p>
          <div className="relative mt-2 rounded-lg bg-black/40 p-2.5 font-mono text-[10px] text-amber-300 border border-amber-500/10">
            <pre className="overflow-x-auto whitespace-pre-wrap">
              {`ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS next_session_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS next_session_type text,
ADD COLUMN IF NOT EXISTS postponed_from_session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL;`}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS next_session_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS next_session_type text,
ADD COLUMN IF NOT EXISTS postponed_from_session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL;`);
                toast.success("تم نسخ كود SQL");
              }}
              className="absolute top-2 left-2 rounded bg-amber-500/15 hover:bg-amber-500/25 px-2 py-0.5 text-[9px] text-amber-400 transition-colors cursor-pointer"
            >
              {"نسخ الكود"}
            </button>
          </div>
        </div>
      )}

      {!open && (
        <button
          onClick={() => {
            if (isTrialExpired) {
              toast.error(
                "انتهت فترتكم التجريبية المجانية لـ قضيتي (٧ أيام). يرجى الاشتراك أو التنشيط مجانًا بالرمز الترويجي EGYPT بالشريط العلوي لتتمكن من إضافة جلسة جديدة.",
              );
              return;
            }
            setOpen(true);
          }}
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
                    className={cn(
                      "rounded-lg border px-2 py-2 text-xs transition-colors",
                      active
                        ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]"
                        : "border-border text-foreground hover:border-[var(--gold)]/40",
                    )}
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

          {form.outcome === "مؤجلة" &&
            (hasExtendedSchema === false ? (
              <div className="rounded-xl border border-dashed border-amber-500/20 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-300">
                {
                  '⚠️ ميزة الجدولة التلقائية لجلسة التأجيل معطلة لأن قاعدة البيانات مخصصة وتحتاج لتشغيل تحديث SQL المذكور أعلاه لتوفير الأعمدة اللازمة. سيتم حفظ خيار "مؤجلة" كحالة فقط للجلسة الحالية.'
                }
              </div>
            ) : (
              <div className="space-y-3 border-r-2 border-[var(--gold)]/40 pr-3 mr-1 my-2 py-1 animate-fade-in">
                <p className="text-xs font-semibold text-[var(--gold-soft)]">
                  تفاصيل الجلسة المؤجلة القادمة
                </p>
                <PremiumInput
                  label="تاريخ الجلسة القادمة"
                  type="datetime-local"
                  value={form.next_session_date}
                  onChange={(e) => setForm({ ...form, next_session_date: e.target.value })}
                />
                <PremiumInput
                  label="نوع الجلسة القادمة"
                  placeholder="مرافعة، مداولة، تقديم مستندات إلخ"
                  value={form.next_session_type}
                  onChange={(e) => setForm({ ...form, next_session_type: e.target.value })}
                />
                <textarea
                  value={form.next_session_notes}
                  onChange={(e) => setForm({ ...form, next_session_notes: e.target.value })}
                  rows={2}
                  placeholder="ملاحظات إضافية لجلسة التأجيل (مثال: تقديم أصل عقد الإيجار)"
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[var(--gold)]"
                />
              </div>
            ))}

          <div className="flex gap-2">
            <PremiumButton
              variant="outline"
              onClick={() => {
                setOpen(false);
                setEditingId(null);
                setForm({
                  session_date: "",
                  session_type: "",
                  outcome: "",
                  notes: "",
                  next_session_date: "",
                  next_session_type: "",
                  next_session_notes: "",
                });
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

                {s.outcome && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-lg px-2.5 py-0.5 text-xs font-semibold border",
                        s.outcome === "مؤجلة"
                          ? "border-[var(--gold-soft)]/30 bg-[var(--gold)]/5 text-[var(--gold-soft)]"
                          : s.outcome === "صدر حكم"
                            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                            : s.outcome === "محجوزة للحكم"
                              ? "border-sky-500/30 bg-sky-500/5 text-sky-400"
                              : "border-border bg-muted/20 text-muted-foreground",
                      )}
                    >
                      {s.outcome}
                    </span>
                  </div>
                )}

                {hasExtendedSchema && s.postponed_from_session_id && (
                  <div className="mt-1.5 text-xs text-[var(--gold-soft)]/90 flex items-center gap-1 bg-[var(--gold)]/5 px-2 py-0.5 rounded border border-[var(--gold)]/10 w-fit">
                    <span className="font-mono">★</span>
                    <span>جلسة مؤجلة مجدولة تلقائياً</span>
                  </div>
                )}

                {s.notes && (
                  <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                    {s.notes}
                  </p>
                )}

                {hasExtendedSchema && s.outcome === "مؤجلة" && s.next_session_date && (
                  <div className="mt-3.5 flex flex-col items-center justify-center border-t border-dashed border-[var(--gold)]/20 pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--gold-soft)] bg-[var(--gold)]/5 px-3 py-1 rounded-full border border-[var(--gold)]/15">
                      <span className="font-semibold">{s.next_session_type || "جلسة قادمة"}</span>
                      <span className="opacity-60">←</span>
                      <span>
                        مؤجلة إلى:{" "}
                        {new Date(s.next_session_date).toLocaleDateString("ar-EG", {
                          day: "numeric",
                          month: "long",
                        })}
                      </span>
                    </div>
                    {/* Golden connector arrow down the timeline */}
                    <div className="text-base font-bold text-[var(--gold)] mt-1.5 animate-bounce">
                      ↓
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
