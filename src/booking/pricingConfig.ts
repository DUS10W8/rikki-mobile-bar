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
  barPaymentModels: [
    {
      id: "client-hosted",
      label: "Client-hosted bar",
      summaryLabel: "Client-hosted bar",
      description: "You cover the estimated hosted drink service for your guests.",
    },
    {
      id: "guest-purchase",
      label: "Guest-purchase bar",
      summaryLabel: "Guest-purchase bar",
      description: "You cover the mobile bar experience and professional beverage service; guests purchase drinks at the event.",
    },
    {
      id: "ticketed",
      label: "Ticketed hosted bar",
      summaryLabel: "Ticketed bar",
      description: "You cover a set number of drink tickets per guest; guests purchase additional drinks after tickets are used.",
    },
  ],
  guestPurchasePricing: {
    entryRange: {
      min: 800,
      max: 800,
    },
    includedGuests: 30,
    includedDuration: "2-3",
    additionalGuestRange: {
      min: 5,
      max: 8,
    },
    durationUpliftRanges: {
      "2-3": { min: 0, max: 0 },
      "4-5": { min: 250, max: 450 },
      "6+": { min: 550, max: 850 },
    },
    tierUpliftRanges: {
      "beer-wine": { min: 0, max: 0 },
      "classic-cocktail": { min: 250, max: 400 },
      premium: { min: 500, max: 750 },
    },
    additionalBartender: {
      threshold: 50,
      range: { min: 175, max: 275 },
    },
    satelliteBar: {
      threshold: 75,
      range: { min: 175, max: 325 },
    },
    publicLabel: "Mobile bar experience & service",
    publicNote: "Includes vintage mobile bar setup, professional bartending, guest beverage service, setup & breakdown, and licensed mobile bar operations.",
  },
  clientHostedMinimumRange: {
    min: 2000,
    max: 2800,
  },
  defaultDrinkTicketsPerGuest: 2,
  ticketedBarPricingFactor: 0.75,
  estimateRangeTighteningFactor: 0.5,
  estimateRounding: {
    increment: 50,
    minDirection: "up",
    maxDirection: "nearest",
  },
  gratuity: {
    percent: 0.2,
    includeInEstimate: false,
    showLineItem: false,
    summaryCopy: "",
  },
  optionalEnhancements: {
    customBrandingRange: {
      min: 250,
      max: 350,
    },
    mocktailMenuRange: {
      min: 150,
      max: 250,
    },
  },
  promoCodes: [
    {
      code: "CLUBWAGON",
      label: "Founder's Code",
      description: "First Pour Offer for the first 3 confirmed bookings.",
      discountAmount: 150,
      maxRedemptions: 3,
    },
  ],
  estimateLanguage: {
    rangeLabel: "Estimated starting range",
    pendingCopy: "Complete the steps to see your estimated starting range",
    disclaimerText: "Most events like this start around the range shown. Final quote may adjust based on guest count, event length, beverage program, staffing, travel, and event complexity.",
    optionalEnhancementCopy: "Optional enhancements can be added or refined during confirmation.",
  },
  defaultRangePadding: 140,
};
