import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PremiumButton } from "@/components/qadeyti/PremiumButton";
import { PremiumInput } from "@/components/qadeyti/PremiumInput";
import { Logo } from "@/components/qadeyti/Logo";

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
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-center pt-12">
        <Logo />
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 pb-12">
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
            <PremiumButton type="submit" loading={loading} disabled={!email || password.length < 6}>
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
      </div>
    </div>
  );
}
