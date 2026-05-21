import { useState, type ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { useTrial } from "@/hooks/use-trial";
import { Sparkles, Command, Check, Gift, ShieldAlert, X } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const { isTrialExpired, daysRemaining, isPremium, togglePremium } = useTrial();
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = () => {
    setCouponError("");
    const cleaned = coupon.trim().toUpperCase();
    if (cleaned === "EGYPT" || cleaned === "QADEYTI2026" || cleaned === "FREE") {
      setCouponSuccess(true);
      setTimeout(() => {
        togglePremium(true);
        setShowBillingModal(false);
        setCouponSuccess(false);
        setCoupon("");
      }, 1500);
    } else {
      setCouponError("كود الخصم غير صحيح. جرب كود: EGYPT");
    }
  };

  const handleSimulatedUpgrade = () => {
    setCouponSuccess(true);
    setTimeout(() => {
      togglePremium(true);
      setShowBillingModal(false);
      setCouponSuccess(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F5F1E8] font-sans antialiased">
      {/* 7-Days Trial Global Banner */}
      {!isPremium && (
        <div
          dir="rtl"
          className={`w-full py-2.5 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            isTrialExpired
              ? "bg-red-500/20 border-b border-red-500/30 text-red-300"
              : "bg-amber-500/10 border-b border-amber-500/20 text-[var(--gold-soft)]"
          }`}
        >
          {isTrialExpired ? (
            <>
              <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
              <span>لقد انتهت فترتك التجريبية (٧ أيام). الميزات الآن في وضع القراءة فقط.</span>
              <button
                onClick={() => setShowBillingModal(true)}
                className="mr-2 rounded-lg bg-red-500 text-black px-3 py-1 text-[11px] font-bold hover:bg-red-400 transition-colors"
              >
                تنشيط الحساب الآن
              </button>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-[var(--gold)] shrink-0 animate-pulse" />
              <span>
                جرّب قضيتي لمدة ٧ أيام مجانًا — متبقي {daysRemaining} أيام على الفترة التجريبية.
              </span>
              <button
                onClick={() => setShowBillingModal(true)}
                className="mr-2 rounded-lg bg-[var(--gold)] text-black px-3 py-1 text-[11px] font-bold hover:brightness-110 transition-all font-sans"
              >
                ترقية الحساب (تنشيط مجاني)
              </button>
            </>
          )}
        </div>
      )}

      {/* Global premium badge for active premium subscribers */}
      {isPremium && (
        <div
          dir="rtl"
          className="w-full py-2 px-4 text-center text-xs font-bold bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300 flex items-center justify-center gap-2"
        >
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>تم تفعيل الاشتراك المميز بالكامل لـ قضيتي (باقة الشريك القانوني)</span>
          <button
            onClick={() => togglePremium(false)}
            className="mr-3 text-[10px] text-slate-500 hover:text-slate-300 underline font-sans"
          >
            (تبديل لوضع التجريبي للاختبار)
          </button>
        </div>
      )}

      <TopBar />
      <main className="mx-auto max-w-md px-4 pb-28 pt-4">{children}</main>
      <BottomNav />

      {/* Subscription/Billing Drawer Modal Container */}
      {showBillingModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/8 w-full backdrop-blur-sm"
          dir="rtl"
        >
          <div className="relative w-full max-w-md rounded-t-3xl border-t border-border bg-[#0C101A] p-6 text-right shadow-2xl animate-in slide-in-from-bottom duration-350">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-[var(--gold)]">
                  <Command className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  تفعيل باقة الشريك القانوني
                </h3>
              </div>
              <button
                onClick={() => setShowBillingModal(false)}
                className="rounded-lg p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Trial & Package Content */}
            <div className="space-y-4">
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  بصفتك مستخدمًا حاليًا، يمكنك تجربة وتشغيل باقة قضيتي المتكاملة بقيمة{" "}
                  <span className="font-bold text-[var(--gold)]">٢٩٩ جنيه/شهريًا</span> مجاناً
                  بالكامل لأغراض الاختبار والعرض التقديمي.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  تفعيلات الاختبار السريعة:
                </h4>
                <button
                  type="button"
                  onClick={handleSimulatedUpgrade}
                  className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--accent)] text-black font-bold p-3.5 text-xs text-right active:scale-[0.98] transition-all relative overflow-hidden"
                >
                  <span className="relative z-10">تنشيط فوري بنقرة واحدة (محاكاة الدفع)</span>
                  <span className="relative z-10 font-mono"> مجاناً ✦</span>
                  {couponSuccess && (
                    <div className="absolute inset-0 bg-emerald-500 flex items-center justify-center gap-2 text-white text-xs font-bold">
                      <Check className="h-4 w-4" /> تم التنشيط بنجاح!
                    </div>
                  )}
                </button>
              </div>

              {/* Coupon input */}
              <div className="space-y-2 pt-2 border-t border-slate-900">
                <label className="text-xs font-semibold text-slate-300">
                  أدخل كود كوبون التفعيل:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="مثال: EGYPT أو FREE"
                    className="flex-1 rounded-xl border border-slate-800 bg-[#090C14] px-3.5 py-2.5 text-xs font-bold font-mono text-white placeholder:text-slate-600 focus:border-[var(--gold)] focus:outline-none"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="rounded-xl bg-slate-900 border border-border px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700"
                  >
                    تطبيق
                  </button>
                </div>
                {couponError && (
                  <p className="text-[10px] font-semibold text-red-400">{couponError}</p>
                )}
                <p className="text-[10px] text-slate-500">
                  كود الخصم المتاح للاختبار هو:{" "}
                  <code className="bg-[#090C14] px-1 py-0.5 rounded text-[var(--gold)]">EGYPT</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
