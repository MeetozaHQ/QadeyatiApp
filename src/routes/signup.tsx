import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PremiumButton } from "@/components/qadeyti/PremiumButton";
import { PremiumInput } from "@/components/qadeyti/PremiumInput";
import { Logo } from "@/components/qadeyti/Logo";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard" });
  }, [session, navigate]);

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/dashboard" },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setSuccess(true);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-center pt-12">
        <Logo />
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 pb-12">
        {success ? (
          <div className="space-y-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <Mail className="h-7 w-7" />
            </div>
            <div className="space-y-2.5">
              <h2 className="font-display text-xl font-bold text-emerald-400">برجاء تأكيد حسابك</h2>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                تم إرسال رابط تفعيل الحساب بنجاح إلى البريد الإلكتروني:
                <br />
                <span className="font-mono text-emerald-300 text-xs mt-2 block select-all p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/15">
                  {email}
                </span>
              </p>
              <p className="text-xs text-slate-400 leading-relaxed font-sans mt-3">
                يرجى الانتقال إلى صندوق الوارد الخاص بك والضغط على رابط التفعيل المرفق لتفعيل حسابك
                القانوني لتتمكن من تسجيل الدخول.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-6 text-sm font-semibold hover:bg-emerald-500/25 active:scale-[0.98] transition-all"
              >
                الذهاب إلى صفحة تسجيل الدخول
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={signUp} className="space-y-8">
            <div className="space-y-3 text-center">
              <h1 className="font-display text-3xl font-bold text-foreground">إنشاء حساب</h1>
              <p className="text-muted-foreground">ابدأ رحلتك مع قضيتي</p>
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <PremiumButton
                type="submit"
                loading={loading}
                disabled={!email || password.length < 6}
              >
                إنشاء حساب
              </PremiumButton>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <Link to="/login" className="text-foreground hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
