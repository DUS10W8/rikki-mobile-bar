import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import type { BarPaymentModel, PricingConfig } from "../types";

interface BarPaymentModelStepProps {
  value: BarPaymentModel | null;
  ticketsPerGuest: number;
  onChange: (value: BarPaymentModel) => void;
  onTicketsPerGuestChange: (value: number) => void;
  config: PricingConfig;
}

export function BarPaymentModelStep({
  value,
  ticketsPerGuest,
  onChange,
  onTicketsPerGuestChange,
  config,
}: BarPaymentModelStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Bar payment model</h3>
        <p className="text-brand-ink/70 text-sm">
          Choose the starting investment style that best fits your event.
        </p>
      </div>

      <div className="grid gap-4">
        {config.barPaymentModels.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => onChange(model.id)}
            className={`text-left transition-all ${
              value === model.id
                ? "estimator-choice-selected ring-4 ring-brand-sea ring-offset-2"
                : "hover:ring-2 hover:ring-brand-chrome"
            }`}
          >
            <Card
              className={`rounded-2xl border-2 ${
                value === model.id
                  ? "border-brand-sea bg-brand-sea/5"
                  : "border-brand-chrome bg-white hover:border-brand-sea/50"
              }`}
            >
              <CardContent className="p-6">
                <div className="font-bold text-lg mb-2">{model.label}</div>
                <div className="text-sm text-brand-ink/70">{model.description}</div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {value === "ticketed" && (
        <div className="rounded-2xl border border-brand-sea/25 bg-brand-sea/10 p-4">
          <label htmlFor="drinkTicketsPerGuest" className="block text-sm font-semibold text-brand-ink mb-2">
            Drink tickets per guest
          </label>
          <div className="flex items-center gap-3">
            <input
              id="drinkTicketsPerGuest"
              type="number"
              min={1}
              max={6}
              step={1}
              value={ticketsPerGuest}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                onTicketsPerGuestChange(Number.isFinite(nextValue) ? Math.min(6, Math.max(1, nextValue)) : 1);
              }}
              className="w-24 rounded-xl border border-brand-chrome bg-white px-3 py-2 text-brand-ink"
            />
            <div className="text-sm text-brand-ink/70">
              Default is {config.defaultDrinkTicketsPerGuest} tickets per guest. This can be refined during confirmation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
