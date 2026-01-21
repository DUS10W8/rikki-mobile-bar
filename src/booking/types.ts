// Shared TypeScript types for booking flow

export type ServiceType = "bar" | "tech" | "both";

export type PricingType = "flat" | "perPerson" | "percent";

export type AddonAvailability = "bar" | "tech" | "both";

export interface BarPackage {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  examples?: string;
  drinkProgramMultiplier: number;
}

export interface TechPackage {
  id: string;
  name: string;
  description: string;
  flatFee: number;
  included?: string[]; // bullet points of what's included
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  pricingType: PricingType;
  amount: number; // flat fee, per-person rate, or percentage (0-100)
  availability: AddonAvailability; // which service types can use this addon
}

export interface PricingConfig {
  serviceTypes: {
    bar: { label: string; description: string };
    tech: { label: string; description: string };
    both: { label: string; description: string };
  };
  barPackages: BarPackage[];
  techPackages: TechPackage[];
  addons: Addon[];
  disclaimerText?: string;
  eventProductionBase?: {
    amount: number;
    included: string[];
  };
  guestCountScalingRate?: number;
}

// User's booking selection state
export interface BookingSelection {
  serviceType: ServiceType | null;
  eventBasics: {
    date: string;
    location: string;
    eventType: string;
    startTime: string;
    endTime: string;
    guestCountRange: string | null; // e.g., "under-40", "40-75", "75-125", "125+"
    guestCount: number | null; // optional exact count for calculation
  };
  barPackage: string | null; // package id
  techPackage: string | null; // package id
  addons: string[]; // array of addon ids
  details: {
    drinkHandling?: "hosted" | "ticketed";
    barPreferences?: string;
    beerWineVsCocktails?: string;
    barConstraints?: string;
    speechMicNeeds?: string;
    playlists?: string;
    inputSources?: string;
    venuePowerNotes?: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
    bestTimeToContact: string;
    notes: string;
  };
}

// Quote calculation output
export interface LineItem {
  label: string;
  amount: number;
  category: "bar" | "tech" | "addon";
  details?: string; // e.g., "50 guests × $25/person" or "Minimum spend applied"
}

export interface Quote {
  lineItems: LineItem[];
  barSubtotal: number;
  techSubtotal: number;
  addonsSubtotal: number;
  estimatedTotal: number;
  disclaimers: string[];
  minSpendApplied?: {
    category: "bar";
    originalAmount: number;
    adjustedAmount: number;
  };
}
