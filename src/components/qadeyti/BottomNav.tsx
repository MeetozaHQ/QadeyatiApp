import { Link, useLocation } from "@tanstack/react-router";
import { Home, Briefcase, Sparkles, Wallet, User } from "lucide-react";

const tabs: Array<{ to: string; label: string; icon: typeof Home; highlight?: boolean }> = [
  { to: "/dashboard", label: "الرئيسية", icon: Home },
  { to: "/cases", label: "القضايا", icon: Briefcase },
  { to: "/ai", label: "الذكاء", icon: Sparkles, highlight: true },
  { to: "/finance", label: "المالي", icon: Wallet },
  { to: "/profile", label: "الملف", icon: User },
];

export function BottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
      <ul className="mx-auto flex max-w-md items-end justify-between px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {tabs.map(({ to, label, icon: Icon, highlight }) => {
          const active = location.pathname.startsWith(to);
          if (highlight) {
            return (
              <li key={to} className="-mt-6">
                <Link
                  to={to as never}
                  className="flex flex-col items-center gap-1"
                  aria-label={label}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold)] text-[color:var(--primary-foreground)] shadow-gold">
                    <Icon className="h-6 w-6" strokeWidth={2.2} />
                  </span>
                  <span className="text-[10px] font-medium text-foreground">{label}</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={to} className="flex-1">
              <Link
                to={to as never}
                className="flex flex-col items-center gap-1 py-1.5"
                aria-label={label}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${active ? "text-[var(--gold)]" : "text-muted-foreground"}`}
                />
                <span
                  className={`text-[11px] transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
