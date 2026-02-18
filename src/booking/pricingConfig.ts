import type { PricingConfig } from "./types";

export const pricingConfig: PricingConfig = {
  serviceTypes: {
    bar: {
      label: "Bar service",
      description: "Premium mobile bar service with licensed bartenders.",
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
      description: "Beer & wine plus a small set of simple mixed drinks—built for clean service flow and happy guests.",
      valueInclusions: [
        "Event-grade stemless wine glasses",
        "Highball cups",
        "Minimal citrus (lemon/lime)",
      ],
      glassware: "Event-grade stemless wine glasses + highball cups",
      garnish: "Minimal citrus (lemon/lime)",
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
      description: "A curated menu of crowd-pleasing classics with a limited signature set—balanced for speed, consistency, and polish.",
      valueInclusions: [
        "Rocks & highball glassware",
        "Cocktail coupes",
        "Citrus twists, dehydrated citrus, house syrups",
      ],
      glassware: "Rocks & highball glassware + cocktail coupes",
      garnish: "Citrus twists, dehydrated citrus, house syrups",
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
      description: "An expanded signature cocktail menu with elevated ingredients, garnishes, and sophisticated presentation.",
      valueInclusions: [
        "Premium crystal-style glassware",
        "Specialty signature glassware",
        "Dehydrated citrus, herbs, seasonal fruit",
        "Elevated garnish presentation",
      ],
      glassware: "Premium crystal-style glassware + specialty signature glassware",
      garnish: "Dehydrated citrus, herbs, seasonal fruit, elevated garnish presentation",
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
