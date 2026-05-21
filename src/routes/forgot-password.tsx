import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PremiumButton } from "@/components/qadeyti/PremiumButton";
import { PremiumInput } from "@/components/qadeyti/PremiumInput";
import { Logo } from "@/components/qadeyti/Logo";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-center pt-12">
        <Logo />
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 pb-12">
        <form onSubmit={submit} className="space-y-8">
          <div className="space-y-3 text-center">
            <h1 className="font-display text-3xl font-bold text-foreground">نسيت كلمة المرور؟</h1>
            <p className="text-muted-foreground">سنرسل لك رابطًا لإعادة التعيين</p>
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            {sent && (
              <p className="text-sm text-[color:var(--gold)]">
                تم إرسال الرابط، تحقق من بريدك الإلكتروني
              </p>
            )}
            <PremiumButton type="submit" loading={loading} disabled={!email}>
              إرسال رابط الاستعادة
            </PremiumButton>
          </div>

          <p className="text-center text-sm">
            <Link to="/login" className="text-muted-foreground hover:text-foreground">
              العودة لتسجيل الدخول
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
