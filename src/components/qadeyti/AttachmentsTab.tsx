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
          token = await authenticateGoogleDrive(customClientId.trim() || undefined);
          setGdriveToken(token);
        } catch (authErr) {
          console.error("GDrive popup integration error:", authErr);
          const errMsg = String(authErr);
          if (errMsg.includes("WINDOW_CLOSED")) {
            toast.error("تم إغلاق نافذة الاتصال بواسطة المستخدم.");
          } else if (errMsg.includes("unauthorized_client") || errMsg.includes("developer_error")) {
            setAuthError("unauthorized-domain");
            toast.error("يرجى مراجعة إعدادات النطاق المعتمد (Authorized Domains) في كونسول Google Cloud.");
          } else if (errMsg.includes("POPUP_BLOCKED")) {
            toast.error("تم حظر النافذة المنبثقة! يرجى السماح بالنوافذ المنبثقة لهذا الموقع.");
          } else {
            toast.error("فشل الاتصال بـ Google Drive.");
          }
          return;
        }
      }

      if (!token) return;

      toast.loading("جاري جلب الملف وتجهيز المزامنة في السحاب...", { id: "gdrive-sync" });

      const { data: fileData, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(a.file_url);

      if (downloadError) throw downloadError;

      const metadata = await uploadFileToGoogleDrive(token, a.file_name, a.file_type, fileData);

      await supabase.from("case_activities").insert({
        case_id: caseId,
        user_id: userId,
        action: "تم حفظ مستند بسحاب Google Drive",
        file_name: a.file_name,
        details: `مذكرة مخزنة بنجاح بمعرف ملف: ${metadata.id}`,
      });

      toast.success("تم الحفظ في Google Drive ومزامنة المستند بنجاح!", { id: "gdrive-sync" });
      loadActivity();
    } catch (err) {
      console.error("Google Drive sync general error:", err);
      toast.error("حدث خطأ أثناء الاتصال أو المزامنة مع السحاب.", { id: "gdrive-sync" });
    } finally {
      setUploadingToDrive(null);
    }
  };

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from("case_attachments")
        .select("*")
        .eq("case_id", caseId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setItems(data as Attachment[]);
    } catch (err) {
      console.error("Loading attachments error:", err);
      toast.error("فشل تحميل مستندات القضية.");
    }
  };

  const loadActivity = async () => {
    try {
      const { data, error } = await supabase
        .from("case_activities")
        .select("id, action, file_name, details, created_at")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivity(data as ActivityRow[]);
    } catch (err) {
      console.error("Loading activities error:", err);
    }
  };

  useEffect(() => {
    loadData();
    loadActivity();
  }, [caseId]);

  const handleUpload = async (file: File) => {
    if (isTrialExpired) return;

    const contentType = getSupportedContentType(file);
    if (!contentType) {
      toast.error("نوع الملف غير مدعوم. يرجى رفع ملفات PDF أو صور فقط (JPG, PNG).");
      return;
    }

    const key = `${Math.random().toString(36).substring(2)}-${Date.now()}`;
    const filePath = `${caseId}/${key}`;

    const newUpload: UploadState = {
      key,
      name: file.name,
      status: "uploading",
      progress: 10,
    };

    setUploads((prev) => [newUpload, ...prev]);

    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          contentType,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploads((prev) =>
        prev.map((up) => (up.key === key ? { ...up, status: "done", progress: 100 } : up))
      );

      const pubUrl = supabase.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;

      const { data, error: dbError } = await supabase
        .from("case_attachments")
        .select("*")
        .eq("case_id", caseId);

      const { error: insertError } = await supabase.from("case_attachments").insert({
        case_id: caseId,
        user_id: userId,
        file_name: file.name,
        file_url: filePath,
        file_type: contentType,
        file_size: file.size,
        category: pendingCategory,
      });

      if (insertError) throw insertError;

      await supabase.from("case_activities").insert({
        case_id: caseId,
        user_id: userId,
        action: "تم رفع مستند جديد",
        file_name: file.name,
        details: `حجم الملف ${formatBytes(file.size)} تم تصنيفه كـ ${pendingCategory}`,
      });

      toast.success(`تم رفع المستند (${file.name}) بنجاح.`);
      loadData();
      loadActivity();

      setTimeout(() => {
        setUploads((prev) => prev.filter((up) => up.key !== key));
      }, 3000);
    } catch (err) {
      console.error("Upload error:", err);
      setUploads((prev) =>
        prev.map((up) => (up.key === key ? { ...up, status: "error", error: "فشل الرفع" } : up))
      );
      toast.error(`فشل رفع الملف ${file.name}`);
    }
  };

  const handleRename = async () => {
    if (!renaming || !renameValue.trim()) return;
    try {
      const extension = renaming.file_name.includes(".")
        ? renaming.file_name.split(".").pop()
        : "";
      let newName = renameValue.trim();
      if (extension && !newName.endsWith(`.${extension}`)) {
        newName = `${newName}.${extension}`;
      }

      const { error } = await supabase
        .from("case_attachments")
        .update({ file_name: newName })
        .eq("id", renaming.id);

      if (error) throw error;

      await supabase.from("case_activities").insert({
        case_id: caseId,
        user_id: userId,
        action: "تم تعديل اسم المستند",
        file_name: newName,
        details: `الاسم القديم: ${renaming.file_name}`,
      });

      toast.success("تم تعديل الاسم بنجاح");
      setRenaming(null);
      loadData();
      loadActivity();
    } catch (err) {
      console.error("Rename failed:", err);
      toast.error("فشل تعديل الاسم");
    }
  };

  const handleMoveCategory = async () => {
    if (!moving) return;
    try {
      const { error } = await supabase
        .from("case_attachments")
        .update({ category: pendingCategory })
        .eq("id", moving.id);

      if (error) throw error;

      await supabase.from("case_activities").insert({
        case_id: caseId,
        user_id: userId,
        action: "تم نقل تصنيف المستند",
        file_name: moving.file_name,
        details: `صُنف المستند بـ ${pendingCategory}`,
      });

      toast.success("تم نقل تصنيف المستند بنجاح");
      setMoving(null);
      loadData();
      loadActivity();
    } catch (err) {
      console.error("Move category failed:", err);
      toast.error("فشل نقل تصنيف المستند");
    }
  };

  const handleDelete = async (a: Attachment) => {
    const isConfirmed = confirm(`هل أنت متأكد من رغبتك في حذف المستند: ${a.file_name}؟`);
    if (!isConfirmed) return;

    try {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([a.file_url]);
      if (storageError) console.warn("Storage warning, file may not exist:", storageError);

      const { error: dbError } = await supabase
        .from("case_attachments")
        .delete()
        .eq("id", a.id);

      if (dbError) throw dbError;

      await supabase.from("case_activities").insert({
        case_id: caseId,
        user_id: userId,
        action: "تم حذف مستند من القضية",
        file_name: a.file_name,
      });

      toast.success("تم حذف المستند بنجاح.");
      loadData();
      loadActivity();
    } catch (err) {
      console.error("Deletion error:", err);
      toast.error("فشل حذف المستند.");
    }
  };

  const handleOpenPreview = async (a: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(a.file_url, 300);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      } else {
        toast.error("فشل إصدار رابط استعراض آمن للمستند.");
      }
    } catch (err) {
      console.error("Preview signature failure:", err);
      toast.error("حدث خطأ أثناء محاولة فتح استعراض المستند.");
    }
  };

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (filter === "الكل") return items;
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  return (
    <div className="space-y-6">
      {/* Search / Integration Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d121f]/50 p-4 rounded-2xl border border-border/40">
        <div>
          <h2 className="text-sm font-semibold text-white">إدارة ملفات ووثائق القضية</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            ارفع ملفات القضية أو قم بمزامنتها إلى سحاب Google Drive الخاص بك بضغطة زر.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Activity Sync History Button */}
          <button
            onClick={() => setShowActivity(!showActivity)}
            className="h-8 px-3 rounded-lg flex items-center gap-1 bg-[#161f30] text-slate-300 text-xs hover:bg-[#1f2b42] border border-border/50 transition-colors cursor-pointer"
          >
            <History className="h-3.5 w-3.5 text-slate-400" />
            <span>سجل العمليات</span>
          </button>

          {/* Google Drive Account Link Controls */}
          {gdriveToken ? (
            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-1.5 pl-3">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-semibold max-w-[80px] truncate">
                Drive مرتبك
              </span>
              <button
                onClick={() => {
                  logoutGoogle();
                  setGdriveToken(null);
                }}
                title="تسجيل الخروج من Google Drive"
                className="text-slate-400 hover:text-red-400 transition-colors mr-2 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={async () => {
                try {
                  const token = await authenticateGoogleDrive(customClientId.trim() || undefined);
                  setGdriveToken(token);
                } catch (authErr) {
                  console.error("GDrive auth failure:", authErr);
                  const errMsg = String(authErr);
                  if (errMsg.includes("WINDOW_CLOSED")) {
                    toast.error("تم إلغاء النافذة المنبثقة للاتصال.");
                  } else if (errMsg.includes("unauthorized_client") || errMsg.includes("developer_error")) {
                    setAuthError("unauthorized-domain");
                    toast.error("يرجى مراجعة وتعديل النطاق المعتمد (Authorized Domains) في كونسول Google API.");
                  } else if (errMsg.includes("POPUP_BLOCKED")) {
                    toast.error("تم حظر الإطار التجريبي! اسمح للمستعرض بفتح النوافذ المنبثقة.");
                  } else {
                    toast.error("حدث خطأ في ربط الحساب.");
                  }
                }
              }}
              className="h-8 px-3 rounded-lg flex items-center gap-1.5 bg-[#0052cc] hover:bg-[#0747a6] text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Cloud className="h-3.5 w-3.5 text-white" />
              <span>ربط Google Drive</span>
            </button>
          )}

          {/* Drive Settings Button */}
          <button
            onClick={() => setShowDriveSettings(!showDriveSettings)}
            className="h-8 w-8 rounded-lg flex items-center justify-center bg-[#161f30] text-slate-300 hover:bg-[#1f2b42] border border-border/50 transition-colors cursor-pointer"
            title="إعدادات Google API المتقدمة"
          >
            <Settings className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Advanced Google API Settings Configuration Panel */}
      {showDriveSettings && (
        <div className="p-4 rounded-2xl border border-border bg-[#0a0f1d] text-slate-300 text-xs space-y-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-[var(--gold)]" />
              <span>تكوين Google OAuth API المتقدم (اختياري)</span>
            </h3>
            <button
              onClick={() => setShowDriveSettings(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal font-sans">
            تتم مزامنة الملفات من خلال تطبيق Google Cloud API افتراضي وآمن معد وموثق لشركائنا. إذا كنت ترغب في استخدام تطبيق سحّابي مخصص خاص بك ومصادقته لتجاوز قيود النطاق التجريبي، يرجى تزويد الـ Client ID هنا:
          </p>
          <div className="space-y-2 mt-1">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="4820938...-...apps.googleusercontent.com"
                value={customClientId}
                onChange={(e) => setCustomClientId(e.target.value)}
                className="h-9 px-3 rounded-lg w-full bg-slate-950 border border-border text-xs focus:ring-1 focus:ring-[var(--gold)] text-slate-100 placeholder-slate-500 focus:outline-none"
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
                className="h-9 px-3 rounded-lg bg-[var(--gold)] text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer text-center"
              >
                حفظ
              </button>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
              * تم تكوين معرّف افتراضي تلقائياً لشركاء الخدمة. يمكنك تزويد المفتاح الخاص لتجاوزه وتجربته. رابط التوجيه الفعلي المطلوب للتسجيل بـ Google API هو:{" "}
              <code className="text-[var(--gold-soft)] bg-slate-950 px-1 py-0.5 rounded font-mono select-all">
                {currentOrigin}/oauth-callback.html
              </code>
            </p>
          </div>
        </div>
      )}

      {/* Dynamic troubleshooting instructions when Firebase returns unauthorized-domain error */}
      {authError === "unauthorized-domain" && (
        <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-slate-300 text-[11px] leading-relaxed font-sans space-y-3 mt-2 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
            <span>⚠️ خطأ النطاق غير المعتمد (Unauthorized Domain)</span>
          </div>
          <p>
            لتفعيل ربط حساب Google Drive مباشرة على نطاق الاستعراض التجريبي هذا، يرجى إضافة هذا النطاق لقائمة النطاقات المعتمدة في كونسول Firebase:
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
                2. اذهب لتبويب <strong>Authorized Domains (النطاقات المصرح بها)</strong> ثم اضغط على <strong>Add Domain</strong>.
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
        </div>
      )}

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
                  ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold-soft)]"
                  : "border-border bg-transparent text-muted-foreground hover:bg-[#161f30]/40"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleUpload(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer duration-300 min-h-[160px]",
          dragOver
            ? "border-[var(--gold)] bg-[var(--gold)]/5 scale-[0.99] shadow-inner"
            : "border-border hover:border-[var(--gold)]/40 hover:bg-slate-950/20",
          isTrialExpired && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          disabled={isTrialExpired}
        />

        <div className="rounded-full bg-[#1a2333]/60 p-3.5 border border-border/40 group-hover:scale-105 transition-transform duration-300">
          <CloudUpload className="h-6 w-6 text-[var(--gold)]" />
        </div>

        <p className="mt-4 text-xs font-semibold text-slate-200">
          {isTrialExpired ? "تم انتهاء الفترة التجريبية" : `اسحب وأسقط المستند كـ ${pendingCategory} هنا`}
        </p>
        <p className="mt-1 text-[10px] text-slate-500 font-sans">
          أو انقر للتصفح من على جهازك (PDF، JPG، PNG بحد أقصى 10MB)
        </p>
      </div>

      {/* Active Uploading indicators */}
      {uploads.length > 0 && (
        <div className="space-y-2 p-3 rounded-xl border border-border/60 bg-[#0d121f]/40 animate-pulse duration-1000">
          <p className="text-[10px] text-slate-400 font-medium">جاري معالجة عمليات الرفع الحالية:</p>
          {uploads.map((up) => (
            <div key={up.key} className="flex items-center justify-between text-xs p-1">
              <span className="text-slate-300 truncate max-w-xs">{up.name}</span>
              <span className="text-[10px] text-[var(--gold-soft)] font-mono">{up.progress}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Search / Filter Navigation Tab Strip */}
      <div className="flex border-b border-border/60 pb-px">
        {(["الكل", ...FILE_CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "border-b-2 px-4 py-2 text-xs font-medium transition-colors cursor-pointer",
              filter === cat
                ? "border-[var(--gold)] text-[var(--gold-soft)]"
                : "border-transparent text-muted-foreground hover:text-white"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Activity Logs Panel Widget */}
      {showActivity && (
        <div className="p-4 rounded-2xl border border-border/50 bg-[#07090e]/80 space-y-3 animate-in duration-300 slide-in-from-right-4">
          <div className="flex justify-between items-center pb-1 border-b border-border/30">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1">
              <History className="h-3.5 w-3.5 text-[var(--gold)]" />
              <span>أحدث الإجراءات والنشاط على السحّاب</span>
            </h3>
            <button onClick={() => setShowActivity(false)} className="text-slate-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {activity.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-4">لا توجد سجلات نشاط مسجلة بعد لهذه القضية.</p>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {activity.map((act) => (
                <div key={act.id} className="text-[10px] text-slate-300 border-b border-border/10 pb-2">
                  <div className="flex justify-between font-sans">
                    <span className="font-semibold text-[11px] text-[var(--gold-soft)]">{act.action}</span>
                    <span className="text-slate-500">{new Date(act.created_at).toLocaleDateString("ar-EG")}</span>
                  </div>
                  {act.file_name && <p className="text-slate-400 font-mono mt-0.5">الملف: {act.file_name}</p>}
                  {act.details && <p className="text-slate-500 font-sans">{act.details}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attachments List */}
      {!items ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="h-8 w-8 text-[var(--gold)] animate-spin" />
          <p className="text-xs text-muted-foreground">جاري تحميل المستندات المرفقة للقضية...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title={filter === "الكل" ? "لا توجد مستندات بعد" : `لا توجد مستندات في تصنيف ${filter}`}
          description={
            filter === "الكل" ? "لم يتم رفع أي مستندات أو مذكرات ملحقة بملف هذه القضية حتى الآن." : ""
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-xl border border-border bg-[#0d121f]/35 p-3.5 hover:bg-[#0d121f]/65 transition-all duration-300"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-900 border border-border/40 p-2.5 text-[var(--gold)] shrink-0">
                  {item.file_type?.startsWith("image/") ? (
                    <ImageIcon className="h-4.5 w-4.5" />
                  ) : (
                    <FileText className="h-4.5 w-4.5" />
                  )}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <p
                    className="truncate text-xs font-semibold text-slate-200 group-hover:text-white transition-colors cursor-pointer"
                    onClick={() => handleOpenPreview(item)}
                    title={item.file_name}
                  >
                    {item.file_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                    <span className="rounded bg-slate-800 px-1 py-0.5 text-[var(--gold-soft)] font-sans">
                      {item.category}
                    </span>
                    <span>•</span>
                    <span>{item.file_size ? formatBytes(item.file_size) : "غير معروف"}</span>
                    <span>•</span>
                    <span>{new Date(item.uploaded_at).toLocaleDateString("ar-EG")}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-border/20 pt-2 text-xs">
                {/* Save To Google Drive Button */}
                <button
                  onClick={() => saveToGoogleDrive(item)}
                  disabled={uploadingToDrive === item.id}
                  className="flex items-center gap-1 rounded-lg border border-border bg-[#161f30] px-2.5 py-1 text-[11px] text-slate-300 hover:bg-[#1f2b42] hover:text-white duration-250 font-medium cursor-pointer"
                  title="مزامنة المستند لـ Google Drive الخاص بك"
                >
                  {uploadingToDrive === item.id ? (
                    <Loader2 className="h-3 w-3 animate-spin text-[var(--gold)]" />
                  ) : (
                    <Cloud className="h-3 w-3 text-slate-400 group-hover:text-[var(--gold)]" />
                  )}
                  <span>Drive</span>
                </button>

                {/* Rename Button */}
                <button
                  onClick={() => {
                    const withoutExt = item.file_name.includes(".")
                      ? item.file_name.substring(0, item.file_name.lastIndexOf("."))
                      : item.file_name;
                    setRenameValue(withoutExt);
                    setRenaming(item);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-border/45 bg-transparent px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-100 hover:bg-[#161f30]/50 duration-250 cursor-pointer"
                >
                  <Pencil className="h-3 w-3 text-slate-500" />
                  <span>تعديل</span>
                </button>

                {/* Move category */}
                <button
                  onClick={() => {
                    setPendingCategory(item.category as FileCategory);
                    setMoving(item);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-border/45 bg-transparent px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-100 hover:bg-[#161f30]/50 duration-250 cursor-pointer"
                >
                  <FolderInput className="h-3 w-3 text-slate-500" />
                  <span>نقل</span>
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(item)}
                  className="flex items-center gap-1 rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[11px] text-red-400 hover:bg-red-500/15 duration-250 cursor-pointer mr-auto"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rename Dialog Modal */}
      {renaming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-[#0d121f] p-5.5 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-white">تعديل اسم المستند</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="h-10 px-3 rounded-lg w-full bg-slate-950 border border-border text-xs focus:ring-1 focus:ring-[var(--gold)] text-slate-100 focus:outline-none"
              placeholder="الاسم الجديد للمستند"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
            <div className="flex justify-end gap-2 pt-2.5">
              <button
                onClick={() => setRenaming(null)}
                className="h-9 px-4 rounded-lg bg-transparent text-slate-400 hover:text-white border border-border text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleRename}
                className="h-9 px-4 rounded-lg bg-[var(--gold)] text-slate-900 font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                تحديث
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Category Dialog Modal */}
      {moving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-[#0d121f] p-5.5 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-white">تغيير تصنيف المستند</h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {FILE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPendingCategory(cat)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs transition-colors cursor-pointer",
                    pendingCategory === cat
                      ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold-soft)]"
                      : "border-border bg-transparent text-muted-foreground hover:bg-[#161f30]/40"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2.5 border-t border-border/10">
              <button
                onClick={() => setMoving(null)}
                className="h-9 px-4 rounded-lg bg-transparent text-slate-400 hover:text-white border border-border text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleMoveCategory}
                className="h-9 px-4 rounded-lg bg-[var(--gold)] text-slate-900 font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                نقل التصنيف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}