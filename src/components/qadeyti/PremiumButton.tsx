import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "gold" | "ghost" | "outline";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export const PremiumButton = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "gold", loading, disabled, children, ...rest }, ref) => {
    const base =
      "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 font-display text-base font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
    const styles: Record<Variant, string> = {
      gold: "bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold)] text-[color:var(--primary-foreground)] shadow-gold hover:brightness-105",
      ghost: "text-foreground hover:bg-secondary",
      outline: "border border-border text-foreground hover:bg-secondary",
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, styles[variant], className)}
        {...rest}
      >
        {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : children}
      </button>
    );
  },
);
PremiumButton.displayName = "PremiumButton";
