import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/qadeyti/Logo";
import { ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/refund-policy")({
  component: RefundPolicyPage,
});

export function RefundPolicyPage() {
  return (
    <div
      className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-[var(--gold)]/30 selection:text-white"
      dir="rtl"
    >
      {/* Top Header navbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-[#07090e]/80 px-4 md:px-8 backdrop-blur-md">
        <Link to="/" className="outline-none cursor-pointer">
          <Logo size="md" />
        </Link>
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-slate-900/40 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-900 hover:text-white active:scale-95 sm:px-3.5"
        >
          <ArrowLeft className="h-4 w-4 rotate-180 shrink-0" />
          <span className="hidden sm:inline">الرجوع للرئيسية</span>
          <span className="sm:inline-hidden inline">الرئيسية</span>
        </Link>
      </header>

      {/* Hero Header */}
      <div className="relative border-b border-border/20 bg-gradient-to-b from-slate-950 to-[#07090e] py-10 md:py-16 px-4 text-center">
        {/* Subtle Decorative Background Gradients */}
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-amber-500/5 blur-3xl"></div>
        <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-indigo-500/5 blur-3xl"></div>

        <div className="relative mx-auto max-w-3xl">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-[var(--gold)]">
            <RefreshCw className="h-5.5 w-5.5" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
            سياسة الاسترداد وإلغاء الاشتراك
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            نسعى دائماً لتقديم أفضل تجربة ممتدة وشفافة لمحترفي القانون والمحامين. يرجى مراجعة شروط
            وسياسة الإلغاء والاسترداد الموضحة أدناه.
          </p>
          <div className="mt-4 text-[10px] sm:text-xs text-muted-foreground">
            تاريخ آخر تحديث: 22 مايو 2026
          </div>
        </div>
      </div>

      {/* Refund Policy Content */}
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12 md:px-8">
        <div className="space-y-8 rounded-2xl sm:rounded-3xl border border-border/40 bg-[#0d121f]/40 p-4 sm:p-8 md:p-10 shadow-xl backdrop-blur-sm">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-r-2 border-[var(--gold)] pr-2.5">
              1. إلغاء الاشتراك المباشر
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              يمكن للمشترك إلغاء اشتراكه الشهري أو السنوي في أي وقت من خلال الدخول إلى إعدادات حسابه
              ثم الانتقال إلى تبويب "الحساب والاشتراك" والضغط على زر "إلغاء الاشتراك". عند قيامك
              بالإلغاء، سيستمر حسابك ومكتبك في العمل وإمكانية استخدام الخدمات والمميزات المدفوعة
              بشكل كامل حتى نهاية الفترة المدفوعة الحالية، ولن يتم سحب أو تجديد أي رسوم إضافية
              تالية.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-r-2 border-[var(--gold)] pr-2.5">
              2. سياسة الاسترداد والضمان الذهبي
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              لأننا نهدف لضمان رضاكم التام عن خدماتنا القانونية الذكية، فإننا نوفر سياسة استرداد
              مرنة وفقاً للضوابط التالية:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs text-slate-400 leading-relaxed pr-2">
              <li>
                <strong>فترة الضمان الأولى:</strong> يحق للمستخدمين الجدد طلب استرداد كامل المبالغ
                المدفوعة خلال أول 7 أيام من تاريخ الاشتراك الأول للمنصة في حال عدم تلبية خدماتنا
                لتوقعاتكم.
              </li>
              <li>
                <strong>الاشتراكات المتكررة:</strong> لا يتم استرداد المبالغ المدفوعة للاشتراكات
                الشهرية بعد انقضاء اليوم السابع للفوترة، إلا في حالات الخلل البرمجي المستمر الذي
                يمنع الاستفادة التامة من الخصائص ويثبت عدم معالجته خلال 3 أيام عمل من إبلاغنا.
              </li>
              <li>
                <strong>الاشتراكات السنوية:</strong> في حال الرغبة بإلغاء اشتراك سنوي مستمر بعد مرور
                فترة الضمان الفاترة، يتم احتساب الأشهر المستغلة بقيمة السعر الشهري المعتاد غير
                المخفض، ويتم استرداد المبلغ المتبقي من قيمة الاشتراك السنوي لصاحب الحساب.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-r-2 border-[var(--gold)] pr-2.5">
              3. كيفية طلب استرداد الأموال
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              لإرسال طلب رسمي لاسترداد مبالغ الاشتراك المدفوعة، يرجى مراسلتنا من البريد الإلكتروني
              المسجل به حسابك مبيناً سبب الإلغاء والرغبة في استرداد رسوم المعاملة، وتفاصيل الحساب
              البنكي أو طريقة الدفع الأصلية المعتمدة لتحويل القيمة المستردة عليها.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-r-2 border-[var(--gold)] pr-2.5">
              4. المعالجة الزمنية للمبالغ المستردة
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              بعد التحقق والموافقة على طلب الاسترداد، تتم تسوية العملية مالياً واسترداد القيمة إلى
              حسابك المصرفي أو بطاقة الائتمان التي تم استخدامها للدفع الأصلي. يستغرق ظهور المبلغ
              عادةً ما بين 5 إلى 14 يوم عمل، وذلك بناءً على لوائح وسياسات البنك المصدر لبطاقتكم
              المصرفية في جمهورية مصر العربية.
            </p>
          </section>

          {/* Alert Box */}
          <div className="mt-8 rounded-2xl border border-amber-500/10 bg-amber-500/5 p-6 text-center">
            <div className="flex justify-center mb-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">
              هل تود معالجة طلب استرداد أو إلغاء حالاً؟
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mb-3">
              فريق الدعم والحسابات على استعداد تام لتسهيل طلبك ومراجعة تفاصيل حسابك بكل سرعة
              واحترام. راسلنا مباشرةً على بريدنا الرسمي:
            </p>
            <a
              href="mailto:info@Qadeyati.com"
              className="font-mono text-sm font-semibold text-[var(--gold-soft)] hover:text-[var(--gold)] transition-colors inline-block"
            >
              info@Qadeyati.com
            </a>
          </div>
        </div>
      </main>

      {/* Small footer */}
      <footer className="border-t border-border/25 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div>جميع الحقوق محفوظة © {new Date().getFullYear()} لمنصة قضيتي.</div>
      </footer>
    </div>
  );
}
