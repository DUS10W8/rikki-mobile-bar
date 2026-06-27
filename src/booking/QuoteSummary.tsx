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
  onEdit?: () => void;
}

export function QuoteSummary({ quote, selection, className, onReset, onEdit }: QuoteSummaryProps) {
  const [showBreakdown, setShowBreakdown] = React.useState(false);
  const hasBar = selection?.serviceType === "bar" || selection?.serviceType === "both";
  const hasTech = selection?.serviceType === "tech" || selection?.serviceType === "both";

  const barTier = hasBar && selection?.barTier
    ? pricingConfig.barTiers.find((tier) => tier.id === selection.barTier)
    : null;
  const barPaymentModel = hasBar && selection?.barPaymentModel
    ? pricingConfig.barPaymentModels.find((model) => model.id === selection.barPaymentModel)
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
      ? "Under 50 guests"
      : selection.guestCount === 75
        ? "50-100 guests"
        : selection.guestCount === 125
          ? "100-150 guests"
          : selection.guestCount === 175
            ? "150-200 guests"
            : selection.guestCount === 250
              ? "200+ guests"
              : `~${selection.guestCount} guests`
    : "Guest count pending";

  const durationLabel = (duration: DurationRange | null | undefined) => {
    if (!duration) return "Duration pending";
    if (duration === "2-3") return "2-3 hours";
    if (duration === "4-5") return "4-5 hours";
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
  const optionalEnhancementItems = quote.lineItems.filter(
    (item) => item.details === "Optional enhancement"
  );

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

  const getBarInclusions = () => {
    if (!barTier || !selection?.barPaymentModel) return [];
    if (selection.barPaymentModel === "guest-purchase") {
      return [
        "Vintage mobile bar setup",
        "Professional bartending",
        "Guest beverage service",
        "Setup & breakdown",
        "Licensed mobile bar operations",
      ];
    }
    if (selection.barPaymentModel === "ticketed") {
      return [
        "Hosted drink ticket service estimate",
        `${selection.drinkTicketsPerGuest} drink tickets per guest`,
        "Drinkware, garnishes, mixers, and bar supplies",
        "Setup and breakdown",
      ];
    }
    return [
      ...barTier.valueInclusions,
      "Licensed bar operations",
      "Setup and breakdown",
    ];
  };

  const guestCountIncludedItems = quote.lineItems.filter(
    (item) => item.amount === 0 && item.details === "Included for your guest count"
  );
  const gratuityItem = pricingConfig.gratuity.showLineItem
    ? quote.lineItems.find((item) => item.amount > 0 && item.label.startsWith("Gratuity"))
    : null;

  const hasSelections = !!selection && (
    selection.serviceType !== null ||
    selection.eventType !== null ||
    selection.guestCount !== null ||
    selection.duration !== null ||
    selection.barPaymentModel !== null ||
    selection.barTier !== null ||
    selection.travelType !== null ||
    selection.djService ||
    selection.customBranding ||
    selection.promoCode !== null ||
    (selection.techModules.starlinkWifi || selection.techModules.tvDisplay || selection.techModules.soundMic)
  );

  const formatCurrency = (amount: number) =>
    amount < 0
      ? `-$${Math.abs(amount).toLocaleString()}`
      : `$${amount.toLocaleString()}`;

  const formatRange = (range: { min: number; max: number }) =>
    range.min === range.max
      ? `$${range.min.toLocaleString()}`
      : `$${range.min.toLocaleString()} - $${range.max.toLocaleString()}`;

  const formatBreakdownAmount = (item: typeof quote.breakdownItems[number]) => {
    if (item.amount !== undefined) return formatCurrency(item.amount);
    if (item.range) {
      if (
        selection?.barPaymentModel === "guest-purchase" &&
        item.label === pricingConfig.guestPurchasePricing.publicLabel
      ) {
        return `$${item.range.min.toLocaleString()}+`;
      }
      return formatRange(item.range);
    }
    return null;
  };

  return (
    <Card className={`rounded-2xl border-2 border-brand-chrome bg-white ${className || ""}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Live Event Estimate</CardTitle>
          {hasSelections && onReset && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="text-xs text-brand-ink/60 hover:text-brand-ink h-auto py-1 px-2"
                >
                  Edit selections
                </Button>
              )}
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
            </div>
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
          {barTier && <div className="text-base font-semibold text-brand-ink">{barTier.name}</div>}
          <div className="text-sm text-brand-ink/70">{guestCountLabel}</div>
          <div className="text-sm text-brand-ink/70">{durationLabel(selection?.duration)}</div>
        </div>

        {barPaymentModel && (
          <div className="pt-3 border-t border-brand-chrome/50">
            <div className="flex justify-between items-start gap-4 text-sm">
              <div className="text-brand-ink/70">Payment model</div>
              <div className="text-right">
                <div className="text-brand-ink font-medium">
                  {selection?.barPaymentModel === "ticketed"
                    ? `${barPaymentModel.summaryLabel}, ${selection.drinkTicketsPerGuest} tickets per guest`
                    : barPaymentModel.summaryLabel}
                </div>
                <div className="text-xs text-brand-ink/60 mt-1 max-w-[15rem]">
                  {selection?.barPaymentModel === "client-hosted" &&
                    "Client covers the hosted bar service estimate for the event."}
                  {selection?.barPaymentModel === "guest-purchase" &&
                    "Client covers the mobile bar experience and professional beverage service. Guests purchase drinks."}
                  {selection?.barPaymentModel === "ticketed" &&
                    "Client covers a set number of drink tickets per guest. Guests purchase additional drinks after tickets are used."}
                </div>
              </div>
            </div>
          </div>
        )}

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
                <div key={module}>- {module}</div>
              ))}
            </div>
          </div>
        )}

        {hasBar && barTier && (
          <div className="pt-3 border-t border-brand-chrome/50">
            <div className="text-sm font-semibold text-brand-ink/80 mb-2">Includes</div>
            <div className="text-sm text-brand-ink/70 space-y-1">
              {getBarInclusions().map((item) => (
                <div key={item}>- {item}</div>
              ))}
            </div>
          </div>
        )}

        {guestCountIncludedItems.length > 0 && (
          <div className="pt-3 border-t border-brand-chrome/50">
            <div className="text-sm font-semibold text-brand-ink/80 mb-2">Included for your guest count</div>
            <div className="text-sm text-brand-ink/70 space-y-1">
              {guestCountIncludedItems.map((item, idx) => (
                <div key={idx}>- {item.label}</div>
              ))}
            </div>
            <div className="text-xs text-brand-ink/60 mt-2 italic">
              Final staffing is confirmed after we review your timeline and layout.
            </div>
          </div>
        )}

        {((hasTech && selection?.djService) || optionalEnhancementItems.length > 0) && (
          <div className="pt-3 border-t border-brand-chrome/50">
            <div className="text-sm font-semibold text-brand-ink/80 mb-2">Optional enhancements</div>
            <div className="text-sm text-brand-ink/70 space-y-1">
              {hasTech && selection?.djService && <div>Live DJ (${liveDjPrice})</div>}
              {optionalEnhancementItems.map((item) => (
                <div key={item.label}>{item.label}</div>
              ))}
            </div>
            <div className="text-xs text-brand-ink/60 mt-2">
              {pricingConfig.estimateLanguage.optionalEnhancementCopy}
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

        {selection?.promoCode && (
          <div className="pt-3 border-t border-brand-chrome/50">
            <div className="flex justify-between items-start gap-4 text-sm">
              <div>
                <div className="font-semibold text-brand-ink">{selection.promoCode.label}</div>
                <div className="text-xs text-brand-ink/60 mt-1">{selection.promoCode.message}</div>
              </div>
              <div className="font-bold text-brand-sea whitespace-nowrap">
                -${selection.promoCode.discountAmount.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {hasEstimate && (
          <div className="pt-4 mt-4 border-t-2 border-brand-sea">
            <div className="text-sm text-brand-ink/60 mb-1">{pricingConfig.estimateLanguage.rangeLabel}</div>
            <div className="text-2xl font-bold text-brand-sea transition-all duration-200">
              {formatRange(quote.estimatedRange)}
            </div>
            <div className="text-xs text-brand-ink/60 mt-1">
              {selection?.barPaymentModel === "guest-purchase"
                ? "Most guest-purchase beer & wine events start around this range."
                : "Most events like this start around this range."}
            </div>
            {quote.breakdownItems.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBreakdown((value) => !value)}
                className="mt-3 text-sm font-semibold text-brand-sea hover:text-brand-rust transition-colors"
              >
                {showBreakdown ? "Hide breakdown" : "See breakdown"}
              </button>
            )}
          </div>
        )}

        {showBreakdown && quote.breakdownItems.length > 0 && (
          <div className="pt-3 border-t border-brand-chrome/50">
            <div className="text-sm font-semibold text-brand-ink/80 mb-2">Estimate breakdown</div>
            <div className="space-y-3">
              {quote.breakdownItems.map((item) => {
                const amount = formatBreakdownAmount(item);
                return (
                  <div key={`${item.label}-${item.note || amount || ""}`} className="text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-brand-ink/75">{item.label}</div>
                      {amount && <div className="font-medium text-brand-ink text-right">{amount}</div>}
                    </div>
                    {item.note && <div className="text-xs text-brand-ink/55 mt-1">{item.note}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!hasEstimate && (
          <div className="text-sm text-brand-ink/60 text-center py-4">
            {quote.requiresCustomQuote
              ? "200+ guests — we'll put together a custom quote for your event. Fill out the form to get started."
              : pricingConfig.estimateLanguage.pendingCopy}
          </div>
        )}

        {quote.serviceNotes.length > 0 && (
          <div className="text-xs text-brand-ink/60 space-y-1">
            {quote.serviceNotes.map((note, idx) => (
              <div key={idx}>{note}</div>
            ))}
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
