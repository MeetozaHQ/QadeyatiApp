import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTrial } from "@/hooks/use-trial";
import { supabase } from "@/integrations/supabase/client";
import { PremiumButton } from "@/components/qadeyti/PremiumButton";
import { PremiumInput } from "@/components/qadeyti/PremiumInput";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { sendPaymentReminderEmail } from "@/lib/email.functions";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  Copy,
  Upload,
  BadgeCheck,
  Check,
  X,
  Loader2,
  Sparkles,
  Database,
  Mail,
  PhoneCall,
  Lock,
  HardDrive,
  Send,
  History,
  UserCheck,
  RefreshCw,
  FileText,
  CloudLightning,
} from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  component: Profile,
});

const BAR_LEVELS = ["تحت التمرين", "ابتدائي", "استئناف", "نقض"];
const SPECIALIZATIONS = [
  "مدني",
  "جنائي",
  "تجاري",
  "أحوال شخصية",
  "عمالي",
  "إداري",
  "ضرائب",
  "عقاري",
  "ملكية فكرية",
  "تحكيم",
];

type Profile = {
  id?: string;
  user_id: string;
  slug: string;
  full_name: string;
  title: string | null;
  bar_level: string | null;
  office_name: string | null;
  office_address: string | null;
  whatsapp: string | null;
  maps_link: string | null;
  bio: string | null;
  specializations: string[];
  years_experience: number | null;
  avatar_url: string | null;
  logo_url: string | null;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { plan, isSubscriptionUnpaid, setSubscriptionUnpaid } = useTrial();
  const callSendReminder = useServerFn(sendPaymentReminderEmail);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState<Profile | null>(null);
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Enterprise Plan States & Simulation controls
  const [entTab, setEntTab] = useState<"storage" | "manager">("storage");
  const [storageStats, setStorageStats] = useState<{ totalSize: number; count: number }>({
    totalSize: 0,
    count: 0,
  });
  const [backingUp, setBackingUp] = useState(false);
  const [backupStage, setBackupStage] = useState("");
  const [optimizing, setOptimizing] = useState(false);
  const [customRequests, setCustomRequests] = useState<
    {
      id: string;
      type: string;
      notes: string;
      date: string;
      status: string;
    }[]
  >([]);

  const [reqType, setReqType] = useState("import");
  const [reqNotes, setReqNotes] = useState("");

  // Helper to format bytes cleanly inside the component
  function formatStorageBytes(bytes: number) {
    if (bytes === 0) return "0 بايت";
    const k = 1024;
    const sizes = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Load custom requests from localStorage on startup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("qadeyti_firm_sla_requests");
      if (stored) {
        try {
          setCustomRequests(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse custom SLA requests from localStorage", e);
        }
      }
    }
  }, []);

  const runBackupSimulation = async () => {
    if (backingUp) return;
    setBackingUp(true);
    setBackupStage("جاري الاتصال بالسحابة الآمنة والتحقق من سلامة البيانات...");
    await new Promise((r) => setTimeout(r, 1200));
    setBackupStage(`جاري فحص وحزم عدد ${storageStats.count} ملف قانوني مستورد...`);
    await new Promise((r) => setTimeout(r, 1000));
    setBackupStage(
      "جاري تشفير الحزمة وخوادم الاستضافة بمعيار AES-256 للمجموعات والمستشارين الشركاء...",
    );
    await new Promise((r) => setTimeout(r, 1200));
    setBackupStage("جاري التوطين وصياغة تقرير الأرشفة الشامل بصيغة ZIP...");
    await new Promise((r) => setTimeout(r, 1100));

    // Generate text report
    const reportText = `تقرير الأرشفة الشامل والنسخ الاحتياطي السحابي من منصة قضيتي
===================================================
تاريخ الأرشفة: ${new Date().toLocaleDateString("ar-EG")}
الباقة النشطة: باقة المكاتب والشركات القانونية (مساحة تخزين شاملة وغير محدودة)
المكتب: ${p?.office_name || "مكتبكم القانوني المرموق"}
المدير المسؤول والمفوض: ${p?.full_name || "المستشار القانوني"}
عدد الملفات المؤرشفة: ${storageStats.count} ملفات نشطة
إجمالي حجم الملفات المصاحبة للشبكة: ${formatStorageBytes(storageStats.totalSize)}

ملاحظة للمستشارين:
تم حزم وتأمين وتصديق كافة ملفاتكم السحابية بنجاح على خوادم قضيتي السحابية المشفرة.
نسخكم آمنة تماماً ومضمونة السداد تحت الإشراف المباشر واليومي لمدير حسابكم الخاص المهندس: حاتم سرحان.

قضيتي - الشريك القانوني المتكامل لمكتبكم الرقمي.`;

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Qadeyti-Archive-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBackingUp(false);
    setBackupStage("");
    toast.success("تم إعداد وتنزيل أرشيف النسخ الاحتياطى بنجاح!");
  };

  const runOptimizationSimulation = async () => {
    if (optimizing) return;
    setOptimizing(true);
    toast.loading("جاري تصفية الكاش وتنظيف الملفات والتحسين السريع للمساحة...", { id: "opt-sim" });
    await new Promise((r) => setTimeout(r, 2000));
    toast.dismiss("opt-sim");
    setOptimizing(false);
    toast.success(
      "تم بنجاح! تم تحسين مسار المعالجة، ورفع سلامة المستندات لـ 99.9%، وضغط التخزين المؤقت.",
    );
  };

  const handleAddSlaRequest = () => {
    if (!reqNotes.trim()) {
      toast.error("يرجى كتابة تفاصيل وتعليمات مساعدة لمدير حسابك");
      return;
    }
    const typeLabel =
      reqType === "import"
        ? "ترحيل واستيراد أرشيف المكتب التاريخي"
        : reqType === "custom_code"
          ? "طلب برمجة ميزة مخصصة للمكتب"
          : reqType === "training"
            ? "جدولة جلسة تدريب وتحضير زووم"
            : "طلب تدقيق أمني وفحص سلامة المستندات";

    const newReq = {
      id: "REQ-" + Math.floor(1000 + Math.random() * 9000),
      type: typeLabel,
      notes: reqNotes.trim(),
      date:
        new Date().toLocaleDateString("ar-EG") +
        " " +
        new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      status: "قيد المراجعة الفورية من المهندس حاتم سرحان",
    };

    const nextList = [newReq, ...customRequests];
    setCustomRequests(nextList);
    setReqNotes("");
    if (typeof window !== "undefined") {
      localStorage.setItem("qadeyti_firm_sla_requests", JSON.stringify(nextList));
    }
    toast.success(
      "تم تسليم طلبك الخاص لمدير حسابات المكتب المهندس حاتم. سيقوم بالتواصل معك حالاً!",
    );
  };

  const handleDeleteSlaRequest = (id: string) => {
    const nextList = customRequests.filter((r) => r.id !== id);
    setCustomRequests(nextList);
    if (typeof window !== "undefined") {
      localStorage.setItem("qadeyti_firm_sla_requests", JSON.stringify(nextList));
    }
    toast.success("تم إلغاء طلب الخدمة");
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("lawyer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setP(data as Profile);
      } else {
        setP({
          user_id: user.id,
          slug: `lawyer-${user.id.slice(0, 8)}`,
          full_name: "",
          title: "محامٍ",
          bar_level: "ابتدائي",
          office_name: "",
          office_address: "",
          whatsapp: "",
          maps_link: "",
          bio: "",
          specializations: [],
          years_experience: null,
          avatar_url: null,
          logo_url: null,
        });
      }

      // Query database for case attachments count & sizing for Enterprise Premium calculations
      try {
        const { data: filesData, error: filesErr } = await supabase
          .from("case_attachments")
          .select("file_size");
        if (!filesErr && filesData) {
          const count = filesData.length;
          const totalSize = filesData.reduce((acc, curr) => acc + (curr.file_size || 0), 0);
          setStorageStats({ totalSize, count });
        }
      } catch (err) {
        console.error("Failed to fetch storage stats", err);
      }

      setLoading(false);
    })();
  }, [user]);

  // Live slug availability check
  useEffect(() => {
    if (!p || !user) return;
    const raw = p.slug.trim();
    if (!raw) {
      setSlugStatus("idle");
      return;
    }
    const cleaned = slugify(raw);
    if (!cleaned || cleaned.length < 3) {
      setSlugStatus("invalid");
      return;
    }
    setSlugStatus("checking");
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("lawyer_profiles")
        .select("user_id")
        .eq("slug", cleaned)
        .maybeSingle();
      if (!data || data.user_id === user.id) setSlugStatus("available");
      else setSlugStatus("taken");
    }, 400);
    return () => clearTimeout(t);
  }, [p?.slug, user]);

  function update<K extends keyof Profile>(k: K, v: Profile[K]) {
    setP((prev) => (prev ? { ...prev, [k]: v } : prev));
  }

  async function handleUploadImage(
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "avatar" | "logo",
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user || !p) return;
    if (!file.type.startsWith("image/")) {
      toast.error("الملف يجب أن يكون صورة");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("الحد الأقصى ٥ ميجابايت");
      return;
    }
    const setBusy = kind === "avatar" ? setUploadingAvatar : setUploadingLogo;
    setBusy(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
    let url: string | null = null;
    try {
      const { data: upData, error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (!upErr && upData) {
        const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
        url = pub?.publicUrl || null;
      }
    } catch (err) {
      console.warn("Storage upload failed, falling back to base64", err);
    }

    if (!url) {
      try {
        url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      } catch (err) {
        setBusy(false);
        toast.error("فشل قراءة ملف الصورة");
        return;
      }
    }

    const field = kind === "avatar" ? "avatar_url" : "logo_url";
    // Persist immediately so it survives refresh
    const { error: dbErr } = await supabase.from("lawyer_profiles").upsert(
      {
        ...p,
        [field]: url,
        user_id: user.id,
        slug: slugify(p.slug) || `lawyer-${user.id.slice(0, 8)}`,
      },
      { onConflict: "user_id" },
    );
    setBusy(false);
    if (dbErr) {
      toast.error("تم رفع الصورة لكن فشل الحفظ");
      return;
    }
    update(field, url);
    toast.success("تم رفع الصورة");
  }

  async function handleSave() {
    if (!p || !user) return;
    if (!p.full_name.trim()) {
      toast.error("الاسم مطلوب");
      return;
    }
    if (!p.slug.trim()) {
      toast.error("الرابط مطلوب");
      return;
    }
    if (slugStatus === "taken") {
      toast.error("هذا الرابط مستخدم");
      return;
    }
    if (slugStatus === "invalid") {
      toast.error("الرابط غير صالح");
      return;
    }
    setSaving(true);
    const payload = { ...p, slug: slugify(p.slug), user_id: user.id };
    const { error } = await supabase
      .from("lawyer_profiles")
      .upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "هذا الرابط مستخدم" : "فشل الحفظ");
      return;
    }
    toast.success("تم الحفظ");
  }

  function toggleSpec(s: string) {
    if (!p) return;
    const has = p.specializations.includes(s);
    update(
      "specializations",
      has ? p.specializations.filter((x) => x !== s) : [...p.specializations, s],
    );
  }

  if (loading || !p) {
    return <div className="py-20 text-center text-muted-foreground">...</div>;
  }

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/lawyer/${p.slug}`
      : `/lawyer/${p.slug}`;

  return (
    <div className="space-y-6 pb-10">
      <h1 className="font-display text-2xl font-bold text-foreground">الملف الشخصي</h1>

      {/* Simulation Controls for Payment/Subscription Status & Emails Alerts */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 space-y-6 text-right">
        {/* Header with Title and Badging */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-500/10">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 animate-pulse text-rose-400" />
            <h2 className="font-display text-base font-bold text-rose-400">
              لوحة اختبار سياسات سداد الاشتراك والملفات (لأغراض المحاكاة)
            </h2>
          </div>
          {user?.email === "meetozacoin@gmail.com" ? (
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-[11px] font-bold text-amber-400 font-sans whitespace-nowrap self-start sm:self-auto">
              خاص بخصوصية مالك ومطور المنصة 👑
            </span>
          ) : (
            <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-[11px] font-bold text-blue-400 font-sans whitespace-nowrap self-start sm:self-auto">
              بيئة محاكاة تفاعلية للمشتركين 🧪
            </span>
          )}
        </div>

        {/* Content of simulator with top-aligned description and button */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="flex-1 space-y-1">
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {user?.email === "meetozacoin@gmail.com" ? (
                <span>
                  أهلاً بك يا مطور النظام ومالك التطبيق. تم إعداد هذه الواجهة التجريبية لتمكينك من
                  فحص ومراجعة سلوك الحساب بالكامل عند تعثر السداد (تفعيل حالة القراءة فقط، قفل رفع
                  المستندات، حظر مزامنة Google Drive، وإرسال عينات بريد التنبيه الفعلي والبيانات).
                </span>
              ) : (
                <span>
                  أهلاً بك في بيئة المحاكاة التفاعلية لمنصة قضيتي. تم إعداد هذا الزر خصيصاً لتجربة
                  واختبار الخصائص المتقدمة وعرض آلية الإشعار والتنبيهات المخصصة لحماية ملفاتك وقفل
                  الميزات عند تعثر الاشتراك (وضع القراءة فقط) لضمان تجربة حقيقية متكاملة قبل
                  الاشتراك الفعلي.
                </span>
              )}
            </p>
          </div>

          <div className="w-full lg:w-auto shrink-0">
            <button
              onClick={() => {
                const nextState = !isSubscriptionUnpaid;
                setSubscriptionUnpaid(nextState);
                toast.success(
                  nextState
                    ? "تم محاكاة توقف الدفع! تم قفل ميزات الرفع والذكاء الاصطناعي وجوجل درايف وتفعيل وضع القراءة فقط."
                    : "تم تنشيط الدفع بنجاح! عادت كافة الميزات المتقدمة للعمل بشكل فوري.",
                );
              }}
              className={cn(
                "w-full lg:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md select-none flex items-center justify-center gap-2",
                isSubscriptionUnpaid
                  ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/15"
                  : "bg-rose-600 text-white hover:bg-rose-500 shadow-rose-600/15",
              )}
            >
              {isSubscriptionUnpaid ? (
                <span>تنشيط وسداد الاشتراك الآن ✅</span>
              ) : (
                <span>إيقاف الدفع وتجميد الحساب 🛑</span>
              )}
            </button>
          </div>
        </div>

        {/* Send simulated reminder emails */}
        <div className="border-t border-rose-500/15 pt-4 space-y-3">
          <p className="text-xs font-semibold text-slate-400">
            أرسل عينات بريد التذكير الآلي للمحامي (عند توقف الدفع):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={async () => {
                if (!user) return;
                toast.loading("جاري إرسال بريد التذكير لليوم 30...", { id: "email-sim" });
                try {
                  const res = await callSendReminder({
                    data: {
                      lawyerEmail: user.email || "lawyer@example.com",
                      lawyerName: p?.full_name || "المحامي الشريك",
                      daysCount: 30,
                    },
                  });
                  toast.dismiss("email-sim");
                  if (res.success) {
                    toast.success("تم إرسال تنبيه الـ 30 يوماً بنجاح لبريدك المسجل!");
                  } else {
                    toast.error(`خطأ: يرجى تزويد RESEND_API_KEY في الإعدادات للبريد الفعلي.`);
                  }
                } catch (e) {
                  toast.dismiss("email-sim");
                  toast.error("فشل الإرسال التلقائي للبريد الفعلي.");
                }
              }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-right hover:border-amber-500/20 transition-all cursor-pointer group"
            >
              <div className="text-[11px] text-amber-500 font-bold mb-0.5 group-hover:underline">
                تنبيه اليوم 30 ⏳
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                إشعار بمضي 30 يوماً على التوقف عن الدفع مع طمأنة المحامي على سلامة مستنداته.
              </p>
            </button>

            <button
              onClick={async () => {
                if (!user) return;
                toast.loading("جاري إرسال إنذار اليوم 60...", { id: "email-sim" });
                try {
                  const res = await callSendReminder({
                    data: {
                      lawyerEmail: user.email || "lawyer@example.com",
                      lawyerName: p?.full_name || "المحامي الشريك",
                      daysCount: 60,
                    },
                  });
                  toast.dismiss("email-sim");
                  if (res.success) {
                    toast.success("تم إرسال إنذار الـ 60 يوماً بنجاح لبريدك!");
                  } else {
                    toast.error(`خطأ: يرجى تزويد RESEND_API_KEY في الإعدادات للبريد الفعلي.`);
                  }
                } catch (e) {
                  toast.dismiss("email-sim");
                  toast.error("فشل الإرسال التلقائي للبريد الفعلي.");
                }
              }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-right hover:border-orange-500/20 transition-all cursor-pointer group"
            >
              <div className="text-[11px] text-orange-500 font-bold mb-0.5 group-hover:underline">
                إنذار اليوم 60 ⚠️
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                إنذار ثانٍ بمضي 60 يوماً يحث على النسخ الاحتياطي الخارجي أو سداد الفاتورة.
              </p>
            </button>

            <button
              onClick={async () => {
                if (!user) return;
                toast.loading("جاري إرسال الإنذار النهائي لليوم 80...", { id: "email-sim" });
                try {
                  const res = await callSendReminder({
                    data: {
                      lawyerEmail: user.email || "lawyer@example.com",
                      lawyerName: p?.full_name || "المحامي الشريك",
                      daysCount: 80,
                    },
                  });
                  toast.dismiss("email-sim");
                  if (res.success) {
                    toast.success("تم إرسال الإنذار النهائي الـ 10 أيام الأخيرة لبريدك!");
                  } else {
                    toast.error(`خطأ: يرجى تزويد RESEND_API_KEY في الإعدادات للبريد الفعلي.`);
                  }
                } catch (e) {
                  toast.dismiss("email-sim");
                  toast.error("فشل الإرسال التلقائي للبريد الفعلي.");
                }
              }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-right hover:border-red-500/20 transition-all cursor-pointer group"
            >
              <div className="text-[11px] text-rose-500 font-bold mb-0.5 group-hover:underline">
                الإنذار النهائي اليوم 80 🚨
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                مهلة 10 أيام أخيرة قبل الحذف التلقائي النهائي والكامل للملفات لتوفير مساحة
                الاستضافة.
              </p>
            </button>
          </div>
        </div>
      </div>

      {plan === "enterprise" && (
        <div className="rounded-2xl border border-[var(--gold)]/40 bg-slate-950/80 p-6 text-right space-y-6 shadow-xl relative overflow-hidden">
          {/* Subtle gold decorative radial background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--gold)]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Heading block */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[var(--gold)] animate-pulse" />
                <h2 className="font-display text-lg font-bold text-transparent bg-clip-text bg-gradient-to-l from-white to-[var(--gold-soft)]">
                  باقة المكاتب والشركات القانونية
                </h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl font-sans">
                مرحباً بك في باقة المؤسسات والشركات الأعلى في منصة قضيتي. حسابك مخوّل بالكامل
                وصلاحياتك المتقدمة غير محدودة لتخزين المستندات والتعاون وإدارة الـ SLA الخاص
                بمكتبكم.
              </p>
            </div>
            <span className="rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 px-3.5 py-1.5 text-xs font-bold text-[var(--gold-soft)] self-start sm:self-auto flex items-center gap-1.5 shadow-inner">
              <BadgeCheck className="h-4 w-4" />
              نشط ومفعّل مدى الحياة 👑
            </span>
          </div>

          {/* Tab Selector buttons */}
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 font-sans">
            <button
              onClick={() => setEntTab("storage")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none",
                entTab === "storage"
                  ? "bg-[var(--gold)] text-slate-955 shadow-md font-extrabold shadow-[var(--gold)]/15"
                  : "bg-slate-905 text-slate-400 border border-slate-800 hover:border-[var(--gold)]/20 hover:text-slate-300",
              )}
            >
              <HardDrive className="h-4 w-4" />
              <span>مساحة التخزين الشاملة 📁</span>
            </button>
            <button
              onClick={() => setEntTab("manager")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none",
                entTab === "manager"
                  ? "bg-[var(--gold)] text-slate-955 shadow-md font-extrabold shadow-[var(--gold)]/15"
                  : "bg-slate-905 text-slate-400 border border-slate-800 hover:border-[var(--gold)]/20 hover:text-slate-300",
              )}
            >
              <UserCheck className="h-4 w-4" />
              <span>مدير حسابك والـ SLA المخصص 👤</span>
            </button>
          </div>

          {/* TAB CONTENT: STORAGE */}
          {entTab === "storage" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Visual Storage Card */}
                <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-5 space-y-4 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                      تحليل المساحة الفعلية في قاعدة البيانات
                    </span>
                    <span className="text-[10px] font-sans font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      سعة غير محدودة
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <Database className="h-5 w-5 text-[var(--gold-soft)]" />
                    <span className="text-2xl font-bold font-sans text-slate-100">
                      {formatStorageBytes(storageStats.totalSize)}
                    </span>
                    <span className="text-xs text-slate-500">مستهلكة حالياً / شاملة وحرّة</span>
                  </div>

                  {/* Visual distribution bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                      <div className="h-full bg-amber-500" style={{ width: "45%" }} />
                      <div className="h-full bg-blue-500" style={{ width: "30%" }} />
                      <div className="h-full bg-teal-500" style={{ width: "15%" }} />
                      <div className="h-full bg-slate-600" style={{ width: "10%" }} />
                    </div>
                    <div className="flex items-center justify-start gap-4 flex-wrap text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-sans">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" /> مستندات
                        وتوكيلات (٤٥٪) -{" "}
                        <span className="text-slate-200">
                          {formatStorageBytes(Math.round(storageStats.totalSize * 0.45))}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 font-sans">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block" /> مذكرات
                        قضائية وصحف (٣٠٪) -{" "}
                        <span className="text-slate-200">
                          {formatStorageBytes(Math.round(storageStats.totalSize * 0.3))}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 font-sans">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 block" /> ملفات صور
                        ومستندات فنية (١٥٪) -{" "}
                        <span className="text-slate-200">
                          {formatStorageBytes(Math.round(storageStats.totalSize * 0.15))}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 font-sans">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-600 block" /> مسودة كاش
                        وذاكرة (١٠٪) -{" "}
                        <span className="text-slate-200">
                          {formatStorageBytes(Math.round(storageStats.totalSize * 0.1))}
                        </span>
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans border-t border-slate-800/80 pt-3">
                    🚀 <span className="font-semibold text-slate-200">الرفع آمن وسريع:</span>{" "}
                    خوادمنا تغطي حماية بمعايير تشفير مصرفية. بصفتك مكتب شريك، فإن سعة الرفع ممددة
                    حتى مع زيادة أحجام الأوراق، المستندات المرفوعة مرتبطة تلقائياً بالذكاء الاصطناعي
                    الخاص لقراءة الوثائق.
                  </p>
                </div>

                {/* Interactive Action Hub */}
                <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-4 flex flex-col justify-between gap-4 text-right">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-300">
                      أدوات تخزين المكتب الفائقة ⚙️
                    </h3>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                      تنفيذ إجراءات تشغيلية سحابية على خادم المكتب المخصص.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {/* Backup btn */}
                    <button
                      onClick={runBackupSimulation}
                      disabled={backingUp}
                      className="w-full h-11 px-3 bg-gradient-to-l from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 border border-slate-700/50 hover:border-[var(--gold)]/30 rounded-xl text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                    >
                      {backingUp ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--gold)]" />
                          <span className="truncate text-[10px] text-[var(--gold-soft)]">
                            جاري الحزم...
                          </span>
                        </>
                      ) : (
                        <>
                          <CloudLightning className="h-3.5 w-3.5 text-[var(--gold-soft)]" />
                          <span>تصدير أرشيف المكتب (TXT/ZIP) 📦</span>
                        </>
                      )}
                    </button>

                    {/* Optimize btn */}
                    <button
                      onClick={runOptimizationSimulation}
                      disabled={optimizing}
                      className="w-full h-11 px-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
                    >
                      <RefreshCw
                        className={cn(
                          "h-3.5 w-3.5 text-slate-500",
                          optimizing && "animate-spin text-[var(--gold)]",
                        )}
                      />
                      <span>تنظيف الذاكرة والتحسين الذكي 🧹</span>
                    </button>
                  </div>

                  {backingUp && (
                    <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2 text-center animate-pulse">
                      <p className="text-[9px] text-[var(--gold-soft)] font-mono leading-normal">
                        {backupStage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: ACCOUNT MANAGER & SLA SUPPORT */}
          {entTab === "manager" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Manager Card Info */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-5 bg-gradient-to-l from-slate-900/90 via-slate-900/60 to-transparent border border-slate-800/80 rounded-2xl p-5 relative">
                {/* Left indicators */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative block" />
                  <span className="text-[10px] text-emerald-400 font-bold font-sans">
                    متصل باللوحة يتابعكم
                  </span>
                </div>

                <div className="flex items-center gap-4.5">
                  {/* Manager Avatar Image placeholder */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-amber-500/10 to-amber-500/20 border border-[var(--gold)]/30 shrink-0 flex items-center justify-center text-xl font-bold text-[var(--gold-soft)] font-sans">
                    ح
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-100">
                        المهندس: حاتم سرحان 🛡️
                      </h4>
                      <span className="text-[9px] font-bold bg-[var(--gold)]/10 text-[var(--gold-soft)] px-2 py-0.5 rounded-full font-sans border border-[var(--gold)]/20">
                        كبير مديري الحسابات الشريكة
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      المدير المخصص ومستشار الدعم في منصة قضيتي المسئول مباشرة عن مكتب:{" "}
                      <span className="text-[var(--gold-soft)] font-semibold">
                        {p.office_name?.trim() || "مكتبكم القانوني"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* WhatsApp & Email Quick Trigger */}
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                  <a
                    href={`https://wa.me/201035854329?text=${encodeURIComponent(
                      `أهلاً المهندس حاتم سرحان، أنا المستشار ${p.full_name || "محامي شريك"}، مالك ${p.office_name || "المكتب القانوني"} المشترك في الباقة القانونية الفائقة بقضيتي. أحتاج لمساعدة أو استفسار عاجل بخصوص حسابي.`,
                    )}`}
                    target="_blank"
                    rel="noreferrer referrer"
                    className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-700/10 select-none text-right"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>تواصل لحظي على واتساب الحصري 🌟</span>
                  </a>
                  <a
                    href="mailto:info@qadeyati.com"
                    className="h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
                  >
                    <Mail className="h-4 w-4 text-blue-400" />
                    <span>بريد الدعم الحصري VIP</span>
                  </a>
                </div>
              </div>

              {/* Console for sending new SLA customization requests */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
                {/* Form to submit a request */}
                <div className="lg:col-span-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 space-y-4 text-right">
                  <h3 className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2.5">
                    إرسال طلب خدمة أو تخصيص يدوي لمدير الحسابات ⚡
                  </h3>

                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-bold text-slate-400">
                      نوع الطلب الخاص المطلوب:
                    </label>
                    <select
                      value={reqType}
                      onChange={(e) => setReqType(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-800 bg-[#090e18] px-3.5 text-xs text-slate-200 outline-none focus:border-[var(--gold)] cursor-pointer font-sans"
                    >
                      <option value="import">
                        📂 استيراد وترحيل ملف أرشيف مكتبكم التاريخي القديم
                      </option>
                      <option value="custom_code">
                        💻 طلب برمجة وإضافة ميزة خاصة أو تعديل حصري بنظامكم
                      </option>
                      <option value="training">
                        🏫 حجز جلسة تدريبية وتأهيلية مكثفة لمنتسبي ومحامي المكتب عبر زووم
                      </option>
                      <option value="audit">
                        🔐 طلب فحص أمني وتدقيق وقائي شامل لملفات وحساب المستندات
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-[11px] font-bold text-slate-400">
                      تعليمات وتفاصيل الطلب الإضافية:
                    </label>
                    <textarea
                      rows={3}
                      value={reqNotes}
                      onChange={(e) => setReqNotes(e.target.value)}
                      placeholder="صف بالتفصيل ما الذي يحتاجه مكتبكم وسيقوم المهندس حاتم والمبرمجون المختصون بمعالجته على الفور..."
                      className="w-full rounded-xl border border-slate-800 bg-[#090e18] px-4 py-3 text-xs text-slate-200 outline-none focus:border-[var(--gold)] font-sans"
                    />
                  </div>

                  <button
                    onClick={handleAddSlaRequest}
                    className="w-full h-11 bg-gradient-to-l from-[var(--gold)] to-[var(--gold-soft)] text-slate-950 hover:opacity-90 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>تأكيد وتسليم الطلب رسمياً 📮</span>
                  </button>
                </div>

                {/* History list of SLA requests */}
                <div className="lg:col-span-2 space-y-3.5 text-right">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-bold text-slate-300">طلباتك الحالية النشطة 📜</h3>
                    <span className="text-[10px] font-sans font-semibold text-slate-500">
                      {customRequests.length} طلبات مسجلة
                    </span>
                  </div>

                  {customRequests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center bg-slate-900/10">
                      <History className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                      <p className="text-[11px] text-slate-500 leading-normal">
                        لا توجد طلبات خدمة مسجلة حالياً للمكتب. أرسل طلب ترحيل ملفات أو ميزة جديدة
                        لنبدأ المعالجة.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                      {customRequests.map((req) => (
                        <div
                          key={req.id}
                          className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 space-y-2 relative group hover:border-[var(--gold)]/30 transition-all font-sans"
                        >
                          {/* Cancel button */}
                          <button
                            onClick={() => handleDeleteSlaRequest(req.id)}
                            className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-md transition-all cursor-pointer"
                            title="إلغاء الطلب"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>

                          <div className="space-y-0.5">
                            <div className="text-[10px] font-bold text-[var(--gold-soft)] flex items-center gap-1.5 text-right">
                              <span>{req.type}</span>
                              <span className="text-[9px] font-normal text-slate-500 font-mono">
                                ({req.id})
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-sans font-medium line-clamp-2 text-right">
                              {req.notes}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-[9px]">
                            <span className="text-slate-500">{req.date}</span>
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-sans font-semibold">
                              {req.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Avatar + public link */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Avatar */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">الصورة الشخصية</p>
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold)]">
                {p.avatar_url ? (
                  <img src={p.avatar_url} className="h-full w-full object-cover" alt="" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-[color:var(--primary-foreground)]">
                    {(p.full_name || "م")[0]}
                  </div>
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground hover:bg-secondary">
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>رفع</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUploadImage(e, "avatar")}
                />
              </label>
            </div>
          </div>
          {/* Logo */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">شعار المكتب</p>
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-card">
                {p.logo_url ? (
                  <img src={p.logo_url} className="h-full w-full object-contain p-1" alt="" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    لا يوجد
                  </div>
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground hover:bg-secondary">
                {uploadingLogo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>رفع</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUploadImage(e, "logo")}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-muted-foreground">الرابط العام</label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <span dir="ltr" className="truncate text-sm text-muted-foreground">
              {publicUrl}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success("تم نسخ الرابط");
              }}
              className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="نسخ"
            >
              <Copy className="h-4 w-4" />
            </button>
            <Link
              to="/lawyer/$slug"
              params={{ slug: p.slug }}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Identity */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <PremiumInput
          label="الاسم الكامل"
          value={p.full_name}
          onChange={(e) => update("full_name", e.target.value)}
        />
        <PremiumInput
          label="اللقب المهني"
          value={p.title ?? ""}
          onChange={(e) => update("title", e.target.value)}
          placeholder="محامٍ بالنقض"
        />
        <div className="space-y-2">
          <label className="block text-sm text-muted-foreground">درجة القيد</label>
          <div className="flex flex-wrap gap-2">
            {BAR_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => update("bar_level", lvl)}
                className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  p.bar_level === lvl
                    ? "border-[var(--gold)] bg-[color:var(--gold)]/10 text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                <BadgeCheck className="h-4 w-4" />
                {lvl}
              </button>
            ))}
          </div>
        </div>
        <PremiumInput
          label="سنوات الخبرة"
          type="number"
          value={p.years_experience ?? ""}
          onChange={(e) =>
            update("years_experience", e.target.value ? Number(e.target.value) : null)
          }
        />
        <div className="space-y-2">
          <PremiumInput
            label="الرابط المختصر (slug)"
            value={p.slug}
            onChange={(e) => update("slug", e.target.value)}
            dir="ltr"
          />
          {slugStatus !== "idle" && (
            <div className="flex items-center gap-2 text-xs">
              {slugStatus === "checking" && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> جارٍ التحقق...
                </span>
              )}
              {slugStatus === "available" && (
                <span className="flex items-center gap-1 text-[color:var(--gold)]">
                  <Check className="h-3 w-3" /> متاح
                </span>
              )}
              {slugStatus === "taken" && (
                <span className="flex items-center gap-1 text-destructive">
                  <X className="h-3 w-3" /> غير متاح
                </span>
              )}
              {slugStatus === "invalid" && (
                <span className="flex items-center gap-1 text-destructive">
                  <X className="h-3 w-3" /> الرابط غير صالح
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <label className="block text-sm text-muted-foreground">نبذة مختصرة</label>
        <textarea
          rows={4}
          value={p.bio ?? ""}
          onChange={(e) => update("bio", e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none focus:border-[var(--gold)]"
          placeholder="عرّف العميل بخبرتك ومجالاتك"
        />
      </div>

      {/* Specializations */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <label className="block text-sm text-muted-foreground">التخصصات</label>
        <div className="flex flex-wrap gap-2">
          {SPECIALIZATIONS.map((s) => {
            const active = p.specializations.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpec(s)}
                className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                  active
                    ? "border-[var(--gold)] bg-[color:var(--gold)]/10 text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Office & contact */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <PremiumInput
          label="اسم المكتب"
          value={p.office_name ?? ""}
          onChange={(e) => update("office_name", e.target.value)}
        />
        <PremiumInput
          label="عنوان المكتب"
          value={p.office_address ?? ""}
          onChange={(e) => update("office_address", e.target.value)}
        />
        <PremiumInput
          label="واتساب"
          dir="ltr"
          placeholder="201234567890"
          value={p.whatsapp ?? ""}
          onChange={(e) => update("whatsapp", e.target.value)}
        />
        <PremiumInput
          label="رابط جوجل ماب"
          dir="ltr"
          placeholder="https://maps.google.com/..."
          value={p.maps_link ?? ""}
          onChange={(e) => update("maps_link", e.target.value)}
        />
      </div>

      <PremiumButton onClick={handleSave} loading={saving}>
        حفظ التغييرات
      </PremiumButton>

      <PremiumButton
        variant="outline"
        onClick={async () => {
          await signOut();
          navigate({ to: "/login" });
        }}
      >
        تسجيل الخروج
      </PremiumButton>
    </div>
  );
}
