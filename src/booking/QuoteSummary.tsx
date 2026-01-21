import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import type { Quote, BookingSelection } from "./types";

interface QuoteSummaryProps {
  quote: Quote;
  selection?: BookingSelection;
  className?: string;
}

export function QuoteSummary({ quote, selection, className }: QuoteSummaryProps) {
  const eventProductionBase = quote.lineItems.find((item) => item.label === "Event Production Base");
  const guestCountScaling = quote.lineItems.find((item) => item.label === "Guest Count Scaling");
  const drinkProgramItems = quote.lineItems.filter((item) => item.label.startsWith("Drink Program"));
  const techItems = quote.lineItems.filter((item) => item.category === "tech");
  const addonItems = quote.lineItems.filter((item) => item.category === "addon");

  // Expert nudge: show when event type, guest count, and package are selected
  const showExpertNudge = selection?.eventBasics.eventType && 
                          selection?.eventBasics.guestCountRange && 
                          selection?.barPackage &&
                          !selection?.details.drinkHandling;

  return (
    <Card className={`rounded-2xl border-2 border-brand-chrome bg-white ${className || ""}`}>
      <CardHeader>
        <CardTitle className="text-xl">Estimate Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {eventProductionBase && (
          <div>
            <div className="text-sm font-semibold text-brand-ink/80 mb-2">Event Production Base</div>
            <div className="flex justify-between items-start text-sm">
              <div className="flex-1">
                <div className="text-brand-ink">{eventProductionBase.label}</div>
                {eventProductionBase.details && (
                  <div className="text-xs text-brand-ink/60 mt-0.5">{eventProductionBase.details}</div>
                )}
              </div>
              <div className="ml-4 font-medium">${eventProductionBase.amount.toLocaleString()}</div>
            </div>
          </div>
        )}

        {guestCountScaling && (
          <div>
            <div className="text-sm font-semibold text-brand-ink/80 mb-2">Guest Count Scaling</div>
            <div className="flex justify-between items-start text-sm">
              <div className="flex-1">
                <div className="text-brand-ink">{guestCountScaling.label}</div>
                {guestCountScaling.details && (
                  <div className="text-xs text-brand-ink/60 mt-0.5">{guestCountScaling.details}</div>
                )}
              </div>
              <div className="ml-4 font-medium">${guestCountScaling.amount.toLocaleString()}</div>
            </div>
          </div>
        )}

        {drinkProgramItems.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-brand-ink/80 mb-2">Drink Program</div>
            <div className="space-y-2">
              {drinkProgramItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <div className="flex-1">
                    <div className="text-brand-ink">{item.label}</div>
                    {item.details && <div className="text-xs text-brand-ink/60 mt-0.5">{item.details}</div>}
                  </div>
                  <div className="ml-4 font-medium">${item.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {techItems.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-brand-ink/80 mb-2">Add-ons (Tech, satellite bar, generator, etc.)</div>
            <div className="space-y-2">
              {techItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <div className="flex-1">
                    <div className="text-brand-ink">{item.label}</div>
                    {item.details && (
                      <div className="text-xs text-brand-ink/60 mt-0.5">{item.details}</div>
                    )}
                  </div>
                  <div className="ml-4 font-medium">${item.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
            {quote.techSubtotal > 0 && (
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-brand-chrome">
                <div className="text-sm font-semibold">Tech Subtotal</div>
                <div className="font-semibold">${quote.techSubtotal.toLocaleString()}</div>
              </div>
            )}
          </div>
        )}

        {addonItems.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-brand-ink/80 mb-2">Add-ons (Tech, satellite bar, generator, etc.)</div>
            <div className="space-y-2">
              {addonItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <div className="flex-1">
                    <div className="text-brand-ink">{item.label}</div>
                    {item.details && (
                      <div className="text-xs text-brand-ink/60 mt-0.5">{item.details}</div>
                    )}
                  </div>
                  <div className="ml-4 font-medium">${item.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
            {quote.addonsSubtotal > 0 && (
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-brand-chrome">
                <div className="text-sm font-semibold">Add-ons Subtotal</div>
                <div className="font-semibold">${quote.addonsSubtotal.toLocaleString()}</div>
              </div>
            )}
          </div>
        )}

        {quote.lineItems.length === 0 && (
          <div className="text-sm text-brand-ink/60 text-center py-4">
            Complete the steps to see your estimate
          </div>
        )}

        {showExpertNudge && (
          <div className="pt-3 mt-3 border-t border-brand-chrome/50">
            <p className="text-xs text-brand-ink/60 italic">
              Based on events like this, most hosts choose a hosted bar with a classic or signature menu.
            </p>
          </div>
        )}

        {quote.estimatedTotal > 0 && (
          <div className="pt-4 mt-4 border-t-2 border-brand-sea">
            <div className="flex justify-between items-center">
              <div className="text-lg font-bold">Estimated Total</div>
              <div className="text-2xl font-bold text-brand-sea">${quote.estimatedTotal.toLocaleString()}</div>
            </div>
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
