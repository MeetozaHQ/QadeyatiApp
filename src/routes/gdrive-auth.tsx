import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Logo } from "@/components/qadeyti/Logo";
import { Cloud, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { getFirebaseApp } from "../lib/google-drive-auth"; // استيراد الدالة الجاهزة مباشرة لمنع مشاكل التحليل

export const Route = createFileRoute("/gdrive-auth")({
  component: GDriveAuthPage,
});

{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "framework": null,
  "buildCommand": "vite build",
  "outputDirectory": "dist/client",
  "functions": {
    "api/index.js": {
      "includeFiles": "dist/server/**"
    }
  },
  "rewrites": [
    {
      "source": "/__/auth/:path*",
      "destination": "https://qadeyati-844c7.firebaseapp.com/__/auth/:path*"
    },
    {
      "source": "/((?!api/|assets/|favicon\\.png|logo\\.png|.*\\.[a-zA-Z0-9]+$).*)",
      "destination": "/api/index"
    }
  ]
}

export const Route = createFileRoute("/gdrive-auth")({
  component: GDriveAuthPage,
});

export function GDriveAuthPage() {
  const [status, setStatus] = useState<"idle" | "authenticating" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const checkTriggeredRef = useRef(false);

  const startAuth = async () => {
    setStatus("authenticating");
    setErrorMsg(null);
    try {
      const app = getFirebaseApp();
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();

      // Request Drive file scope for uploading files
      provider.addScope("https://www.googleapis.com/auth/drive.file");
      provider.setCustomParameters({
        prompt: "consent",
      });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error("لم يتم إرجاع رمز اتصال صالح من Google.");
      }

      const token = credential.accessToken;
      setStatus("success");

      // Post token back to the opener window
      if (window.opener) {
        window.opener.postMessage({ type: "GOOGLE_DRIVE_AUTH_SUCCESS", token }, "*");
        // Give a brief moment for postMessage to complete, then close
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        localStorage.setItem("temp_gdrive_token", token);
        setTimeout(() => {
          window.close();
        }, 1500);
      }
    } catch (err) {
      console.error("GDrive auth error:", err);
      const detail = (err as { message?: string }).message || String(err);
      setErrorMsg(detail);
      setStatus("error");

      if (window.opener) {
        window.opener.postMessage({ type: "GOOGLE_DRIVE_AUTH_FAILURE", error: detail }, "*");
      }
    }
  };

  useEffect(() => {
    if (checkTriggeredRef.current) return;
    checkTriggeredRef.current = true;
    setStatus("idle");
  }, []);

  return (
    <div
      className="min-h-screen bg-[#07090e] text-slate-100 font-sans flex flex-col items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-[#0d121f]/60 p-6 md:p-8 shadow-2xl backdrop-blur-md text-center space-y-6">
        {/* Brand Logo */}
        <div className="flex justify-center mb-3">
          <Logo size="lg" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <Cloud className="h-5.5 w-5.5 text-[var(--gold)]" />
            <span>ربط Google Drive الآمن</span>
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            {
              "يُرجى إكمال الاتصال بحساب Google الخاص بك لتتمكن منصة قضيتي من حفظ ملفاتك ومستنداتك مباشرة بضغط زر."
            }
          </p>
        </div>

        {/* Status Area */}
        <div className="p-6 rounded-xl border border-border/40 bg-slate-900/40 flex flex-col items-center justify-center min-h-[140px] space-y-4">
          {status === "authenticating" && (
            <>
              <Loader2 className="h-10 w-10 text-[var(--gold)] animate-spin" />
              <div className="space-y-1">
                <p className="text-xs text-slate-300 font-medium animate-pulse">
                  {"جاري الاتصال بـ Google..."}
                </p>
                <p className="text-[10px] text-slate-500">
                  {"يرجى تسجيل الدخول في النافذة المنبثقة إذا ظهرت."}
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-emerald-400 font-semibold">
                  {"تم الاتصال بـ Google Drive بنجاح!"}
                </p>
                <p className="text-[10px] text-slate-500">
                  {"سيتم إغلاق هذه النافذة تلقائياً لتستمر بالمنصة..."}
                </p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertCircle className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-red-400 font-semibold">{"فشل ربط الحساب"}</p>
                <p
                  className="text-[10px] text-slate-400 max-w-xs mx-auto truncate"
                  title={errorMsg || ""}
                >
                  {errorMsg || "حدث خطأ غير متوقع."}
                </p>
              </div>
              <button
                onClick={startAuth}
                className="mt-2 h-8 px-4 sm:px-5 rounded-lg bg-[var(--gold)] text-slate-900 text-xs font-semibold hover:opacity-95 transition-opacity active:scale-95 flex items-center gap-1"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{"إعادة المحاولة ومزامنة الحساب"}</span>
              </button>
            </>
          )}

          {status === "idle" && (
            <button
              onClick={startAuth}
              className="h-10 px-6 rounded-lg bg-[var(--gold)] text-slate-900 text-xs font-semibold hover:opacity-95 transition-opacity active:scale-95"
            >
              {"ابدأ ربط Google Drive"}
            </button>
          )}
        </div>

        <div className="text-[10px] text-slate-500 leading-normal">
          {
            "تطبق هذه العملية معايير الحماية الرسمية لـ Google ويقتصر استخدامها على المجلد الخاص بك فقط دون الاطلاع على ملفاتك الأخرى."
          }
        </div>
      </div>
    </div>
  );
}
