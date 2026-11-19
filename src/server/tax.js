import { squareRequest } from "./square.js";

// Sales tax for walk-up sales, in basis points (8.9% = 890).
// SALES_TAX_BASIS_POINTS overrides; otherwise read the location's additive taxes that
// apply to custom amounts in Square, which is what Square POS adds to a walk-up card charge.
let cached = null;
const cacheMs = 10 * 60 * 1000;

export async function salesTaxBasisPoints() {
  const override = process.env.SALES_TAX_BASIS_POINTS;
  if (override !== undefined && override.trim() !== "") {
    const value = Number(override);
    if (!Number.isInteger(value) || value < 0 || value > 2000) throw new Error("SALES_TAX_BASIS_POINTS must be 0–2000");
    return value;
  }
  if (cached && cached.expires > Date.now()) return cached.value;

  const location = process.env.SQUARE_LOCATION_ID;
  let cursor = "";
  let total = 0;
  for (let page = 0; page < 10; page += 1) {
    const { objects, cursor: next } = await squareRequest("catalog/list?types=TAX" + (cursor ? "&cursor=" + encodeURIComponent(cursor) : ""));
    for (const object of objects ?? []) {
      const tax = object.tax_data;
      if (!tax || object.is_deleted || tax.enabled === false) continue;
      if (tax.inclusion_type === "INCLUSIVE" || tax.applies_to_custom_amounts === false) continue;
      const atLocation = object.present_at_all_locations !== false
        ? !(object.absent_at_location_ids ?? []).includes(location)
        : (object.present_at_location_ids ?? []).includes(location);
      if (!atLocation) continue;
      const percent = Number(tax.percentage);
      if (!Number.isFinite(percent) || percent < 0) continue;
      total += Math.round(percent * 100);
    }
    if (!next) break;
    cursor = next;
  }
  cached = { value: total, expires: Date.now() + cacheMs };
  return total;
}

// Tax on the whole subtotal, rounded half-up to the cent (one custom-amount line in Square POS).
export function taxCents(subtotalCents, basisPoints) {
  return Math.floor((subtotalCents * basisPoints + 5000) / 10000);
}

export function resetTaxCache() {
  cached = null;
}
