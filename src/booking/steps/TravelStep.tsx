import React from "react";
import { Card, CardContent } from "../../components/ui/card";

interface TravelStepProps {
  value: string | null;
  onChange: (value: string) => void;
}

const travelOptions = [
  { id: "local", label: "Local (Tri-Cities)", description: "Standard travel range." },
  { id: "extended", label: "Extended Travel", description: "For events outside the local area." },
];

export function TravelStep({ value, onChange }: TravelStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Location / travel</h3>
        <p className="text-brand-ink/70 text-sm">Select the travel range so we can refine the estimate.</p>
      </div>
      <div className="grid gap-4">
        {travelOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`text-left transition-all ${
              value === option.id ? "ring-4 ring-brand-sea ring-offset-2" : "hover:ring-2 hover:ring-brand-chrome"
            }`}
          >
            <Card
              className={`rounded-2xl border-2 ${
                value === option.id
                  ? "border-brand-sea bg-brand-sea/5"
                  : "border-brand-chrome bg-white hover:border-brand-sea/50"
              }`}
            >
              <CardContent className="p-6">
                <div className="font-bold text-lg mb-1">{option.label}</div>
                <div className="text-sm text-brand-ink/70">{option.description}</div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
