import React from "react";
import { RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { pricingConfig } from "./pricingConfig";
import type { Quote, BookingSelection, DurationRange } from "./types";

interface QuoteSummaryProps {
  quote: Quote;
  selection?: BookingSelection;
  className?: string;
  onReset?: () => void;
}

export function QuoteSummary({ quote, selection, className, onReset }: QuoteSummaryProps) {
  const hasBar = selection?.serviceType === "bar" || selection?.serviceType === "both";
  const hasTech = selection?.serviceType === "tech" || selection?.serviceType === "both";

  const barTier = hasBar && selection?.barTier
    ? pricingConfig.barTiers.find((tier) => tier.id === selection.barTier)
    : null;

  const serviceTypeLabel = selection?.serviceType
    ? selection.serviceType === "bar"
      ? "Bar service"
      : selection.serviceType === "tech"
        ? "Event tech"
        : "Bar + tech"
    : null;

  const guestCountLabel = selection?.guestCount
    ? selection.guestCount === 40
      ? "~40 guests"
      : selection.guestCount === 75
        ? "~75 guests"
        : selection.guestCount === 125
          ? "~125 guests"
          : "~170 guests"
    : "Guest count pending";

  const durationLabel = (duration: DurationRange | null | undefined) => {
    if (!duration) return "Duration pending";
    if (duration === "2-3") return "2–3 hours";
    if (duration === "4-5") return "4–5 hours";
    return "6+ hours";
  };

  const liveDjPrice = selection?.duration
    ? selection.duration === "2-3"
      ? 400
      : selection.duration === "4-5"
        ? 500
        : 600
    : 500;

  const hasEstimate = quote.estimatedRange.max > 0;

  const getFoodServiceLabel = () => {
    if (!hasBar || !selection?.foodPlan) return null;
    const { status, provider } = selection.foodPlan;
    let label = "";
    if (status === "yes") label = "Confirmed";
    else if (status === "planned") label = "Planned";
    else if (status === "unsure") label = "To be confirmed";
    
    if (provider) {
      const providerLabels: Record<string, string> = {
        caterer: "Caterer",
        food_truck: "Food truck",
        venue: "Venue",
        host: "Host",
        other: "Other",
      };
      label += ` (${providerLabels[provider] || provider})`;
    }
    return label;
  };

  const getTechModulesList = () => {
    if (!hasTech || !selection?.techModules) return null;
    const modules: string[] = [];
    if (selection.techModules.starlinkWifi) modules.push("Starlink WiFi");
    if (selection.techModules.tvDisplay) modules.push("TV / Display setup");
    if (selection.techModules.soundMic) modules.push("Bose PA + Wireless Mic");
    return modules.length > 0 ? modules : null;
  };

  // Get guest count included items (non-priced line items)
  const guestCountIncludedItems = quote.lineItems.filter(
    (item) => item.amount === 0 && item.details === "Included for your guest count"
  );

  // Get priced line items (for breakdown display)
  const pricedLineItems = quote.lineItems.filter((item) => item.amount > 0);
  
  // Get gratuity line item separately
  const gratuityItem = pricedLineItems.find((item) => item.label.startsWith("Gratuity"));

  // Check if user has made any selections (to show reset button)
  const hasSelections = selection?.serviceType !== null || 
    selection?.eventType !== null || 
    selection?.guestCount !== null ||
    selection?.duration !== null ||
    selection?.barTier !== null ||
    selection?.travelType !== null ||
    selection?.djService ||
    selection?.customBranding ||
    (selection?.techModules && (selection.techModules.starlinkWifi || selection.techModules.tvDisplay || selection.techModules.soundMic));

  return (
    <Card className={`rounded-2xl border-2 border-brand-chrome bg-white ${className || ""}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Your Event Estimate</CardTitle>
          {hasSelections && onReset && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs text-brand-ink/60 hover:text-brand-ink h-auto py-1 px-2"
              title="Reset estimate"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {serviceTypeLabel && (
          <div className="pt-3 border-t border-brand-chrome/50">
            <div className="flex justify-between items-center text-sm">
              <div className="text-brand-ink/70">Service type</div>
              <div className="text-brand-ink font-medium">{serviceTypeLabel}</div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {barTier && (
            <div className="text-base font-semibold text-brand-ink">
              {barTier.name}
            </div>
          )}
          <div className="text-sm text-brand-ink/70">{guestCountLabel}</div>
          <div className="text-sm text-brand-ink/70">{durationLabel(selection?.duration)}</div>
        </div>

        {hasBar && selection?.foodPlan && (
          <div className="pt-3 border-t border-brand-chrome/50">
            <div className="flex justify-between items-center text-sm">
              <div className="text-brand-ink/70">Food service</div>
              <div className="text-brand-ink font-medium">{getFoodServiceLabel()}</div>
            </div>
          </div>
        )}

        {hasBar && selection?.mocktailMenu !== undefined && (
          <div className="pt-3 border-t border-brand-chrome/50">
            <div className="flex justify-between items-center text-sm">
              <div className="text-brand-ink/70">Mocktail menu</div>
              <div className="text-brand-ink font-medium">{selection.mocktailMenu ? "Included" : "Not included"}</div>
            </div>
          </div>
        )}

        {hasTech && getTechModulesList() && (
          <div className="pt-3 border-t border-brand-chrome/50">
            <div className="text-sm font-semibold text-brand-ink/80 mb-2">Tech modules</div>
            <div className="text-sm text-brand-ink/70 space-y-1">
              {getTechModulesList()?.map((module) => (
                <div key={module}>✓ {module}</div>
              ))}
            </div>
          </div>
        )}

        {hasBar && barTier && (
          <div className="pt-3 border-t border-brand-chrome/50">
            <div className="text-sm font-semibold text-brand-ink/80 mb-2">Includes</div>
            <div className="text-sm text-brand-ink/70 space-y-1">
              {barTier.valueInclusions.map((item) => (
                <div key={item}>✓ {item}</div>
              ))}
              <div>✓ Licensed & insured service</div>
              <div>✓ Setup & breakdown</div>
            </div>
          </div>
        )}

        {guestCountIncludedItems.length > 0 && (
          <div className="pt-3 border-t border-brand-chrome/50">
            <div className="text-sm font-semibold text-brand-ink/80 mb-2">Included for your guest count</div>
            <div className="text-sm text-brand-ink/70 space-y-1">
              {guestCountIncludedItems.map((item, idx) => (
                <div key={idx}>✓ {item.label}</div>
              ))}
            </div>
            <div className="text-xs text-brand-ink/60 mt-2 italic">
              Final staffing is confirmed after we review your timeline and layout.
            </div>
          </div>
        )}

        {((hasTech && selection?.djService) || selection?.customBranding) && (
          <div className="pt-3 border-t border-brand-chrome/50">
            <div className="text-sm font-semibold text-brand-ink/80 mb-2">Add-ons</div>
            <div className="text-sm text-brand-ink/70 space-y-1">
              {hasTech && selection?.djService && <div>Live DJ (${liveDjPrice})</div>}
              {selection?.customBranding && <div>Event Branding & Custom Drinkware</div>}
            </div>
          </div>
        )}

        {gratuityItem && (
          <div className="pt-3 border-t border-brand-chrome/50">
            <div className="flex justify-between items-center text-sm">
              <div className="text-brand-ink/70">{gratuityItem.label}</div>
              <div className="text-brand-ink font-medium">${gratuityItem.amount.toLocaleString()}</div>
            </div>
          </div>
        )}

        {hasEstimate && (
          <div className="pt-4 mt-4 border-t-2 border-brand-sea">
            <div className="text-sm text-brand-ink/60 mb-1">Estimated Range</div>
            <div className="text-2xl font-bold text-brand-sea">
              ${quote.estimatedRange.min.toLocaleString()} – ${quote.estimatedRange.max.toLocaleString()}
            </div>
          </div>
        )}

        {!hasEstimate && (
          <div className="text-sm text-brand-ink/60 text-center py-4">
            Complete the steps to see your estimate range
          </div>
        )}

        {quote.disclaimers.length > 0 && (
          <div className="pt-4 mt-4 border-t border-brand-chrome">
            <div className="text-xs text-brand-ink/60 space-y-1">
              {quote.disclaimers.map((disclaimer, idx) => (
                <div key={idx}>{disclaimer}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
