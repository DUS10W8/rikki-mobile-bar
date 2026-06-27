// Shared TypeScript types for booking flow

export type EventType = "wedding" | "private-party" | "corporate" | "other";
export type DurationRange = "2-3" | "4-5" | "6+";
export type BarTier = "beer-wine" | "classic-cocktail" | "premium";
export type TravelType = "local" | "extended";
export type FoodPlanStatus = "yes" | "planned" | "unsure";
export type FoodProvider = "caterer" | "food_truck" | "venue" | "host" | "other";
export type ServiceType = "bar" | "tech" | "both";
export type BarPaymentModel = "client-hosted" | "guest-purchase" | "ticketed";

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

export interface PromoCodeConfig {
  code: string;
  label: string;
  description: string;
  discountAmount: number;
  maxRedemptions: number;
}

export interface AppliedPromoCode {
  code: string;
  label: string;
  description: string;
  discountAmount: number;
  status: "applied" | "pending" | "reserved";
  message: string;
}

export interface PricingConfig {
  barTiers: BarTierConfig[];
  travelRangeMultiplier: {
    local: number;
    extended: number;
  };
  baseProductionRange: Range;
  barPaymentModels: BarPaymentModelConfig[];
  guestPurchasePricing: {
    // Base service fee by bar tier (under 50 guests, 2-3 hours)
    baseFeeByTier: Record<BarTier, number>;
    // Guest count bracket uplifts -- flat add-on, same across all tiers
    guestCountUplifts: Array<{ maxGuests: number; uplift: number }>;
    // Guests above this threshold → custom quote required
    customQuoteGuestThreshold: number;
    // Duration add-ons (flat, on top of base + guest uplift)
    durationAddons: Record<DurationRange, number>;
    publicLabel: string;
    publicNote: string;
  };
  clientHostedMinimumRange: Range;
  ticketedBarMinimumRange: Range;
  defaultDrinkTicketsPerGuest: number;
  ticketedBarPricingFactor: number;
  estimateRangeTighteningFactor: number;
  estimateRounding: {
    increment: number;
    minDirection: "nearest" | "down" | "up";
    maxDirection: "nearest" | "down" | "up";
  };
  gratuity: {
    percent: number;
    includeInEstimate: boolean;
    showLineItem: boolean;
    summaryCopy: string;
  };
  optionalEnhancements: {
    customBrandingRange: Range;
    mocktailMenuRange: Range;
  };
  promoCodes: PromoCodeConfig[];
  estimateLanguage: {
    rangeLabel: string;
    pendingCopy: string;
    disclaimerText: string;
    optionalEnhancementCopy: string;
  };
  defaultRangePadding: number;
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
  barStyle: string | null; // ID of the selected style card -- drives barPaymentModel pre-selection
  serviceType: ServiceType | null;
  eventType: EventType | null;
  guestCount: number | null;
  duration: DurationRange | null;
  foodPlan: FoodPlan | null;
  barPaymentModel: BarPaymentModel | null;
  drinkTicketsPerGuest: number;
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
  promoCode: AppliedPromoCode | null;
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
  category: "core" | "addon" | "discount";
  details?: string;
}

export interface BreakdownItem {
  label: string;
  range?: Range;
  amount?: number;
  note?: string;
}

export interface Quote {
  lineItems: LineItem[];
  breakdownItems: BreakdownItem[];
  estimatedRange: Range;
  addonsSubtotal: number;
  disclaimers: string[];
  serviceNotes: string[];
  requiresCustomQuote?: boolean;
}

export interface BarPaymentModelConfig {
  id: BarPaymentModel;
  label: string;
  summaryLabel: string;
  description: string;
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
