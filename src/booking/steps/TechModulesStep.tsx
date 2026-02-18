import React from "react";
import { Card, CardContent } from "../../components/ui/card";

interface TechModulesStepProps {
  value: {
    starlinkWifi: boolean;
    tvDisplay: boolean;
    soundMic: boolean;
  };
  onChange: (value: {
    starlinkWifi?: boolean;
    tvDisplay?: boolean;
    soundMic?: boolean;
  }) => void;
}

const techModules = [
  {
    id: "starlinkWifi" as const,
    label: "Starlink WiFi",
    description: "Managed connectivity for guests and vendors.",
    price: 100,
  },
  {
    id: "tvDisplay" as const,
    label: "TV / Display setup",
    description: "HDMI and casting support for slides, sports, and content.",
    price: 75,
  },
  {
    id: "soundMic" as const,
    label: "Bose PA + Wireless Mic",
    description: "PA speaker and wireless mic for speeches and toasts. Also doubles as a powerful music speaker.",
    price: 150,
  },
];

export function TechModulesStep({ value, onChange }: TechModulesStepProps) {
  const toggleModule = (id: keyof typeof value) => {
    onChange({ [id]: !value[id] });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Event Tech Modules</h3>
        <p className="text-brand-ink/70 text-sm">
          Select only what you need — we'll handle setup and a clean, reliable run.
        </p>
      </div>
      <div className="grid gap-4">
        {techModules.map((module) => {
          const isSelected = value[module.id];
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => toggleModule(module.id)}
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
                          isSelected ? "border-brand-sea bg-brand-sea" : "border-brand-chrome bg-white"
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
                        <div className="font-bold text-lg">{module.label}</div>
                        <div className="text-sm text-brand-ink/70 mt-1">{module.description}</div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-semibold text-brand-sea">+${module.price}</div>
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
