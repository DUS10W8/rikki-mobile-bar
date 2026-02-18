import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import type { PricingConfig } from "../types";

interface TechPackageStepProps {
  value: string | null;
  onChange: (value: string) => void;
  config: PricingConfig;
}

export function TechPackageStep({ value, onChange, config }: TechPackageStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Choose your tech package</h3>
        <p className="text-brand-ink/70 text-sm">Select the tech package that fits your event needs.</p>
      </div>
      <div className="grid gap-4">
        {config.techPackages.map((pkg) => (
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
                  <div className="font-bold text-lg">{pkg.name}</div>
                  <div className="text-right">
                    <div className="font-semibold text-brand-sea">${pkg.flatFee.toLocaleString()}</div>
                    <div className="text-xs text-brand-ink/60">flat fee</div>
                  </div>
                </div>
                <div className="text-sm text-brand-ink/70 mb-3">{pkg.description}</div>
                {pkg.included && pkg.included.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-brand-chrome">
                    <div className="text-xs font-semibold text-brand-ink/80 mb-2">What's included:</div>
                    <ul className="space-y-1 text-xs text-brand-ink/60">
                      {pkg.included.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-brand-sea mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
