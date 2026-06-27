import React from "react";
import { Card, CardContent } from "../../components/ui/card";

interface BarStyleOption {
  id: string;
  name: string;
  tagline: string;
  startingAt: string;
  description: string;
  inclusions: string[];
  badge?: string;
}

const barStyleOptions: BarStyleOption[] = [
  {
    id: "cash-bar",
    name: "Cash Bar Service",
    tagline: "Guests purchase drinks individually.",
    startingAt: "$600",
    description:
      "You cover the mobile bar experience and professional service. Guests buy their own drinks at the event — great for keeping host costs low.",
    inclusions: [
      "Custom bar menu",
      "Professional bartending",
      "Mobile bar & vintage van setup and teardown",
      "Garnishes, fresh juices, and cocktail supplies",
      "QR / mobile ordering system",
      "Beer, wine, and cocktail service",
      "Licensed and insured bar service",
    ],
  },
  {
    id: "hosted-cash",
    name: "Hosted Bar + Cash Bar",
    tagline: "Give guests a ticket allotment — cash bar after.",
    startingAt: "$800",
    description:
      "You cover a set number of drink tickets per guest. Guests can keep ordering on their own tab after tickets are used.",
    inclusions: [
      "Custom host ticketed system",
      "Beer, wine, and cocktails",
      "Garnishes, fresh juices, and supplies",
      "Mobile ordering system",
      "Custom bar menu",
      "Cash bar continues after tickets",
      "Professional bartending team",
      "Mobile bar & vintage van setup and teardown",
    ],
  },
  {
    id: "signature",
    name: "Fully Hosted Bar",
    tagline: "You cover the full drink program for your guests.",
    startingAt: "$1,800",
    badge: "Most popular",
    description:
      "Wholesale alcohol purchasing handled for you. Choose your package level in the next step — from curated signature cocktails to a premium elevated program.",
    inclusions: [
      "Wholesale alcohol purchasing & coordination",
      "Beer, wine, and signature cocktails",
      "Garnishes, fresh juices, ice, and bar supplies",
      "Custom beverage menu",
      "Mobile ordering system",
      "Professional bartending team",
      "Personalized cocktail consultation",
      "Mobile bar & vintage van setup and teardown",
    ],
  },
];

interface BarStyleStepProps {
  value: string | null;
  onChange: (id: string) => void;
  onTechPath: () => void;
}

export function BarStyleStep({ value, onChange, onTechPath }: BarStyleStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">What kind of bar service are you looking for?</h3>
        <p className="text-brand-ink/70 text-sm">
          Pick the option that best fits your event. You'll fine-tune the details in the next steps.
        </p>
      </div>

      <div className="grid gap-4">
        {barStyleOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`text-left transition-all ${
              value === opt.id
                ? "estimator-choice-selected ring-4 ring-brand-sea ring-offset-2"
                : "hover:ring-2 hover:ring-brand-chrome"
            }`}
          >
            <Card
              className={`rounded-2xl border-2 relative ${
                value === opt.id
                  ? "border-brand-sea bg-brand-sea/5"
                  : "border-brand-chrome bg-white hover:border-brand-sea/50"
              }`}
            >
              {opt.badge && (
                <div className="absolute -top-3 right-4 bg-brand-sea text-white text-xs font-bold px-3 py-1 rounded-full">
                  {opt.badge}
                </div>
              )}
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="font-bold text-lg leading-tight">{opt.name}</div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-brand-ink/50">starting at</div>
                    <div className="font-bold text-brand-sea text-sm">{opt.startingAt}</div>
                  </div>
                </div>
                <div className="text-xs text-brand-ink/60 mb-2">{opt.tagline}</div>
                <div className="text-sm text-brand-ink/70 mb-3">{opt.description}</div>
                <div className="pt-3 border-t border-brand-chrome/50 text-xs text-brand-ink/60 space-y-1">
                  <div className="font-semibold text-brand-ink/80">What's included:</div>
                  {opt.inclusions.map((item) => (
                    <div key={item} className="flex items-center gap-1.5">
                      <span className="text-brand-sea">✓</span> {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onTechPath}
          className="text-sm text-brand-ink/50 underline underline-offset-2 hover:text-brand-ink/70 transition-colors"
        >
          Looking for event tech instead?
        </button>
      </div>
    </div>
  );
}
