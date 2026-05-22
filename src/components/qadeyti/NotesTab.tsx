import { useEffect, useState } from "react";
import { Trash2, Pencil, Check, X, StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PremiumButton } from "./PremiumButton";
import { EmptyState } from "./EmptyState";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { motion, AnimatePresence } from "motion/react";

interface Note {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function NotesTab({ caseId, userId }: { caseId: string; userId: string }) {
  const [items, setItems] = useState<Note[] | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const load = () => {
    supabase
      .from("case_notes")
      .select("id,content,created_at,updated_at")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Note[]) ?? []));
  };
  useEffect(load, [caseId]);

  const add = async () => {
    const t = draft.trim();
    if (!t) return;
    setSaving(true);
    await supabase.from("case_notes").insert({ case_id: caseId, user_id: userId, content: t });
    setDraft("");
    setSaving(false);
    load();
  };

  const saveEdit = async (id: string) => {
    const t = editDraft.trim();
    if (!t) return;
    await supabase.from("case_notes").update({ content: t }).eq("id", id);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف الملاحظة؟")) return;
    await supabase.from("case_notes").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="أضف ملاحظة سريعة عن القضية..."
          className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[var(--gold)] transition-colors"
        />
        <PremiumButton loading={saving} disabled={!draft.trim()} onClick={add}>
          إضافة ملاحظة
        </PremiumButton>
      </div>

      {items === null ? (
        <div className="space-y-3">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<StickyNote className="h-7 w-7" />} title="لا توجد ملاحظات" />
      ) : (
        <motion.ul layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {items.map((n) => (
              <motion.li
                key={n.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-border bg-card/90 p-4 shadow-sm hover:border-[var(--gold)]/20 transition-all duration-300"
              >
                {editing === n.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-[var(--gold)]"
                    />
                    <div className="flex justify-end gap-2 text-sm">
                      <button
                        onClick={() => setEditing(null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" /> إلغاء
                      </button>
                      <button
                        onClick={() => saveEdit(n.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[var(--gold)]/10 text-[var(--gold-soft)] hover:bg-[var(--gold)]/20 transition-all cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" /> حفظ
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{n.content}</p>
                    <div className="mt-3.5 flex items-center justify-between border-t border-border/40 pt-2.5">
                      <span className="text-xs text-muted-foreground/80 font-medium">
                        {new Date(n.created_at).toLocaleString("ar-EG", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                      <div className="flex gap-2.5 text-muted-foreground">
                        <button
                          aria-label="تعديل"
                          onClick={() => {
                            setEditing(n.id);
                            setEditDraft(n.content);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary hover:text-foreground transition-all cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          aria-label="حذف" 
                          onClick={() => remove(n.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}

