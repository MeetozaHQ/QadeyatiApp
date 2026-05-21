import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  Paperclip,
  Pencil,
  FolderInput,
  Eye,
  X,
  History,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "./EmptyState";
import { useTrial } from "@/hooks/use-trial";
import { FILE_CATEGORIES, type FileCategory, formatBytes } from "@/lib/file-constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  category: string;
  uploaded_at: string;
}

interface ActivityRow {
  id: string;
  action: string;
  file_name: string;
  details: string | null;
  created_at: string;
}

const BUCKET = "case-attachments";
const SUPPORTED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function getSupportedContentType(file: File) {
  if (SUPPORTED_TYPES.has(file.type)) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  return null;
}

type UploadState = {
  key: string;
  name: string;
  status: "uploading" | "done" | "error";
  progress: number;
  error?: string;
};

export function AttachmentsTab({ caseId, userId }: { caseId: string; userId: string }) {
  const { isTrialExpired } = useTrial();
  const [items, setItems] = useState<Attachment[] | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [showActivity, setShowActivity] = useState(false);
  const [filter, setFilter] = useState<"الكل" | FileCategory>("الكل");
  const [pendingCategory, setPendingCategory] = useState<FileCategory>("أخرى");
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<{ a: Attachment; url: string } | null>(null);
  const [renaming, setRenaming] = useState<Attachment | null>(null);
  const [moving, setMoving] = useState<Attachment | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    supabase
      .from("case_attachments")
      .select("id,file_name,file_url,file_type,file_size,category,uploaded_at")
      .eq("case_id", caseId)
      .order("uploaded_at", { ascending: false })
      .then(({ data }) => setItems((data as Attachment[]) ?? []));
    supabase
      .from("file_activity")
      .select("id,action,file_name,details,created_at")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setActivity((data as ActivityRow[]) ?? []));
  };
  useEffect(load, [caseId]);

  const logActivity = async (
    action: string,
    file_name: string,
    attachment_id?: string,
    details?: string,
  ) => {
    await supabase.from("file_activity").insert({
      user_id: userId,
      case_id: caseId,
      attachment_id: attachment_id ?? null,
      action,
      file_name,
      details: details ?? null,
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (isTrialExpired) {
      toast.error(
        "انتهت فترتكم التجريبية المجانية لـ قضيتي (٧ أيام). يرجى الاشتراك أو التنشيط مجانًا بالرمز الترويجي EGYPT بالشريط العلوي لتتمكن من رفع ملفات جديدة.",
      );
      return;
    }
    const list = Array.from(files);
    if (!list.length) return;
    const category = pendingCategory;
    for (const file of list) {
      const uploadKey = `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`;
      const contentType = getSupportedContentType(file);
      if (!contentType) {
        const message = "الصيغ المدعومة فقط: PDF أو JPG أو PNG";
        setUploads((u) => [
          ...u,
          { key: uploadKey, name: file.name, status: "error", progress: 0, error: message },
        ]);
        toast.error(message);
        continue;
      }
      setUploads((u) => [
        ...u,
        { key: uploadKey, name: file.name, status: "uploading", progress: 10 },
      ]);
      // Sanitize file name for storage key: keep ASCII letters/digits/dot/dash, drop the rest.
      const dot = file.name.lastIndexOf(".");
      const ext =
        dot >= 0
          ? file.name
              .slice(dot)
              .toLowerCase()
              .replace(/[^a-z0-9.]/g, "")
          : "";
      const safeBase =
        (dot >= 0 ? file.name.slice(0, dot) : file.name)
          .replace(/[^a-zA-Z0-9-_]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 60) || "file";
      const path = `${userId}/${caseId}/${Date.now()}-${safeBase}${ext}`;
      setUploads((u) => u.map((x) => (x.key === uploadKey ? { ...x, progress: 35 } : x)));
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType,
        upsert: false,
      });
      if (upErr) {
        console.error("[upload] storage error", upErr);
        toast.error(`تعذّر رفع ${file.name}: ${upErr.message}`);
        setUploads((u) =>
          u.map((x) =>
            x.key === uploadKey ? { ...x, status: "error", progress: 0, error: upErr.message } : x,
          ),
        );
        continue;
      }
      setUploads((u) => u.map((x) => (x.key === uploadKey ? { ...x, progress: 75 } : x)));
      const { data: row, error: dbErr } = await supabase
        .from("case_attachments")
        .insert({
          case_id: caseId,
          user_id: userId,
          file_name: file.name,
          file_url: path,
          file_type: contentType,
          file_size: file.size,
          category,
        })
        .select("id,file_name,file_url,file_type,file_size,category,uploaded_at")
        .maybeSingle();
      if (dbErr) {
        console.error("[upload] db insert error", dbErr);
        toast.error(`تم الرفع لكن تعذّر حفظ السجل: ${dbErr.message}`);
        // Roll back the orphaned storage object so the user can retry cleanly.
        await supabase.storage.from(BUCKET).remove([path]);
        setUploads((u) =>
          u.map((x) =>
            x.key === uploadKey ? { ...x, status: "error", progress: 0, error: dbErr.message } : x,
          ),
        );
        continue;
      }
      await logActivity("رفع", file.name, row?.id, category);
      if (row) setItems((current) => [row as Attachment, ...(current ?? [])]);
      toast.success("تم رفع الملف بنجاح");
      setUploads((u) =>
        u.map((x) => (x.key === uploadKey ? { ...x, status: "done", progress: 100 } : x)),
      );
    }
    load();
    setTimeout(() => setUploads((u) => u.filter((x) => x.status === "uploading")), 2500);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    handleFiles(files);
  };

  const openPreview = async (a: Attachment) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(a.file_url, 300);
    if (!data?.signedUrl) {
      toast.error(error?.message ?? "تعذّر فتح الملف");
      return;
    }
    const t = (a.file_type ?? "").toLowerCase();
    if (t.startsWith("image/") || t.includes("pdf")) {
      setPreview({ a, url: data.signedUrl });
    } else {
      window.open(data.signedUrl, "_blank");
    }
  };

  const download = async (a: Attachment) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(a.file_url, 60, { download: a.file_name });
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error(error?.message ?? "تعذّر تحميل الملف");
  };

  const remove = async (a: Attachment) => {
    if (!confirm("حذف الملف؟")) return;
    await supabase.storage.from(BUCKET).remove([a.file_url]);
    await supabase.from("case_attachments").delete().eq("id", a.id);
    await logActivity("حذف", a.file_name, a.id);
    load();
  };

  const doRename = async () => {
    if (!renaming || !renameValue.trim()) return;
    const newName = renameValue.trim();
    const oldName = renaming.file_name;
    await supabase.from("case_attachments").update({ file_name: newName }).eq("id", renaming.id);
    await logActivity("إعادة تسمية", newName, renaming.id, `من: ${oldName}`);
    setRenaming(null);
    load();
  };

  const doMove = async (cat: FileCategory) => {
    if (!moving) return;
    await supabase.from("case_attachments").update({ category: cat }).eq("id", moving.id);
    await logActivity("نقل", moving.file_name, moving.id, `إلى: ${cat}`);
    setMoving(null);
    load();
  };

  const filtered = useMemo(() => {
    if (!items) return null;
    return filter === "الكل" ? items : items.filter((i) => i.category === filter);
  }, [items, filter]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    (items ?? []).forEach((i) => m.set(i.category, (m.get(i.category) ?? 0) + 1));
    return m;
  }, [items]);

  return (
    <div className="space-y-4">
      {/* Category picker for upload */}
      <div className="rounded-2xl border border-border bg-card p-3">
        <p className="mb-2 text-xs text-muted-foreground">تصنيف الرفع:</p>
        <div className="flex flex-wrap gap-2">
          {FILE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setPendingCategory(cat)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                pendingCategory === cat
                  ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]"
                  : "border-border text-muted-foreground hover:border-[var(--gold)]/40",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
        multiple
        onChange={onPick}
        className="hidden"
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-8 text-sm transition-colors",
          dragOver
            ? "border-[var(--gold)] bg-[var(--gold)]/10"
            : "border-[var(--gold)]/40 bg-card/40 hover:bg-[var(--gold)]/5",
        )}
      >
        <Upload className="h-6 w-6 text-[var(--gold-soft)]" />
        <span className="font-medium text-foreground">اسحب الملفات هنا أو اضغط للاختيار</span>
        <span className="text-xs text-muted-foreground">PDF أو صور — يمكن رفع عدة ملفات</span>
      </div>

      {uploads.length > 0 && (
        <ul className="space-y-2">
          {uploads.map((u) => (
            <li key={u.key} className="rounded-xl border border-border bg-card p-3 text-sm">
              <div className="flex items-center gap-2">
                {u.status === "uploading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--gold-soft)]" />
                )}
                {u.status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                {u.status === "error" && <X className="h-4 w-4 text-destructive" />}
                <span className="flex-1 truncate text-foreground">{u.name}</span>
                <span className="text-xs text-muted-foreground">
                  {u.status === "uploading" && "جاري رفع الملف..."}
                  {u.status === "done" && "تم رفع الملف بنجاح"}
                  {u.status === "error" && (u.error ?? "تعذّر رفع الملف")}
                </span>
              </div>
              {u.status === "uploading" && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-[var(--gold)] transition-all"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["الكل", ...FILE_CATEGORIES] as const).map((cat) => {
          const n = cat === "الكل" ? (items?.length ?? 0) : (counts.get(cat) ?? 0);
          const active = filter === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                active
                  ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]"
                  : "border-border text-muted-foreground hover:border-[var(--gold)]/40",
              )}
            >
              {cat} <span className="opacity-60">({n})</span>
            </button>
          );
        })}
      </div>

      {filtered === null ? (
        <div className="h-24 animate-pulse rounded-2xl border border-border bg-card/50" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Paperclip className="h-7 w-7" />} title="لا توجد وثائق بعد" />
      ) : (
        <ul className="space-y-2">
          {filtered.map((a) => {
            const isImg = (a.file_type ?? "").startsWith("image/");
            return (
              <li key={a.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--gold)]/10 text-[var(--gold-soft)]">
                    {isImg ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.file_name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-md border border-[var(--gold)]/30 px-1.5 py-0.5 text-[var(--gold-soft)]">
                        {a.category}
                      </span>
                      <span>{new Date(a.uploaded_at).toLocaleDateString("ar-EG")}</span>
                      <span>{formatBytes(a.file_size)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-2">
                  <IconBtn label="معاينة" onClick={() => openPreview(a)}>
                    <Eye className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label="تحميل" onClick={() => download(a)}>
                    <Download className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn
                    label="إعادة تسمية"
                    onClick={() => {
                      setRenaming(a);
                      setRenameValue(a.file_name);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label="نقل تصنيف" onClick={() => setMoving(a)}>
                    <FolderInput className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label="حذف" onClick={() => remove(a)} danger>
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Activity */}
      <button
        onClick={() => setShowActivity((s) => !s)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/40 py-2.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <History className="h-4 w-4" />
        {showActivity ? "إخفاء السجل" : "عرض سجل النشاط"}
      </button>
      {showActivity && (
        <ul className="space-y-2">
          {activity.length === 0 && (
            <li className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-center text-xs text-muted-foreground">
              لا يوجد نشاط بعد
            </li>
          )}
          {activity.map((row) => (
            <li
              key={row.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-xs"
            >
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />
              <div className="min-w-0 flex-1">
                <p className="text-foreground">
                  <span className="text-[var(--gold-soft)]">{row.action}</span>: {row.file_name}
                </p>
                {row.details && <p className="text-muted-foreground">{row.details}</p>}
              </div>
              <span className="shrink-0 text-muted-foreground">
                {new Date(row.created_at).toLocaleString("ar-EG", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border p-3">
              <p className="truncate text-sm text-foreground">{preview.a.file_name}</p>
              <button
                onClick={() => setPreview(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex max-h-[80vh] items-center justify-center overflow-auto bg-black/40">
              {(preview.a.file_type ?? "").startsWith("image/") ? (
                <img
                  src={preview.url}
                  alt={preview.a.file_name}
                  className="max-h-[80vh] w-auto object-contain"
                />
              ) : (
                <iframe src={preview.url} title={preview.a.file_name} className="h-[80vh] w-full" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rename modal */}
      {renaming && (
        <Modal title="إعادة تسمية الملف" onClose={() => setRenaming(null)}>
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-background px-3 text-foreground outline-none focus:border-[var(--gold)]"
            autoFocus
          />
          <button
            onClick={doRename}
            className="h-12 w-full rounded-xl bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold)] font-semibold text-[color:var(--primary-foreground)]"
          >
            حفظ
          </button>
        </Modal>
      )}

      {/* Move modal */}
      {moving && (
        <Modal title="نقل إلى تصنيف" onClose={() => setMoving(null)}>
          <div className="grid grid-cols-2 gap-2">
            {FILE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => doMove(cat)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-sm",
                  cat === moving.category
                    ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-soft)]"
                    : "border-border text-foreground hover:border-[var(--gold)]/40",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary",
        danger ? "hover:text-destructive" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
