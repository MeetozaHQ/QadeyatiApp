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
        <div className="rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-l from-[var(--gold)]/10 via-[var(--gold)]/5 to-transparent p-5 text-right space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--gold)] animate-pulse" />
              باقة المكاتب والشركات القانونية
            </h2>
            <span className="rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 px-3 py-1 text-xs font-semibold text-[var(--gold-soft)]">
              نشط ومفعّل مدى الحياة
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            مرحباً بك في المستوى الاحترافي الأعلى لمنصة قضيتي. حسابك يمتلك وصولاً كاملاً لجميع
            الأدوات، مع تفعيل ميزات التعاون والرقابة للمكتب بالكامل.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3.5 space-y-1.5">
              <span className="text-xs text-slate-500 font-bold block">مساحة التخزين الشاملة</span>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-[var(--gold-soft)]" />
                <span className="text-sm text-slate-200 font-sans font-semibold">
                  0.2 جيجابايت مستهلكة / غير محدودة
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                جميع الملفات وصور التوكيلات ترفع على خوادم سحابية آمنة ومحمية.
              </p>
            </div>

            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3.5 space-y-1.5">
              <span className="text-xs text-slate-500 font-bold block">
                مدير الحساب المخصص لمكتبكم
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-200 font-semibold text-right">
                  المستشار م. عاصم التهامي
                </span>
              </div>
              <div className="flex gap-2.5 pt-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <PhoneCall className="h-3.5 w-3.5 text-blue-400" /> +201012345678
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-blue-400" /> info@qadeyati.com
                </span>
              </div>
            </div>
          </div>
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
