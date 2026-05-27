import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import * as React from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import {
  Database,
  ShieldAlert,
  KeyRound,
  ExternalLink,
  Clipboard,
  CheckCircle2,
} from "lucide-react";

function SupabaseSetupAlert() {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#07090e] text-slate-100 p-4 font-sans select-none"
      dir="rtl"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-amber-500/20 bg-[#0d121f]/90 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        {/* Subtle Decorative Background Gradients */}
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl"></div>
        <div className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl"></div>

        <div className="relative text-center">
          {/* Main Logo & Badge */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse">
            <Database className="h-8 w-8" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/20 mb-3">
            <ShieldAlert className="h-3.5 w-3.5" />
            أمان قاعدة البيانات • Database Vault Configuration
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl font-sans mb-2">
            منصة قضيتي — الربط مطلوب
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
            لقد تم رفع وتهيئة التطبيق بنجاح على Vercel، ولكن يجب ربط وتثبيت مفاتيح قاعدة بيانات
            Supabase لتفعيل لوحة التحكم.
          </p>
        </div>

        {/* Step-by-Step Box */}
        <div className="space-y-4 rounded-2xl bg-[#090d16] p-4 border border-slate-800/60 mb-6 text-right">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2 border-b border-slate-800 pb-2">
            <KeyRound className="h-4 w-4 text-slate-400" />
            خطوات التكوين في Vercel (Environments)
          </h3>
          <ol className="space-y-3 text-xs text-slate-300 leading-normal list-decimal list-inside pr-1">
            <li>
              افتح لوحة تحكم مشروعك في <strong>Vercel Dashboard</strong>.
            </li>
            <li>
              اذهب إلى التبويب <strong>Settings</strong> ثم ابحث عن{" "}
              <strong>Environment Variables</strong>.
            </li>
            <li>قم بإضافة المتغيرين التاليين من حساب Supabase الخاص بك:</li>
          </ol>

          {/* Variables Copy Cards */}
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between rounded-xl bg-[#0b0f1a] p-3 border border-slate-800/80 hover:border-amber-500/30 transition-all">
              <div className="text-left font-mono text-[11px] text-amber-400">
                VITE_SUPABASE_URL
              </div>
              <button
                onClick={() => copyToClipboard("VITE_SUPABASE_URL", "url")}
                className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "url" ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="h-3 w-3" />
                    <span>نسخ الاسم</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#0b0f1a] p-3 border border-slate-800/80 hover:border-amber-500/30 transition-all">
              <div className="text-left font-mono text-[11px] text-amber-400">
                VITE_SUPABASE_ANON_KEY
              </div>
              <button
                onClick={() => copyToClipboard("VITE_SUPABASE_ANON_KEY", "key")}
                className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "key" ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="h-3 w-3" />
                    <span>نسخ الاسم</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Informational Warning */}
        <div className="text-center">
          <p className="text-[11px] leading-relaxed text-amber-500/95 bg-amber-500/5 rounded-xl border border-amber-500/15 p-3 mb-6">
            💡 ملاحظة: بعد إضافة هذه القيم في إعدادات Vercel، قم بإعادة بناء المشروع (Re-deploy) في
            لوحة تحكم Vercel ليتم حقن المتغيرات وبدء تشغيل المنصة فوراً.
          </p>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-slate-950 transition-all hover:bg-amber-400 active:scale-[0.98] shadow-lg shadow-amber-500/20"
            >
              فتح لوحة Supabase
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/55 px-5 py-2.5 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-800 hover:text-white active:scale-[0.98]"
            >
              فتح لوحة Vercel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  const router = useRouter();
  const currentPath = router.state.location.pathname;
  const isServer = typeof window === "undefined";
  const browserUrl = !isServer ? window.location.href : "Server SSR";
  const registeredRouteIds = router.flatRoutes.map((r) => `${r.id} [${r.fullPath}]`);

  // Log detailed info to console for debugging
  if (!isServer) {
    console.warn("404 Router Path mismatch:", {
      currentPath,
      browserUrl,
      flatRoutes: router.flatRoutes.map((r) => ({ id: r.id, path: r.path, fullPath: r.fullPath })),
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-4 p-3 bg-muted rounded text-left font-mono text-xs space-y-1">
          <div>
            Router Path: <span className="text-amber-500 font-bold">{currentPath}</span>
          </div>
          <div>
            Location URL: <span className="text-blue-500">{browserUrl}</span>
          </div>
          <div>
            Context:{" "}
            <span className="text-emerald-500">
              {isServer ? "SSR (Server-Side)" : "Hydrated Client"}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-700">
            <span className="text-slate-400">Registered Routes ({registeredRouteIds.length}):</span>
            <div className="max-h-24 overflow-y-auto mt-1 text-[10px] text-purple-400">
              {registeredRouteIds.join(", ")}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "قضيتي — نظامك القانوني المتكامل" },
      { name: "description", content: "منصة قضيتي: نظام قانوني ذكي للمحامين في مصر." },
      { name: "author", content: "Qadeyti" },
      { property: "og:title", content: "قضيتي — نظامك القانوني المتكامل" },
      { property: "og:description", content: "منصة قضيتي: نظام قانوني ذكي للمحامين في مصر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "قضيتي — نظامك القانوني المتكامل" },
      { name: "twitter:description", content: "منصة قضيتي: نظام قانوني ذكي للمحامين في مصر." },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/463e4771-204f-49ad-bbd8-500346a69085/id-preview-2070f880--aaf061f6-470c-4861-8c94-f36ff3e6ae48.lovable.app-1779245522598.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/463e4771-204f-49ad-bbd8-500346a69085/id-preview-2070f880--aaf061f6-470c-4861-8c94-f36ff3e6ae48.lovable.app-1779245522598.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const isClientSPA = typeof window !== "undefined" && !!document.getElementById("root");

  if (isClientSPA) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    function logError(
      type: string,
      message: unknown,
      source: unknown,
      lineno: unknown,
      colno: unknown,
      error: unknown,
    ) {
      const errObj = error as Record<string, unknown> | null;
      const payload = {
        type,
        message: String(message),
        source: String(source),
        lineno,
        colno,
        error: errObj
          ? {
              message: errObj.message,
              stack: errObj.stack,
              name: errObj.name,
            }
          : null,
        url: window.location.href,
        userAgent: window.navigator.userAgent,
        timestamp: new Date().toISOString(),
      };

      console.warn("Captured client-side error:", payload);

      fetch("/api/log-client-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((e) => {
        console.error("Failed to report client error:", e);
      });
    }

    const originalOnError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
      logError("onerror", message, source, lineno, colno, error);
      if (typeof originalOnError === "function") {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    const handleRejection = function (event: PromiseRejectionEvent) {
      const reason = event.reason;
      const msg = reason ? reason.message || String(reason) : "Unhandled promise rejection";
      logError("unhandledrejection", msg, null, null, null, reason);
    };
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.onerror = originalOnError;
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  if (!isSupabaseConfigured()) {
    return <SupabaseSetupAlert />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
