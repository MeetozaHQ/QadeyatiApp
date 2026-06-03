import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { adminActivateSubscription } from "@/lib/admin.functions";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Crown,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Calendar,
  Sparkles,
  Search,
  CheckCircle,
} from "lucide-react";

export const Route = createFileRoute("/_app/admin")({
  component: AdminPage,
});

export function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const callActivate = useServerFn(adminActivateSubscription);

  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "pro" | "enterprise">("pro");
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<string | null>(null);

  // Strict local safety gate
  const isAdmin = user?.email?.toLowerCase().trim() === "meetozacoin@gmail.com";

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("عذراً، غير مصرح لك بالقيام بهذا الإجراء.");
      return;
    }

    if (!email.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني للعميل.");
      return;
    }

    setLoading(true);
    setSuccessResult(null);

    try {
      const response = await callActivate({
        data: {
          email: email.trim(),
          plan: selectedPlan,
          durationMonths: Number(durationMonths),
        },
      });

      if (response && response.success) {
        setSuccessResult(response.message);
        toast.success("تم تفعيل الاشتراك وتحديث رصيد العميل بنجاح!");
        // Reset form but keep experience fluid
        setEmail("");
      } else {
        toast.error("حدث خطأ أثناء تنشيط الباقة.");
      }
    } catch (err: unknown) {
      console.error("Admin activation error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "فشلت عملية التنشيط، يرجى التحقق من صحة المدخلات.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Rendering for non-admin accounts to ensure perfect security and elegance
  if (!user || !isAdmin) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6"
        dir="rtl"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-6 rounded-3xl border border-red-500/20 bg-red-500/5 max-w-md w-full relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 h-16 w-16 bg-red-500/5 rounded-full blur-xl"></div>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="font-display text-lg font-black text-white mb-2">أنت غير مصرح بالدخول</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            عذراً، هذه الصفحة مخصصة للمطورين وإدارة المنصة الرسميين فقط ولا تتوفر صلاحية الدخول
            لحسابكم المعين.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowRight className="h-4 w-4 shrink-0" />
            <span>العودة للوحة التحكم الرئيسية</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right pb-10" dir="rtl">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center">
            <Crown className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-bold text-[var(--gold-soft)] font-mono uppercase tracking-wider">
            لوحة قيادة الإدارة والتحكم
          </span>
        </div>
        <Link
          to="/profile"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowRight className="h-4 w-4" />
          <span>الرجوع للملف الشخصي</span>
        </Link>
      </div>

      {/* Main Title Section */}
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-black text-white tracking-tight">
          تفعيل الاشتراكات الجارية والترقيات
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
          أهلاً بك يا مدير النظام. يمكنك استخدام هذا النموذج لتفعيل باقات العملاء المدفوعة بعد
          التحقق من سداد الرسوم عبر فودافون كاش، إنستاباي، أو التحويل البنكي يدوياً.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Simple Activation Form - 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleActivateSubmit}
            className="rounded-3xl border border-slate-800 bg-[#12151C]/40 p-5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md"
          >
            {/* Ambient upper glowing ring */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-[60%] bg-gradient-to-r from-transparent via-[var(--gold)]/20 to-transparent"></div>

            <div className="space-y-6">
              {/* Form header */}
              <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
                <div className="p-2 w-10 h-10 rounded-xl bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    تنشيط فوري لباقة العميل
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    يرجى كتابة البريد بدقة متناهية لمطابقة العضو بالنظام
                  </p>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="space-y-4">
                {/* Email address field */}
                <div className="space-y-1.5 text-right">
                  <label htmlFor="client-email" className="text-xs font-bold text-slate-300">
                    البريد الإلكتروني للعميل المستهدف:
                  </label>
                  <div className="relative">
                    <input
                      id="client-email"
                      type="email"
                      required
                      placeholder="lawyer@example.com"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-right h-11 rounded-xl border border-border bg-slate-950/50 pr-4 pl-10 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground/40 focus:border-[var(--gold)] focus:bg-background transition-all font-sans"
                    />
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Grid for Package & Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dropdown for Qadeyti plans */}
                  <div className="space-y-1.5 text-right">
                    <label htmlFor="client-plan" className="text-xs font-bold text-slate-300">
                      باقة الاشتراك المطلوبة:
                    </label>
                    <div className="relative">
                      <select
                        id="client-plan"
                        value={selectedPlan}
                        onChange={(e) =>
                          setSelectedPlan(e.target.value as "basic" | "pro" | "enterprise")
                        }
                        className="w-full h-11 rounded-xl border border-border bg-slate-950/50 px-4 text-sm text-white select-none outline-none ring-offset-background focus:border-[var(--gold)] transition-all font-sans cursor-pointer appearance-none"
                      >
                        <option
                          value="basic"
                          className="bg-slate-900 border-none text-slate-100 py-2"
                        >
                          الباقة الأساسية (Lawyer Basic)
                        </option>
                        <option
                          value="pro"
                          className="bg-slate-900 border-none text-slate-100 py-2"
                        >
                          باقة المحامي المحترف (Pro Lawyer) ⭐
                        </option>
                        <option
                          value="enterprise"
                          className="bg-slate-900 border-none text-slate-100 py-2"
                        >
                          مكاتب المحاماة والشركات (Enterprise) 👑
                        </option>
                      </select>
                      <div className="pointer-events-none absolute left-4 top-4.5 flex h-2.5 w-2.5 items-center justify-center text-slate-400">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Duration selects */}
                  <div className="space-y-1.5 text-right">
                    <label htmlFor="client-duration" className="text-xs font-bold text-slate-300">
                      مدة تفعيل الاشتراك (أشهر):
                    </label>
                    <div className="relative">
                      <select
                        id="client-duration"
                        value={durationMonths}
                        onChange={(e) => setDurationMonths(Number(e.target.value))}
                        className="w-full h-11 rounded-xl border border-border bg-slate-950/50 px-4 text-sm text-white select-none outline-none ring-offset-background focus:border-[var(--gold)] transition-all font-sans cursor-pointer appearance-none"
                      >
                        <option value={1} className="bg-slate-900 text-slate-100 py-2">
                          شـهر واحد (١)
                        </option>
                        <option value={3} className="bg-slate-900 text-slate-100 py-2">
                          ٣ أشـهر (ربع سنوي)
                        </option>
                        <option value={6} className="bg-slate-900 text-slate-100 py-2">
                          ٦ أشـهر (نصف سنوي)
                        </option>
                        <option value={12} className="bg-slate-900 text-slate-100 py-2">
                          ١٢ شـهراً (سـنوي محفز) 🌟
                        </option>
                        <option value={24} className="bg-slate-900 text-slate-100 py-2">
                          ٢٤ شـهراً (سـنتين كاملة)
                        </option>
                      </select>
                      <div className="pointer-events-none absolute left-4 top-4.5 flex h-2.5 w-2.5 items-center justify-center text-slate-400">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Active Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative h-12 flex items-center justify-center gap-2 px-6 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[var(--gold-soft)] hover:from-[var(--gold-soft)] hover:to-[var(--gold)] text-slate-950 font-bold text-sm transition-all shadow-md shadow-[var(--gold)]/10 hover:shadow-[var(--gold)]/20 active:scale-[0.98] cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="animate-spin h-4.5 w-4.5 text-slate-950"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>جاري تفعيل ومزامنة الاشتراك...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5" />
                    <span>تفعيل الاشتراك ومزامنة الصلاحيات فوراً</span>
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Success state overview panel */}
          <AnimatePresence>
            {successResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3 md:gap-4 text-emerald-400"
              >
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">نجحت العملية!</h4>
                  <p className="text-[11px] leading-relaxed text-slate-300">{successResult}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Informational Guidelines Card - 1 Col */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-[#12151C]/60 p-5 shadow-xl backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-bold text-white font-display border-b border-slate-850 pb-2 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
              <span>إرشادات التفعيل الآمن</span>
            </h3>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <div className="flex gap-2">
                <span className="text-[var(--gold)]">•</span>
                <p className="text-[11px]">
                  يجب قبل تفعيل الباقة التحقق المسبق من استلام القيمة المحولة كاملة عبر المحفظة أو
                  البنك.
                </p>
              </div>

              <div className="flex gap-2">
                <span className="text-[var(--gold)]">•</span>
                <p className="text-[11px]">
                  بمجرد النقر على زر "تفعيل"، يتم تخليق وتوثيق الصلاحيات في خوادم Supabase Auth
                  مباشرةً.
                </p>
              </div>

              <div className="flex gap-2">
                <span className="text-[var(--gold)]">•</span>
                <p className="text-[11px]">
                  سيتمكن العالِم في قضيتي من ممارسة كافة الامتيازات فور قيامه بفتح التطبيق مجدداً في
                  متصفحه.
                </p>
              </div>

              <div className="flex gap-2">
                <span className="text-[var(--gold)]">•</span>
                <p className="text-[11px]">
                  إن التفعيل يقوم تلقائياً بإلغاء "وضع القراءة فقط" ويزيل أي حظر/تجميد بسب عدم دفع
                  الاشتراك فورا.
                </p>
              </div>
            </div>
          </div>

          {/* Quick link buttons shortcut */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/20 p-4 space-y-3">
            <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              مفاتيح الدعم السريع
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  try {
                    window.open("https://wa.me/201035854329", "_blank");
                  } catch (err) {
                    console.error("Failed to open WhatsApp:", err);
                  }
                }}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-[10px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer text-center"
              >
                محادثة الدعم الرسمية لواتساب
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
