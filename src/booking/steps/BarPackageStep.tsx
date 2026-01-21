import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import type { PricingConfig } from "../types";

interface BarPackageStepProps {
  value: string | null;
  onChange: (value: string) => void;
  config: PricingConfig;
  guestCountRange: string | null;
}

export function BarPackageStep({ value, onChange, config, guestCountRange }: BarPackageStepProps) {
  // Convert range to approximate guest count for calculation
  const getApproximateGuestCount = (range: string | null): number => {
    switch (range) {
      case "under-40":
        return 30;
      case "40-75":
        return 55;
      case "75-125":
        return 100;
      case "125+":
        return 150;
      default:
        return 0;
    }
  };

  const approximateGuestCount = getApproximateGuestCount(guestCountRange);
  const guestCountFactorRate = config.guestCountScalingRate || 0;
  const baseFee = config.eventProductionBase?.amount || 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Drink Program</h3>
        <p className="text-brand-ink/70 text-sm">
          Guest count affects staffing and volume. Drink program affects ingredients and menu complexity.
        </p>
      </div>
      <div className="grid gap-4">
        {config.barPackages.map((pkg) => {
          const guestCountFactor = approximateGuestCount * guestCountFactorRate;
          const drinkProgramAmount = guestCountFactor * pkg.drinkProgramMultiplier;
          const finalAmount = baseFee + guestCountFactor + drinkProgramAmount;

          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onChange(pkg.id)}
              className={`text-left transition-all ${
                value === pkg.id
                  ? "ring-4 ring-brand-sea ring-offset-2"
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
                    {approximateGuestCount > 0 && (
                      <div className="text-right ml-4">
                        <div className="font-semibold text-brand-sea">
                          ${Math.round(finalAmount).toLocaleString()}+
                        </div>
                        <div className="text-xs text-brand-ink/60">estimate</div>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-brand-ink/70 mb-2">{pkg.description}</div>
                  {pkg.examples && <div className="text-xs text-brand-ink/60">{pkg.examples}</div>}
                  <div className="pt-3 border-t border-brand-chrome/50 text-xs text-brand-ink/60 space-y-1">
                    <div className="font-semibold">Estimate includes:</div>
                    <div>Event Production Base + guest count scaling + drink program multiplier</div>
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
