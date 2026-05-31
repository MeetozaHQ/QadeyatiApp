console.log("index.tsx file evaluated at startup!");
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/qadeyti/Logo";
import {
  Scale,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  BellRing,
  CreditCard,
  TrendingUp,
  Briefcase,
  UserCheck,
  MapPin,
  Phone,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Lock,
  Database,
  Smartphone,
  LayoutGrid,
  MessageSquare,
  Mail,
  Facebook,
  Linkedin,
  Youtube,
  Menu,
  X,
  Play,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { session } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "هل أحتاج بطاقة بنكية للاستفادة من الباقة المجانية؟",
      a: "لا، يمكنك البدء فورًا بمجرد إنشاء حساب بالبريد الإلكتروني وتفعيله. ستحصل على إمكانية الوصول لباقة قضيتي المجانية بشكل دائم دون الحاجة لإدخال أي بيانات دفع.",
    },
    {
      q: "هل بيانات القضايا والمعلومات آمنة؟",
      a: "نعم بشكل قطعي. نستخدم بروتوكولات حماية وتشفير متطورة للغاية بترميز SSL لحماية جميع الملفات، القضايا، والمستندات المخزنة سحابيًا. كما يجري تفعيل نسخ احتياطي آمن وتلقائي لكل مكتب لمنع ضياع أي ملف.",
    },
    {
      q: "كيف يعمل ربط ومزامنة Google Drive بملفات القضايا؟",
      a: "تتيح لك منصة 'قضيتي' ربط حساب Google Drive الشخصي أو الخاص بالعمل بضغطة زر واحدة. عند تفعيل الربط، ستتمكن من رفع وحفظ عقود الموكلين ومستندات القضايا والتوكيلات مباشرة داخل مجلد مخصص في سحابة Google الخاصة بك. تظل جميع ملفاتك تحت سيادتك وحمايتك وتصرفك الكامل مع إمكانية الوصول السريع إليها من أي جهاز وبمساحة تخزينية مخصصة لك بالكامل دون استهلاك لسعة المنصة السحابية.",
    },
    {
      q: "هل يعمل البرنامج على الهواتف والأجهزة اللوحية؟",
      a: "نعم، النظام مصمم بتقنية واجهات متجاوبة بالكامل ليعمل بسلاسة فائقة وكفاءة قصوى على الهواتف الذكية (آيفون وأندرويد)، الأجهزة اللوحية، وأجهزة الكمبيوتر الشخصية المتنوعة دون الحاجة لتحميل تطبيقات ثقيلة.",
    },
    {
      q: "هل أستطيع استخدامه لإدارة مكتب محاماة كامل بمساعدين؟",
      a: "نعم، يتيح لك النظام المركزي متابعة ومزامنة أعمال مكتبك بالكامل في مكان واحد منظم يربط الأعمال الإدارية والمالية معًا بأعلى دقة.",
    },
    {
      q: "هل الذكاء الاصطناعي (المستشار الذكي) يكتب المذكرات القانونية بالكامل؟",
      a: "يقوم المستشار الذكي بصياغة مسودات قانونية دقيقة، استخراج أهم الثغرات والنقاط من أوراق قضيتك، وتلخيص المذكرات الطويلة في ثوانٍ. تظل هذه مخرجات استشارية للمساعدة، مراجعة وتعديل المحامي لها قبل الاستخدام أمر ضروري.",
    },
    {
      q: "كيف تعمل الباقة المجانية وما هي حدودها؟",
      a: "تمنحك الباقة المجانية المقعد المناسب لتجربة البرنامج والبدء في تنظيم مكتبك مجانًا لعدد محدود من القضايا والجلسات والمساعد الذكي. في حال رغبتك في زيادة الحدود والاستمتاع بتجربة بلا قيود مع كامل مميزات المساعد الذكي وحفظ الملفات، يمكنك الترقية إلى إحدى باقاتنا المدفوعة بمنتهى السهولة وفى أي وقت.",
    },
  ];

  const features = [
    {
      icon: <Briefcase className="h-6 w-6 text-[var(--gold)]" />,
      title: "إدارة القضايا والجلسات",
      desc: "نظام أرشفة ذكي لمتابعة سير الدعاوى ومواعيد الجلسات والقرارات خطوة بخطوة.",
    },
    {
      icon: <Sparkles className="h-6 w-6 text-[var(--gold)]" />,
      title: "المساعد القانوني بالذكاء الاصطناعي",
      desc: "صيغ مذكراتك القانونية، افحص الثغرات، ولخّص مستنداتك القانونية بذكاء بالاعتماد على Gemini 1.5 Flash.",
    },
    {
      icon: <UploadCloud className="h-6 w-6 text-[var(--gold)]" />,
      title: "التخزين والربط بـ Google Drive",
      desc: "اربط مستندات القضية بحسابك الشخصي على جوجل درايف بضغطة زر، وارفع مقاطع توكيلاتك وعقودك وسجلّات جلساتك مباشرة بمساحة تخزينية غير محدودة.",
    },
    {
      icon: <BellRing className="h-6 w-6 text-[var(--gold)]" />,
      title: "الإشعارات والتنبيهات",
      desc: "تنبيهات فورية وذكية على لوحة التحكم للهامش والقرارات والجلسات القادمة حتى لا يضيع ميعاد.",
    },
    {
      icon: <CreditCard className="h-6 w-6 text-[var(--gold)]" />,
      title: "إدارة الأتعاب والأقساط",
      desc: "سجّل دفعات الموكلين، وقسّم الأتعاب لمقادير واضحة بدفاتر مالية رقمية متطورة.",
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-[var(--gold)]" />,
      title: "متابعة المتأخرات المالية",
      desc: "اعرف من دفع ومن متأخر بضغطة زر. تتبع مديونيات القضايا وحسّن تحصيلات مكتبك المالية.",
    },
    {
      icon: <UserCheck className="h-6 w-6 text-[var(--gold)]" />,
      title: "صفحة احترافية للمحامي",
      desc: "احصل على رابط عام مخصص لمكتبك يعكس خبرتك وتخصصاتك ويسهل وصول الموكلين إليك عبر واتساب.",
    },
    {
      icon: <LayoutGrid className="h-6 w-6 text-[var(--gold)]" />,
      title: "تنظيم المكتب القانوني بالكامل",
      desc: "استبدل أكوام الورق ببيئة عمل رقمية تضمن حفظ جهودك وتنظيم ملفات عملائك بأقصى مهنية وسرعة.",
    },
  ];

  return (
    <div
      className="min-h-screen bg-[#0A0A0F] text-[#F5F1E8] font-sans antialiased overflow-x-hidden selection:bg-[var(--gold)] selection:text-black"
      dir="rtl"
    >
      {/* 1. Header & Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-[#0A0A0F]/95 backdrop-blur-md transition-all">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/">
                <Logo className="h-10 md:h-12 w-auto" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm font-medium text-slate-300 hover:text-[var(--gold)] transition-colors"
              >
                ميزات المنصة
              </a>
              <a
                href="#ai-assistant"
                className="text-sm font-medium text-slate-300 hover:text-[var(--gold)] transition-colors"
              >
                المستشار الذكي
              </a>
              <a
                href="#financial"
                className="text-sm font-medium text-slate-300 hover:text-[var(--gold)] transition-colors"
              >
                إدارة الأتعاب
              </a>
              <a
                href="#lawyer-profile"
                className="text-sm font-medium text-slate-300 hover:text-[var(--gold)] transition-colors"
              >
                الصفحة الشخصية
              </a>
              <a
                href="#pricing"
                className="text-sm font-semibold text-slate-300 hover:text-[var(--gold)] transition-colors"
              >
                الأسعار
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-slate-300 hover:text-[var(--gold)] transition-colors"
              >
                الأسئلة الشائعة
              </a>
            </nav>

            {/* CTAs */}
            <div className="hidden md:flex items-center gap-4">
              {session ? (
                <Link
                  to="/dashboard"
                  className="rounded-xl border border-[var(--gold)] px-6 py-2.5 text-sm font-bold text-[var(--gold)] hover:bg-[var(--gold)] hover:text-black transition-all shadow-gold/20"
                >
                  لوحة التحكم
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    to="/signup"
                    className="rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--accent)] px-6 py-2.5 text-sm font-bold text-black border border-transparent hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-amber-500/10"
                  >
                    ابدأ مجانًا
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-xl p-2.5 text-slate-400 hover:bg-slate-900 hover:text-white focus:outline-none"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-[#0C0C12] px-4 py-6 space-y-4 animate-in fade-in slide-in-from-top-5 duration-200">
            <div className="grid grid-cols-1 gap-4 font-sans text-right">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-300 hover:text-[var(--gold)] py-2 border-b border-slate-900"
              >
                ميزات المنصة
              </a>
              <a
                href="#ai-assistant"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-300 hover:text-[var(--gold)] py-2 border-b border-slate-900"
              >
                المستشار الذكي
              </a>
              <a
                href="#financial"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-300 hover:text-[var(--gold)] py-2 border-b border-slate-900"
              >
                إدارة الأتعاب
              </a>
              <a
                href="#lawyer-profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-300 hover:text-[var(--gold)] py-2 border-b border-slate-900"
              >
                الصفحة الشخصية
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-semibold text-slate-300 hover:text-[var(--gold)] py-2 border-b border-slate-900"
              >
                الأسعار
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-300 hover:text-[var(--gold)] py-2"
              >
                الأسئلة الشائعة
              </a>
            </div>

            <div className="pt-4 border-t border-slate-900 flex flex-col gap-3">
              {session ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--accent)] py-3 text-sm font-bold text-black"
                >
                  لوحة التحكم
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-xl border border-border py-3 text-sm font-bold text-slate-300 hover:bg-slate-900"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--accent)] py-3 text-sm font-bold text-black"
                  >
                    سجل حسابك المجاني
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-12 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-[var(--gold)] border border-amber-500/20 mb-8 animate-pulse">
              <span>⚖️</span>
              <span>اشترك في الباقة المجانية الدائمة — بدون بطاقة بنكية</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight md:leading-tight mb-6 font-display">
              نظامك القانوني الذكي لإدارة{" "}
              <span className="bg-gradient-to-l from-[var(--gold)] to-[#F3D078] bg-clip-text text-transparent">
                مكتب المحاماة بالكامل
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10">
              إدارة القضايا، الجلسات، الأتعاب، الملفات، والمساعد القانوني بالذكاء الاصطناعي — في
              منصة واحدة مصممة خصيصاً لتناسب احتياجات المحامين المصريين.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--gold)] to-[var(--accent)] px-8 py-4 text-base font-bold text-black border border-transparent shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                احصل على الباقة المجانية
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-border bg-slate-900/50 backdrop-blur-md px-8 py-4 text-base font-bold text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-900 transition-all"
              >
                شاهد كيف تعمل المنصة
              </a>
            </div>

            <p className="text-xs text-slate-500 mb-16">
              باقة مجانية بالكامل • لا تتطلب بطاقة بنكية • ترقية ميسرة في أي وقت
            </p>

            {/* Floating UI Elements / Premium Mockup Graphics */}
            <div className="relative mt-8 mx-auto xl:max-w-5xl rounded-3xl border border-border bg-[#0E121C]/80 p-4 md:p-6 shadow-2xl backdrop-blur-lg">
              {/* Inner Decorative Window Chrome */}
              <div
                className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4"
                dir="ltr"
              >
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="rounded-md bg-[#080B12] px-6 py-1 text-xs text-slate-500 border border-slate-950 font-mono">
                  qadeyati.com/dashboard/cases
                </div>
                <div className="w-8"></div>
              </div>

              {/* Graphic Body */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right" dir="rtl">
                {/* Visual Card 1: Case Detail */}
                <div className="rounded-2xl bg-[#090D16] border border-slate-800 p-5 p-r hover:border-amber-500/20 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/10">
                      جاري الإجراء
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      قضية رقم ٢٣٧٤ لسنة ٢٠٢٦
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2 leading-relaxed">
                    دعوى بطلان عقد إيجار خاضع للقانون القديم
                  </h4>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <p className="text-[11px] text-slate-400">
                      <strong className="text-[11px] text-slate-300 font-medium">الموكل:</strong>{" "}
                      الحاج أحمد عبد الرحيم
                    </p>
                    <p className="text-[11px] text-slate-400">
                      <strong className="text-[11px] text-slate-300 font-medium">المحكمة:</strong>{" "}
                      جنوب الجيزة الكلية — الدائرة ١٢ مدني
                    </p>
                  </div>
                  <div className="border-t border-slate-900 pt-3 mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">الجلسة القادمة</span>
                    <span className="text-xs font-bold text-[var(--gold)]">
                      الأحد، ٢٤ مايو ٢٠٢٦
                    </span>
                  </div>
                </div>

                {/* Visual Card 2: AI Advisor */}
                <div className="rounded-2xl bg-[#090D16] border border-[var(--gold)]/20 p-5 relative overflow-hidden backdrop-gradient-amber">
                  <div className="absolute top-0 left-0 bg-[var(--gold)] text-black px-2.5 py-0.5 rounded-br-2xl text-[10px] font-bold flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                    المستشار الذكي (Gemini API)
                  </div>
                  <div className="text-right pt-2">
                    <p className="text-xs text-slate-400 mb-2 font-mono">سؤال في المدني المصري:</p>
                    <p className="text-[11.5px] text-slate-200 bg-[#101422] p-2.5 rounded-xl border border-slate-800 leading-relaxed mb-3">
                      &quot;كيف أحصن طرد مستأجر تأخر بالوفاء بالأجرة بالرغم من عرضه الوفاء
                      بالجلسة؟&quot;
                    </p>
                    <p className="text-[11.5px] text-[var(--gold-soft)] leading-relaxed flex items-start gap-1">
                      <span>✦</span>
                      <span>
                        طبقاً للمادة ١٨ من القانون ١٣٦ لسنة ١٩٨١، يلزم إثبات تكرار الامتناع أو
                        التأخر لتفادي أثر سداد الأجرة بالجلسة...
                      </span>
                    </p>
                  </div>
                </div>

                {/* Visual Card 3: Finance Overview */}
                <div className="rounded-2xl bg-[#090D16] border border-slate-800 p-5 hover:border-amber-500/20 transition-all">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1 font-mono">
                    المتأخرات المالية هذا الشهر
                  </p>
                  <h5 className="text-2xl font-black text-white font-mono mb-2">
                    ٤,٥٠٠ <span className="text-xs text-[var(--gold)] font-sans">جنيه</span>
                  </h5>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 mb-4">
                    <div
                      className="bg-[var(--gold)] h-1.5 rounded-full"
                      style={{ width: "65%" }}
                    ></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">تحصيل الأستاذ محمد</span>
                      <span className="font-bold text-emerald-400">تم الدفع • ١,٥٠٠ ج</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">مكتب المهندس خالد</span>
                      <span className="font-bold text-amber-500">متأخر • ٣,٠٠٠ ج</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Demo Video Section */}
      <section
        className="relative border-b border-t border-border bg-[#07070D] py-16 overflow-hidden md:py-24"
        id="demo-video"
      >
        {/* Glow behind the mockup */}
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--gold)]/10 blur-[100px] pointer-events-none sm:h-[500px] sm:w-[500px]"></div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8" dir="rtl">
          {/* Header info */}
          <div className="mx-auto mb-12 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-[var(--gold)] mb-4">
              ✨ شاهد المنصة أثناء العمل
            </span>
            <h2 className="font-display text-3xl font-extrabold text-white mb-4 leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              اكتشف كيف يدير المحامون مكاتبهم القانونية مع{" "}
              <span className="bg-gradient-to-l from-[var(--gold)] to-[#F3D078] bg-clip-text text-transparent">
                قضيتي
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base md:text-lg">
              {"شاهد خلال أقل من دقيقة كيف يمكنك إدارة القضايا والجلسات "}
              {"والمستندات والأتعاب والمساعد القانوني من مكان واحد."}
            </p>
          </div>

          {/* Interactive iPhone-Style Mockup Frame */}
          <div className="mt-6 flex flex-col items-center justify-center">
            <div
              className="group relative cursor-pointer duration-300 transition-all hover:scale-[1.02]"
              onClick={() => setIsVideoModalOpen(true)}
            >
              {/* Highlight Label overlaying the video mockup */}
              <div className="font-sans absolute -top-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-yellow-300/30 bg-gradient-to-r from-[var(--gold)] to-[#F3D078] px-4 py-1.5 text-xs font-black text-black shadow-lg tracking-wide whitespace-nowrap">
                <span>✦ جولة سريعة داخل قضيتي ✦</span>
              </div>

              {/* Gold outer halo background glow */}
              <div className="absolute inset-0 rounded-[38px] bg-amber-500/15 blur-2xl transition-all duration-300 group-hover:bg-amber-500/25"></div>

              {/* Phone Container Mockup */}
              <div className="relative aspect-[9/16] w-[280px] rounded-[42px] border-4 border-slate-700/80 bg-[#0E121C] p-2.5 shadow-[0_0_35px_rgba(235,190,95,0.15)] overflow-hidden transition-all duration-300 group-hover:border-[var(--gold)]/80 sm:w-[320px] md:w-[350px]">
                {/* Dynamic Island Notch */}
                <div className="absolute top-4 left-1/2 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-black flex items-center justify-center">
                  <div className="absolute right-4 h-2.5 w-2.5 rounded-full bg-slate-900"></div>
                </div>

                {/* Cover Image Wrapper */}
                <div className="relative flex h-full w-full items-center justify-center rounded-[32px] overflow-hidden bg-black">
                  <img
                    src="https://img.youtube.com/vi/aKxdZaCpECQ/hqdefault.jpg"
                    alt="Qadeyati Demo Preview"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover opacity-75 duration-500 group-hover:scale-105 transition-transform"
                  />

                  {/* Glassmorphism Dark Cover Sheet */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-950/40 to-transparent"></div>

                  {/* Pulsing glow under the play button */}
                  <div className="duration-[3s] absolute h-20 w-20 rounded-full bg-[var(--gold)]/20 blur-xl animate-ping group-hover:bg-[var(--gold)]/40 transition-all"></div>

                  {/* Play Button Overlay */}
                  <div className="absolute flex flex-col items-center justify-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[var(--gold)] to-[#F3D078] text-black shadow-[0_4px_25px_rgba(245,158,11,0.5)] flex items-center justify-center duration-300 transition-transform group-hover:scale-110 sm:h-20 sm:w-20">
                      <Play className="h-6 w-6 translate-x-[-2px] fill-black text-black sm:h-8 sm:w-8 sm:translate-x-[-3px]" />
                    </div>
                    <span className="rounded-full border border-slate-800 bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur tracking-wide">
                      انقر لمشاهدة الفيديو
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof Statements */}
          <div className="mx-auto mt-12 mb-10 max-w-2xl text-center">
            <h4 className="text-lg font-bold text-white mb-2 md:text-xl">
              ✨ كل ما يحتاجه مكتب المحاماة في منصة واحدة.
            </h4>
            <p className="mx-auto max-w-lg text-xs leading-relaxed text-slate-400 sm:text-sm">
              {"بدلاً من الملفات الورقية والأنظمة المتفرقة، "}
              {"اجعل كل أعمال مكتبك القانونية منظمة داخل منصة واحدة."}
            </p>
          </div>

          {/* Trust Badges Wrapper */}
          <div className="mt-8 border-t border-slate-900 pt-8">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3 md:gap-4">
              {[
                { emoji: "⚖️", label: "إدارة القضايا والجلسات" },
                { emoji: "🤖", label: "المساعد القانوني بالذكاء الاصطناعي" },
                { emoji: "📂", label: "إدارة المستندات القانونية" },
                { emoji: "☁️", label: "مزامنة وحفظ الملفات عبر Google Drive" },
                { emoji: "💰", label: "متابعة الأتعاب والتحصيلات" },
              ].map((badge, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-2xl border border-slate-850 bg-[#0E121C]/90 px-4 py-2.5 text-xs font-semibold text-slate-200 shadow-md hover:border-amber-500/20 hover:bg-[#111726] transition-all"
                >
                  <span className="text-sm">{badge.emoji}</span>
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Video Fullscreen Modal */}
        {isVideoModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setIsVideoModalOpen(false)}
          >
            {/* Elegant Close Button */}
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-6 right-6 z-50 rounded-full border border-slate-800 bg-slate-900 p-3 text-slate-400 hover:text-white hover:border-slate-600 transition-all"
              aria-label="إغلاق الفيديو"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Modal Body with Aspect-Ratio */}
            <div
              className="relative aspect-[9/16] w-full max-w-[450px] rounded-3xl border border-amber-500/20 bg-black shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src="https://www.youtube.com/embed/aKxdZaCpECQ?autoplay=1&rel=0&showinfo=0&modestbranding=1"
                title="Qadeyati Product Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full rounded-2xl"
              ></iframe>
            </div>
          </div>
        )}
      </section>

      {/* 3. Trust Legal Workflow Section */}
      <section className="py-16 md:py-24 border-t border-border bg-[#0C0C14]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 font-display">
              منصة مبنية على الثقة والأمان الكاملين
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              نحفظ أسرار مكتبك بأرقى معايير التكنولوجيا السحابية الحديثة.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="rounded-2xl border border-slate-850 bg-[#0E121C]/50 p-6 text-center hover:bg-[#0E121C] transition-all">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-[var(--gold)]">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">حماية وتشفير البيانات</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                تشفير كامل لكافة مذكراتك وملفاتك الحساسة بترميزات بالغة الأمان لمنع أي اختراق.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-850 bg-[#0E121C]/50 p-6 text-center hover:bg-[#0E121C] transition-all">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-[var(--gold)]">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">نسخ احتياطي آمن</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                يرحل النظام نسخة يومية من جميع قضاياك سحابيًا لضمان استرجاعها حتى في حال تلف أجهزتك.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-850 bg-[#0E121C]/50 p-6 text-center hover:bg-[#0E121C] transition-all">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-[var(--gold)]">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">مصممة للمحامين المصريين</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                مصطلحات القضايا وإجراءات المحاكم مطابقة للواقع الإداري والقضائي بالمحاكم المصرية.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-850 bg-[#0E121C]/50 p-6 text-center hover:bg-[#0E121C] transition-all">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-[var(--gold)]">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">واجهة عربية بالكامل</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                فهم سهل وتواصل سليم بعبارات ومصطلحات بلغة عربية فصيحة وأنيقة.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-850 bg-[#0E121C]/50 p-6 text-center hover:bg-[#0E121C] transition-all">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-[var(--gold)]">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">الجوال والكمبيوتر</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                مزامنة تامة لبياناتك لملاحقة جدول قضاياك ورول الجلسة أثناء تواجدك بالمحكمة من هاتفك
                المحمول.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="py-20 md:py-28 border-t border-border relative">
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-gold/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] mb-2 block">
              الميزات والخصائص
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-display">
              كل مكتبك في مكان واحد
            </h2>
            <p className="text-slate-300 font-medium">
              &quot;بدل دفاتر القضايا والورق المبعثر — كل مكتبك في مكان واحد&quot;
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((item, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-border bg-[#0B0E17] p-6 hover:border-[var(--gold)]/30 hover:bg-[#0E121D] hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/5 text-[var(--gold)] group-hover:bg-amber-500/10 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-[var(--gold)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-gradient-to-r from-amber-500/5 to-slate-900/50 border border-amber-500/10 p-6 text-center max-w-3xl mx-auto">
            <p className="text-sm font-semibold text-[var(--gold)] leading-relaxed">
              &quot;اعرف مين دفع ومين متأخر بدون دفاتر أو ورق&quot;
            </p>
          </div>
        </div>
      </section>

      {/* 5. AI Assistant Section */}
      <section
        id="ai-assistant"
        className="py-20 md:py-28 border-t border-border bg-[#0B0B12] relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Visual Mockup */}
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-3xl border border-[var(--gold)]/20 bg-[#121520]/90 p-5 md:p-6 shadow-2xl relative">
                {/* Visual Glass Header */}
                <div className="flex items-center justify-between border-b border-slate-900/50 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    <span className="text-xs font-bold text-white font-display">
                      المستشار الذكي
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Gemini 1.5 Flash</span>
                </div>

                {/* AI Chat Layout */}
                <div className="space-y-4 font-sans text-right">
                  {/* User message */}
                  <div className="flex items-start gap-2.5 max-w-[85%] mr-auto">
                    <div className="rounded-2xl bg-[#090C16] border border-slate-800 p-3 text-xs leading-relaxed text-slate-200">
                      طلب صياغة: قم بصياغة بند براءة ذمة المالك من أي التزامات مالية سابقة بعد
                      التوقيع على محضر تسليم في عقد إيجار شقة.
                    </div>
                  </div>

                  {/* AI Reply */}
                  <div className="flex items-start gap-2.5 max-w-[90%]">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--accent)] flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-black" />
                    </div>
                    <div className="rounded-2xl bg-[#1D212E] border border-slate-850 p-4 text-[11.5px] leading-relaxed text-slate-100 flex-1 space-y-2">
                      <p className="font-bold text-[var(--gold)]">البند المقترح:</p>
                      <p className="bg-[#121520] p-3 rounded-lg text-[11px] leading-relaxed select-all border border-slate-950 text-slate-300 font-mono">
                        &quot;بمجرد توقيع المستأجر على محضر تسليم العين المؤجرة وخلوها من الشواغل
                        والتلفيات، يعتبر ذلك بمثابة إقرار ببراءة ذمة المؤجر من أي التزامات سابقة،
                        ويسقط حق المستأجر في أي ادعاء مالي بخصوص العين.&quot;
                      </p>
                      <div className="text-[9.5px] text-slate-400">
                        تعديلك متاح بالنقر والنسخ المباشر.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-900 bg-black/40 p-4 text-center">
                <p className="text-[11px] text-slate-400 italic">
                  &quot;مخرجات الذكاء الاصطناعي هي مساعدات قانونية وتتطلب مراجعة المحامي.&quot;
                </p>
              </div>
            </div>

            {/* Right Column: Copy & Actions */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
                الذكاء الاصطناعي القانوني
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display leading-tight">
                المستشار الذكي القانوني بمكتبك
              </h2>
              <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                استعن بأرقى تكنولوجيا الذكاء الاصطناعي للتفكير كشريك قانوني سريع الإنجاز. مصمم
                خصيصاً لمساعدتك على الإعداد المثالي والرد على الخصوم في دقائق معدودة.
              </p>

              {/* Grid of Examples */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-[#0E121C]/50 hover:bg-[#0E121C] transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-[var(--gold)] font-bold text-sm shrink-0">
                    ✦
                  </div>
                  <span className="text-xs font-medium text-slate-200">
                    صياغة دفوع وردود قانونية
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-[#0E121C]/50 hover:bg-[#0E121C] transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-[var(--gold)] font-bold text-sm shrink-0">
                    ✦
                  </div>
                  <span className="text-xs font-medium text-slate-200">
                    استخراج أهم الثغرات والثبوتيات
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-[#0E121C]/50 hover:bg-[#0E121C] transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-[var(--gold)] font-bold text-sm shrink-0">
                    ✦
                  </div>
                  <span className="text-xs font-medium text-slate-200">
                    تلخيص مذكرات ومستندات طويلة
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-[#0E121C]/50 hover:bg-[#0E121C] transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-[var(--gold)] font-bold text-sm shrink-0">
                    ✦
                  </div>
                  <span className="text-xs font-medium text-slate-200">
                    صياغة وتنسيق مسودات العقود
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-[var(--gold)] px-6 py-3 text-sm font-bold text-[var(--gold)] hover:bg-[var(--gold)] hover:text-black transition-all"
                >
                  اختبر المساعد الذكي مجانًا
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Financial Management Section */}
      <section id="financial" className="py-20 md:py-28 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] mb-2 block">
              الحلول المالية
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-display">
              إدارة الأتعاب الحسابية بذكاء
            </h2>
            <p className="text-xl font-bold text-[var(--gold-soft)] font-display mb-4">
              &quot;تابع أرباح مكتبك بسهولة وبدون دفاتر&quot;
            </p>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              تصفح كل أتعاب القضايا والمبالغ المستلمة من الموكلين والأقساط المستحقة، وحدد المتأخرات
              بدقة متناهية تحافظ على تدفقات مكتبك النقدية.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Copy section */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-border bg-[#0E121C]/50 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs">
                    ١
                  </div>
                  <h3 className="text-sm font-bold text-white">نظام الأقساط والدفعات</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  قسّم الأتعاب الإجمالية للدعوى إلى أقساط وتواريخ سداد واضحة، ليقوم النظام بتذكيرك
                  عند استحقاق القسط.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-[#0E121C]/50 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 font-bold text-xs">
                    ٢
                  </div>
                  <h3 className="text-sm font-bold text-white">تتبع المديونيات والمتأخرات</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تظهر المبالغ المتأخرة بلون متبقٍ واضح حتى تراجع الموكل فورياً قبل كل جلسة
                  بالمحكمة.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-[#0E121C]/50 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs">
                    ٣
                  </div>
                  <h3 className="text-sm font-bold text-white">فواتير إلكترونية وتحصيل</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  سجل استلام المبالغ والوصل المالي ليحدث النظام الرصيد المتبقي للقضية والضرائب
                  والمصاريف تلقائياً.
                </p>
              </div>
            </div>

            {/* Visual section: Payments mockup */}
            <div className="lg:col-span-7 bg-[#0E121C] border border-border rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
                <h4 className="text-sm font-bold text-white font-display">الأتعاب والتحصيلات</h4>
                <span className="text-[11px] text-slate-400 font-mono">دفتر تحصيلات المكتب</span>
              </div>

              {/* Financial stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl bg-[#090C16] border border-slate-850 p-3 text-right">
                  <span className="text-[9.5px] text-slate-400 block mb-0.5">
                    إجمالي المتفق عليه
                  </span>
                  <span className="text-sm font-black text-white font-mono">
                    ٤٥,٠٠٠ <span className="text-[9px] font-sans text-slate-400">ج</span>
                  </span>
                </div>
                <div className="rounded-xl bg-[#090C16] border border-slate-850 p-3 text-right">
                  <span className="text-[9.5px] text-emerald-400 block mb-0.5">مجموع المحصل</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    ٢٣,٥٠٠ <span className="text-[9px] font-sans text-emerald-500">ج</span>
                  </span>
                </div>
                <div className="rounded-xl bg-[#090C16] border border-slate-850 p-3 text-right">
                  <span className="text-[9.5px] text-amber-500 block mb-0.5">
                    المتأخرات المعلقة
                  </span>
                  <span className="text-sm font-black text-amber-500 font-mono">
                    ٢١,٥٠٠ <span className="text-[9px] font-sans text-amber-500">ج</span>
                  </span>
                </div>
              </div>

              {/* List of payments */}
              <div className="space-y-3">
                <div className="rounded-xl bg-[#080B14] p-3 border border-slate-900 flex items-center justify-between text-right">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold font-mono">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        وديعة قسط الاستئناف — الحاج أحمد
                      </p>
                      <p className="text-[9px] text-slate-400">
                        قضية التعويض المباشر • محكمة مصر الجديدة
                      </p>
                    </div>
                  </div>
                  <div className="text-left font-mono">
                    <p className="text-xs font-bold text-emerald-400">+٥,٠٠٠ ج</p>
                    <p className="text-[9px] text-slate-500">تم القبض ١٥-٠٥-٢٠٢٦</p>
                  </div>
                </div>

                <div className="rounded-xl bg-[#080B14] p-3 border border-slate-900 flex items-center justify-between text-right">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold font-mono">
                      !
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        مؤخر أتعاب المرافعة — مكتب النور
                      </p>
                      <p className="text-[9px] text-slate-400">
                        عقود توريد وتكامل • شمال القاهرة الإبتدائية
                      </p>
                    </div>
                  </div>
                  <div className="text-left font-mono">
                    <p className="text-xs font-bold text-amber-500">+٧,٥٠٠ ج</p>
                    <p className="text-[9px] text-slate-500">استحقاق ٢٠-٠٥-٢٠٢٦</p>
                  </div>
                </div>

                <div className="rounded-xl bg-[#080B14] p-3 border border-slate-900 flex items-center justify-between text-right">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold font-mono">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        الدفعة التأسيسية — قضية إشهار الإفلاس
                      </p>
                      <p className="text-[9px] text-slate-400">
                        الشركة العقارية المتكاملة • المحكمة الإقتصادية
                      </p>
                    </div>
                  </div>
                  <div className="text-left font-mono">
                    <p className="text-xs font-bold text-emerald-400">+١٠,٠٠٠ ج</p>
                    <p className="text-[9px] text-slate-500">تم القبض ١٠-٠٥-٢٠٢٦</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Lawyer Public Profile Section */}
      <section
        id="lawyer-profile"
        className="py-20 md:py-28 border-t border-border bg-[#0C0C14] relative"
      >
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Copy side */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
                الموقع الشخصي الرقمي
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
                صفحتك القانونية العامة الاحترافية
              </h2>
              <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                استبدل فوضى مواقع التواصل بصفحة رسمية فاخرة تعكس ثقل مكتبك وعناوين الفروع والدرجة
                المقيد بها بالنقابة. سهّل على العملاء التواصل معك مباشرة بضغطة زر عبر واتساب دون
                وسطاء.
              </p>

              <div className="space-y-3.5">
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="h-4.5 w-4.5 text-[var(--gold)] shrink-0" />
                  <span>تثبيت تخصصاتك: مدني، جنائي، إداري، اقتصادي، شرعي ومجلس الدولة.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="h-4.5 w-4.5 text-[var(--gold)] shrink-0" />
                  <span>زر تواصل مباشر وآمن بضغطة زر عبر واتساب والمكالمات الهاتفية.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="h-4.5 w-4.5 text-[var(--gold)] shrink-0" />
                  <span>توجيه العملاء الجدد لمقر مكتبك القانوني بواسطة Google Maps.</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/signup"
                  className="rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--accent)] px-6 py-3 text-sm font-bold text-black hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  أنشئ صفحتك العامة فورًا
                </Link>
              </div>
            </div>

            {/* Visual: Preview profile */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-[var(--gold)]/20 bg-[#0A0A0F] p-6 md:p-8 shadow-2xl relative">
                {/* Visual Accent Glow */}
                <div className="absolute top-0 right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>

                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-right">
                  {/* Lawyer Photo fallback */}
                  <div className="h-28 w-28 rounded-full border-2 border-[var(--gold)] bg-[#12151D] flex items-center justify-center text-4xl shrink-0 overflow-hidden relative group">
                    <span className="text-4xl">⚖️</span>
                  </div>

                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5 flex-wrap">
                        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--gold)] border border-amber-500/20">
                          محامٍ مقيد بالنقض ومجلس الدّولة
                        </span>
                        <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/15">
                          خبرة ١٨ عامًا
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                        الأستاذ المستشار • حازم الشريف
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        مكتب الشريف للاستشارات والعمل القانوني المتكامل
                      </p>
                    </div>

                    <p className="text-[11.5px] text-slate-300 leading-relaxed max-w-lg">
                      متخصصون في القضايا الجنائية والمدنية الكبرى والمحكمة الاقتصادية ومجلس الدولة
                      ومنازعات الاستثمار والشركات وعقود المطورين العقاريين في مصر.
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                      <span className="rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[10px] text-slate-300">
                        القانون الجنائي
                      </span>
                      <span className="rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[10px] text-slate-300">
                        مجلس الدّولة
                      </span>
                      <span className="rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[10px] text-slate-300">
                        القضايا المدنية الكبرى
                      </span>
                    </div>

                    {/* Contact CTA buttons inside Lawyers public page */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
                      <a
                        href="https://wa.me/201035854329"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-black px-5 py-2.5 text-xs font-bold hover:brightness-105 active:scale-[0.98] transition-all"
                      >
                        <Phone className="h-4 w-4" />
                        تواصل عبر واتساب
                      </a>
                      <a
                        href="https://maps.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-850 bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all px-5 py-2.5"
                      >
                        <MapPin className="h-4 w-4" />
                        عنوان الفرع الرئيسي بالدقي
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 border-t border-border bg-[#0A0A0F] relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[400px] bg-amber-500/[0.03] rounded-full blur-[120px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] mb-2 block font-mono">
              خطط الاشتراك والأسعار
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-display">
              باقات مرنة ومصممة خصيصاً للعمل القانوني
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed text-right md:text-center">
              سجّل الآن في الباقة المجانية الدائمة بضغطة زر واحدة دون الحاجة لأية بيانات بنكية، أو
              اختر الباقة الملائمة لطبيعة عملك القانوني وسعة مكتبك للحصول على مميزات غير محدودة.
            </p>

            {/* Toggle Billing Period */}
            <div className="inline-flex items-center gap-1 rounded-2xl bg-secondary p-1 border border-slate-900 mt-8">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`rounded-xl px-5 py-2 text-xs font-semibold transition-all ${billingPeriod === "monthly" ? "bg-[var(--gold)] text-black font-bold shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                الدفع شهرياً
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`relative rounded-xl px-5 py-2 text-xs font-semibold transition-all ${billingPeriod === "yearly" ? "bg-[var(--gold)] text-black font-bold shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                الدفع سنوياً
                <span className="absolute -top-6 -left-2 rounded-full bg-red-500 px-2 py-0.5 text-[8.5px] font-bold text-white tracking-tight animate-bounce">
                  الأكثر توفيرًا (شهرين مجاناً)
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mt-12">
            {/* 1. Free Plan */}
            <div className="rounded-3xl border border-slate-800 bg-[#0C101A]/60 p-6 flex flex-col justify-between shadow-lg relative text-right transition-all hover:border-slate-700">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-900/80 rounded-full px-2.5 py-1 inline-block mb-3">
                  البداية السريعة
                </span>
                <h3 className="text-lg font-bold text-white mb-1 font-display">
                  الباقة المجانية (Free)
                </h3>
                <p className="text-xs text-slate-400 mb-6 font-sans leading-relaxed">
                  أنسب خيار للمحامين المبتدئين للبدء في تنظيم أعمالهم مجاناً وبدون قيود زمنية.
                </p>

                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-3xl font-black text-white font-mono">٠</span>
                  <span className="text-xs text-slate-300">جنيه مصرى</span>
                  <span className="text-xs text-slate-500">/ للأبد</span>
                </div>

                <div className="border-t border-slate-900/60 pt-5 space-y-3">
                  <p className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                    محتويات الباقة:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        إدارة حتى <strong>٣ قضايا</strong> كحد أقصى
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>١٥ محادثة</strong> للمستشار الذكي شهرياً
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-500 line-through">
                      <X className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span>ربط ومزامنة Google Drive</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>لوحة تحكم مهام أساسية</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/signup"
                  className="w-full text-center flex items-center justify-center rounded-xl bg-slate-900 py-3 text-xs font-bold text-slate-200 border border-slate-800 hover:text-white hover:bg-slate-850 transition-all cursor-pointer"
                >
                  سجل مجاناً
                </Link>
              </div>
            </div>

            {/* 2. Basic Plan (The Highlighted Plan) */}
            <div className="rounded-3xl border-2 border-[var(--gold)] bg-[#0C1222] p-6 flex flex-col justify-between shadow-2xl relative text-right transition-all transform scale-[1.03] lg:scale-[1.05] z-10">
              <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--accent)] px-3 py-1 text-[9px] font-bold text-black border border-amber-600/20 shadow animate-pulse">
                الباقة الأكثر طلباً ⭐ الأكثر شعبية
              </span>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--gold)] bg-amber-500/10 rounded-full px-2.5 py-1 inline-block mb-3">
                  موصى للأفراد والشباب
                </span>
                <h3 className="text-lg font-bold text-white mb-1 font-display">
                  الباقة الفردية للـمُحامي
                </h3>
                <p className="text-xs text-slate-300 mb-6 font-sans leading-relaxed">
                  مخصصة للمحامين الشباب أو المستقلين الذين يديرون كمّاً معتاداً من القضايا.
                </p>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-4xl font-black text-white font-mono">
                    {billingPeriod === "yearly" ? "١,٤٩٠" : "١٤٩"}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">جنيه مصرى</span>
                  <span className="text-xs text-slate-400">
                    / {billingPeriod === "yearly" ? "سنة" : "شهر"}
                  </span>
                </div>

                {billingPeriod === "yearly" && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1 text-[9px] text-red-400 font-bold mb-4 inline-block">
                    وفر شهرين كاملين (٢ شهر مجانًا!)
                  </div>
                )}

                <div className="border-t border-slate-800/80 pt-5 space-y-3">
                  <p className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                    كل ما في المجانية بالإضافة إلى:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-200">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[var(--gold)] shrink-0 mt-0.5" />
                      <span>
                        إدارة حتى <strong>٥٠ قضية نشطة</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[var(--gold)] shrink-0 mt-0.5" />
                      <span>
                        جلسات وعملاء وجهات اتصال <strong>بلا حدود</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[var(--gold)] shrink-0 mt-0.5" />
                      <span>
                        <strong>١٠٠ طلب قانوني شهرياً</strong> بالمستشار الذكي
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[var(--gold)] shrink-0 mt-0.5" />
                      <span>
                        ربط وحفظ مذكرات ومرفقات <strong>Google Drive</strong> مباشرة
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[var(--gold)] shrink-0 mt-0.5" />
                      <span>المتابعة المالية والإشعارات وحساب الأقساط</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/signup"
                  className="w-full text-center flex items-center justify-center rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--accent)] py-3.5 text-xs font-bold text-black hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  اشترك الآن في الباقة الفردية
                </Link>
              </div>
            </div>

            {/* 3. Pro Plan */}
            <div className="rounded-3xl border border-slate-800 bg-[#0C101A]/60 p-6 flex flex-col justify-between shadow-lg relative text-right transition-all hover:border-slate-700">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 rounded-full px-2.5 py-1 inline-block mb-3">
                  للنشاط المكثف والـ AI
                </span>
                <h3 className="text-lg font-bold text-white mb-1 font-display">
                  باقة المحامي المحترف (Pro)
                </h3>
                <p className="text-xs text-slate-400 mb-6 font-sans leading-relaxed">
                  الخيار الأفضل للنشاط المكثف والاعتماد الدائم على الذكاء الاصطناعي في صياغة وتلخيص
                  العقود.
                </p>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-3xl font-black text-white font-mono">
                    {billingPeriod === "yearly" ? "٢,٩٩٠" : "٢٩٩"}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">جنيه مصرى</span>
                  <span className="text-xs text-slate-400">
                    / {billingPeriod === "yearly" ? "سنة" : "شهر"}
                  </span>
                </div>

                {billingPeriod === "yearly" && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1 text-[9px] text-red-400 font-bold mb-4 inline-block">
                    وفر شهرين كاملين تلقائياً (توفير ٢ شهر)
                  </div>
                )}

                <div className="border-t border-slate-900/60 pt-5 space-y-3">
                  <p className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                    كل ما في الأساسية بالإضافة إلى:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        قضايا وعملاء وحسابات مالية <strong>بلا حدود</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>٦٠٠ طلب شهرياً</strong> تشمل التحليل والتوليد العميق
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>ربط متكامل لـ Google Drive ومرئي ومتحكم به بالكامل</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>دعم فني عربي ذو أولوية فائقة</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/signup"
                  className="w-full text-center flex items-center justify-center rounded-xl bg-slate-900 py-3 text-xs font-bold text-slate-200 border border-slate-850 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  اشترك في باقة المحترف
                </Link>
              </div>
            </div>

            {/* 4. Enterprise Plan */}
            <div className="rounded-3xl border border-slate-800 bg-[#0C101A]/60 p-6 flex flex-col justify-between shadow-lg relative text-right transition-all hover:border-slate-700">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 rounded-full px-2.5 py-1 inline-block mb-3">
                  للمكاتب الكبيرة والشركات
                </span>
                <h3 className="text-lg font-bold text-white mb-1 font-display">
                  باقة المكاتب والشركات القانونية
                </h3>
                <p className="text-xs text-slate-400 mb-6 font-sans leading-relaxed">
                  باقة مخصصة للمكاتب القانونية الكبيرة التي تحتوي على عدة محامين ومستشارين يتشاركون
                  نفس النظام.
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-white font-mono">٢٤٩</span>
                    <span className="text-xs font-semibold text-slate-300">جنيه مصرى</span>
                    <span className="text-xs text-slate-500">/ شهرياً لصاحب المكتب</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 border-t border-slate-900/40 pt-2">
                    <span className="text-xl font-bold text-blue-400 font-mono">+ ١٩٩</span>
                    <span className="text-xs font-semibold text-slate-300">جنيه مصرى</span>
                    <span className="text-xs text-slate-500">/ شهرياً لكل محامٍ إضافي مضاف</span>
                  </div>
                </div>

                <div className="border-t border-slate-900/60 pt-5 space-y-3">
                  <p className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                    خصائص باقة الشركات:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>٦٠٠ استشارة ذكية شهرياً</strong> لكل مستخدم فرعي بشكل مستقل
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>لوحة تحكم رئيسية</strong> لصاحب المكتب يرى فيها قضايا ومواعيد كل
                        المحامين
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        تكامل المستشار الذكي <strong>لكل مستخدم فرعي</strong> بشكل مستقل
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>توزيع المهام والقضايا ومراجعة المخرجات مركزياً</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>مساحة تخزين شاملة ومدير حسابات خاص</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <a
                  href="mailto:info@qadeyati.com?subject=طلب باقة الشركات والمكاتب القانونية في قضيتي"
                  className="w-full text-center flex items-center justify-center rounded-xl bg-blue-900/20 py-3 text-xs font-bold text-blue-400 border border-blue-900/30 hover:bg-blue-900/35 hover:text-blue-300 transition-all cursor-pointer"
                >
                  اطلب باقة الشركات
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Coming Soon Section */}
      <section className="py-12 md:py-16 border-t border-border bg-[#0C0C14]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="rounded-full bg-slate-900 border border-slate-800 px-3.5 py-1 text-[11px] font-bold text-[var(--gold)] mb-4 inline-block font-display tracking-wider">
            قريباً في قضيتي
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 font-display">
            ميزات ذكية قيد التطوير
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed mb-6">
            مستمرون دوماً بتزويد مكتبك بما يحتاجه من تحليل رقمي رائد. الميزات التالية تضاف قريباً
            لجميع عملائنا مجاناً:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="rounded-xl border border-slate-900 bg-[#090C15]/50 p-3 hover:bg-[#0E121D] transition-colors">
              <h3 className="text-xs font-bold text-slate-200">إحصاءات الإيرادات</h3>
            </div>
            <div className="rounded-xl border border-slate-900 bg-[#090C15]/50 p-3 hover:bg-[#0E121D] transition-colors">
              <h3 className="text-xs font-bold text-slate-200">تقارير شهرية متقدمة</h3>
            </div>
            <div className="rounded-xl border border-slate-900 bg-[#090C15]/50 p-3 hover:bg-[#0E121D] transition-colors">
              <h3 className="text-xs font-bold text-slate-200">تقارير سنوية شاملة</h3>
            </div>
            <div className="rounded-xl border border-slate-900 bg-[#090C15]/50 p-3 hover:bg-[#0E121D] transition-colors">
              <h3 className="text-xs font-bold text-slate-200">تحليلات أداء المكتب</h3>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FAQ Section */}
      <section id="faq" className="py-20 md:py-28 border-t border-border bg-[#0A0A0F]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] mb-2 block font-display">
              الأسئلة الشائعة
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
              إرشادات وأجوبة حول قضيتي
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-[#0C101A] overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-right font-display text-sm sm:text-base font-bold text-white hover:bg-slate-900 transition-colors focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4.5 w-4.5 text-[var(--gold)] transition-transform duration-300 ${isOpen ? "transform rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-slate-300 text-xs sm:text-sm font-sans leading-relaxed border-t border-slate-900/50 animate-in fade-in slide-in-from-top-1">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. CTA Section */}
      <section className="py-20 border-t border-border bg-gradient-to-br from-[#0B0E17] to-[#121524] relative text-center">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/30 to-transparent"></div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight font-display mb-4">
            ابدأ تنظيم أعمال مكتبك اليوم
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto leading-relaxed text-xs sm:text-sm mb-10">
            انضم إلى مئات المحامين في مصر الذين يثقون في منصتنا الرقمية لتسريع صياغة مذكراتهم
            القانونية ومتابعة دفاتر القضايا والأتعاب باحترافية وسهولة مطلقة.
          </p>

          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[var(--gold)] to-[var(--accent)] px-8 py-4 text-base font-bold text-black hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-amber-500/10"
          >
            سجّل في الباقة المجانية الآن
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <p className="text-[11px] text-slate-500 mt-4">
            الباقة المجانية متاحة للأبد — بدون بطاقة بنكية
          </p>
        </div>
      </section>

      {/* 12. Footer & Footer Links */}
      <footer className="bg-[#09090D] border-t border-border pt-16 pb-8 text-right text-xs sm:text-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-850">
            {/* Logo and phone */}
            <div className="space-y-4">
              <Logo className="h-10 w-auto" />
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mt-2">
                نظام قانوني ذكي وإداري متكامل للمحامين والمشاركين بالعمل القانوني في المحاكم
                المصرية.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-slate-850 rounded-xl hover:text-[var(--gold)] hover:border-slate-700 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-slate-850 rounded-xl hover:text-[var(--gold)] hover:border-slate-700 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-slate-850 rounded-xl hover:text-[var(--gold)] hover:border-slate-700 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-300 mb-4 font-display">
                رابط سريعة
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    ميزات المنصة
                  </a>
                </li>
                <li>
                  <a href="#ai-assistant" className="hover:text-white transition-colors">
                    المستشار الذكي (AI)
                  </a>
                </li>
                <li>
                  <a href="#financial" className="hover:text-white transition-colors">
                    إدارة الأتعاب والمدفوعات
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    خطط الاشتراك والأسعار
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-300 mb-4 font-display">
                الشروط القانونية
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-400 font-sans">
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    تواصل معنا
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors">
                    الشروط والأحكام
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors">
                    سياسة الخصوصية
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="hover:text-white transition-colors">
                    سياسة الاسترداد وإلغاء الاشتراك
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support communications info */}
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-300 mb-4 font-display">
                تواصل مباشرة
              </h3>
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                  <a
                    href="mailto:info@Qadeyati.com"
                    className="hover:text-white transition-colors font-mono"
                  >
                    info@Qadeyati.com
                  </a>
                </li>
                <li className="flex flex-col gap-1 items-start">
                  <span className="text-[10px] text-slate-500 font-sans tracking-wide">
                    الهاتف:
                  </span>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <a
                      href="tel:+201035854329"
                      dir="ltr"
                      className="hover:text-white transition-colors font-mono font-semibold"
                    >
                      +20 103 585 4329
                    </a>
                  </div>
                </li>
                <li className="flex flex-col gap-1 items-start">
                  <span className="text-[10px] text-slate-500 font-sans tracking-wide">
                    واتساب:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-[#25D366] shrink-0"></span>
                    <a
                      href="https://wa.me/201035854329"
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                      className="hover:text-white transition-colors font-mono font-bold"
                    >
                      +20 103 585 4329
                    </a>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="text-slate-400">القاهرة — جمهورية مصر العربية</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 text-center text-[11.5px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 قضيتي — جميع الحقوق محفوظة · صُنع بـ ❤️ في مصر</p>
            <p className="text-[10px] text-slate-600 font-sans">
              يُحظر إعادة إنتاج أو نسخ المحتويات دون تصريح خطي مسبق.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
