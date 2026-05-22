import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/qadeyti/Logo";
import { PremiumButton } from "@/components/qadeyti/PremiumButton";
import { PremiumInput } from "@/components/qadeyti/PremiumInput";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquareCode,
  MapPin,
  Send,
  CheckCircle2,
  Inbox,
} from "lucide-react";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate premium submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    }, 1500);
  };

  return (
    <div
      className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-[var(--gold)]/30 selection:text-white pb-12"
      dir="rtl"
    >
      {/* Top Header navbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-[#07090e]/85 px-4 md:px-8 backdrop-blur-md">
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
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-amber-500/5 blur-3xl"></div>
        <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-indigo-500/5 blur-3xl"></div>

        <div className="relative mx-auto max-w-2xl">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-[var(--gold)]">
            <Inbox className="h-5.5 w-5.5 animate-pulse" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
            يسعدنا التواصل معك
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            سواء كنت ترغب في الاستفسار عن ميزات المنصة، أو واجهت مشكلة، أو تود طلب عرض توضيحي
            لمكتبك، فريقنا على أتم الاستعداد لخدمتكم.
          </p>
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="mx-auto max-w-6xl px-4 py-12 md:px-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Contact Info Sidebar - 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-2 font-display">
              معلومات الاتصال المباشرة
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              يسعدنا تلقي مكالماتكم وتواصلكم طوال أيام الأسبوع من الساعة 9 صباحاً وحتى الساعة 7
              مساءً.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Email Card */}
            <div className="rounded-2xl border border-border/40 bg-[#0d121f]/35 p-5 transition-all hover:border-[var(--gold)]/30 hover:bg-[#0d121f]/50 flex items-start gap-4">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-border/60 text-[var(--gold)] shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <span className="block text-[10px] text-slate-500 font-sans tracking-wide">
                  البريد الإلكتروني الرسمي:
                </span>
                <a
                  href="mailto:info@Qadeyati.com"
                  className="block text-sm font-mono font-medium text-slate-200 hover:text-[var(--gold-soft)] transition-colors text-right"
                >
                  info@Qadeyati.com
                </a>
              </div>
            </div>

            {/* Direct Call Card */}
            <div className="rounded-2xl border border-border/40 bg-[#0d121f]/35 p-5 transition-all hover:border-[var(--gold)]/30 hover:bg-[#0d121f]/50 flex items-start gap-4">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-border/60 text-emerald-500 shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <span className="block text-[10px] text-slate-500 font-sans tracking-wide">
                  الاتصال الهاتفي الساخن:
                </span>
                <a
                  href="tel:+201035854329"
                  dir="ltr"
                  className="block text-sm font-mono font-semibold text-slate-200 hover:text-[var(--gold-soft)] transition-colors text-right"
                >
                  +20 103 585 4329
                </a>
              </div>
            </div>

            {/* WhatsApp Card */}
            <a
              href="https://wa.me/201035854329"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-border/40 bg-[#0d121f]/35 p-5 transition-all hover:border-[var(--gold)]/30 hover:bg-[#0d121f]/50 flex items-start gap-4 group"
            >
              <div className="p-3.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/35 text-[#25D366] shrink-0">
                <MessageSquareCode className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-sans tracking-wide">
                    مراسلة فورية عبر واتساب:
                  </span>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-[#25D366]"></span>
                </div>
                <span
                  dir="ltr"
                  className="block text-sm font-mono font-bold text-slate-200 group-hover:text-[var(--gold-soft)] transition-colors text-right"
                >
                  +20 103 585 4329
                </span>
              </div>
            </a>

            {/* Location Card */}
            <div className="rounded-2xl border border-border/40 bg-[#0d121f]/35 p-5 transition-all hover:border-[var(--gold)]/30 hover:bg-[#0d121f]/50 flex items-start gap-4">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-border/60 text-indigo-400 shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-sans tracking-wide">
                  العنوان والمقر الرئيسي:
                </span>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  جمهورية مصر العربية، محافظة القاهرة، وسط البلد.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Area - 3 Cols */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl sm:rounded-3xl border border-border/40 bg-[#0d121f]/50 p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-sm h-full flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="contact-form"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  onSubmit={handleSubmit}
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white font-display border-b border-border/20 pb-2.5">
                      أرسل لنا رسالة مباشرة
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <PremiumInput
                        id="name"
                        label="الاسم الكامل"
                        type="text"
                        placeholder="أدخل اسمك الكريم"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                      <PremiumInput
                        id="email"
                        label="البريد الإلكتروني"
                        type="email"
                        dir="ltr"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <PremiumInput
                        id="phone"
                        label="رقم الهاتف الخاص بك (اختياري)"
                        type="tel"
                        dir="ltr"
                        placeholder="01xxxxxxxxx"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                      <PremiumInput
                        id="subject"
                        label="موضوع الاستفسار"
                        type="text"
                        placeholder="عن ماذا تود استفسارنا؟"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-1.5 text-right">
                      <label htmlFor="message" className="text-xs font-semibold text-slate-300">
                        تفاصيل الرسالة
                      </label>
                      <textarea
                        id="message"
                        required
                        className="min-h-[140px] w-full resize-none rounded-xl border border-border/80 bg-background/50 p-4 font-sans text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground/50 focus:border-[var(--gold)] focus:bg-background transition-all"
                        placeholder="اكتب هنا تفاصيل رسالتك أو مشكلتك وسيقوم فريق الدعم بالرد بأقرب وقت..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      ></textarea>
                    </div>
                  </div>

                  <div className="pt-4">
                    <PremiumButton type="submit" loading={loading} className="gap-2">
                      <Send className="h-4 w-4" />
                      إرسال الرسالة الآن
                    </PremiumButton>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="success-message"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center justify-center text-center py-16 px-4 flex-1"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="h-8 w-8 animate-bounce" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white mb-2">
                    تم استلام رسالتك بنجاح!
                  </h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
                    شكراً لتواصلك مع قضيتي. لقد قمنا بتوجيه تذكرتك إلى فريق الدعم الفني المختص،
                    وسنقوم بالرد عليك على بريدك المسجل خلال أقرب فرصة (عادةً في غضون 3 ساعات عمل).
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--gold-soft)] hover:text-[var(--gold)] transition-colors underline underline-offset-4 cursor-pointer"
                  >
                    إرسال استفسار آخر
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Small footer */}
      <footer className="border-t border-border/25 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-12">
        <div>جميع الحقوق محفوظة © {new Date().getFullYear()} لمنصة قضيتي.</div>
      </footer>
    </div>
  );
}
