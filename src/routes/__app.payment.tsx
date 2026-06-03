import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Check,
  CreditCard,
  Smartphone,
  Building,
  Lock,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
  Info,
} from "lucide-react";

export const Route = createFileRoute("/_app/payment")({
  component: PaymentPage,
});

export function PaymentPage() {
  const navigate = useNavigate();

  const handleWhatsAppClick = () => {
    const whatsappNumber = "201035854329";
    const text = encodeURIComponent(
      "مرحباً، أرغب في الاشتراك في Qadeyati وأريد إتمام عملية الدفع.",
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6 text-right pb-10" dir="rtl">
      {/* Top Header/Back link */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-[var(--gold)] transition-colors cursor-pointer"
        >
          <ArrowRight className="h-4 w-4" />
          <span>الرجوع إلى الملف الشخصي</span>
        </button>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-[var(--gold)] border border-amber-500/20">
          دفع يدوي آمن
        </span>
      </div>

      {/* Hero Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-2 py-4"
      >
        <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
          أكمل اشتراكك في{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-[var(--gold-soft)] to-[var(--gold)]">
            قضيتي
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          يمكنك تفعيل اشتراكك الآن خلال دقائق. نحن نعمل حالياً على تفعيل بوابات الدفع الإلكتروني
          التلقائية وسيتم توفيرها قريباً.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Payment Methods Card */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-slate-800 bg-[#12151C]/60 p-5 sm:p-6 shadow-xl backdrop-blur-sm relative overflow-hidden"
        >
          {/* subtle gold accent background */}
          <div className="absolute top-0 right-0 h-24 w-24 bg-[var(--gold)]/5 rounded-full blur-2xl"></div>

          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-5 font-display border-b border-slate-800 pb-3">
            <span className="text-[var(--gold)] text-base">✨</span>
            <span>طرق الدفع المتاحة حالياً</span>
          </h2>

          <div className="space-y-4">
            {/* InstaPay */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:border-[var(--gold)]/20 transition-all">
              <div className="p-2 w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white">تطبيق InstaPay</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  تسهيل التحويل اللحظي والمباشر عبر حسابك البنكي أو عنوان دفع إنستاباي بسهولة وبدون
                  عمولات.
                </p>
              </div>
            </div>

            {/* Bank Transfer */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:border-[var(--gold)]/20 transition-all">
              <div className="p-2 w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[var(--gold-soft)] flex items-center justify-center shrink-0">
                <Building className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white">التحويل البنكي المباشر</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  يمكنك إجراء تحويل إلكتروني مباشر من حسابك من أي بنك داخل مصر وسنقوم بالتحقق منه
                  فوراً.
                </p>
              </div>
            </div>

            {/* Vodafone Cash */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:border-[var(--gold)]/20 transition-all">
              <div className="p-2 w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <div className="font-bold text-xs uppercase">Cash</div>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white">Vodafone Cash (فودافون كاش)</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  الوسيلة الأوسع انتشاراً والأسهل من الكشك أو من خلال محفظتك الإلكترونية الخاصة
                  بالفودافون.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* How to Activation Card */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-slate-800 bg-[#12151C]/60 p-5 sm:p-6 shadow-xl backdrop-blur-sm"
        >
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-5 font-display border-b border-slate-800 pb-3">
            <span className="text-[var(--gold)] text-base">⚙️</span>
            <span>كيف يتم التفعيل؟</span>
          </h2>

          <div className="relative border-r border-slate-800 mr-2 pr-5 space-y-5 py-1">
            {/* Step 1 */}
            <div className="relative">
              <span className="absolute -right-7.5 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-[var(--gold)] border border-slate-700">
                1
              </span>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">اضغط على زر واتساب بالأسفل</h4>
                <p className="text-[10px] text-slate-400">
                  سيقوم النظام بتوجيهك فوراً لمحادثة خدمة العملاء للتفعيل.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <span className="absolute -right-7.5 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-[var(--gold)] border border-slate-700">
                2
              </span>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">
                  سيقوم فريق مينوزيا بإرسال بيانات الدفع
                </h4>
                <p className="text-[10px] text-slate-400">
                  سنوفر لك حسابات InstaPay، أرقام الكاش، أو رقم الحساب البنكي حسب رغبتك.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <span className="absolute -right-7.5 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-[var(--gold)] border border-slate-700">
                3
              </span>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">أرسل إثبات الدفع</h4>
                <p className="text-[10px] text-slate-400">
                  قم بالتقاط صورة للتحويل أو إيصال السداد وإرساله للتحقق.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <span className="absolute -right-7.5 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                ✓
              </span>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-emerald-400">يتم تفعيل اشتراكك خلال دقائق</h4>
                <p className="text-[10px] text-slate-400">
                  يقوم طاقمنا التقني بتوثيق المعاملة وتحديث صلاحيات حسابك في ثوانٍ معدودة.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trust guarantees badge section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="space-y-1 p-2">
            <span className="block text-base">🔒</span>
            <span className="block text-[11px] font-bold text-white">تفعيل سريع وآمن</span>
          </div>

          <div className="space-y-1 p-2 border-r border-slate-850 md:border-r">
            <span className="block text-base">🔒</span>
            <span className="block text-[11px] font-bold text-white">لا توجد رسوم إضافية</span>
          </div>

          <div className="space-y-1 p-2 border-r border-slate-850">
            <span className="block text-base">🔒</span>
            <span className="block text-[11px] font-bold text-white">دعم مباشر عبر واتساب</span>
          </div>

          <div className="space-y-1 p-2 border-r border-slate-850">
            <span className="block text-base">🔒</span>
            <span className="block text-[11px] font-bold text-white">
              بوابات إلكترونية قيد التفعيل
            </span>
          </div>
        </div>
      </motion.div>

      {/* Premium Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex items-start gap-2.5 p-3.5 rounded-xl border border-slate-800 bg-slate-950/20 text-slate-400 max-w-lg mx-auto"
      >
        <Info className="h-4 w-4 text-[var(--gold)] shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>ملاحظة هامة:</strong> هذه المرحلة مؤقتة فقط، وسيتم قريباً تفعيل الدفع الإلكتروني
          المباشر داخل المنصة. ثقتكم تهمنا، والتفعيل اليدوي يخضع لمعايير أمان كاملة ومعتمد بالكامل
          من فريق مينوزيا لإدارة قضيتي.
        </p>
      </motion.div>

      {/* WhatsApp Activation Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="pt-4 flex justify-center"
      >
        <button
          onClick={handleWhatsAppClick}
          className="relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm select-none transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 duration-300 hover:scale-[1.02] active:scale-[0.98] w-full max-w-sm cursor-pointer"
        >
          <MessageCircle className="h-5 w-5 shrink-0 fill-white" />
          <span>إتمـام الاشتـراك عبـر واتسـاب</span>
        </button>
      </motion.div>
    </div>
  );
}
