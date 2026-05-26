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
  Cloud,
  CloudUpload,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "./EmptyState";
import { useTrial } from "@/hooks/use-trial";
import { FILE_CATEGORIES, type FileCategory, formatBytes } from "@/lib/file-constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getCachedToken,
  authenticateGoogleDrive,
  uploadFileToGoogleDrive,
  getGoogleClientId,
  saveGoogleClientId,
  logoutGoogle,
} from "@/lib/google-drive-auth";
import firebaseConfig from "../../../firebase-applet-config.json";

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

  // Safely track hostname and origin for SSR compatibility
  const [currentHostname, setCurrentHostname] = useState("");
  const [currentOrigin, setCurrentOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHostname(window.location.hostname);
      setCurrentOrigin(window.location.origin);
    }
  }, []);

  // Google Drive state variables
  const [uploadingToDrive, setUploadingToDrive] = useState<string | null>(null);
  const [gdriveToken, setGdriveToken] = useState<string | null>(getCachedToken());
  const [showDriveSettings, setShowDriveSettings] = useState(false);
  const [customClientId, setCustomClientId] = useState(getGoogleClientId());
  const [authError, setAuthError] = useState<string | null>(null);

  const saveToGoogleDrive = async (a: Attachment) => {
    try {
      setUploadingToDrive(a.id);

      let token = gdriveToken || getCachedToken();
      if (!token) {
        toast.info("يرجى إكمال تسجيل الدخول لـ Google Drive بالنافذة المنبثقة...");
        try {
          // authenticateGoogleDrive() will automatically use dynamic preconfigured Firebase credentials or custom client ID if set
          token = await authenticateGoogleDrive();
          setGdriveToken(token);
          setAuthError(null);
          toast.success("تم الاتصال بـ Google Drive بنجاح!");
        } catch (err) {
          const errMsg = (err as { message?: string }).message || String(err);
          if (errMsg.includes("auth/unauthorized-domain")) {
            setAuthError("unauthorized-domain");
          }
          if (errMsg === "POPUP_BLOCKED") {
            toast.error(
              "تم حظر النافذة المنبثقة من قِبل المتصفح. يرجى تفعيل النوافذ المنبثقة وبدء الاتصال من جديد.",
            );
          } else if (errMsg === "WINDOW_CLOSED") {
            toast.error("تم إغلاق نافذة تسجيل الدخول.");
          } else {
            toast.error(`فشل الاتصال بـ Google: ${errMsg}`);
          }
          setUploadingToDrive(null);
          return;
        }
      }

      toast.loading("جاري جلب الملف من التخزين السحابي للمنصة...", { id: "gdrive-upload" });
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(a.file_url, 120);

      if (!data?.signedUrl) {
        toast.dismiss("gdrive-upload");
        toast.error("فشل في الحصول على الملف من خادم التخزين.");
        setUploadingToDrive(null);
        return;
      }

      const fileResponse = await fetch(data.signedUrl);
      const fileBlob = await fileResponse.blob();

      toast.loading("جاري رفع واستيراد الملف إلى Google Drive الخاص بك...", {
        id: "gdrive-upload",
      });
      const driveFile = await uploadFileToGoogleDrive(token, a.file_name, a.file_type, fileBlob);

      toast.dismiss("gdrive-upload");
      toast.success(`تم حفظ الملف "${a.file_name}" بنجاح في Google Drive!`);

      if (driveFile.webViewLink) {
        localStorage.setItem(`gdrive_saved_${a.id}`, driveFile.webViewLink);
      } else {
        localStorage.setItem(`gdrive_saved_${a.id}`, "true");
      }

      await logActivity("نسخ احتياطي (Google Drive)", a.file_name, a.id, "تم الرفع بنجاح");
      load();
    } catch (err) {
      toast.dismiss("gdrive-upload");
      console.error("Google Drive Upload Error:", err);
      toast.error(
        `خطأ أثناء الرفع إلى Google Drive: ${(err as { message?: string }).message || err}`,
      );
    } finally {
      setUploadingToDrive(null);
    }
  };

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
      try {
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
              x.key === uploadKey
                ? {
                    ...x,
                    status: "error",
                    progress: 0,
                    error: upErr.message,
                  }
                : x,
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
              x.key === uploadKey
                ? {
                    ...x,
                    status: "error",
                    progress: 0,
                    error: dbErr.message,
                  }
                : x,
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
      } catch (err: unknown) {
        console.error("[upload] unexpected exception", err);
        const errMsg = (err as Error)?.message || String(err);
        toast.error(`خطأ غير متوقع أثناء الرفع: ${errMsg}`);
        setUploads((u) =>
          u.map((x) =>
            x.key === uploadKey ? { ...x, status: "error", progress: 0, error: errMsg } : x,
          ),
        );
      }
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
      {/* Google Drive Status Panel */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-4 w-full">
          <div className="space-y-1 text-right w-full">
            <h3 className="font-sans text-base sm:text-lg font-bold text-foreground">
              إدارة ملفات ووثائق القضية
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              ارفع ملفات القضية أو قم بمزامنتها إلى سحاب Google Drive الخاص بك بضغطة زر.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 font-sans w-full pt-3 border-t border-border/40">
            <button
              onClick={() => {
                setCustomClientId(getGoogleClientId());
                setShowDriveSettings(!showDriveSettings);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-slate-900/40 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
              title="إعدادات الاتصال"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
            {gdriveToken ? (
              <button
                onClick={() => {
                  logoutGoogle();
                  setGdriveToken(null);
                  setAuthError(null);
                }}
                className="flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs text-destructive hover:bg-destructive/20 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="h-4 w-4" />
                <span>فصل الحساب</span>
              </button>
            ) : (
              <button
                onClick={async () => {
                  toast.loading("جاري فتح نافذة الاتصال بـ Google...", { id: "google-auth" });
                  try {
                    const token = await authenticateGoogleDrive();
                    setGdriveToken(token);
                    setAuthError(null);
                    toast.dismiss("google-auth");
                    toast.success("تم ربط حساب Google Drive بنجاح!");
                  } catch (err) {
                    toast.dismiss("google-auth");
                    const errMsg = (err as { message?: string }).message || String(err);
                    if (errMsg.includes("auth/unauthorized-domain")) {
                      setAuthError("unauthorized-domain");
                    }
                    if (errMsg === "POPUP_BLOCKED") {
                      toast.error("تم حظر الإطار المنبثق. يرجى تفعيل النوافذ المنبثقة لموقعنا.");
                    } else if (errMsg === "WINDOW_CLOSED") {
                      toast.error("تم إلغاء العملية.");
                    } else {
                      toast.error(`خطأ في ربط الحساب: ${errMsg}`);
                    }
                  }
                }}
                className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs text-white hover:bg-blue-500 transition-all font-semibold cursor-pointer shadow-md shadow-blue-600/20 shrink-0 select-none whitespace-nowrap min-w-[124px] justify-center"
              >
                <Cloud className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap font-medium text-white">ربط Google Drive</span>
              </button>
            )}
            <button
              onClick={() => setShowActivity((s) => !s)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs transition-colors font-semibold border cursor-pointer shrink-0",
                showActivity
                  ? "bg-[var(--gold)]/20 text-[var(--gold-soft)] border-[var(--gold)]/30"
                  : "bg-slate-900/60 text-slate-300 border-border hover:bg-slate-900",
              )}
            >
              <History className="h-4 w-4" />
              <span>سجل العمليات</span>
            </button>
          </div>
        </div>

        {/* Dynamic troubleshooting instructions when Firebase returns unauthorized-domain error */}
        {authError === "unauthorized-domain" && (
          <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-slate-300 text-[11px] leading-relaxed font-sans space-y-3 mt-2 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <span>⚠️ خطأ النطاق غير المعتمد (Unauthorized Domain)</span>
            </div>
            <p>
              لتفعيل ربط حساب Google Drive مباشرة على نطاق الاستعراض التجريبي هذا، يرجى إضافة هذا
              النطاق لقائمة النطاقات المعتمدة في كونسول Firebase:
            </p>
            <div className="space-y-2 p-2.5 rounded-lg bg-black/40 border border-border/50">
              <p className="text-slate-400 font-medium">خطوات الحل عبر كونسول Firebase:</p>
              <div className="space-y-1 pl-1">
                <p>1. افتح صفحة إعدادات الهوية لمشروع Firebase الخاص بك:</p>
                <a
                  href={`https://console.firebase.google.com/u/0/project/${firebaseConfig.projectId || "qadeyati-844c7"}/authentication/settings`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--gold-soft)] underline hover:text-[var(--gold)] flex items-center gap-1 w-fit font-mono py-0.5 text-[10px]"
                >
                  <span>فتح إعدادات مشروع {firebaseConfig.projectId || "qadeyati-844c7"}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <p className="mt-1">
                  2. اذهب لتبويب <strong>Authorized Domains (النطاقات المصرح بها)</strong> ثم اضغط
                  على <strong>Add Domain</strong>.
                </p>
                <p>3. انسخ النطاق التجريبي الحالي وأضفه هناك:</p>
              </div>
              <div className="flex gap-1.5 mt-2 items-center bg-background/50 p-1.5 rounded-md border border-border/40 w-full justify-between">
                <code className="text-[var(--gold-soft)] font-mono text-[10px] select-all truncate max-w-[200px] md:max-w-xs">
                  {currentHostname}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(window.location.hostname);
                      toast.success("تم نسخ النطاق بنجاح!");
                    }
                  }}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded px-2.5 py-1 text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
                >
                  نسخ النطاق
                </button>
              </div>
            </div>
            <div className="pt-2 text-[10px] text-slate-500 leading-relaxed border-t border-border/40">
              * ملحوظة: يمكنك تخطي هذا الإعداد عبر إدخال <strong>Google Client ID</strong> يدوي خاص
              لتخطي تحقق Firebase بالضغط على زر الترس ⚙️ بالأعلى.
            </div>
          </div>
        )}

        {/* Dynamic client-id settings block under gear icon */}
        {showDriveSettings && (
          <div className="pt-2 border-t border-border/40 space-y-2 animate-in fade-in duration-200">
            <label className="block text-[11px] text-muted-foreground font-sans">
              لوحة تحكم المطورين ومعرّف عميل Google OAuth 2.0 (Client ID):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                dir="ltr"
                value={customClientId}
                onChange={(e) => setCustomClientId(e.target.value)}
                placeholder="مثال: 123456-abcdef.apps.googleusercontent.com"
                className="flex-1 h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-slate-200 font-mono outline-none focus:border-[var(--gold)]"
              />
              <button
                onClick={() => {
                  if (!customClientId.trim()) {
                    toast.error("يرجى إدخال معرّف صحيح أولاً.");
                    return;
                  }
                  saveGoogleClientId(customClientId.trim());
                  toast.success("تم حفظ إعداد عميل Google بنجاح.");
                  setShowDriveSettings(false);
                }}
                className="h-9 px-3 rounded-lg bg-[var(--gold)] text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                حفظ
              </button>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
              * تم تكوين معرّف افتراضي تلقائياً لشركاء الخدمة. يمكنك تزويد المفتاح الخاص لتجاوزه
              وتجربته. رابط التوجيه الفعلي المطلوب للتسجيل بـ Google API هو:{" "}
              <code className="text-[var(--gold-soft)] bg-slate-950 px-1 py-0.5 rounded font-mono select-all">
                {currentOrigin}/oauth-callback.html
              </code>
            </p>
          </div>
        )}
      </div>

      {/* Category picker for upload */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">تصنيف الرفع:</p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {FILE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setPendingCategory(cat)}
              className={cn(
                "rounded-lg border px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs transition-colors duration-150 font-medium select-none cursor-pointer",
                pendingCategory === cat
                  ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold-soft)] font-semibold"
                  : "border-border text-muted-foreground hover:border-[var(--gold)]/30 hover:text-foreground",
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
                      {localStorage.getItem(`gdrive_saved_${a.id}`) && (
                        <a
                          href={
                            localStorage.getItem(`gdrive_saved_${a.id}`) === "true"
                              ? undefined
                              : localStorage.getItem(`gdrive_saved_${a.id}`) || undefined
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-400 font-sans border border-emerald-500/20 px-1.5 py-0.5 rounded-md transition-colors hover:bg-emerald-500/25"
                          onClick={(e) => {
                            if (localStorage.getItem(`gdrive_saved_${a.id}`) === "true")
                              e.preventDefault();
                          }}
                        >
                          <Cloud className="h-3 w-3" />
                          <span>Google Drive</span>
                          {localStorage.getItem(`gdrive_saved_${a.id}`) !== "true" && (
                            <ExternalLink className="h-2.5 w-2.5" />
                          )}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t border-border/50 pt-2.5">
                  {/* Google Drive Kopierer */}
                  <button
                    onClick={() => saveToGoogleDrive(a)}
                    className={cn(
                      "flex h-8 items-center gap-1 px-2.5 text-xs font-sans font-semibold transition-all cursor-pointer border rounded-lg select-none",
                      localStorage.getItem(`gdrive_saved_${a.id}`)
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600/20",
                    )}
                    title={
                      localStorage.getItem(`gdrive_saved_${a.id}`)
                        ? "منسوخ في Google Drive"
                        : "نسخ إلى Google Drive"
                    }
                  >
                    {uploadingToDrive === a.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CloudUpload className="h-3.5 w-3.5" />
                    )}
                    <span>Drive</span>
                  </button>

                  {/* Preview Button */}
                  <button
                    onClick={() => openPreview(a)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-slate-950/40 text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer shrink-0"
                    title="معاينة"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  {/* Download Button */}
                  <button
                    onClick={() => download(a)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-slate-950/40 text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer shrink-0"
                    title="تحميل"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>

                  {/* Rename (Edit) Button */}
                  <button
                    onClick={() => {
                      setRenaming(a);
                      setRenameValue(a.file_name);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-slate-950/40 text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer shrink-0"
                    title="تعديل"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  {/* Move Button */}
                  <button
                    onClick={() => setMoving(a)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-slate-950/40 text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer shrink-0"
                    title="نقل"
                  >
                    <FolderInput className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => remove(a)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-400/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all cursor-pointer shrink-0"
                    title="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
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