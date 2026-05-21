import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const PremiumInput = forwardRef<HTMLInputElement, Props>(
  ({ className, label, id, ...rest }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="block text-sm text-muted-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "h-14 w-full rounded-xl border border-border bg-card px-4 text-lg text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20",
            className,
          )}
          {...rest}
        />
      </div>
    );
  },
);
PremiumInput.displayName = "PremiumInput";
