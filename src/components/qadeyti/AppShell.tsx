import { useState, type ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { useTrial, type QadeytiPlan } from "@/hooks/use-trial";
import { Sparkles, Command, Check, ShieldAlert, X, Users, MessageSquare } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { isPremium, plan, setPlan, limits, simulatedLawyerId, firmLawyers, cancelImpersonation } =
    useTrial();
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [couponError, setCouponError] = useState("");

  const activeSimulatedLawyer =
    simulatedLawyerId !== "owner" ? firmLawyers.find((l) => l.id === simulatedLawyerId) : null;

  const handleApplyCoupon = () => {
    setCouponError("");
    const cleaned = coupon.trim().toUpperCase();
    if (cleaned === "EGYPT") {
      setCouponSuccess(true);
      setTimeout(() => {
        setPlan("basic");
        setShowBillingModal(false);
        setCouponSuccess(false);
        setCoupon("");
      }, 1500);
    } else if (cleaned === "FREE") {
      setCouponSuccess(true);
      setTimeout(() => {
        setPlan("free");
        setShowBillingModal(false);
        setCouponSuccess(false);
        setCoupon("");
      }, 1500);
    } else if (cleaned === "PRO" || cleaned === "QADEYTI2026") {
      setCouponSuccess(true);
      setTimeout(() => {
        setPlan("pro");
        setShowBillingModal(false);
        setCouponSuccess(false);
        setCoupon("");
      }, 1500);
    } else {
      setCouponError("كود الخصم غير صحيح. جرب كود: EGYPT لتفعيل الباقة الأساسية");
    }
  };

  const handleSelectPlan = (selectedPlan: QadeytiPlan) => {
    setCouponSuccess(true);
    setTimeout(() => {
      setPlan(selectedPlan);
      setShowBillingModal(false);
      setCouponSuccess(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F5F1E8] font-sans antialiased">
      {/* Global premium badge for active premium subscribers */}
      {isPremium && (
        <div
          dir="rtl"
          className="w-full py-2 px-4 text-center text-xs font-bold bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300 flex items-center justify-center gap-2 flex-wrap"
        >
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            تم تفعيل الاشتراك المميز بنجاح لـ قضيتي :{" "}
            <span className="text-[var(--gold)]">{limits.label}</span>
          </span>
          <button
            onClick={() => setPlan("free")}
            className="mr-3 text-[10px] text-slate-500 hover:text-slate-300 underline font-sans cursor-pointer"
          >
            (تبديل للباقة المجانية)
          </button>
        </div>
      )}

      {/* Sub-Lawyer Simulation/Impersonation Banner */}
      {activeSimulatedLawyer && (
        <div
          dir="rtl"
          className="w-full py-2.5 px-4 text-center text-xs font-medium bg-blue-650/20 border-b border-blue-500/30 text-blue-300 flex items-center justify-between gap-3 flex-wrap"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
            <span className="truncate text-[11px]">
              أنت تتصفح الحساب الآن بصلاحيات:{" "}
              <strong className="text-white font-bold">{activeSimulatedLawyer.name}</strong> (
              {activeSimulatedLawyer.role})
            </span>
          </div>
          <button
            onClick={() => cancelImpersonation()}
            className="shrink-0 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/40 rounded px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer"
          >
            إنهاء المحاكاة ↩️
          </button>
        </div>
      )}

      <TopBar />
      <main className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-5xl px-4 pb-28 pt-4">
        {children}
      </main>
      <BottomNav />

      {/* Subscription/Billing Drawer Modal Container */}
      {showBillingModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 w-full backdrop-blur-sm overflow-y-auto"
          dir="rtl"
        >
          <div className="relative w-full max-w-md rounded-t-3xl border-t border-border bg-[#0C101A] p-5 text-right shadow-2xl animate-in slide-in-from-bottom duration-350 max-h-[90dvh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-[var(--gold)]">
                  <Command className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-white font-display">
                  اختر وتنشيط باقتك المفضلة
                </h3>
              </div>
              <button
                onClick={() => setShowBillingModal(false)}
                className="rounded-lg p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Trial & Package Content */}
            <div className="space-y-3.5">
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  بصفتك مستخدمًا حاليًا، يمكنك تجربة وتفعيل أي من الباقات التالية مجاناً بالكامل
                  لأغراض الاختبار والعرض التقديمي. بنقرة واحدة ستقوم بتفعيل الباقة المناسبة لك.
                </p>
              </div>

              {/* Plans List */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  الباقات والاشتراكات المتاحة للاختبار:
                </h4>

                {/* 1. Free Plan */}
                <div
                  onClick={() => handleSelectPlan("free")}
                  className={`rounded-xl border p-3 cursor-pointer transition-all hover:bg-slate-900/40 text-right ${
                    plan === "free"
                      ? "border-[var(--gold)] bg-[var(--gold)]/5"
                      : "border-slate-800 bg-[#070a12]"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white">الباقة المجانية (Free)</span>
                    <span className="text-[10px] font-bold text-slate-400">مجانًا</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    محدودة بـ (٣ قضايا كحد أقصى، و ١٥ محادثة للمساعد الذكي شهرياً، وبدون ربط Google
                    Drive).
                  </p>
                </div>

                {/* 2. Basic Plan */}
                <div
                  onClick={() => handleSelectPlan("basic")}
                  className={`rounded-xl border p-3 cursor-pointer transition-all hover:bg-slate-900/40 text-right relative overflow-hidden ${
                    plan === "basic"
                      ? "border-[var(--gold)] bg-[var(--gold)]/5"
                      : "border-slate-800 bg-[#070a12]"
                  }`}
                >
                  <div className="absolute top-0 left-0 bg-red-500 text-white text-[8px] font-bold py-0.5 px-2 rounded-br-lg tracking-tight">
                    الأكثر طلباً ⭐
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white">
                      الباقة الفردية للـمُحامي (Basic)
                    </span>
                    <span className="text-[10px] font-bold text-[var(--gold-soft)]">
                      ١٤٩ ج.م / شهر
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    إدارة حتى ٥٠ قضية نشطة، وعملاء بلا حدود، المساعد القانوني (١٠٠ طلب/شهرياً)،
                    مزامنة وحفظ المرفقات على سحابة Google Drive الشخصية.
                  </p>
                </div>

                {/* 3. Pro Plan */}
                <div
                  onClick={() => handleSelectPlan("pro")}
                  className={`rounded-xl border p-3 cursor-pointer transition-all hover:bg-slate-900/40 text-right ${
                    plan === "pro"
                      ? "border-[var(--gold)] bg-[var(--gold)]/5"
                      : "border-slate-800 bg-[#070a12]"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white">باقة المحامي المحترف (Pro)</span>
                    <span className="text-[10px] font-bold text-emerald-400">٢٩٩ ج.م / شهر</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    للنشاط المكثف والذكاء الاصطناعي الدائم (٦٠٠ طلب/شهرياً بميزات تحليل وتلخيص
                    الملفات الضخمة)، قضايا بلا حدود وتكامل Google Drive الكامل.
                  </p>
                </div>

                {/* 4. Enterprise Plan */}
                <div
                  onClick={() => handleSelectPlan("enterprise")}
                  className={`rounded-xl border p-3 cursor-pointer transition-all hover:bg-slate-900/40 text-right ${
                    plan === "enterprise"
                      ? "border-[var(--gold)] bg-[var(--gold)]/5"
                      : "border-slate-800 bg-[#070a12]"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white">
                      باقة المكاتب والشركات (Enterprise)
                    </span>
                    <span className="text-[10px] font-bold text-blue-400">٢٤٩ ج.م / محامٍ</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed flex items-center gap-1.5 flex-wrap">
                    <Users className="h-3 w-3 shrink-0 text-blue-400" />
                    <span>
                      لوحة تحكم رئيسية لصاحب المكتب لإدارة طواقم العمل والقضايا والجلسات، مع{" "}
                      <strong>٦٠٠ طلب للمستشار الذكي شهرياً</strong> لكل محامٍ.
                    </span>
                  </p>
                </div>
              </div>

              {/* Coupon input */}
              <div className="space-y-2 pt-2 border-t border-slate-900">
                <label className="text-[11px] font-semibold text-slate-300">
                  أدخل كود كوبون التفعيل:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="مثال: EGYPT أو FREE"
                    className="flex-1 rounded-xl border border-slate-800 bg-[#090C14] px-3.5 py-2 text-xs font-bold font-mono text-white placeholder:text-slate-600 focus:border-[var(--gold)] focus:outline-none"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="rounded-xl bg-slate-900 border border-border px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 cursor-pointer"
                  >
                    تطبيق
                  </button>
                </div>
                {couponError && (
                  <p className="text-[10px] font-semibold text-red-400">{couponError}</p>
                )}
                {couponSuccess && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold p-2 text-center">
                    ✓ تم التنشيط وتحديث الباقة بنجاح!
                  </div>
                )}
                <p className="text-[10px] text-slate-500">
                  كود الخصم لتفعيل الباقة الأساسية:{" "}
                  <code className="bg-[#090C14] px-1 py-0.5 rounded text-[var(--gold)]">EGYPT</code>
                </p>
              </div>

              {/* Manual payment page link */}
              <div className="pt-4 mt-2 border-t border-slate-900 flex flex-col gap-2">
                <p className="text-[10px] text-slate-400 text-center">
                  تريد إتمام الدفع الفعلي وتنشيط حسابك عبر وسائل الدفع الرسمية؟
                </p>
                <button
                  onClick={() => {
                    setShowBillingModal(false);
                    navigate({ to: "/payment" });
                  }}
                  className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[var(--gold-soft)] hover:from-[var(--gold-soft)] hover:to-[var(--gold)] text-slate-950 font-bold text-xs shadow-md transition-all active:scale-[0.98] select-none text-center cursor-pointer"
                >
                  <span>أكمل السداد والتفعيل اليدوي الآن 💳</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
