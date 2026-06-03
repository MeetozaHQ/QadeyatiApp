import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PremiumButton } from "@/components/qadeyti/PremiumButton";
import { PremiumInput } from "@/components/qadeyti/PremiumInput";
import { Logo } from "@/components/qadeyti/Logo";
import { Link } from "@tanstack/react-router";
import { Mail, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const MANUAL_CONFIRM_TIPS = [
  {
    title: "1. التفعيل يدويًا ومباشرة (من لوحة تحكم Supabase):",
    desc: "اذهب إلى لوحة تحكم Supabase ثم Authentication ثم Users. ابحث عن بريدك الإلكتروني، واضغط على النقاط الثلاث بجانبه واختر Confirm User. سيتم تفعيل حسابك فوراً ويمكنك الدخول!",
  },
  {
    title: "2. لتجنب هذا الشرط مستقبلاً:",
    desc: "إذا أردت إلغاء شرط تفعيل البريد تماماً لجميع المستخدمين: اذهب إلى Authentication ثم Providers ثم Email، وقم بتعطيل خيار Confirm email.",
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnconfirmed, setIsUnconfirmed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [showHowToConfirm, setShowHowToConfirm] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard" });
  }, [session, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsUnconfirmed(false);
    setResendMessage(null);
    setLoading(true);

    const emailVal = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({ email: emailVal, password });
    setLoading(false);

    if (error) {
      const isEmailNotConfirmed =
        error.message.toLowerCase().includes("email not confirmed") ||
        error.message.toLowerCase().includes("confirm");

      if (isEmailNotConfirmed) {
        setIsUnconfirmed(true);
      }
      return setError(
        error.message === "Email not confirmed"
          ? "لم يتم تفعيل حسابك بعد. يرجى تفعيل البريد الإلكتروني."
          : error.message,
      );
    }
    navigate({ to: "/dashboard" });
  }

  async function handleResendEmail() {
    if (!email) return;
    setResending(true);
    setError(null);
    setResendMessage(null);

    const emailVal = email.trim().toLowerCase();

    try {
      // Use the current domain (Vercel domain) as redirect URL so clicking the link confirms correctly on the live app
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: emailVal,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setResendMessage(
          "تمت إعادة إرسال رابط التفعيل بنجاح! يرجى التحقق من صندوق البريد الوارد وصندوق الـ Spam.",
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء محاولة إرسال بريد التفعيل.";
      setError(msg);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-center pt-12">
        <Logo />
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 pb-12">
        <form onSubmit={signIn} className="space-y-8">
          <div className="space-y-3 text-center">
            <h1 className="font-display text-3xl font-bold text-foreground">تسجيل الدخول</h1>
            <p className="text-muted-foreground">مرحبًا بك في قضيتي</p>
          </div>

          <div className="space-y-4">
            <PremiumInput
              id="email"
              label="البريد الإلكتروني"
              type="email"
              dir="ltr"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <PremiumInput
              id="password"
              label="كلمة المرور"
              type="password"
              dir="ltr"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-destructive text-right">{error}</p>}

            {isUnconfirmed && (
              <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-right animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5 text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium leading-relaxed">
                    يبدو أن رابط التفعيل السابق ارتبط بعنوان خاطئ، أو انتهت صلاحيته.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={resending}
                    className="flex items-center justify-center gap-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 text-xs font-semibold text-amber-300 px-3 py-2 transition-colors disabled:opacity-50"
                  >
                    {resending ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Mail className="h-3.5 w-3.5" />
                    )}
                    {"إرسال رابط تفعيل جديد مبرمج لعنوان موقعك الحالي"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowHowToConfirm(!showHowToConfirm)}
                    className="text-right text-[11px] text-slate-400 hover:text-slate-300 underline underline-offset-2"
                  >
                    {showHowToConfirm
                      ? "إخفاء لوحة التفعيل اليدوية"
                      : "تفعيل الحساب فوراً يدويًا (مدير النظام)؟ اضغط هنا"}
                  </button>
                </div>

                {resendMessage && (
                  <div className="flex items-start gap-2 text-emerald-400 text-[11px] bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{resendMessage}</p>
                  </div>
                )}

                {showHowToConfirm && (
                  <div className="border-t border-slate-800 pt-3 mt-2 space-y-3">
                    {MANUAL_CONFIRM_TIPS.map((tip, idx) => (
                      <div key={idx} className="space-y-1">
                        <p className="text-[11px] font-bold text-slate-200">{tip.title}</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{tip.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <PremiumButton type="submit" loading={loading} disabled={!email || !password}>
              تسجيل الدخول
            </PremiumButton>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link to="/signup" className="text-muted-foreground hover:text-foreground">
              إنشاء حساب
            </Link>
            <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground">
              نسيت كلمة المرور؟
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
