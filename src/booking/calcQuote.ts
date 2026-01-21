// Pure pricing calculation function
// No React, no DOM, no side effects

import type { BookingSelection, PricingConfig, Quote, LineItem, Range, BarTierConfig } from "./types";

export function calculateQuote(
  selection: BookingSelection,
  config: PricingConfig
): Quote {
  const lineItems: LineItem[] = [];
  let addonsSubtotal = 0;
  const disclaimers: string[] = [];

  // Add disclaimer
  if (config.disclaimerText) {
    disclaimers.push(config.disclaimerText);
  }

  const hasBar = selection.serviceType === "bar" || selection.serviceType === "both";
  const hasTech = selection.serviceType === "tech" || selection.serviceType === "both";

  const guestCount = selection.guestCount ?? 0;

  const getBarTier = (): BarTierConfig | undefined =>
    config.barTiers.find((tier) => tier.id === selection.barTier);

  const getAveragePerGuestRange = (): Range => {
    const totals = config.barTiers.reduce(
      (acc, tier) => {
        acc.min += tier.pricing.perGuestRange.min;
        acc.max += tier.pricing.perGuestRange.max;
        return acc;
      },
      { min: 0, max: 0 }
    );
    return {
      min: Math.round(totals.min / config.barTiers.length),
      max: Math.round(totals.max / config.barTiers.length),
    };
  };

  const getDurationMultiplier = (): number => {
    if (!selection.duration) return 1;
    const tier = getBarTier();
    if (tier) {
      return tier.pricing.durationMultipliers[selection.duration];
    }
    const multipliers = config.barTiers.map((t) => t.pricing.durationMultipliers[selection.duration]);
    return multipliers.reduce((sum, value) => sum + value, 0) / multipliers.length;
  };

  // Base production fee (always $800)
  const baseRange: Range = {
    min: config.baseProductionRange.min,
    max: config.baseProductionRange.max,
  };

  // Bar pricing (only if bar service is selected)
  let guestRange: Range = { min: 0, max: 0 };
  if (hasBar) {
    const perGuestRange = selection.barTier ? getBarTier()?.pricing.perGuestRange : getAveragePerGuestRange();
    const durationMultiplier = getDurationMultiplier();

    guestRange = guestCount
      ? {
          min: Math.round(guestCount * (perGuestRange?.min || 0) * durationMultiplier),
          max: Math.round(guestCount * (perGuestRange?.max || 0) * durationMultiplier),
        }
      : { min: 0, max: 0 };
  }

  // Guest count-based included items (non-priced, for bar service only)
  if (hasBar) {
    if (guestCount >= 75) {
      // At 75+, show satellite bar and additional bartender (staffing increases again)
      lineItems.push({
        label: "Satellite bar included",
        amount: 0,
        category: "core",
        details: "Included for your guest count",
      });
      lineItems.push({
        label: "Additional bartender included",
        amount: 0,
        category: "core",
        details: "Included for your guest count",
      });
    } else if (guestCount >= 50) {
      // At 50-74, show additional bartender
      lineItems.push({
        label: "Additional bartender included",
        amount: 0,
        category: "core",
        details: "Included for your guest count",
      });
    }
  }

  const travelMultiplier = selection.travelType
    ? config.travelRangeMultiplier[selection.travelType]
    : 1;

  let estimatedRange: Range = {
    min: Math.round((baseRange.min + guestRange.min) * travelMultiplier),
    max: Math.round((baseRange.max + guestRange.max) * travelMultiplier),
  };

  // Tech modules (only if tech service is selected)
  if (hasTech && selection.techModules) {
    if (selection.techModules.starlinkWifi) {
      const amount = 100;
      lineItems.push({
        label: "Starlink WiFi",
        amount,
        category: "addon",
      });
      addonsSubtotal += amount;
      estimatedRange = {
        min: estimatedRange.min + amount,
        max: estimatedRange.max + amount,
      };
    }

    if (selection.techModules.tvDisplay) {
      const amount = 75;
      lineItems.push({
        label: "TV / Display setup",
        amount,
        category: "addon",
      });
      addonsSubtotal += amount;
      estimatedRange = {
        min: estimatedRange.min + amount,
        max: estimatedRange.max + amount,
      };
    }

    if (selection.techModules.soundMic) {
      const amount = 150;
      lineItems.push({
        label: "Bose PA + Wireless Mic",
        amount,
        category: "addon",
      });
      addonsSubtotal += amount;
      estimatedRange = {
        min: estimatedRange.min + amount,
        max: estimatedRange.max + amount,
      };
    }
  }

  // Mocktail menu (stored but not priced for now)
  // If pricing is needed later, add it here as a flat fee

  // DJ Service (only if tech is included - defensive check)
  if (hasTech && selection.djService) {
    let djRange: Range = { min: 400, max: 600 };
    if (selection.duration === "2-3") djRange = { min: 400, max: 400 };
    if (selection.duration === "4-5") djRange = { min: 500, max: 500 };
    if (selection.duration === "6+") djRange = { min: 600, max: 600 };

    const djAmount = Math.round((djRange.min + djRange.max) / 2);
    lineItems.push({
      label: "Live DJ",
      amount: djAmount,
      category: "addon",
      details: selection.duration ? undefined : "Range based on duration",
    });
    addonsSubtotal += djAmount;
    estimatedRange = {
      min: estimatedRange.min + djRange.min,
      max: estimatedRange.max + djRange.max,
    };
  }

  // Custom Branding (available for all service types)
  if (selection.customBranding) {
    const brandingRange: Range = { min: 250, max: 350 };
    lineItems.push({
      label: "Event Branding & Custom Drinkware",
      amount: 300,
      category: "addon",
    });
    addonsSubtotal += 300;
    estimatedRange = {
      min: estimatedRange.min + brandingRange.min,
      max: estimatedRange.max + brandingRange.max,
    };
  }

  // Determine if we have enough pricing signals
  const hasPricingSignal =
    selection.serviceType !== null &&
    (hasBar ? (selection.guestCount !== null && selection.barTier !== null) : true) &&
    selection.duration !== null &&
    selection.travelType !== null;

  // Add padding if key signals are missing
  if (!hasPricingSignal) {
    estimatedRange = { min: 0, max: 0 };
  } else {
    const missingSignals: string[] = [];
    if (hasBar && !selection.barTier) missingSignals.push("barTier");
    if (hasBar && !selection.guestCount) missingSignals.push("guestCount");
    if (!selection.duration) missingSignals.push("duration");
    if (!selection.travelType) missingSignals.push("travelType");

    if (missingSignals.length > 0) {
      let padding = config.defaultRangePadding;
      if (missingSignals.includes("barTier")) padding += 180;
      if (missingSignals.includes("guestCount")) padding += 180;
      if (missingSignals.includes("duration")) padding += 140;
      if (missingSignals.includes("travelType")) padding += 80;
      estimatedRange = {
        min: Math.max(0, estimatedRange.min - padding),
        max: estimatedRange.max + padding,
      };
    }
  }

  // Calculate gratuity: fixed 20% of the full estimate subtotal (before gratuity)
  // The estimatedRange at this point represents the full subtotal (base + guest costs + tech + add-ons + travel)
  if (hasPricingSignal && estimatedRange.min > 0) {
    const gratuityMin = Math.round(estimatedRange.min * 0.2);
    const gratuityMax = Math.round(estimatedRange.max * 0.2);
    const gratuityAmount = Math.round((gratuityMin + gratuityMax) / 2);
    
    lineItems.push({
      label: "Gratuity (20%)",
      amount: gratuityAmount,
      category: "addon",
    });
    
    // Add gratuity to the final estimated range
    estimatedRange = {
      min: estimatedRange.min + gratuityMin,
      max: estimatedRange.max + gratuityMax,
    };
  }

  return {
    lineItems,
    estimatedRange,
    addonsSubtotal,
    disclaimers,
  };
}
