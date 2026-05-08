import type { PricingConfig } from "./types";

export const pricingConfig: PricingConfig = {
  serviceTypes: {
    bar: {
      label: "Bar service",
      description: "Premium mobile bar service with licensed alcohol purchasing and service.",
    },
    tech: {
      label: "Event tech",
      description: "Sound, displays, WiFi, and event technology.",
    },
    both: {
      label: "Bar + tech",
      description: "Full-service bar and event technology together.",
    },
  },
  barTiers: [
    {
      id: "beer-wine",
      name: "Beer & Wine Bar",
      subtitle: "Simple, fast, and intentional.",
      description: "Alcohol included: beer, wine, and a small set of simple mixed drinks, built for clean service flow and happy guests.",
      valueInclusions: [
        "Alcohol for your selected drink program",
        "Drinkware/cups",
        "Simple garnish and bar supplies",
      ],
      glassware: "Drinkware/cups included",
      garnish: "Simple garnish and bar supplies",
      pricing: {
        perGuestRange: { min: 16, max: 20 },
        durationMultipliers: {
          "2-3": 0.9,
          "4-5": 1,
          "6+": 1.25,
        },
      },
    },
    {
      id: "classic-cocktail",
      name: "Classic Cocktail Bar",
      subtitle: "Most Popular",
      description: "Alcohol included: a curated menu of crowd-pleasing classics with a limited signature set, balanced for speed, consistency, and polish.",
      valueInclusions: [
        "Alcohol for your selected drink program",
        "Drinkware/cups",
        "Garnishes, mixers, and bar supplies",
      ],
      glassware: "Drinkware/cups included",
      garnish: "Garnishes, mixers, and bar supplies",
      pricing: {
        perGuestRange: { min: 20, max: 26 },
        durationMultipliers: {
          "2-3": 0.9,
          "4-5": 1,
          "6+": 1.25,
        },
      },
    },
    {
      id: "premium",
      name: "Premium Bar",
      subtitle: "Signature-forward + elevated ingredients.",
      description: "Alcohol included: an expanded signature cocktail menu with elevated ingredients, garnishes, and sophisticated presentation.",
      valueInclusions: [
        "Alcohol for your selected drink program",
        "Drinkware/cups",
        "Premium garnishes, mixers, and bar supplies",
        "Elevated garnish presentation",
      ],
      glassware: "Drinkware/cups included",
      garnish: "Premium garnishes, mixers, and bar supplies",
      pricing: {
        perGuestRange: { min: 26, max: 34 },
        durationMultipliers: {
          "2-3": 0.9,
          "4-5": 1,
          "6+": 1.25,
        },
      },
    },
  ],
  barPackages: [],
  techPackages: [],
  addons: [],
  eventProductionBase: {
    amount: 0,
    included: [],
  },
  guestCountScalingRate: 0,
  travelRangeMultiplier: {
    local: 1,
    extended: 1.12,
  },
  baseProductionRange: {
    min: 800,
    max: 800,
  },
  defaultRangePadding: 140,
  disclaimerText: "This is an estimate. Final quote confirmed after we review your details and availability.",
};
