import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "card" | "text" | "circle" | "default";
}

export function LoadingSkeleton({ className = "", variant = "default" }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30",
        // Shimmering shine overlay
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.03] before:to-transparent",
        variant === "card" && "h-28 border border-border bg-card/40 p-5",
        variant === "text" && "h-4 w-3/4",
        variant === "circle" && "h-12 w-12 rounded-full",
        variant === "default" && "h-16",
        className,
      )}
      aria-hidden
    >
      {variant === "card" && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="h-4 w-1/3 rounded bg-muted/60" />
            <div className="h-5 w-16 rounded bg-muted/60" />
          </div>
          <div className="h-3 w-2/3 rounded bg-muted/40" />
          <div className="flex items-center justify-between pt-2">
            <div className="h-3 w-1/4 rounded bg-muted/40" />
            <div className="h-3 w-12 rounded bg-muted/60" />
          </div>
        </div>
      )}
    </div>
  );
}
