import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import type { ServiceType, PricingConfig } from "../types";

interface ServiceTypeStepProps {
  value: ServiceType | null;
  onChange: (value: ServiceType) => void;
  config: PricingConfig;
}

export function ServiceTypeStep({ value, onChange, config }: ServiceTypeStepProps) {
  const options: Array<{ type: ServiceType; label: string; description: string }> = [
    {
      type: "bar",
      label: config.serviceTypes.bar.label,
      description: config.serviceTypes.bar.description,
    },
    {
      type: "tech",
      label: config.serviceTypes.tech.label,
      description: config.serviceTypes.tech.description,
    },
    {
      type: "both",
      label: config.serviceTypes.both.label,
      description: config.serviceTypes.both.description,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Which services are you looking for?</h3>
        <p className="text-brand-ink/70 text-sm">Select the services you need for your event.</p>
      </div>
      <div className="grid gap-4">
        {options.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => onChange(option.type)}
            className={`text-left transition-all ${
              value === option.type
                ? "ring-4 ring-brand-sea ring-offset-2"
                : "hover:ring-2 hover:ring-brand-chrome"
            }`}
          >
            <Card
              className={`rounded-2xl border-2 ${
                value === option.type
                  ? "border-brand-sea bg-brand-sea/5"
                  : "border-brand-chrome bg-white hover:border-brand-sea/50"
              }`}
            >
              <CardContent className="p-6">
                <div className="font-bold text-lg mb-2">{option.label}</div>
                <div className="text-sm text-brand-ink/70">{option.description}</div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
