export const FILE_CATEGORIES = [
  "مذكرات",
  "أحكام",
  "مستندات موكل",
  "إثباتات",
  "عقود",
  "أخرى",
] as const;

export type FileCategory = (typeof FILE_CATEGORIES)[number];

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}
