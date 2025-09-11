// Minimal "cn" helper—no external deps needed.
export function cn(...parts: Array<string | number | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
