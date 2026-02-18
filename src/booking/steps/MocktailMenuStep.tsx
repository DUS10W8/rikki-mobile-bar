import React from "react";
import { Card, CardContent } from "../../components/ui/card";

interface MocktailMenuStepProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function MocktailMenuStep({ value, onChange }: MocktailMenuStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Zero-Proof / Mocktail Options</h3>
        <p className="text-brand-ink/70 text-sm">
          Would you like us to include a curated zero-proof mocktail menu?
        </p>
      </div>
      <div className="grid gap-4">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`text-left transition-all ${
            value === true ? "ring-4 ring-brand-sea ring-offset-2" : "hover:ring-2 hover:ring-brand-chrome"
          }`}
        >
          <Card
            className={`rounded-2xl border-2 ${
              value === true
                ? "border-brand-sea bg-brand-sea/5"
                : "border-brand-chrome bg-white hover:border-brand-sea/50"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    value === true ? "border-brand-sea bg-brand-sea" : "border-brand-chrome bg-white"
                  }`}
                >
                  {value === true && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                </div>
                <div className="font-bold text-lg">Yes — include a mocktail menu</div>
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => onChange(false)}
          className={`text-left transition-all ${
            value === false ? "ring-4 ring-brand-sea ring-offset-2" : "hover:ring-2 hover:ring-brand-chrome"
          }`}
        >
          <Card
            className={`rounded-2xl border-2 ${
              value === false
                ? "border-brand-sea bg-brand-sea/5"
                : "border-brand-chrome bg-white hover:border-brand-sea/50"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    value === false ? "border-brand-sea bg-brand-sea" : "border-brand-chrome bg-white"
                  }`}
                >
                  {value === false && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                </div>
                <div className="font-bold text-lg">No — standard menu only</div>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>
      <div className="text-xs text-brand-ink/60 bg-brand-chrome/30 rounded-xl p-4">
        Mocktails are thoughtfully crafted, non-alcoholic drinks designed to feel intentional — not an afterthought.
      </div>
    </div>
  );
}
