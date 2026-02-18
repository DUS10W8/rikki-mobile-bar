import React from "react";
import { Card, CardContent } from "../../components/ui/card";

interface GuestCountRangeStepProps {
  value: string | null;
  onChange: (value: string) => void;
}

const guestRanges = [
  { id: "lt-50", label: "<50", description: "Staffing and preparation scale with guest count to maintain service quality." },
  { id: "50-100", label: "50–100", description: "Staffing and preparation scale with guest count to maintain service quality." },
  { id: "100-150", label: "100–150", description: "Staffing and preparation scale with guest count to maintain service quality." },
  { id: "150-plus", label: "150+", description: "Staffing and preparation scale with guest count to maintain service quality." },
];

export function GuestCountRangeStep({ value, onChange }: GuestCountRangeStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Estimated guest count</h3>
        <p className="text-brand-ink/70 text-sm">
          Staffing and preparation scale with guest count to maintain service quality.
        </p>
      </div>
      <div className="grid gap-4">
        {guestRanges.map((range) => (
          <button
            key={range.id}
            type="button"
            onClick={() => onChange(range.id)}
            className={`text-left transition-all ${
              value === range.id
                ? "ring-4 ring-brand-sea ring-offset-2"
                : "hover:ring-2 hover:ring-brand-chrome"
            }`}
          >
            <Card
              className={`rounded-2xl border-2 ${
                value === range.id
                  ? "border-brand-sea bg-brand-sea/5"
                  : "border-brand-chrome bg-white hover:border-brand-sea/50"
              }`}
            >
              <CardContent className="p-6">
                <div className="font-bold text-lg mb-1">{range.label}</div>
                <div className="text-sm text-brand-ink/70">{range.description}</div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
