// Shared TypeScript types for booking flow

export type EventType = "wedding" | "private-party" | "corporate" | "other";
export type DurationRange = "2-3" | "4-5" | "6+";
export type BarTier = "beer-wine" | "classic-cocktail" | "premium";
export type TravelType = "local" | "extended";
export type FoodPlanStatus = "yes" | "planned" | "unsure";
export type FoodProvider = "caterer" | "food_truck" | "venue" | "host" | "other";
export type ServiceType = "bar" | "tech" | "both";

export interface FoodPlan {
  status: FoodPlanStatus;
  provider?: FoodProvider;
}

export interface Range {
  min: number;
  max: number;
}

export interface BarTierConfig {
  id: BarTier;
  name: string;
  subtitle: string;
  description: string;
  valueInclusions: string[];
  glassware: string;
  garnish: string;
  pricing: {
    perGuestRange: Range;
    durationMultipliers: Record<DurationRange, number>;
  };
}

export interface PricingConfig {
  barTiers: BarTierConfig[];
  travelRangeMultiplier: {
    local: number;
    extended: number;
  };
  baseProductionRange: Range;
  defaultRangePadding: number;
  disclaimerText?: string;
  // Legacy fields retained for unused steps
  serviceTypes: {
    bar: { label: string; description: string };
    tech: { label: string; description: string };
    both: { label: string; description: string };
  };
  barPackages: BarPackage[];
  techPackages: TechPackage[];
  addons: Addon[];
  eventProductionBase: {
    amount: number;
    included: string[];
  };
  guestCountScalingRate: number;
}

// User's booking selection state
export interface BookingSelection {
  serviceType: ServiceType | null;
  eventType: EventType | null;
  guestCount: number | null;
  duration: DurationRange | null;
  foodPlan: FoodPlan | null;
  barTier: BarTier | null;
  mocktailMenu: boolean;
  techModules: {
    starlinkWifi: boolean;
    tvDisplay: boolean;
    soundMic: boolean;
  };
  travelType: TravelType | null;
  djService: boolean;
  customBranding: boolean;
  contact: {
    name: string;
    email: string;
    phone: string;
    eventDate: string;
    bestTimeToContact: string;
    notes: string;
  };
  // Legacy fields retained for unused steps
  eventBasics?: {
    date: string;
    location: string;
    eventType: string;
    startTime: string;
    endTime: string;
    guestCountRange: string | null;
    guestCount: number | null;
  };
  barPackage?: string | null;
  techPackage?: string | null;
  addons?: string[];
  details?: {
    drinkHandling?: "hosted" | "ticketed";
    barPreferences?: string;
    beerWineVsCocktails?: string;
    barConstraints?: string;
    speechMicNeeds?: string;
    playlists?: string;
    inputSources?: string;
    venuePowerNotes?: string;
  };
}

export interface LineItem {
  label: string;
  amount: number;
  category: "core" | "addon";
  details?: string;
}

export interface Quote {
  lineItems: LineItem[];
  estimatedRange: Range;
  addonsSubtotal: number;
  disclaimers: string[];
}

// Legacy types retained for unused steps
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
  included?: string[];
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  pricingType: PricingType;
  amount: number;
  availability: AddonAvailability;
}
