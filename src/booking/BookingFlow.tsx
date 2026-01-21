import React, { useState, useMemo, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { pricingConfig } from "./pricingConfig";
import { calculateQuote } from "./calcQuote";
import type { BookingSelection, Quote, ServiceType } from "./types";
import { ServiceTypeStep } from "./steps/ServiceTypeStep";
import { BarPackageStep } from "./steps/BarPackageStep";
import { AddonsStep } from "./steps/AddonsStep";
import { ContactSubmitStep } from "./steps/ContactSubmitStep";
import { EventTypeStep } from "./steps/EventTypeStep";
import { GuestCountRangeStep } from "./steps/GuestCountRangeStep";
import { FoodServiceStep } from "./steps/FoodServiceStep";
import { DurationStep } from "./steps/DurationStep";
import { TravelStep } from "./steps/TravelStep";
import { TechModulesStep } from "./steps/TechModulesStep";
import { MocktailMenuStep } from "./steps/MocktailMenuStep";
import { QuoteSummary } from "./QuoteSummary";
import { MobileSummaryDrawer } from "./MobileSummaryDrawer";

interface BookingFlowProps {
  formspreeId: string;
}

type Step = "serviceType" | "eventType" | "guestCount" | "duration" | "foodService" | "barTier" | "mocktailMenu" | "techModules" | "travelType" | "addons" | "contact";

// Helper function to get initial selection state
const getInitialSelection = (): BookingSelection => ({
  serviceType: null,
  eventType: null,
  guestCount: null,
  duration: null,
  foodPlan: null,
  barTier: null,
  mocktailMenu: false,
  techModules: {
    starlinkWifi: false,
    tvDisplay: false,
    soundMic: false,
  },
    travelType: null,
    djService: false,
    customBranding: false,
    contact: {
      name: "",
      email: "",
      phone: "",
      eventDate: "",
      bestTimeToContact: "",
      notes: "",
    },
});

// Normalize selection based on serviceType - clears incompatible fields
const normalizeSelectionForServiceType = (
  nextServiceType: ServiceType | null,
  prevSelection: BookingSelection
): BookingSelection => {
  if (nextServiceType === "both") {
    // Both services selected - keep everything
    return prevSelection;
  }

  if (nextServiceType === "bar") {
    // Bar-only: clear tech-only fields
    return {
      ...prevSelection,
      techModules: {
        starlinkWifi: false,
        tvDisplay: false,
        soundMic: false,
      },
      djService: false, // Tech-only add-on
      // customBranding stays - it's available for all service types
    };
  }

  if (nextServiceType === "tech") {
    // Tech-only: clear bar-only fields
    return {
      ...prevSelection,
      barTier: null,
      mocktailMenu: false,
      foodPlan: null,
      // customBranding stays - it's available for all service types
    };
  }

  // serviceType is null - return as-is (initial state)
  return prevSelection;
};

export function BookingFlow({ formspreeId }: BookingFlowProps) {
  type SubmitError = { message?: string };
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<SubmitError[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>("serviceType");
  const [selection, setSelection] = useState<BookingSelection>(getInitialSelection());
  
  // Track previous serviceType to detect changes (safety net for programmatic changes)
  const prevServiceTypeRef = useRef<ServiceType | null>(selection.serviceType);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  // Normalize selection when serviceType changes (safety net)
  useEffect(() => {
    const prevServiceType = prevServiceTypeRef.current;
    const currentServiceType = selectionRef.current.serviceType;
    const currentSelection = selectionRef.current;

    // Only normalize if serviceType actually changed
    if (prevServiceType !== currentServiceType) {
      const normalized = normalizeSelectionForServiceType(currentServiceType, currentSelection);
      
      // Check if normalization actually changed any values
      const needsUpdate = 
        (currentServiceType === "bar" && (
          currentSelection.techModules.starlinkWifi ||
          currentSelection.techModules.tvDisplay ||
          currentSelection.techModules.soundMic ||
          currentSelection.djService
        )) ||
        (currentServiceType === "tech" && (
          currentSelection.barTier !== null ||
          currentSelection.mocktailMenu ||
          currentSelection.foodPlan !== null
        ));
      
      if (needsUpdate) {
        setSelection(normalized);
      }
      
      prevServiceTypeRef.current = currentServiceType;
    }
  }, [selection.serviceType]);

  // Reset function
  const handleReset = () => {
    if (window.confirm("Start over? This will clear all your selections.")) {
      setSelection(getInitialSelection());
      setCurrentStep("serviceType");
      setSubmitErrors([]);
      setSubmitted(false);
      prevServiceTypeRef.current = null;
    }
  };

  const hasBar = selection.serviceType === "bar" || selection.serviceType === "both";
  const hasTech = selection.serviceType === "tech" || selection.serviceType === "both";

  // Calculate quote whenever selection changes
  const quote: Quote = useMemo(() => {
    return calculateQuote(selection, pricingConfig);
  }, [selection]);

  // Conditional step order based on serviceType
  const activeSteps = useMemo<Step[]>(() => {
    const steps: Step[] = ["serviceType", "eventType", "guestCount", "duration"];
    
    if (hasBar) {
      steps.push("foodService", "barTier", "mocktailMenu");
    }
    
    if (hasTech) {
      steps.push("techModules");
    }
    
    steps.push("travelType", "addons", "contact");
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
      case "eventType":
        return selection.eventType !== null;
      case "guestCount":
        return selection.guestCount !== null;
      case "duration":
        return selection.duration !== null;
      case "foodService":
        return hasBar ? selection.foodPlan !== null : true;
      case "barTier":
        return hasBar ? selection.barTier !== null : true;
      case "mocktailMenu":
        return true; // optional
      case "techModules":
        return true; // optional, at least one module should be selected if tech is chosen
      case "travelType":
        return selection.travelType !== null;
      case "addons":
        return true;
      case "contact": {
        const { name, email, phone, eventDate } = selection.contact;
        // Validate date is on or after 2026-04-07
        const minDate = "2026-04-07";
        const hasValidDate = eventDate && eventDate >= minDate;
        return !!(name && email && phone && hasValidDate);
      }
      default:
        return false;
    }
  };

  const canAdvance = isStepValid(currentStep);

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
    if (selection.contact.eventDate) {
      formData.append("eventDate", selection.contact.eventDate);
    }
    if (selection.contact.bestTimeToContact) {
      formData.append("bestTimeToContact", selection.contact.bestTimeToContact);
    }
    if (selection.contact.notes) {
      formData.append("notes", selection.contact.notes);
    }

    // Service type
    if (selection.serviceType) {
      formData.append("serviceType", selection.serviceType);
    }

    // Event basics
    if (selection.eventType) {
      formData.append("eventType", selection.eventType);
    }
    if (selection.guestCount) {
      formData.append("guestCountEstimate", selection.guestCount.toString());
    }
    if (selection.duration) {
      formData.append("duration", selection.duration);
    }

    // Food service (bar only)
    if (hasBar && selection.foodPlan) {
      formData.append("foodPlanStatus", selection.foodPlan.status);
      if (selection.foodPlan.provider) {
        formData.append("foodPlanProvider", selection.foodPlan.provider);
      }
    }

    // Bar service
    if (hasBar && selection.barTier) {
      const barTier = pricingConfig.barTiers.find((tier) => tier.id === selection.barTier);
      if (barTier) {
        formData.append("barTier", barTier.name);
      }
    }
    if (hasBar) {
      formData.append("mocktailMenu", selection.mocktailMenu ? "true" : "false");
    }

    // Tech modules
    if (hasTech && selection.techModules) {
      if (selection.techModules.starlinkWifi) formData.append("techModuleStarlink", "true");
      if (selection.techModules.tvDisplay) formData.append("techModuleTvDisplay", "true");
      if (selection.techModules.soundMic) formData.append("techModuleSoundMic", "true");
    }

    // Travel
    if (selection.travelType) {
      formData.append("travelType", selection.travelType);
    }

    // Add-ons
    if (hasTech && selection.djService) {
      formData.append("addOnLiveDj", "true");
    }
    if (selection.customBranding) {
      formData.append("addOnEventBranding", "true");
    }

    // Pricing breakdown
    formData.append(
      "estimated_range",
      `$${quote.estimatedRange.min.toLocaleString()} – $${quote.estimatedRange.max.toLocaleString()}`
    );
    formData.append("addons_subtotal", `$${quote.addonsSubtotal.toLocaleString()}`);

    // Full quote JSON
    formData.append("quote_json", JSON.stringify({
      lineItems: quote.lineItems,
      addonsSubtotal: quote.addonsSubtotal,
      estimatedRange: quote.estimatedRange,
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
        const errors = Array.isArray(data?.errors) ? data.errors : [];
        setSubmitErrors(errors);
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
              onChange={(value) => {
                setSelection((prev) => {
                  const updated = { ...prev, serviceType: value };
                  // Normalize immediately when serviceType changes
                  return normalizeSelectionForServiceType(value, updated);
                });
              }}
              config={pricingConfig}
            />
          )}

          {currentStep === "eventType" && (
            <EventTypeStep
              value={selection.eventType || ""}
              onChange={(value) => setSelection((prev) => ({ ...prev, eventType: value as BookingSelection["eventType"] }))}
            />
          )}

          {currentStep === "guestCount" && (
            <GuestCountRangeStep
              value={
                selection.guestCount === 40
                  ? "lt-50"
                  : selection.guestCount === 75
                    ? "50-100"
                    : selection.guestCount === 125
                      ? "100-150"
                      : selection.guestCount === 170
                        ? "150-plus"
                        : null
              }
              onChange={(value) => {
                const mappedCount =
                  value === "lt-50" ? 40 :
                  value === "50-100" ? 75 :
                  value === "100-150" ? 125 : 170;
                setSelection((prev) => ({ ...prev, guestCount: mappedCount }));
              }}
            />
          )}

          {currentStep === "duration" && (
            <DurationStep
              value={selection.duration}
              onChange={(value) => setSelection((prev) => ({ ...prev, duration: value as BookingSelection["duration"] }))}
            />
          )}

          {currentStep === "foodService" && (
            <FoodServiceStep
              value={selection.foodPlan}
              onChange={(value) => setSelection((prev) => ({ ...prev, foodPlan: value }))}
            />
          )}

          {currentStep === "barTier" && (
            <BarPackageStep
              value={selection.barTier}
              onChange={(value) => setSelection((prev) => ({ ...prev, barTier: value as BookingSelection["barTier"] }))}
              config={pricingConfig}
            />
          )}

          {currentStep === "mocktailMenu" && (
            <MocktailMenuStep
              value={selection.mocktailMenu}
              onChange={(value) => setSelection((prev) => ({ ...prev, mocktailMenu: value }))}
            />
          )}

          {currentStep === "techModules" && (
            <TechModulesStep
              value={selection.techModules}
              onChange={(value) =>
                setSelection((prev) => ({
                  ...prev,
                  techModules: {
                    ...prev.techModules,
                    ...value,
                  },
                }))
              }
            />
          )}

          {currentStep === "travelType" && (
            <TravelStep
              value={selection.travelType}
              onChange={(value) => setSelection((prev) => ({ ...prev, travelType: value as BookingSelection["travelType"] }))}
            />
          )}

          {currentStep === "addons" && (
            <AddonsStep
              serviceType={selection.serviceType}
              djService={selection.djService}
              customBranding={selection.customBranding}
              onChange={(value) =>
                setSelection((prev) => ({
                  ...prev,
                  djService: value.djService ?? prev.djService,
                  customBranding: value.customBranding ?? prev.customBranding,
                }))
              }
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
                {submitting ? "Checking availability..." : "Check availability for your date"}
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
        <QuoteSummary quote={quote} selection={selection} onReset={handleReset} />
      </div>

      {/* Mobile: Sticky bottom bar with drawer */}
      <MobileSummaryDrawer quote={quote} selection={selection} onReset={handleReset} />
    </div>
  );
}
