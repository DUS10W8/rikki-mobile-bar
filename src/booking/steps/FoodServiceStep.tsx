import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import type { FoodPlan, FoodPlanStatus, FoodProvider } from "../types";

interface FoodServiceStepProps {
  value: FoodPlan | null;
  onChange: (value: FoodPlan) => void;
}

const foodStatusOptions: { id: FoodPlanStatus; label: string }[] = [
  { id: "yes", label: "Yes — food will be provided" },
  { id: "planned", label: "Not yet, but it will be arranged" },
  { id: "unsure", label: "I'm not sure yet" },
];

const foodProviderOptions: { id: FoodProvider; label: string }[] = [
  { id: "caterer", label: "Caterer" },
  { id: "food_truck", label: "Food truck" },
  { id: "venue", label: "Venue-provided" },
  { id: "host", label: "Host-provided" },
  { id: "other", label: "Other / TBD" },
];

export function FoodServiceStep({ value, onChange }: FoodServiceStepProps) {
  const handleStatusChange = (status: FoodPlanStatus) => {
    if (status === "yes") {
      onChange({ status, provider: value?.provider });
    } else {
      onChange({ status });
    }
  };

  const handleProviderChange = (provider: FoodProvider) => {
    onChange({ status: "yes", provider });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Food Service at Your Event</h3>
        <p className="text-brand-ink/70 text-sm">
          Washington state regulations require food to be available when alcohol is served. This helps us ensure your event is compliant and smooth.
        </p>
      </div>

      <div>
        <div className="text-sm font-medium mb-3 text-brand-ink/80">
          Will food be available during your event?
        </div>
        <div className="grid gap-4">
          {foodStatusOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleStatusChange(option.id)}
              className={`text-left transition-all ${
                value?.status === option.id
                  ? "ring-4 ring-brand-sea ring-offset-2"
                  : "hover:ring-2 hover:ring-brand-chrome"
              }`}
            >
              <Card
                className={`rounded-2xl border-2 ${
                  value?.status === option.id
                    ? "border-brand-sea bg-brand-sea/5"
                    : "border-brand-chrome bg-white hover:border-brand-sea/50"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        value?.status === option.id
                          ? "border-brand-sea bg-brand-sea"
                          : "border-brand-chrome bg-white"
                      }`}
                    >
                      {value?.status === option.id && (
                        <div className="h-2.5 w-2.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="font-bold text-lg">{option.label}</div>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>

      {value?.status === "yes" && (
        <div className="pt-2">
          <div className="text-sm font-medium mb-3 text-brand-ink/80">
            How will food be provided? <span className="text-brand-ink/50 font-normal">(optional)</span>
          </div>
          <div className="grid gap-3">
            {foodProviderOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleProviderChange(option.id)}
                className={`text-left transition-all ${
                  value?.provider === option.id
                    ? "ring-2 ring-brand-sea ring-offset-1"
                    : "hover:ring-1 hover:ring-brand-chrome"
                }`}
              >
                <Card
                  className={`rounded-xl border ${
                    value?.provider === option.id
                      ? "border-brand-sea bg-brand-sea/5"
                      : "border-brand-chrome bg-white hover:border-brand-sea/30"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          value?.provider === option.id
                            ? "border-brand-sea bg-brand-sea"
                            : "border-brand-chrome bg-white"
                        }`}
                      >
                        {value?.provider === option.id && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="text-sm font-medium">{option.label}</div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}

      {(value?.status === "planned" || value?.status === "unsure") && (
        <div className="pt-2">
          <div className="text-sm text-brand-ink/60 bg-brand-chrome/30 rounded-xl p-4">
            That's okay — food just needs to be arranged before final booking. We'll confirm this with you after your estimate.
          </div>
        </div>
      )}
    </div>
  );
}
