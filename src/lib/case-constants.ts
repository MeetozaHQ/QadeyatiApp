export const CASE_STATUSES = [
  "جديدة",
  "قيد التحضير",
  "جلسة قادمة",
  "مؤجلة",
  "محجوزة للحكم",
  "صدر حكم",
  "مستأنفة",
  "مغلقة",
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_TYPES = [
  "مدني",
  "تجاري",
  "جنائي",
  "أسرة",
  "إداري",
  "عمالي",
  "اقتصادي",
  "أحوال شخصية",
  "تنفيذ",
  "أخرى",
] as const;

export type CaseType = (typeof CASE_TYPES)[number];

// Tailwind-friendly status colors using semantic shades.
export const STATUS_STYLES: Record<string, string> = {
  جديدة: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  "قيد التحضير": "bg-amber-500/10 text-amber-300 border-amber-500/30",
  "جلسة قادمة": "bg-[var(--gold)]/15 text-[var(--gold-soft)] border-[var(--gold)]/40",
  مؤجلة: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  "محجوزة للحكم": "bg-violet-500/10 text-violet-300 border-violet-500/30",
  "صدر حكم": "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  مستأنفة: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  مغلقة: "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",
};
