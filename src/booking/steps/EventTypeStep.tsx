import React from "react";
import { Card, CardContent } from "../../components/ui/card";

interface EventTypeStepProps {
  value: string;
  onChange: (value: string) => void;
}

const eventTypes = [
  { id: "wedding", label: "Wedding" },
  { id: "private-party", label: "Private Party" },
  { id: "corporate-brand", label: "Corporate / Brand" },
  { id: "community-other", label: "Community / Other" },
];

export function EventTypeStep({ value, onChange }: EventTypeStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Event type</h3>
        <p className="text-brand-ink/70 text-sm">Tell us what kind of event you're planning.</p>
      </div>
      <div className="grid gap-4">
        {eventTypes.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={`text-left transition-all ${
              value === type.id
                ? "ring-4 ring-brand-sea ring-offset-2"
                : "hover:ring-2 hover:ring-brand-chrome"
            }`}
          >
            <Card
              className={`rounded-2xl border-2 ${
                value === type.id
                  ? "border-brand-sea bg-brand-sea/5"
                  : "border-brand-chrome bg-white hover:border-brand-sea/50"
              }`}
            >
              <CardContent className="p-6">
                <div className="font-bold text-lg">{type.label}</div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
