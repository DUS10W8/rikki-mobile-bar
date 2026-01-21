import type { PricingConfig } from "./types";

export const pricingConfig: PricingConfig = {
  serviceTypes: {
    bar: {
      label: "Bar Only",
      description: "Perfect for events focused on drinks and service.",
    },
    tech: {
      label: "Tech Only",
      description: "Perfect for events that need sound, lighting, or content capture.",
    },
    both: {
      label: "Bar + Tech",
      description: "Perfect for full-service events with drinks and entertainment.",
    },
  },
  barPackages: [
    {
      id: "beer-wine",
      name: "Beer & Wine Bar",
      subtitle: "Simple, fast, and intentional.",
      description: "Beer & wine plus a small set of simple mixed drinks—built for clean service flow and happy guests.",
      examples: "Examples: spritz, rum & coke, jack & diet, classic margarita.",
      drinkProgramMultiplier: 1.0,
    },
    {
      id: "classic-cocktail",
      name: "Classic Cocktail Bar",
      subtitle: "Classics + a few signatures.",
      description: "A curated menu of crowd-pleasing classics with a limited signature set—balanced for speed, consistency, and polish.",
      examples: "Examples: margarita, whiskey sour, old fashioned + 2–3 signatures.",
      drinkProgramMultiplier: 1.35,
    },
    {
      id: "premium-mocktail",
      name: "Premium / Mocktail Bar",
      subtitle: "Signature-forward + zero-proof done right.",
      description: "An expanded signature cocktail menu with elevated ingredients, garnishes, and intentional zero-proof options.",
      examples: "Includes: 3–5 signatures + elevated mocktails.",
      drinkProgramMultiplier: 1.6,
    },
  ],
  techPackages: [
    {
      id: "basic-tech",
      name: "Basic Tech Package",
      description: "Sound system, basic lighting, and playlist management.",
      flatFee: 400,
      included: [
        "Portable sound system with wireless mic",
        "Basic ambient lighting",
        "Playlist setup and management",
        "Standard power requirements",
      ],
    },
    {
      id: "premium-tech",
      name: "Premium Tech Package",
      description: "Full sound, advanced lighting, content capture, and live streaming.",
      flatFee: 800,
      included: [
        "Premium sound system with multiple mics",
        "Advanced lighting setup",
        "Content capture (photo/video highlights)",
        "Live streaming capability",
        "Dedicated tech coordinator",
      ],
    },
  ],
  addons: [
    {
      id: "satellite-bar",
      name: "Satellite Bar",
      description: "Add a second service point to speed lines for high guest counts.",
      pricingType: "flat",
      amount: 300,
      availability: "bar",
    },
    {
      id: "generator-power",
      name: "Generator & Power",
      description: "Perfect for off-grid or outdoor locations without power access.",
      pricingType: "flat",
      amount: 200,
      availability: "both",
    },
    {
      id: "content-capture",
      name: "Content Capture",
      description: "We can record & stream highlights for your guests.",
      pricingType: "flat",
      amount: 250,
      availability: "tech",
    },
    {
      id: "premium-glassware",
      name: "Premium Glassware",
      description: "Upgraded glassware selection for a more polished presentation.",
      pricingType: "flat",
      amount: 150,
      availability: "bar",
    },
    {
      id: "extra-bartender",
      name: "Extra Bartender",
      description: "Additional staff member to handle high-volume events.",
      pricingType: "flat",
      amount: 200,
      availability: "bar",
    },
    {
      id: "late-night-extension",
      name: "Late Night Extension",
      description: "Extend service beyond standard hours (per hour).",
      pricingType: "flat",
      amount: 150,
      availability: "bar",
    },
  ],
  disclaimerText: "This is an estimate. Final quote confirmed after we review your details and availability.",
  eventProductionBase: {
    amount: 800,
    included: [
      "Licensed & insured service",
      "Custom planning & menu design",
      "Travel + vehicle setup",
      "Power, ice, and breakdown coordination",
    ],
  },
  guestCountScalingRate: 10,
};
