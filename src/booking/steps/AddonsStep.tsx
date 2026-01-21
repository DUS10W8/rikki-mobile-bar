import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import type { ServiceType } from "../types";

interface AddonsStepProps {
  serviceType: ServiceType | null;
  djService: boolean;
  customBranding: boolean;
  onChange: (next: { djService?: boolean; customBranding?: boolean }) => void;
}

export function AddonsStep({ serviceType, djService, customBranding, onChange }: AddonsStepProps) {
  const hasTech = serviceType === "tech" || serviceType === "both";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Tech & experience add-ons</h3>
        <p className="text-brand-ink/70 text-sm">Optional enhancements that pair well with your event.</p>
      </div>
      <div className="grid gap-4">
        {hasTech && (
          <button
            type="button"
            onClick={() => onChange({ djService: !djService })}
            className={`text-left transition-all ${
              djService ? "ring-4 ring-brand-sea ring-offset-2" : "hover:ring-2 hover:ring-brand-chrome"
            }`}
          >
            <Card
              className={`rounded-2xl border-2 ${
                djService
                  ? "border-brand-sea bg-brand-sea/5"
                  : "border-brand-chrome bg-white hover:border-brand-sea/50"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`mt-1 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        djService ? "border-brand-sea bg-brand-sea" : "border-brand-chrome bg-white"
                      }`}
                    >
                      {djService && (
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
                      <div className="font-bold text-lg">Live DJ</div>
                      <div className="text-sm text-brand-ink/70 mt-1">
                        Professional event DJ coordinated with bar flow and timeline.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        )}

        <button
          type="button"
          onClick={() => onChange({ customBranding: !customBranding })}
          className={`text-left transition-all ${
            customBranding ? "ring-4 ring-brand-sea ring-offset-2" : "hover:ring-2 hover:ring-brand-chrome"
          }`}
        >
          <Card
            className={`rounded-2xl border-2 ${
              customBranding
                ? "border-brand-sea bg-brand-sea/5"
                : "border-brand-chrome bg-white hover:border-brand-sea/50"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg">Event Branding & Custom Drinkware</div>
                        <div className="text-sm text-brand-ink/70 mt-1">
                          Personalized cups, napkins, and straws with a cohesive bar presentation.
                          Final design approved by you before production.
                        </div>
                      </div>
                      <div
                        className={`ml-4 w-12 h-7 rounded-full border-2 flex items-center transition-colors ${
                          customBranding ? "border-brand-sea bg-brand-sea/90" : "border-brand-chrome bg-white"
                        }`}
                      >
                        <div
                          className={`h-5 w-5 bg-white rounded-full shadow transition-transform ${
                            customBranding ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>
    </div>
  );
}
