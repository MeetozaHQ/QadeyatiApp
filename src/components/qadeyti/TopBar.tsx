import { Bell, FolderOpen, Key } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useAuth } from "@/lib/auth-context";

export function TopBar() {
  const { count } = useUnreadCount();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("qadeyti_plan");
        localStorage.removeItem("qadeyti_premium");
        localStorage.removeItem("qadeyti_subscription_unpaid");
        localStorage.removeItem("qadeyti_subscription_expiry");
        localStorage.removeItem("qadeyti_subscription_activation");
        window.dispatchEvent(new Event("storage"));
      }
    } catch (e) {
      console.warn("Storage cleanup error:", e);
    }
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <Link to="/" className="outline-none cursor-pointer">
        <Logo />
      </Link>
      <div className="flex items-center gap-2">
        {user && (
          <button
            onClick={handleLogout}
            title="الخروج من لوحة التحكم"
            aria-label="الخروج من لوحة التحكم"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 text-amber-500 bg-amber-500/5 transition-all hover:bg-amber-500 hover:text-slate-950 hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Key className="h-4 w-4" />
          </button>
        )}
        <Link
          to="/files"
          aria-label="الملفات"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-secondary"
        >
          <FolderOpen className="h-5 w-5" />
        </Link>
        <Link
          to="/notifications"
          aria-label="الإشعارات"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-secondary"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
