import React from "react";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent } from "../../components/ui/card";
import type { BookingSelection, ServiceType } from "../types";

interface DetailsStepProps {
  value: BookingSelection["details"];
  onChange: (value: BookingSelection["details"]) => void;
  serviceType: ServiceType | null;
}

export function DetailsStep({ value, onChange, serviceType }: DetailsStepProps) {
  const hasBar = serviceType === "bar" || serviceType === "both";
  const hasTech = serviceType === "tech" || serviceType === "both";

  const updateField = (field: keyof typeof value, newValue: string) => {
    onChange({ ...value, [field]: newValue });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Final details</h3>
        <p className="text-brand-ink/70 text-sm">Help us understand your specific needs and preferences.</p>
      </div>
      <div className="grid gap-6">
        {hasBar && (
          <div className="space-y-4">
            <div className="border-l-4 border-brand-sea pl-4">
              <h4 className="font-semibold text-lg mb-3">Bar Service Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Drink handling <span className="text-brand-rust">*</span>
                  </label>
                  <div className="grid gap-3 mb-2">
                    <button
                      type="button"
                      onClick={() => updateField("drinkHandling", "hosted")}
                      className={`text-left transition-all ${
                        value.drinkHandling === "hosted"
                          ? "ring-4 ring-brand-sea ring-offset-2"
                          : "hover:ring-2 hover:ring-brand-chrome"
                      }`}
                    >
                      <Card
                        className={`rounded-xl border-2 ${
                          value.drinkHandling === "hosted"
                            ? "border-brand-sea bg-brand-sea/5"
                            : "border-brand-chrome bg-white hover:border-brand-sea/50"
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-sm">Hosted Bar (recommended)</div>
                              <div className="text-xs text-brand-ink/70 mt-1">
                                All drinks included in event pricing
                              </div>
                            </div>
                            {value.drinkHandling === "hosted" && (
                              <div className="w-5 h-5 rounded-full border-2 border-brand-sea bg-brand-sea flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("drinkHandling", "ticketed")}
                      className={`text-left transition-all ${
                        value.drinkHandling === "ticketed"
                          ? "ring-4 ring-brand-sea ring-offset-2"
                          : "hover:ring-2 hover:ring-brand-chrome"
                      }`}
                    >
                      <Card
                        className={`rounded-xl border-2 ${
                          value.drinkHandling === "ticketed"
                            ? "border-brand-sea bg-brand-sea/5"
                            : "border-brand-chrome bg-white hover:border-brand-sea/50"
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-sm">Ticketed Bar</div>
                              <div className="text-xs text-brand-ink/70 mt-1">
                                Guests purchase drinks individually
                              </div>
                            </div>
                            {value.drinkHandling === "ticketed" && (
                              <div className="w-5 h-5 rounded-full border-2 border-brand-sea bg-brand-sea flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  </div>
                  <p className="text-xs text-brand-ink/60 mt-2">
                    Most private events choose a hosted bar for smoother service. Ticketed options are available if needed.
                  </p>
                </div>
                <div>
                  <label htmlFor="barPreferences" className="block text-sm font-medium mb-2">
                    Bar preferences & vibe
                  </label>
                  <Textarea
                    id="barPreferences"
                    placeholder="Tell us about your preferred drink style, any signature cocktails, or special requests..."
                    value={value.barPreferences || ""}
                    onChange={(e) => updateField("barPreferences", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <label htmlFor="beerWineVsCocktails" className="block text-sm font-medium mb-2">
                    Beer/wine vs cocktails focus
                  </label>
                  <Textarea
                    id="beerWineVsCocktails"
                    placeholder="What's the mix you're expecting? Mostly beer and wine? Heavy on cocktails? All of the above?"
                    value={value.beerWineVsCocktails || ""}
                    onChange={(e) => updateField("beerWineVsCocktails", e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <label htmlFor="barConstraints" className="block text-sm font-medium mb-2">
                    Any constraints or special considerations
                  </label>
                  <Textarea
                    id="barConstraints"
                    placeholder="Dietary restrictions, venue limitations, timing concerns, etc."
                    value={value.barConstraints || ""}
                    onChange={(e) => updateField("barConstraints", e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {hasTech && (
          <div className="space-y-4">
            <div className="border-l-4 border-brand-rust pl-4">
              <h4 className="font-semibold text-lg mb-3">Tech Service Details</h4>
              <div className="space-y-4">
                <div>
                  <label htmlFor="speechMicNeeds" className="block text-sm font-medium mb-2">
                    Speech & microphone needs
                  </label>
                  <Textarea
                    id="speechMicNeeds"
                    placeholder="Will there be speeches, announcements, or presentations? How many speakers?"
                    value={value.speechMicNeeds || ""}
                    onChange={(e) => updateField("speechMicNeeds", e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <label htmlFor="playlists" className="block text-sm font-medium mb-2">
                    Playlists & music preferences
                  </label>
                  <Textarea
                    id="playlists"
                    placeholder="Do you have playlists ready? Any specific music style or requests?"
                    value={value.playlists || ""}
                    onChange={(e) => updateField("playlists", e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <label htmlFor="inputSources" className="block text-sm font-medium mb-2">
                    Input sources (if any)
                  </label>
                  <Textarea
                    id="inputSources"
                    placeholder="Will you need to connect phones, laptops, or other devices?"
                    value={value.inputSources || ""}
                    onChange={(e) => updateField("inputSources", e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <label htmlFor="venuePowerNotes" className="block text-sm font-medium mb-2">
                    Venue power & setup notes
                  </label>
                  <Textarea
                    id="venuePowerNotes"
                    placeholder="Is power available? Any restrictions or special setup requirements?"
                    value={value.venuePowerNotes || ""}
                    onChange={(e) => updateField("venuePowerNotes", e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {!hasBar && !hasTech && (
          <div className="text-brand-ink/60 text-sm">
            Please select a service type to see relevant questions.
          </div>
        )}
      </div>
    </div>
  );
}
