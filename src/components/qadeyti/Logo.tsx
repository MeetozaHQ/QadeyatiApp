export function Logo({
  className = "",
  mode = "full", // "icon" | "full"
  size = "md",
}: {
  className?: string;
  mode?: "icon" | "full";
  size?: "sm" | "md" | "lg";
}) {
  const isIcon = mode === "icon";
  let sizeClass = "";
  if (isIcon) {
    if (size === "sm") sizeClass = "h-8 w-8";
    else if (size === "lg") sizeClass = "h-16 w-16";
    else sizeClass = "h-10 w-10";
  } else {
    if (size === "sm") sizeClass = "h-8";
    else if (size === "lg") sizeClass = "h-16 md:h-20";
    else sizeClass = "h-10 md:h-12";
  }

  // Define fallback UI
  const iconFallback = (
    <div
      className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--gold-soft)] font-display font-bold shadow-gold ${size === "sm" ? "h-8 w-8 text-sm" : size === "lg" ? "h-16 w-16 text-2xl" : "h-10 w-10 text-lg"} text-black`}
    >
      ق
    </div>
  );

  const fullFallback = (
    <div className={`flex items-center gap-2 ${className}`}>
      {iconFallback}
      <span
        className={`font-display font-semibold tracking-tight text-white ${size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg md:text-xl"}`}
      >
        قضيتي
      </span>
    </div>
  );

  if (isIcon) {
    return (
      <div className={`relative shrink-0 ${sizeClass} ${className}`}>
        <img
          src="/favicon.png"
          alt="قضيتي Logo"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain"
          onError={(e) => {
            // Remove image if failed, showing fallback
            e.currentTarget.style.display = "none";
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const fallbackContainer = document.createElement("div");
              fallbackContainer.className = "fallback-logo";
              parent.appendChild(fallbackContainer);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 flex items-center ${sizeClass} ${className}`}>
      <img
        src="/logo.png"
        alt="قضيتي"
        referrerPolicy="no-referrer"
        className="h-full object-contain overflow-visible max-w-full"
        onError={(e) => {
          // If image load fails, hide image and show the fallbacks
          e.currentTarget.style.display = "none";
          const sibling = e.currentTarget.nextElementSibling;
          if (sibling) {
            sibling.classList.remove("hidden");
          }
        }}
      />
      {/* Fallback hidden by default, shown if image fails */}
      <div className="hidden">{fullFallback}</div>
    </div>
  );
}
