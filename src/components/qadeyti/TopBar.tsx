import { Bell, FolderOpen } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useUnreadCount } from "@/hooks/use-notifications";

export function TopBar() {
  const { count } = useUnreadCount();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <Logo />
      <div className="flex items-center gap-2">
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
