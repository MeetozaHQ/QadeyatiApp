import { useEffect, useState } from "react";
import { Trash2, Pencil, Check, X, StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PremiumButton } from "./PremiumButton";
import { EmptyState } from "./EmptyState";

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
      <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="أضف ملاحظة سريعة عن القضية..."
          className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[var(--gold)]"
        />
        <PremiumButton loading={saving} disabled={!draft.trim()} onClick={add}>
          إضافة ملاحظة
        </PremiumButton>
      </div>

      {items === null ? (
        <div className="h-24 animate-pulse rounded-2xl border border-border bg-card/50" />
      ) : items.length === 0 ? (
        <EmptyState icon={<StickyNote className="h-7 w-7" />} title="لا توجد ملاحظات" />
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id} className="rounded-2xl border border-border bg-card p-4">
              {editing === n.id ? (
                <>
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-[var(--gold)]"
                  />
                  <div className="mt-2 flex justify-end gap-2 text-sm">
                    <button
                      onClick={() => setEditing(null)}
                      className="flex items-center gap-1 text-muted-foreground"
                    >
                      <X className="h-4 w-4" /> إلغاء
                    </button>
                    <button
                      onClick={() => saveEdit(n.id)}
                      className="flex items-center gap-1 text-[var(--gold-soft)]"
                    >
                      <Check className="h-4 w-4" /> حفظ
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{n.content}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString("ar-EG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    <div className="flex gap-3 text-muted-foreground">
                      <button
                        aria-label="تعديل"
                        onClick={() => {
                          setEditing(n.id);
                          setEditDraft(n.content);
                        }}
                      >
                        <Pencil className="h-4 w-4 hover:text-foreground" />
                      </button>
                      <button aria-label="حذف" onClick={() => remove(n.id)}>
                        <Trash2 className="h-4 w-4 hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
