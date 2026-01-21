import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import type { PricingConfig, ServiceType } from "../types";

interface AddonsStepProps {
  value: string[];
  onChange: (value: string[]) => void;
  config: PricingConfig;
  serviceType: ServiceType | null;
  guestCount: number | null;
}

export function AddonsStep({ value, onChange, config, serviceType, guestCount }: AddonsStepProps) {
  const hasBar = serviceType === "bar" || serviceType === "both";
  const hasTech = serviceType === "tech" || serviceType === "both";

  // Filter addons based on availability and service type
  const availableAddons = config.addons.filter((addon) => {
    if (addon.availability === "both") return true;
    if (addon.availability === "bar" && hasBar) return true;
    if (addon.availability === "tech" && hasTech) return true;
    return false;
  });

  const toggleAddon = (addonId: string) => {
    if (value.includes(addonId)) {
      onChange(value.filter((id) => id !== addonId));
    } else {
      onChange([...value, addonId]);
    }
  };

  const getAddonPrice = (addon: typeof config.addons[0]): string => {
    switch (addon.pricingType) {
      case "flat":
        return `$${addon.amount.toLocaleString()}`;
      case "perPerson":
        if (guestCount) {
          return `$${(guestCount * addon.amount).toLocaleString()} ($${addon.amount}/person)`;
        }
        return `$${addon.amount}/person`;
      case "percent":
        return `${addon.amount}% of bar service`;
      default:
        return "";
    }
  };

  if (availableAddons.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold mb-2">Add upgrades</h3>
          <p className="text-brand-ink/70 text-sm">No add-ons available for your selected service type.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Add upgrades</h3>
        <p className="text-brand-ink/70 text-sm">Enhance your event with optional add-ons.</p>
      </div>
      <div className="grid gap-4">
        {availableAddons.map((addon) => {
          const isSelected = value.includes(addon.id);
          return (
            <button
              key={addon.id}
              type="button"
              onClick={() => toggleAddon(addon.id)}
              className={`text-left transition-all ${
                isSelected ? "ring-4 ring-brand-sea ring-offset-2" : "hover:ring-2 hover:ring-brand-chrome"
              }`}
            >
              <Card
                className={`rounded-2xl border-2 ${
                  isSelected
                    ? "border-brand-sea bg-brand-sea/5"
                    : "border-brand-chrome bg-white hover:border-brand-sea/50"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`mt-1 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "border-brand-sea bg-brand-sea"
                            : "border-brand-chrome bg-white"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-lg">{addon.name}</div>
                        <div className="text-sm text-brand-ink/70 mt-1">{addon.description}</div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-brand-sea">{getAddonPrice(addon)}</div>
                    </div>
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
