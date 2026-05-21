import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PremiumButton } from "@/components/qadeyti/PremiumButton";
import { PremiumInput } from "@/components/qadeyti/PremiumInput";
import { Logo } from "@/components/qadeyti/Logo";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
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
        <form onSubmit={submit} className="space-y-8">
          <div className="space-y-3 text-center">
            <h1 className="font-display text-3xl font-bold text-foreground">كلمة مرور جديدة</h1>
            <p className="text-muted-foreground">أدخل كلمة المرور الجديدة</p>
          </div>

          <div className="space-y-4">
            <PremiumInput
              id="password"
              label="كلمة المرور الجديدة"
              type="password"
              dir="ltr"
              placeholder="••••••••"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <PremiumButton type="submit" loading={loading} disabled={password.length < 6}>
              حفظ كلمة المرور
            </PremiumButton>
          </div>
        </form>
      </div>
    </div>
  );
}
