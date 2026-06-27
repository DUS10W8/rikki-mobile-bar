import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import type { BarPaymentModel, PricingConfig } from "../types";

interface BarPackageStepProps {
  value: string | null;
  onChange: (value: string) => void;
  config: PricingConfig;
  paymentModel?: BarPaymentModel | null;
}

export function BarPackageStep({ value, onChange, config, paymentModel }: BarPackageStepProps) {
  // When paymentModel is known, show context-specific note
  const paymentNote = paymentModel === "guest-purchase"
    ? "Guest-purchase bar: estimate covers mobile bar experience and professional service."
    : paymentModel === "ticketed"
      ? "Drink ticket model: estimate covers the hosted ticket allocation per guest."
      : paymentModel === "client-hosted"
        ? "Hosted bar: estimate covers the full drink program for your guests."
        : null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Choose your bar package</h3>
        <p className="text-brand-ink/70 text-sm">
          This sets the foundation for your estimate. Guest count, duration, and travel stack on top.
        </p>
      </div>
      <div className="grid gap-4">
        {config.barTiers.map((pkg) => {
          const perGuestMin = pkg.pricing.perGuestRange.min;
          const perGuestMax = pkg.pricing.perGuestRange.max;

          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onChange(pkg.id)}
              className={`text-left transition-all ${
                value === pkg.id
                  ? "estimator-choice-selected ring-4 ring-brand-sea ring-offset-2"
                  : "hover:ring-2 hover:ring-brand-chrome"
              }`}
            >
              <Card
                className={`rounded-2xl border-2 ${
                  value === pkg.id
                    ? "border-brand-sea bg-brand-sea/5"
                    : "border-brand-chrome bg-white hover:border-brand-sea/50"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-0.5">{pkg.name}</div>
                      <div className="text-xs text-brand-ink/60">{pkg.subtitle}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-brand-ink/50 mb-0.5">per guest</div>
                      <div className="font-bold text-brand-sea text-sm">
                        ${perGuestMin}–${perGuestMax}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-brand-ink/70 mb-3">{pkg.description}</div>
                  <div className="pt-3 border-t border-brand-chrome/50 text-xs text-brand-ink/60 space-y-1">
                    <div className="font-semibold text-brand-ink/80">What's included:</div>
                    {pkg.valueInclusions.map((item) => (
                      <div key={item} className="flex items-center gap-1.5">
                      <span className="text-brand-sea">✓</span> {item}
                    </div>
                  ))}
                </div>
                {paymentNote && (
                  <div className="mt-3 rounded-xl border border-brand-sea/25 bg-brand-sea/10 px-3 py-2 text-xs font-semibold text-brand-ink">
                    {paymentNote}
                  </div>
                )}
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  </div>
);
}
