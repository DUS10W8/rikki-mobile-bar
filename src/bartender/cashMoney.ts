// ── Money helpers: integer cents only ─────────────────────────────────────────
export function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

// "40" → 4000, "28.98" → 2898, "$5.5" → 550. Anything else → null.
export function parseCents(value: string) {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!/^\d{1,5}(\.\d{0,2})?$/.test(cleaned)) return null;
  const [dollars, fraction = ""] = cleaned.split(".");
  return Number(dollars) * 100 + Number((fraction + "00").slice(0, 2));
}

// Exact, then the next amounts a guest is likely to hand over.
export function cashShortcuts(dueCents: number) {
  const options = new Set([dueCents]);
  for (const step of [500, 1000, 2000, 5000, 10000]) {
    const next = Math.ceil(dueCents / step) * step;
    if (next > dueCents) options.add(next);
  }
  return [...options].sort((a, b) => a - b).slice(0, 5);
}

export const DENOMINATIONS: Array<[string, string]> = [
  ["10000", "$100"], ["5000", "$50"], ["2000", "$20"], ["1000", "$10"], ["500", "$5"], ["100", "$1"],
  ["25", "25¢"], ["10", "10¢"], ["5", "5¢"], ["1", "1¢"],
];
