import React from "react";
import { Card, CardContent } from "../../components/ui/card";

interface DurationStepProps {
  value: string | null;
  onChange: (value: string) => void;
}

const durationOptions = [
  { id: "2-3", label: "2–3 hours", description: "Best for streamlined service windows." },
  { id: "4-5", label: "4–5 hours", description: "Most events choose this range." },
  { id: "6+", label: "6+ hours", description: "Ideal for extended receptions." },
];

export function DurationStep({ value, onChange }: DurationStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Event duration</h3>
        <p className="text-brand-ink/70 text-sm">Select the service window you want covered.</p>
      </div>
      <div className="grid gap-4">
        {durationOptions.map((option) => (
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
