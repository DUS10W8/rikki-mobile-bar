// Pure pricing calculation function
// No React, no DOM, no side effects

import type { BookingSelection, PricingConfig, Quote, LineItem, BarPackage, TechPackage, Addon } from "./types";

export function calculateQuote(
  selection: BookingSelection,
  config: PricingConfig
): Quote {
  const lineItems: LineItem[] = [];
  let barSubtotal = 0;
  let techSubtotal = 0;
  let addonsSubtotal = 0;
  const disclaimers: string[] = [];

  // Add disclaimer
  if (config.disclaimerText) {
    disclaimers.push(config.disclaimerText);
  }

  const hasBar = selection.serviceType === "bar" || selection.serviceType === "both";
  const hasTech = selection.serviceType === "tech" || selection.serviceType === "both";
  
  // Convert guest count range to approximate count for calculation
  const getApproximateGuestCount = (range: string | null, exact: number | null): number => {
    if (exact) return exact;
    switch (range) {
      case "under-40": return 30;
      case "40-75": return 55;
      case "75-125": return 100;
      case "125+": return 150;
      default: return 0;
    }
  };
  
  const guestCount = getApproximateGuestCount(selection.eventBasics.guestCountRange, selection.eventBasics.guestCount);

  // Calculate Bar Service
  if (hasBar && selection.barPackage) {
    const barPkg = config.barPackages.find((p) => p.id === selection.barPackage) as BarPackage | undefined;
    if (barPkg) {
      const baseFee = config.eventProductionBase?.amount || 0;
      const guestCountFactorRate = config.guestCountScalingRate || 0;
      const guestCountFactor = guestCount * guestCountFactorRate;
      const drinkProgramAmount = guestCountFactor * barPkg.drinkProgramMultiplier;

      if (baseFee > 0) {
        lineItems.push({
          label: "Event Production Base",
          amount: baseFee,
          category: "bar",
          details: "Planning, licensed service, travel, setup, and breakdown",
        });
      }

      if (guestCountFactor > 0) {
        lineItems.push({
          label: "Guest Count Scaling",
          amount: guestCountFactor,
          category: "bar",
          details:
            guestCount > 0
              ? `Approx. ${guestCount} guests × $${guestCountFactorRate} guest count factor`
              : "Scaled to staffing and volume needs",
        });
      }

      lineItems.push({
        label: `Drink Program — ${barPkg.name}`,
        amount: drinkProgramAmount,
        category: "bar",
        details: `Menu complexity multiplier ×${barPkg.drinkProgramMultiplier}`,
      });

      barSubtotal = baseFee + guestCountFactor + drinkProgramAmount;
    }
  }

  // Calculate Tech Service
  if (hasTech && selection.techPackage) {
    const techPkg = config.techPackages.find((p) => p.id === selection.techPackage) as TechPackage | undefined;
    if (techPkg) {
      techSubtotal = techPkg.flatFee;
      lineItems.push({
        label: techPkg.name,
        amount: techPkg.flatFee,
        category: "tech",
        details: "Flat fee",
      });
    }
  }

  // Calculate Add-ons
  if (selection.addons.length > 0) {
    selection.addons.forEach((addonId) => {
      const addon = config.addons.find((a) => a.id === addonId) as Addon | undefined;
      if (!addon) return;

      // Check availability based on service type
      const isAvailable =
        addon.availability === "both" ||
        (addon.availability === "bar" && hasBar) ||
        (addon.availability === "tech" && hasTech);

      if (!isAvailable) return;

      let addonAmount = 0;

      switch (addon.pricingType) {
        case "flat":
          addonAmount = addon.amount;
          lineItems.push({
            label: addon.name,
            amount: addonAmount,
            category: "addon",
            details: "Flat fee",
          });
          break;

        case "perPerson":
          addonAmount = guestCount * addon.amount;
          if (addonAmount > 0) {
            lineItems.push({
              label: addon.name,
              amount: addonAmount,
              category: "addon",
              details: `${guestCount} guests × $${addon.amount}/person`,
            });
          }
          break;

        case "percent":
          // Percentage of bar subtotal (if bar is selected)
          if (hasBar && barSubtotal > 0) {
            addonAmount = Math.round((barSubtotal * addon.amount) / 100);
            lineItems.push({
              label: addon.name,
              amount: addonAmount,
              category: "addon",
              details: `${addon.amount}% of bar service`,
            });
          }
          break;
      }

      addonsSubtotal += addonAmount;
    });
  }

  const estimatedTotal = barSubtotal + techSubtotal + addonsSubtotal;

  return {
    lineItems,
    barSubtotal,
    techSubtotal,
    addonsSubtotal,
    estimatedTotal,
    disclaimers,
    minSpendApplied: undefined,
  };
}
