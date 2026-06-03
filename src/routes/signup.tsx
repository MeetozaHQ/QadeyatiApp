import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PremiumButton } from "@/components/qadeyti/PremiumButton";
import { PremiumInput } from "@/components/qadeyti/PremiumInput";
import { Logo } from "@/components/qadeyti/Logo";
import { Mail } from "lucide-react";

const TROUBLESHOOT_TIPS = [
  {
    title: "1. تحقق من صندوق Spam/Junk:",
    desc: "غالبًا ما تصنف رسائل Supabase التلقائية كرسائل مزعجة في Gmail.",
  },
  {
    title: "2. لتفعيل حسابك ودخولك فوراً (لوحة Supabase):",
    desc: "اذهب إلى لوحة تحكم Supabase ثم Authentication ثم Users. ابحث عن بريدك الإلكتروني، واضغط على النقاط الثلاث بجانبه واختر Confirm User. سيتم تفعيله فورًا ويمكنك الدخول!",
  },
  {
    title: "3. لتفعيل الحسابات تلقائياً للمستقبل:",
    desc: "إذا أردت إلغاء شرط تفعيل البريد تماماً وتسجيل الدخول الفوري: اذهب إلى Authentication ثم Providers ثم Email، وقم بإيقاف خيار Confirm email.",
  },
];

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
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard" });
  }, [session, navigate]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get("email");
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, []);

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Check if the email has a pre-activated fallback subscription allocation from Admin Page
    let initialMetadata: Record<string, string | boolean> = {};
    try {
      const { checkActivationForUser } = await import("@/lib/admin.functions");
      const act = await checkActivationForUser({ data: email });
      if (act) {
        initialMetadata = {
          qadeyti_plan: act.plan,
          qadeyti_subscription_unpaid: false,
          qadeyti_subscription_expiry: act.expiryDate,
          qadeyti_subscription_activation: act.activationDate,
        };
        console.log("[Signup Sync] Pre-activated plan found, setting on user creation:", act.plan);
      }
    } catch (err) {
      console.warn("Failed checking pre-activation during registration:", err);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: initialMetadata,
      },
    });
    setLoading(false);
    if (error) return setError(error.message);

    // Check if user already exists
    // 1. Supabase returns empty identities array when email is already registered and confirmed (due to security/user enumeration protection)
    // 2. Or we check the user's creation time vs current time. If user.created_at was created in the past (more than 15 seconds ago), it means this account was already registered in a previous signup session!
    const isExistingUser =
      data?.user &&
      (!data.user.identities ||
        data.user.identities.length === 0 ||
        (data.user.created_at && Date.now() - new Date(data.user.created_at).getTime() > 15000) ||
        data.user.identities.some(
          (id) => id.created_at && Date.now() - new Date(id.created_at).getTime() > 15000,
        ));

    if (isExistingUser) {
      setError("هذا البريد الإلكتروني مسجل بالفعل لدينا. يرجى الذهاب لصفحة تسجيل الدخول.");
      return;
    }

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

            <div className="pt-4 border-t border-emerald-500/10">
              <button
                type="button"
                onClick={() => setShowTips(!showTips)}
                className="text-xs text-slate-400 hover:text-emerald-300 transition-colors underline underline-offset-4"
              >
                {showTips ? "إخفاء نصائح حل المشكلات" : "لم يصلك بريد التفعيل؟ اضغط هنا للحل"}
              </button>

              {showTips && (
                <div className="mt-4 text-right bg-slate-950/45 p-4 rounded-xl border border-slate-800 space-y-3 animate-in slide-in-from-top-2 duration-150">
                  {TROUBLESHOOT_TIPS.map((tip, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-xs font-bold text-slate-200">{tip.title}</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{tip.desc}</p>
                    </div>
                  ))}
                </div>
              )}
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
              {error && (
                <div className="space-y-3">
                  <p className="text-sm text-destructive font-semibold text-center">{error}</p>
                  {(error.toLowerCase().includes("confirmation email") ||
                    error.toLowerCase().includes("email")) && (
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-right space-y-3.5 text-xs text-slate-300 animate-in fade-in duration-300">
                      <div className="font-semibold text-amber-400 flex items-center gap-1.5 justify-end">
                        <span>💡 حل مشكلة إرسال بريد التفعيل (SMTP مع Resend)</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      </div>

                      <p className="leading-relaxed text-[11px] text-slate-400">
                        لأنك تستخدم خدمة <span className="text-slate-200">Resend</span> مع نطاقك
                        المخصص <code className="text-amber-200">Qadeyati.com</code>، فهناك خطوة
                        حاسمة متبقية في لوحة تحكم Supabase لتفادي رفض خوادم Resend للإرسال:
                      </p>

                      <div className="space-y-1.5 p-2.5 rounded-lg bg-black/30 border border-amber-500/10 text-[11px] text-slate-300 text-right">
                        <p className="font-bold text-amber-300">
                          ⚙️ مشكلة حالة الأحرف (Case Sensitivity) - مهمة جداً:
                        </p>
                        <p>
                          نطاقك الموثق في Resend هو لقيمات صغيرة:{" "}
                          <code className="text-emerald-300">qadeyati.com</code> (حرف q صغير).
                        </p>
                        <p>
                          أما في لوحة تحكم Supabase SMTP (الخطأ الأبرز): قمت بكتابته بحرف Q كبير:{" "}
                          <code className="text-rose-400">info@Qadeyati.com</code>.
                        </p>
                        <p>
                          <strong>الحل:</strong> قم بتغيير البريد في إعدادات SMTP في Supabase إلى{" "}
                          <code className="text-emerald-300">info@qadeyati.com</code> (أحرف صغيرة
                          بالكامل) ليتطابق مع النطاق الموثق في Resend، ثم اضغط{" "}
                          <strong>Save changes</strong>.
                        </p>
                        <p className="text-slate-400 mt-1 text-[10px] leading-normal">
                          * ملاحظتك صحيحة تماماً: في واجهة Supabase الحديثة، لا يوجد حقل لبريد
                          المرسل داخل القوالب الفردية؛ فهو يستمد العنوان تلقائياً من حقل "Sender
                          email address" العام في إعدادات SMTP.
                        </p>
                      </div>

                      <div className="space-y-1.5 p-2.5 rounded-lg bg-black/15 border border-border text-[11px] text-slate-400 text-right">
                        <p className="font-semibold text-slate-200">
                          ⚙️ لتخطي تفعيل البريد تماماً والتسجيل المباشر:
                        </p>
                        <p>
                          1. اذهب في Supabase إلى <strong>Authentication</strong> ثم{" "}
                          <strong>Providers</strong>.
                        </p>
                        <p>
                          2. افتح خيار <strong>Email</strong> وقم بإغلاق تفعيل{" "}
                          <strong>Confirm email</strong> ثم اضغط <strong>Save</strong>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
