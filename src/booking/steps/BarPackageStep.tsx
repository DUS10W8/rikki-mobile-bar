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
  const getDescription = (description: string) => {
    if (paymentModel === "guest-purchase") {
      return "Select the drink program style guests can purchase from at the event.";
    }
    if (paymentModel === "ticketed") {
      return "Select the drink program style for the hosted drink ticket estimate.";
    }
    return description;
  };

  const paymentNote =
    paymentModel === "guest-purchase"
      ? "Guest-purchase bar: your estimate covers the mobile bar experience and professional beverage service."
      : paymentModel === "ticketed"
        ? "Drink ticket model: your estimate covers the selected tickets per guest."
        : "Hosted drink service estimate for your selected drink program.";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Drink Program</h3>
        <p className="text-brand-ink/70 text-sm">Select the drink program that fits your event.</p>
      </div>
      <div className="grid gap-4">
        {config.barTiers.map((pkg) => {
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
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-1">{pkg.name}</div>
                      <div className="text-xs text-brand-ink/60 mb-2">{pkg.subtitle}</div>
                    </div>
                  </div>
                  <div className="text-sm text-brand-ink/70 mb-2">{getDescription(pkg.description)}</div>
                  <div className="mb-3 rounded-xl border border-brand-sea/25 bg-brand-sea/10 px-3 py-2 text-xs font-semibold text-brand-ink">
                    {paymentNote}
                  </div>
                  <div className="pt-3 border-t border-brand-chrome/50 text-xs text-brand-ink/60 space-y-1">
                    <div className="font-semibold">Includes:</div>
                    <div>{pkg.glassware}</div>
                    <div>{pkg.garnish}</div>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
