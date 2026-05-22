import type { ReactNode } from "react";
import { motion } from "motion/react";

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-gradient-to-b from-card/30 to-card/5 py-12 px-8 text-center transition-all duration-300 hover:border-[var(--gold)]/30 hover:shadow-[0_8px_32px_rgba(212,175,55,0.02)] overflow-hidden"
    >
      {/* Background radial glow */}
      <div className="pointer-events-none absolute -bottom-10 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-[var(--gold)]/5 blur-3xl transition-opacity duration-300 group-hover:bg-[var(--gold)]/10" />

      {icon && (
        <motion.div
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#181822]/80 to-[#101016]/80 text-[var(--gold)] border border-border/80 shadow-sm"
          whileHover={{ scale: 1.05, rotate: 3 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          {icon}
        </motion.div>
      )}

      <div className="space-y-1.5 relative z-10">
        <h3 className="font-display text-base font-bold text-foreground leading-snug">{title}</h3>
        {description && (
          <p className="max-w-xs text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
