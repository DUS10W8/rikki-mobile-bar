import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { pricingConfig } from "./pricingConfig";
import { calculateQuote } from "./calcQuote";
import type { BookingSelection, ServiceType, Quote } from "./types";
import { ServiceTypeStep } from "./steps/ServiceTypeStep";
import { EventBasicsStep } from "./steps/EventBasicsStep";
import { BarPackageStep } from "./steps/BarPackageStep";
import { TechPackageStep } from "./steps/TechPackageStep";
import { AddonsStep } from "./steps/AddonsStep";
import { DetailsStep } from "./steps/DetailsStep";
import { ContactSubmitStep } from "./steps/ContactSubmitStep";
import { EventTypeStep } from "./steps/EventTypeStep";
import { GuestCountRangeStep } from "./steps/GuestCountRangeStep";
import { QuoteSummary } from "./QuoteSummary";
import { MobileSummaryDrawer } from "./MobileSummaryDrawer";

interface BookingFlowProps {
  formspreeId: string;
}

type Step = "serviceType" | "barPackage" | "techPackage" | "eventType" | "guestCountRange" | "eventBasics" | "addons" | "details" | "contact";

export function BookingFlow({ formspreeId }: BookingFlowProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>("serviceType");
  const [selection, setSelection] = useState<BookingSelection>({
    serviceType: null,
    eventBasics: {
      date: "",
      location: "",
      eventType: "",
      startTime: "",
      endTime: "",
      guestCountRange: null,
      guestCount: null,
    },
    barPackage: null,
    techPackage: null,
    addons: [],
    details: {},
    contact: {
      name: "",
      email: "",
      phone: "",
      bestTimeToContact: "",
      notes: "",
    },
  });

  // Calculate quote whenever selection changes
  const quote: Quote = useMemo(() => {
    return calculateQuote(selection, pricingConfig);
  }, [selection]);

  // Determine which steps are relevant
  const hasBar = selection.serviceType === "bar" || selection.serviceType === "both";
  const hasTech = selection.serviceType === "tech" || selection.serviceType === "both";

  // Get active steps based on service type - NEW ORDER: serviceType → bar/tech → eventType → guestCount → date/location → addons → details → contact
  const activeSteps = useMemo(() => {
    const steps: Step[] = ["serviceType"];
    if (hasBar) steps.push("barPackage");
    if (hasTech) steps.push("techPackage");
    steps.push("eventType", "guestCountRange", "eventBasics", "addons", "details", "contact");
    return steps;
  }, [hasBar, hasTech]);

  // Get current step index
  const currentStepIndex = activeSteps.indexOf(currentStep);
  const canGoBack = currentStepIndex > 0;
  const canGoNext = currentStepIndex < activeSteps.length - 1;

  // Validation per step
  const isStepValid = (step: Step): boolean => {
    switch (step) {
      case "serviceType":
        return selection.serviceType !== null;
      case "barPackage":
        return hasBar ? selection.barPackage !== null : true;
      case "techPackage":
        return hasTech ? selection.techPackage !== null : true;
      case "eventType":
        return !!selection.eventBasics.eventType;
      case "guestCountRange":
        return hasBar ? !!selection.eventBasics.guestCountRange : true;
      case "eventBasics":
        const { date, location } = selection.eventBasics;
        return !!(date && location);
      case "addons":
        return true; // optional
      case "details":
        // Require drink handling if bar service is selected
        if (hasBar && !selection.details.drinkHandling) return false;
        return true;
      case "contact":
        const { name, email, phone } = selection.contact;
        return !!(name && email && phone);
      default:
        return false;
    }
  };

  const canAdvance = isStepValid(currentStep);

  // Handle service type change - clear irrelevant selections
  const handleServiceTypeChange = (newType: ServiceType) => {
    setSelection((prev) => {
      const updated: BookingSelection = {
        ...prev,
        serviceType: newType,
      };
      // Clear bar package if tech only
      if (newType === "tech") {
        updated.barPackage = null;
      }
      // Clear tech package if bar only
      if (newType === "bar") {
        updated.techPackage = null;
      }
      // Clear addons that aren't available for new service type
      if (newType === "bar") {
        updated.addons = prev.addons.filter((id) => {
          const addon = pricingConfig.addons.find((a) => a.id === id);
          return addon?.availability === "bar" || addon?.availability === "both";
        });
      } else if (newType === "tech") {
        updated.addons = prev.addons.filter((id) => {
          const addon = pricingConfig.addons.find((a) => a.id === id);
          return addon?.availability === "tech" || addon?.availability === "both";
        });
      }
      return updated;
    });
  };

  // Navigation
  const goToNext = () => {
    if (!canAdvance) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < activeSteps.length) {
      setCurrentStep(activeSteps[nextIndex]);
    }
  };

  const goToPrevious = () => {
    if (!canGoBack) return;
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(activeSteps[prevIndex]);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStepValid("contact")) return;

    setSubmitting(true);
    setSubmitErrors([]);

    // Prepare FormData for Formspree
    const formData = new FormData();

    // Contact info
    formData.append("name", selection.contact.name);
    formData.append("email", selection.contact.email);
    formData.append("phone", selection.contact.phone);
    if (selection.contact.bestTimeToContact) {
      formData.append("bestTimeToContact", selection.contact.bestTimeToContact);
    }
    if (selection.contact.notes) {
      formData.append("notes", selection.contact.notes);
    }

    // Event basics
    formData.append("eventDate", selection.eventBasics.date);
    formData.append("location", selection.eventBasics.location);
    formData.append("eventType", selection.eventBasics.eventType);
    if (selection.eventBasics.startTime) {
      formData.append("startTime", selection.eventBasics.startTime);
    }
    if (selection.eventBasics.endTime) {
      formData.append("endTime", selection.eventBasics.endTime);
    }
    if (selection.eventBasics.guestCount) {
      formData.append("guestCount", selection.eventBasics.guestCount.toString());
    }

    // Service selection
    if (selection.serviceType) {
      formData.append("selected_service_type", selection.serviceType);
    }
    if (selection.barPackage) {
      const barPkg = pricingConfig.barPackages.find((p) => p.id === selection.barPackage);
      if (barPkg) {
        formData.append("bar_package", barPkg.name);
      }
    }
    if (selection.techPackage) {
      const techPkg = pricingConfig.techPackages.find((p) => p.id === selection.techPackage);
      if (techPkg) {
        formData.append("tech_package", techPkg.name);
      }
    }
    if (selection.addons.length > 0) {
      const addonNames = selection.addons
        .map((id) => pricingConfig.addons.find((a) => a.id === id)?.name)
        .filter(Boolean)
        .join(", ");
      formData.append("selected_addons", addonNames);
    }

    // Details
    if (selection.details.barPreferences) {
      formData.append("barPreferences", selection.details.barPreferences);
    }
    if (selection.details.beerWineVsCocktails) {
      formData.append("beerWineVsCocktails", selection.details.beerWineVsCocktails);
    }
    if (selection.details.barConstraints) {
      formData.append("barConstraints", selection.details.barConstraints);
    }
    if (selection.details.speechMicNeeds) {
      formData.append("speechMicNeeds", selection.details.speechMicNeeds);
    }
    if (selection.details.playlists) {
      formData.append("playlists", selection.details.playlists);
    }
    if (selection.details.inputSources) {
      formData.append("inputSources", selection.details.inputSources);
    }
    if (selection.details.venuePowerNotes) {
      formData.append("venuePowerNotes", selection.details.venuePowerNotes);
    }

    // Pricing breakdown
    formData.append("estimated_total", `$${quote.estimatedTotal.toLocaleString()}`);
    formData.append("bar_subtotal", `$${quote.barSubtotal.toLocaleString()}`);
    formData.append("tech_subtotal", `$${quote.techSubtotal.toLocaleString()}`);
    formData.append("addons_subtotal", `$${quote.addonsSubtotal.toLocaleString()}`);

    // Full quote JSON
    formData.append("quote_json", JSON.stringify({
      lineItems: quote.lineItems,
      barSubtotal: quote.barSubtotal,
      techSubtotal: quote.techSubtotal,
      addonsSubtotal: quote.addonsSubtotal,
      estimatedTotal: quote.estimatedTotal,
      minSpendApplied: quote.minSpendApplied,
    }));

    // Submit to Formspree
    try {
      const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setSubmitting(false);
      } else {
        setSubmitErrors(data.errors || []);
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitErrors([{ message: "An error occurred. Please try again." }]);
      setSubmitting(false);
    }
  };

  // Show confirmation after successful submission
  if (submitted) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div>
              <h3 className="text-3xl font-bold mb-2">Estimate request received! 🎉</h3>
              <p className="text-brand-ink/80">
                We've received your request and will confirm availability and finalize your quote soon. No payment required.
              </p>
            </div>

            <div className="mt-8">
              <QuoteSummary quote={quote} selection={selection} />
            </div>

            <div className="pt-6 border-t border-brand-chrome">
              <h4 className="font-semibold text-lg mb-3">What happens next?</h4>
              <div className="text-sm text-brand-ink/70 space-y-2 text-left max-w-md mx-auto">
                <p>
                  • We'll review your event details and check availability for your date.
                </p>
                <p>
                  • You'll receive a confirmation email with a finalized quote and next steps.
                </p>
                <p>
                  • We'll coordinate any final details to make sure everything is perfect for your event.
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                // Reset form by reloading or resetting state
                window.location.reload();
              }}
              variant="secondary"
              className="mt-6"
            >
              Start New Request
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      {/* Left: Steps Form */}
      <div className="space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm text-brand-ink/60">
          <span>Step {currentStepIndex + 1} of {activeSteps.length}</span>
        </div>

        {/* Current step content */}
        <div className="min-h-[400px]">
          {currentStep === "serviceType" && (
            <ServiceTypeStep
              value={selection.serviceType}
              onChange={handleServiceTypeChange}
              config={pricingConfig}
            />
          )}

          {currentStep === "barPackage" && hasBar && (
            <BarPackageStep
              value={selection.barPackage}
              onChange={(value) => setSelection((prev) => ({ ...prev, barPackage: value }))}
              config={pricingConfig}
              guestCountRange={selection.eventBasics.guestCountRange}
            />
          )}

          {currentStep === "eventType" && (
            <EventTypeStep
              value={selection.eventBasics.eventType}
              onChange={(value) => setSelection((prev) => ({ ...prev, eventBasics: { ...prev.eventBasics, eventType: value } }))}
            />
          )}

          {currentStep === "guestCountRange" && (
            <GuestCountRangeStep
              value={selection.eventBasics.guestCountRange}
              onChange={(value) => setSelection((prev) => ({ ...prev, eventBasics: { ...prev.eventBasics, guestCountRange: value } }))}
            />
          )}

          {currentStep === "eventBasics" && (
            <EventBasicsStep
              value={selection.eventBasics}
              onChange={(value) => setSelection((prev) => ({ ...prev, eventBasics: value }))}
            />
          )}

          {currentStep === "techPackage" && hasTech && (
            <TechPackageStep
              value={selection.techPackage}
              onChange={(value) => setSelection((prev) => ({ ...prev, techPackage: value }))}
              config={pricingConfig}
            />
          )}

          {currentStep === "addons" && (
            <AddonsStep
              value={selection.addons}
              onChange={(value) => setSelection((prev) => ({ ...prev, addons: value }))}
              config={pricingConfig}
              serviceType={selection.serviceType}
              guestCount={selection.eventBasics.guestCount || (selection.eventBasics.guestCountRange ? 
                (selection.eventBasics.guestCountRange === "under-40" ? 30 :
                 selection.eventBasics.guestCountRange === "40-75" ? 55 :
                 selection.eventBasics.guestCountRange === "75-125" ? 100 : 150) : null)}
            />
          )}

          {currentStep === "details" && (
            <DetailsStep
              value={selection.details}
              onChange={(value) => setSelection((prev) => ({ ...prev, details: value }))}
              serviceType={selection.serviceType}
            />
          )}

          {currentStep === "contact" && (
            <ContactSubmitStep
              value={selection.contact}
              onChange={(value) => setSelection((prev) => ({ ...prev, contact: value }))}
              onSubmit={() => {
                const syntheticEvent = {
                  preventDefault: () => {},
                } as React.FormEvent;
                handleFormSubmit(syntheticEvent);
              }}
              isSubmitting={submitting}
            />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-brand-chrome">
          <Button
            type="button"
            variant="ghost"
            onClick={goToPrevious}
            disabled={!canGoBack}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Back
          </Button>

          {canGoNext ? (
            <Button
              type="button"
              onClick={goToNext}
              disabled={!canAdvance}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-brand-ink/70 text-center px-4">
                You'll receive a clear estimate and next steps — no payment required to check availability.
              </div>
              <Button
                type="button"
                onClick={handleFormSubmit}
                disabled={!canAdvance || submitting}
                loading={submitting}
                className="w-full"
              >
                {submitting ? "Submitting..." : "Get your event estimate"}
              </Button>
            </div>
          )}
        </div>

        {submitErrors.length > 0 && (
          <div className="text-sm text-brand-rust space-y-1">
            {submitErrors.map((error, idx) => (
              <div key={idx}>{error.message || "An error occurred"}</div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Quote Summary (Desktop) */}
      <div className="hidden md:block sticky top-24">
        <QuoteSummary quote={quote} selection={selection} />
      </div>

      {/* Mobile: Sticky bottom bar with drawer */}
      <MobileSummaryDrawer quote={quote} />
    </div>
  );
}
