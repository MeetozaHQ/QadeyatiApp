import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/qadeyti/Logo";
import { ArrowLeft, ShieldCheck, Eye } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

export function PrivacyPage() {
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
            <Eye className="h-5.5 w-5.5" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
            سياسة الخصوصية وحماية البيانات
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            توضح هذه السياسة كيفية جمعنا، حمايتنا، واستخدامنا للبيانات الشخصية والمهنية المرفوعة على
            منصة قضيتي.
          </p>
          <div className="mt-4 text-[10px] sm:text-xs text-muted-foreground">
            تاريخ آخر تحديث: 22 مايو 2026
          </div>
        </div>
      </div>

      {/* Privacy Content */}
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12 md:px-8">
        <div className="space-y-8 rounded-2xl sm:rounded-3xl border border-border/40 bg-[#0d121f]/40 p-4 sm:p-8 md:p-10 shadow-xl backdrop-blur-sm">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-r-2 border-[var(--gold)] pr-2.5">
              1. سرية بيانات الموكلين والقضايا
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              إننا ندرك تماماً الحساسية القصوى والمعايير الأخلاقية والمهنية الصارمة لسرية بيانات
              المحاماة والقضايا. نحن لا نطلع أو نتصرف في أي معلومات أو مستندات أو مذكرات قانونية
              يقوم المستخدم برفعها على المنصة. يتم تشفير جميع ملفات القضايا والبيانات الخاصة
              بالموكلين تشفيراً ملقماً بنظام متكامل لمنع أي طرف خارجي غير مصرح له من الوصول إليها.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-r-2 border-[var(--gold)] pr-2.5">
              2. البيانات التي نجمعها
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              لتقديم أفضل تنظيم وتجربة استخدام، تقوم المنصة بجمع الفئات التالية من البيانات:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs text-slate-400 leading-relaxed pr-2">
              <li>
                <strong>بيانات الحساب:</strong> الاسم، والبريد الإلكتروني التجاري، ورقم الهاتف،
                والبيانات العامة لمكتب المحاماة الخاص بك عند التسجيل.
              </li>
              <li>
                <strong>ملفات ومستندات القضايا:</strong> الملاحق والمذكرات وعقود الموكلين التي
                ترفعها لغرض الأرشفة أو معالجة الذكاء الاصطناعي بناءً على رغبتك.
              </li>
              <li>
                <strong>بيانات الفواتير والمدفوعات:</strong> تتم معالجة تفاصيل الدفع بأمان من خلال
                بوابات دفع شريكة مشفرة بالكامل وخارج نطاق تخزين المنصة المباشر.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-r-2 border-[var(--gold)] pr-2.5">
              3. مشاركة وحرية البيانات
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              نحن نتعهد بعدم بيع أو تأجير أو مشاركة البيانات التي تخصك أو تخص موكليك مع أي طرف ثالث
              لأغراض تسويقية أو تجارية على الإطلاق. تُستخدم البيانات الداخلية حصرياً في تسهيل مهام
              مراجعتك وتنبيهاتك الشخصية من خلال إعدادات مذكرتك.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-r-2 border-[var(--gold)] pr-2.5">
              4. معالجة وحماية البيانات عبر الذكاء الاصطناعي
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              عند استخدام المستشار الذكي لتحليل القضايا وتلخيص المستندات، تتم معالجة البيانات من
              خلال واجهات برمجة مشفرة وآمنة ومحمية بالكامل. لا تُستخدم المستندات الخاصة بقضاياك في
              تدريب النماذج اللغوية العامة، مما يضمن أقصى حماية للملكية الفكرية وسرية المكاتبات
              القانونية.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-r-2 border-[var(--gold)] pr-2.5">
              5. الأمان والنسخ الاحتياطي
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              يتم حفظ وتأمين كافة مخرجات المنصة على مخازن آمنة تعمل بنسخ احتياطي دوري تلقائي لتقليل
              فرصة تلف أو فقدان معلومات القضايا والاشتراكات.
            </p>
          </section>

          {/* Contact Box */}
          <div className="mt-8 rounded-2xl border border-amber-500/10 bg-amber-500/5 p-6 text-center">
            <div className="flex justify-center mb-2 text-amber-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">
              هل تحتاج لمزيد من الاستفسار حول الخصوصية؟
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mb-3">
              إذا كانت لديك أي أسئلة حول سياسة حماية البيانات الخاصة بنا، يرجى مراسلة مسؤول الأمن
              السيبراني وحماية البيانات للمنصة:
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
