import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/qadeyti/Logo";
import { ArrowLeft, Shield, FileText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

export function TermsPage() {
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
      <div className="relative overflow-hidden border-b border-border/20 bg-gradient-to-b from-slate-950 to-[#07090e] py-10 md:py-16 px-4 text-center">
        {/* Subtle Decorative Background Gradients */}
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-amber-500/5 blur-3xl"></div>
        <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-indigo-500/5 blur-3xl"></div>

        <div className="relative mx-auto max-w-3xl">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-[var(--gold)]">
            <FileText className="h-5.5 w-5.5" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
            الشروط والأحكام
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            شروط الاستخدام للخدمات والبرمجيات المقدمة من منصة قضيتي. يرجى قراءة هذه الاتفاقية بعناية
            قبل البدء في استخدام المنصة.
          </p>
          <div className="mt-4 text-[10px] sm:text-xs text-muted-foreground">
            تاريخ آخر تحديث: 22 مايو 2026
          </div>
        </div>
      </div>

      {/* Terms Content */}
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12 md:px-8">
        <div className="space-y-8 rounded-2xl sm:rounded-3xl border border-border/40 bg-[#0d121f]/40 p-4 sm:p-8 md:p-10 shadow-xl backdrop-blur-sm">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-r-2 border-[var(--gold)] pr-2.5">
              1. الموافقة على الشروط
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              بمجرد وصولك إلى منصة قضيتي أو إنشاء حساب مستخدم، فإنك تقر وتوافق على الالتزام بكامل
              هذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، فيرجى عدم استخدام
              المنصة أو أي من خدماتها.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-r-2 border-[var(--gold)] pr-2.5">
              2. خدمات المنصة وحسابات المستخدمين
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              تُقدم منصة قضيتي نظاماً متكاملاً لإدارة مكاتب المحاماة والقضايا والعملاء والجوانب
              المالية والتحليل الذكي المبني على تقنيات الذكاء الاصطناعي.
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs text-slate-400 leading-relaxed pr-2">
              <li>يجب أن تكون المعلومات المقدمة أثناء التسجيل حقيقية، دقيقة، ومحدثة باستمرار.</li>
              <li>أنت مسؤول بالكامل عن الحفاظ على سرية معلومات حسابك وكلمة المرور الخاصة بك.</li>
              <li>
                المنصة وبواباتها مخصصة للمحامين والمستشارين القانونيين المرخصين لمزاولة المهنة في
                جمهورية مصر العربية.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-r-2 border-[var(--gold)] pr-2.5">
              3. الاستخدام المقبول والمحظور
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              يلتزم المستخدم باستخدام المنصة في الأغراض المشروعة والمهنية فقط. ويُحظر تماماً:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs text-slate-400 leading-relaxed pr-2">
              <li>
                محاولة استغلال نظام البرمجة الخاص بالمنصة أو كشف الكود المصدري أو إحداث خلل مالي أو
                فني.
              </li>
              <li>
                استخدام المنصة لنشر محتوى تضليلي أو غير قانوني أو ينتهك خصوصية وقانون حماية البيانات
                في مصر.
              </li>
              <li>
                مشاركة بيانات الدخول مع أطراف غير مخولة أو غير تابعة لمكتب المحاماة المشترك بشكل
                مباشر.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-r-2 border-[var(--gold)] pr-2.5">
              4. حدود المسؤولية والذكاء الاصطناعي
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              توفر المنصة أدوات متطورة للمساعدة القانونية الذكية ومحرك التلخيص والتحليل. هذه الأدوات
              تُطرح كوسائل استشارية تنظيمية لمساعدة المحامين والمستشارين، وليست بديلاً عن المراجعة
              والتدقيق القانوني البشري الدقيق والمباشر بواسطة صاحب الاختصاص. منصة قضيتي تخلي
              مسؤوليتها عن أي سوء تقدير في النتائج قد ينشأ عن عدم المراجعة الفنية المناسبة للثغرات
              القانونية.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-r-2 border-[var(--gold)] pr-2.5">
              5. الإنهاء وإيقاف الخدمة
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              تحتفظ إدارة المنصة بالحق الكامل في تعليق أو إلغاء وصول حساب المستخدم فوراً دون إخطار
              مسبق، في حال مخالفة الشروط والأحكام أو عند اكتشاف أي استخدام مشكوك فيه أو محاولات
              إضرار بأمن واستقرار المنصة.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-r-2 border-[var(--gold)] pr-2.5">
              6. القانون الحاكم والنزاعات
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              تخضع هذه الشروط والأحكام وتُفسر وفقاً للقوانين واللوائح السارية في جمهورية مصر
              العربية، وينعقد الاختصاص القضائي الحصري في حال نشوب أي نزاع لجهة القضاء المصري المختص
              بمدينة القاهرة.
            </p>
          </section>

          {/* Contact Box */}
          <div className="mt-8 rounded-2xl border border-amber-500/10 bg-amber-500/5 p-6 text-center">
            <div className="flex justify-center mb-2 text-amber-500">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">هل لديك أي استفسار حول الشروط؟</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mb-3">
              نحن هنا لمساعدتك دائماً. يرجى التواصل معنا عبر البريد الإلكتروني الرسمي للمنصة:
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
