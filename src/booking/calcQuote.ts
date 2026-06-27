// Pure pricing calculation function
// No React, no DOM, no side effects

import type { BookingSelection, PricingConfig, Quote, LineItem, Range, BarTierConfig, BreakdownItem } from "./types";

export function calculateQuote(
  selection: BookingSelection,
  config: PricingConfig
): Quote {
  const lineItems: LineItem[] = [];
  const breakdownItems: BreakdownItem[] = [];
  let addonsSubtotal = 0;
  const disclaimers: string[] = [];
  const serviceNotes: string[] = [];

  if (config.estimateLanguage.disclaimerText) {
    disclaimers.push(config.estimateLanguage.disclaimerText);
  }
  if (!config.gratuity.showLineItem && config.gratuity.summaryCopy) {
    serviceNotes.push(config.gratuity.summaryCopy);
  }

  const hasBar = selection.serviceType === "bar" || selection.serviceType === "both";
  const hasTech = selection.serviceType === "tech" || selection.serviceType === "both";

  const guestCount = selection.guestCount ?? 0;
  const barPaymentModel = selection.barPaymentModel ?? "guest-purchase";
  const isGuestPurchaseBar = hasBar && barPaymentModel === "guest-purchase";

  const getBarTier = (): BarTierConfig | undefined =>
    config.barTiers.find((tier) => tier.id === selection.barTier);

  const addRange = (base: Range, addition: Range): Range => ({
    min: base.min + addition.min,
    max: base.max + addition.max,
  });

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

  // Base production fee
  const baseRange: Range = {
    min: config.baseProductionRange.min,
    max: config.baseProductionRange.max,
  };
  // For guest-purchase bars, coreServiceRange is overridden inside the bar pricing block
  let coreServiceRange: Range = isGuestPurchaseBar ? { min: 0, max: 0 } : baseRange;
  if (selection.serviceType && !isGuestPurchaseBar) {
    breakdownItems.push({
      label: "Base production/service fee",
      range: baseRange,
    });
  }

  // Bar pricing (only if bar service is selected)
  let guestRange: Range = { min: 0, max: 0 };
  let guestPurchaseUpliftRange: Range = { min: 0, max: 0 };
  let mocktailRange: Range = { min: 0, max: 0 };
  if (hasBar) {
    const perGuestRange = selection.barTier ? getBarTier()?.pricing.perGuestRange : getAveragePerGuestRange();
    const durationMultiplier = getDurationMultiplier();

    if (barPaymentModel === "guest-purchase") {
      const gpp = config.guestPurchasePricing;

      if (guestCount <= gpp.customQuoteGuestThreshold) {
        // Base fee by tier (ranges across beer-wine → premium if no tier selected yet)
        const tierBase: Range = selection.barTier
          ? { min: gpp.baseFeeByTier[selection.barTier], max: gpp.baseFeeByTier[selection.barTier] }
          : { min: gpp.baseFeeByTier["beer-wine"], max: gpp.baseFeeByTier["premium"] };

        coreServiceRange = tierBase;

        breakdownItems.push({
          label: gpp.publicLabel,
          range: tierBase,
          note: gpp.publicNote,
        });

        // Guest count bracket uplift (flat, same for all tiers)
        const bracket = gpp.guestCountUplifts.find((b) => guestCount <= b.maxGuests);
        const guestUplift = bracket ? bracket.uplift : 0;
        if (guestUplift > 0) {
          const upliftRange: Range = { min: guestUplift, max: guestUplift };
          guestPurchaseUpliftRange = addRange(guestPurchaseUpliftRange, upliftRange);
          breakdownItems.push({
            label: "Guest count service scale",
            range: upliftRange,
            note: "Flat add-on based on estimated guest count.",
          });
        }

        // Duration add-on (flat, on top of base + guest uplift)
        const durationAddon = selection.duration ? gpp.durationAddons[selection.duration] : 0;
        if (durationAddon > 0) {
          const durationRange: Range = { min: durationAddon, max: durationAddon };
          guestPurchaseUpliftRange = addRange(guestPurchaseUpliftRange, durationRange);
          breakdownItems.push({
            label: "Extended service hours",
            range: durationRange,
          });
        }
      }
      // else: 200+ guests -- coreServiceRange stays {0,0}, flagged as requiresCustomQuote at return
    } else {
      const coverageMultiplier =
        barPaymentModel === "ticketed"
          ? config.ticketedBarPricingFactor * (selection.drinkTicketsPerGuest / config.defaultDrinkTicketsPerGuest)
          : 1;

      guestRange = guestCount
        ? {
            min: Math.round(guestCount * (perGuestRange?.min || 0) * durationMultiplier * coverageMultiplier),
            max: Math.round(guestCount * (perGuestRange?.max || 0) * durationMultiplier * coverageMultiplier),
          }
        : { min: 0, max: 0 };
      breakdownItems.push(
        barPaymentModel === "ticketed"
          ? {
              label: "Ticketed drink allocation",
              range: guestRange,
              note: `${selection.drinkTicketsPerGuest} drink tickets per guest.`,
            }
          : {
              label: getBarTier()?.name ?? "Hosted bar service estimate",
              range: guestRange,
              note: "Client covers the hosted bar service estimate.",
            }
      );
    }
  }

  if (hasBar && selection.mocktailMenu) {
    mocktailRange = config.optionalEnhancements.mocktailMenuRange;
    const mocktailAmount = Math.round((mocktailRange.min + mocktailRange.max) / 2);
    lineItems.push({
      label: "Zero-proof mocktail menu",
      amount: mocktailAmount,
      category: "addon",
      details: "Optional enhancement",
    });
    addonsSubtotal += mocktailAmount;
    breakdownItems.push({
      label: "Zero-proof mocktail menu",
      range: mocktailRange,
    });
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
    min: Math.round((coreServiceRange.min + guestPurchaseUpliftRange.min + guestRange.min) * travelMultiplier),
    max: Math.round((coreServiceRange.max + guestPurchaseUpliftRange.max + guestRange.max) * travelMultiplier),
  };

  if (hasBar && barPaymentModel === "client-hosted") {
    const hostedMinimumUplift: Range = {
      min: Math.max(0, Math.round(config.clientHostedMinimumRange.min * travelMultiplier) - estimatedRange.min),
      max: Math.max(0, Math.round(config.clientHostedMinimumRange.max * travelMultiplier) - estimatedRange.max),
    };
    estimatedRange = {
      min: Math.max(estimatedRange.min, Math.round(config.clientHostedMinimumRange.min * travelMultiplier)),
      max: Math.max(estimatedRange.max, Math.round(config.clientHostedMinimumRange.max * travelMultiplier)),
    };
    if (hostedMinimumUplift.max > 0) {
      breakdownItems.push({
        label: "Hosted service minimum",
        range: hostedMinimumUplift,
        note: "Keeps the full-service bar experience properly staffed and prepared.",
      });
    }
  }

  if (hasBar && barPaymentModel === "ticketed") {
    const ticketedMinimumUplift: Range = {
      min: Math.max(0, Math.round(config.ticketedBarMinimumRange.min * travelMultiplier) - estimatedRange.min),
      max: Math.max(0, Math.round(config.ticketedBarMinimumRange.max * travelMultiplier) - estimatedRange.max),
    };
    estimatedRange = {
      min: Math.max(estimatedRange.min, Math.round(config.ticketedBarMinimumRange.min * travelMultiplier)),
      max: Math.max(estimatedRange.max, Math.round(config.ticketedBarMinimumRange.max * travelMultiplier)),
    };
    if (ticketedMinimumUplift.max > 0) {
      breakdownItems.push({
        label: "Ticketed bar minimum",
        range: ticketedMinimumUplift,
        note: "Covers bar setup, professional service, and ticket management for your event.",
      });
    }
  }

  if (mocktailRange.max > 0) {
    estimatedRange = {
      min: estimatedRange.min + mocktailRange.min,
      max: estimatedRange.max + mocktailRange.max,
    };
  }

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
      breakdownItems.push({ label: "Starlink WiFi", amount });
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
      breakdownItems.push({ label: "TV / Display setup", amount });
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
      breakdownItems.push({ label: "Bose PA + Wireless Mic", amount });
      estimatedRange = {
        min: estimatedRange.min + amount,
        max: estimatedRange.max + amount,
      };
    }
  }

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
    breakdownItems.push({
      label: "Live DJ",
      range: djRange,
    });
    estimatedRange = {
      min: estimatedRange.min + djRange.min,
      max: estimatedRange.max + djRange.max,
    };
  }

  // Custom Branding (available for all service types)
  if (selection.customBranding) {
    const brandingRange = config.optionalEnhancements.customBrandingRange;
    lineItems.push({
      label: "Event Branding & Custom Drinkware",
      amount: Math.round((brandingRange.min + brandingRange.max) / 2),
      category: "addon",
      details: "Optional enhancement",
    });
    addonsSubtotal += Math.round((brandingRange.min + brandingRange.max) / 2);
    breakdownItems.push({
      label: "Event Branding & Custom Drinkware",
      range: brandingRange,
    });
    estimatedRange = {
      min: estimatedRange.min + brandingRange.min,
      max: estimatedRange.max + brandingRange.max,
    };
  }

  if (selection.promoCode && estimatedRange.max > 0) {
    const discountAmount = selection.promoCode.discountAmount;
    lineItems.push({
      label: `${selection.promoCode.label} (${selection.promoCode.code})`,
      amount: -discountAmount,
      category: "discount",
      details: selection.promoCode.message,
    });
    breakdownItems.push({
      label: `${selection.promoCode.label} promo`,
      amount: -discountAmount,
      note: selection.promoCode.message,
    });
    estimatedRange = {
      min: Math.max(0, estimatedRange.min - discountAmount),
      max: Math.max(0, estimatedRange.max - discountAmount),
    };
  }

  // Determine if we have enough pricing signals
  const hasPricingSignal =
    selection.serviceType !== null;

  if (!hasPricingSignal) {
    estimatedRange = { min: 0, max: 0 };
  }

  if (hasPricingSignal && selection.travelType === "extended") {
    const travelRange: Range = {
      min: Math.max(0, Math.round(estimatedRange.min - estimatedRange.min / travelMultiplier)),
      max: Math.max(0, Math.round(estimatedRange.max - estimatedRange.max / travelMultiplier)),
    };
    if (travelRange.max > 0) {
      breakdownItems.push({
        label: "Extended travel adjustment",
        range: travelRange,
      });
    }
  }

  if (hasPricingSignal && estimatedRange.min > 0 && config.gratuity.includeInEstimate) {
    const gratuityMin = Math.round(estimatedRange.min * config.gratuity.percent);
    const gratuityMax = Math.round(estimatedRange.max * config.gratuity.percent);
    const gratuityAmount = Math.round((gratuityMin + gratuityMax) / 2);

    if (config.gratuity.showLineItem) {
      lineItems.push({
        label: `Gratuity (${Math.round(config.gratuity.percent * 100)}%)`,
        amount: gratuityAmount,
        category: "addon",
      });
    } else {
      breakdownItems.push({
        label: "Staffing/service gratuity",
        note: config.gratuity.summaryCopy,
      });
    }

    estimatedRange = {
      min: estimatedRange.min + gratuityMin,
      max: estimatedRange.max + gratuityMax,
    };
  }

  if (estimatedRange.max > estimatedRange.min) {
    const tightenedSpread = Math.round((estimatedRange.max - estimatedRange.min) * config.estimateRangeTighteningFactor);
    estimatedRange = {
      min: estimatedRange.min,
      max: estimatedRange.min + tightenedSpread,
    };
  }

  if (estimatedRange.max > 0) {
    estimatedRange = roundRange(estimatedRange, config);
  }

  const requiresCustomQuote =
    isGuestPurchaseBar && guestCount > config.guestPurchasePricing.customQuoteGuestThreshold;

  return {
    lineItems,
    breakdownItems: estimatedRange.max > 0 ? breakdownItems.filter((item) => {
      if (item.amount !== undefined) return item.amount !== 0;
      if (item.range) return item.range.max > 0;
      return Boolean(item.note);
    }) : [],
    estimatedRange,
    addonsSubtotal,
    disclaimers,
    serviceNotes,
    requiresCustomQuote,
  };
}

function roundRange(range: Range, config: PricingConfig): Range {
  const { increment, minDirection, maxDirection } = config.estimateRounding;
  return {
    min: roundCurrency(range.min, increment, minDirection),
    max: Math.max(
      roundCurrency(range.max, increment, maxDirection),
      roundCurrency(range.min, increment, minDirection)
    ),
  };
}

function roundCurrency(value: number, increment: number, direction: "nearest" | "down" | "up"): number {
  if (direction === "down") return Math.floor(value / increment) * increment;
  if (direction === "up") return Math.ceil(value / increment) * increment;
  return Math.round(value / increment) * increment;
}
