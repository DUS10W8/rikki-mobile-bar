import React, { useState, useMemo, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
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
import { BarPaymentModelStep } from "./steps/BarPaymentModelStep";
import { BarStyleStep } from "./steps/BarStyleStep";
import { QuoteSummary } from "./QuoteSummary";
import { MobileSummaryDrawer } from "./MobileSummaryDrawer";

interface BookingFlowProps {
  formspreeId: string;
}

type Step = "barStyle" | "serviceType" | "eventType" | "guestCount" | "duration" | "foodService" | "barPaymentModel" | "barTier" | "mocktailMenu" | "techModules" | "travelType" | "addons" | "contact";

// Maps a barStyle card ID to the barPaymentModel it pre-selects
const BAR_STYLE_PAYMENT_MODEL: Record<string, import("./types").BarPaymentModel> = {
  "cash-bar": "guest-purchase",
  "hosted-cash": "ticketed",
  "signature": "client-hosted",
  "premium": "client-hosted",
};

// Helper function to get initial selection state
const getInitialSelection = (): BookingSelection => ({
  barStyle: null,
  serviceType: null,
  eventType: null,
  guestCount: null,
  duration: null,
  foodPlan: null,
  barPaymentModel: null,
  drinkTicketsPerGuest: pricingConfig.defaultDrinkTicketsPerGuest,
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
  promoCode: null,
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
      barPaymentModel: null,
      drinkTicketsPerGuest: pricingConfig.defaultDrinkTicketsPerGuest,
      mocktailMenu: false,
      foodPlan: null,
      promoCode: null,
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
  const [promoInput, setPromoInput] = useState("");
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("barStyle");
  const [selection, setSelection] = useState<BookingSelection>(getInitialSelection());
  
  // Track previous serviceType to detect changes (safety net for programmatic changes)
  const prevServiceTypeRef = useRef<ServiceType | null>(selection.serviceType);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  // Ref for scrolling to top of step content when step changes
  const stepContentRef = useRef<HTMLDivElement>(null);

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
          currentSelection.barPaymentModel !== null ||
          currentSelection.drinkTicketsPerGuest !== pricingConfig.defaultDrinkTicketsPerGuest ||
          currentSelection.mocktailMenu ||
          currentSelection.foodPlan !== null
        ));
      
      if (needsUpdate) {
        setSelection(normalized);
      }
      
      prevServiceTypeRef.current = currentServiceType;
    }
  }, [selection.serviceType]);

  // Auto-scroll to top of step content when step changes (only if booking section is already in view)
  useEffect(() => {
    if (stepContentRef.current) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        const element = stepContentRef.current;
        const bookSection = document.getElementById("book");
        
        if (element && bookSection) {
          // Check if booking section is already in viewport
          const bookRect = bookSection.getBoundingClientRect();
          const isBookSectionVisible = bookRect.top < window.innerHeight && bookRect.bottom > 0;
          
          // Only scroll if booking section is already visible (user is already viewing it)
          // This prevents scrolling the whole page down to the booking section
          if (isBookSectionVisible) {
            const elementRect = element.getBoundingClientRect();
            // Only scroll if step content is below the top 30% of viewport
            if (elementRect.top > window.innerHeight * 0.3) {
              element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        }
      });
    }
  }, [currentStep]);

  // Reset function
  const handleReset = () => {
    setConfirmingReset(true);
  };

  const confirmReset = () => {
    setSelection(getInitialSelection());
    setCurrentStep("barStyle");
    setSubmitErrors([]);
    setSubmitted(false);
    setConfirmingReset(false);
    setPromoInput("");
    setPromoFeedback(null);
    prevServiceTypeRef.current = null;
  };

  const hasBar = selection.serviceType === "bar" || selection.serviceType === "both";
  const hasTech = selection.serviceType === "tech" || selection.serviceType === "both";

  // Calculate quote whenever selection changes
  const quote: Quote = useMemo(() => {
    return calculateQuote(selection, pricingConfig);
  }, [selection]);

  // Pure helper — computes step list from any selection snapshot.
  // Used both for the memoized activeSteps and inside auto-advance closures
  // where the React state hasn't flushed yet (stale closure problem).
  const computeActiveSteps = (sel: BookingSelection): Step[] => {
    const hBar = sel.serviceType === "bar" || sel.serviceType === "both";
    const hTech = sel.serviceType === "tech" || sel.serviceType === "both";
    // barStyle is always first — the 4 package type cards.
    const steps: Step[] = ["barStyle"];
    // Show serviceType step only for users on the tech/both path
    // (i.e., they clicked "event tech" instead of picking a bar style card).
    if (!sel.barStyle) {
      steps.push("serviceType");
    }
    if (hBar) steps.push("barTier"); // barPaymentModel is pre-set by barStyle selection
    steps.push("guestCount", "duration", "eventType");
    if (hBar) steps.push("foodService", "mocktailMenu");
    if (hTech) steps.push("techModules");
    steps.push("travelType", "addons", "contact");
    return steps;
  };

  // Conditional step order based on serviceType + barStyle.
  // Package (barTier) comes first to establish the price floor,
  // then payment model, then sizing questions (guests, duration, event type).
  const activeSteps = useMemo<Step[]>(() => {
    return computeActiveSteps(selection);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBar, hasTech, !!selection.barStyle]);

  // Get current step index
  const currentStepIndex = activeSteps.indexOf(currentStep);
  const canGoBack = currentStepIndex > 0;
  const canGoNext = currentStepIndex < activeSteps.length - 1;

  // Validation per step
  const isStepValid = (step: Step): boolean => {
    switch (step) {
      case "barStyle":
        return selection.barStyle !== null;
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
      case "barPaymentModel":
        return hasBar
          ? selection.barPaymentModel !== null &&
              (selection.barPaymentModel !== "ticketed" || selection.drinkTicketsPerGuest > 0)
          : true;
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
        // Validate date is today or later
        const minDate = new Date().toISOString().split("T")[0];
        const hasValidDate = eventDate && eventDate >= minDate;
        return !!(name && email && phone && hasValidDate);
      }
      default:
        return false;
    }
  };

  const canAdvance = isStepValid(currentStep);
  const isContactStep = currentStep === "contact";
  const isBuilderComplete = currentStep === "addons";
  const autoAdvanceSteps: Step[] = [
    "barStyle",
    "serviceType",
    "eventType",
    "guestCount",
    "duration",
    "foodService",
    "barTier",
    "mocktailMenu",
    "travelType",
  ];
  const isAutoAdvanceStep = autoAdvanceSteps.includes(currentStep);
  const builderSteps = activeSteps.filter((step): step is Exclude<Step, "contact"> => step !== "contact");
  const builderStepCount = builderSteps.length;
  const builderStepIndex = builderSteps.indexOf(currentStep as Exclude<Step, "contact">);

  // Navigation
  const goToNext = () => {
    if (!canAdvance) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < activeSteps.length) {
      setCurrentStep(activeSteps[nextIndex]);
    }
  };

  // Helper to auto-advance on single-select steps
  const handleSingleSelectChange = (
    updateFn: (prev: BookingSelection) => BookingSelection,
    step: Step
  ) => {
    const tempSelection = updateFn(selection);
    
    // Check if step will be valid with the new selection
    let isValid = false;
    switch (step) {
      case "barStyle":
        isValid = tempSelection.barStyle !== null;
        break;
      case "serviceType":
        isValid = tempSelection.serviceType !== null;
        break;
      case "eventType":
        isValid = tempSelection.eventType !== null;
        break;
      case "guestCount":
        isValid = tempSelection.guestCount !== null;
        break;
      case "duration":
        isValid = tempSelection.duration !== null;
        break;
      case "foodService":
        isValid = hasBar ? tempSelection.foodPlan !== null : true;
        break;
      case "barPaymentModel":
        isValid = hasBar
          ? tempSelection.barPaymentModel !== null &&
              (tempSelection.barPaymentModel !== "ticketed" || tempSelection.drinkTicketsPerGuest > 0)
          : true;
        break;
      case "barTier":
        isValid = hasBar ? tempSelection.barTier !== null : true;
        break;
      case "mocktailMenu":
        isValid = true;
        break;
      case "travelType":
        isValid = tempSelection.travelType !== null;
        break;
      default:
        isValid = false;
    }
    
    setSelection(updateFn);

    // Choice-based steps advance as soon as the selection is saved.
    if (isValid && currentStep === step) {
      // Use tempSelection (not the stale closed-over activeSteps) to compute
      // the correct next step — avoids the stale-closure bug where serviceType
      // changing to "bar" wouldn't include barTier/barPaymentModel yet.
      const nextSteps = computeActiveSteps(tempSelection);
      const stepIndex = nextSteps.indexOf(step);
      const nextIndex = stepIndex + 1;
      if (nextIndex < nextSteps.length) {
        // Leave the selected card visible long enough for the confirmation
        // animation to register before the next question appears.
        setTimeout(() => {
          setCurrentStep(nextSteps[nextIndex]);
        }, 280);
      }
    }
  };

  const goToPrevious = () => {
    if (!canGoBack) return;
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(activeSteps[prevIndex]);
    }
  };

  const openContactStep = () => {
    setCurrentStep("contact");
  };

  const goToBuilderStart = () => {
    setCurrentStep("barStyle");
  };

  const applyPromoCode = async () => {
    const normalizedCode = promoInput.trim().toUpperCase();

    if (!normalizedCode) {
      setPromoFeedback("Enter a promo code to apply it.");
      return;
    }

    setPromoFeedback("Checking code…");

    try {
      const response = await fetch(`/api/promo-code?code=${encodeURIComponent(normalizedCode)}`);
      const data = await response.json();

      if (!data.valid) {
        setSelection((prev) => ({ ...prev, promoCode: null }));
        setPromoFeedback("That promo code is not active.");
        return;
      }

      setSelection((prev) => ({
        ...prev,
        promoCode: {
          code: data.code,
          label: data.label,
          description: data.description,
          discountAmount: data.discountAmount,
          status: "applied",
          message: `${data.label} applied pending first-${data.maxRedemptions} redemption confirmation.`,
        },
      }));
      setPromoInput(data.code);
      setPromoFeedback(`${data.label} applied: $${data.discountAmount.toLocaleString()} off pending confirmation.`);
    } catch {
      setPromoFeedback("Couldn't verify the code right now. Try again.");
    }
  };

  const removePromoCode = () => {
    setSelection((prev) => ({ ...prev, promoCode: null }));
    setPromoInput("");
    setPromoFeedback(null);
  };

  const reservePromoCode = async (currentSelection: BookingSelection) => {
    if (!currentSelection.promoCode) return null;

    const response = await fetch("/api/promo-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: currentSelection.promoCode.code,
        name: currentSelection.contact.name,
        email: currentSelection.contact.email,
        phone: currentSelection.contact.phone,
        eventDate: currentSelection.contact.eventDate,
      }),
    });

    return response.json() as Promise<{ status: "reserved" | "pending" | "applied"; message: string }>;
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
    if (hasBar && selection.barPaymentModel) {
      const paymentModel = pricingConfig.barPaymentModels.find((model) => model.id === selection.barPaymentModel);
      if (paymentModel) {
        formData.append("barPaymentModel", paymentModel.summaryLabel);
      }
      if (selection.barPaymentModel === "ticketed") {
        formData.append("drinkTicketsPerGuest", selection.drinkTicketsPerGuest.toString());
      }
    }
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

    let nextSelection = selection;
    if (selection.promoCode) {
      const reservation = await reservePromoCode(selection).catch(() => null);
      const reservedPromo = reservation
        ? {
            ...selection.promoCode,
            status: reservation.status,
            message: reservation.message,
          }
        : {
            ...selection.promoCode,
            status: "pending" as const,
            message: "Promo noted for manual first-3 redemption confirmation.",
          };

      nextSelection = { ...selection, promoCode: reservedPromo };
      setSelection(nextSelection);
      formData.append("promoCode", reservedPromo.code);
      formData.append("promoLabel", reservedPromo.label);
      formData.append("promoDiscount", reservedPromo.discountAmount.toString());
      formData.append("promoStatus", reservedPromo.status);
      formData.append("promoMessage", reservedPromo.message);
    }

    // Pricing breakdown
    formData.append(
      "estimated_range",
      `$${quote.estimatedRange.min.toLocaleString()} - $${quote.estimatedRange.max.toLocaleString()}`
    );
    formData.append("addons_subtotal", `$${quote.addonsSubtotal.toLocaleString()}`);

    // Full quote JSON
    formData.append("quote_json", JSON.stringify({
      lineItems: quote.lineItems,
      breakdownItems: quote.breakdownItems,
      addonsSubtotal: quote.addonsSubtotal,
      estimatedRange: quote.estimatedRange,
      serviceNotes: quote.serviceNotes,
      disclaimers: quote.disclaimers,
      barPaymentModel: nextSelection.barPaymentModel,
      drinkTicketsPerGuest: nextSelection.drinkTicketsPerGuest,
      promoCode: nextSelection.promoCode,
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
              <h3 className="text-3xl font-bold mb-2">Estimate request received!</h3>
              <p className="text-brand-ink/80">
                We've received your starting estimate request and will confirm availability, service details, and your final quote soon. No payment required.
              </p>
            </div>

            <div className="mt-8">
              <QuoteSummary quote={quote} selection={selection} />
            </div>

            <div className="pt-6 border-t border-brand-chrome">
              <h4 className="font-semibold text-lg mb-3">What happens next?</h4>
              <div className="text-sm text-brand-ink/70 space-y-2 text-left max-w-md mx-auto">
                <p>
                  - We'll review your event details and check availability for your date.
                </p>
                <p>
                  - You'll receive a confirmation email with your starting range, final quote path, and next steps.
                </p>
                <p>
                  - We'll coordinate any final details to make sure everything is perfect for your event.
                </p>
              </div>
            </div>

            <Button
              onClick={confirmReset}
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

  // In-UI reset confirmation overlay
  if (confirmingReset) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="p-8 text-center space-y-4">
          <h3 className="text-xl font-bold">Start over?</h3>
          <p className="text-brand-ink/70 text-sm">This will clear all your selections.</p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => setConfirmingReset(false)}>
              Keep editing
            </Button>
            <Button onClick={confirmReset} className="bg-brand-rust border-brand-rust text-white hover:bg-brand-rust/90">
              Yes, start over
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
        <div className="space-y-1">
          <h3 className="text-2xl font-bold">Build Your Event</h3>
          <div className="flex items-center gap-2 text-sm text-brand-ink/60">
            <span>{isContactStep ? "Availability details" : `Builder step ${builderStepIndex + 1} of ${builderStepCount}`}</span>
          </div>
          <p className="text-sm text-brand-ink/70">
            Adjust options to fit your event and watch the estimated starting range update live.
          </p>
        </div>

        {/* Current step content */}
        <div ref={stepContentRef} className="pb-4 md:min-h-[400px] md:pb-8">
          {currentStep === "barStyle" && (
            <BarStyleStep
              value={selection.barStyle}
              onChange={(styleId) => {
                handleSingleSelectChange(
                  (prev) => ({
                    ...prev,
                    barStyle: styleId,
                    serviceType: "bar",
                    barPaymentModel: BAR_STYLE_PAYMENT_MODEL[styleId] ?? null,
                  }),
                  "barStyle"
                );
              }}
              onTechPath={() => {
                // Clear bar style and let user pick service type (tech/both) explicitly
                setSelection((prev) => ({
                  ...prev,
                  barStyle: null,
                  serviceType: null,
                  barPaymentModel: null,
                  barTier: null,
                }));
                setCurrentStep("serviceType");
              }}
            />
          )}

          {currentStep === "serviceType" && (
            <ServiceTypeStep
              value={selection.serviceType}
              onChange={(value) => {
                handleSingleSelectChange(
                  (prev) => {
                    const updated = {
                      ...prev,
                      serviceType: value,
                      barPaymentModel:
                        value === "bar" || value === "both"
                          ? prev.serviceType === "bar" || prev.serviceType === "both"
                            ? prev.barPaymentModel
                            : null
                          : null,
                      drinkTicketsPerGuest:
                        value === "bar" || value === "both"
                          ? prev.drinkTicketsPerGuest
                          : pricingConfig.defaultDrinkTicketsPerGuest,
                    };
                    // Normalize immediately when serviceType changes
                    return normalizeSelectionForServiceType(value, updated);
                  },
                  "serviceType"
                );
              }}
              config={pricingConfig}
            />
          )}

          {currentStep === "eventType" && (
            <EventTypeStep
              value={selection.eventType || ""}
              onChange={(value) => handleSingleSelectChange(
                (prev) => ({ ...prev, eventType: value as BookingSelection["eventType"] }),
                "eventType"
              )}
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
                      : selection.guestCount === 175
                        ? "150-200"
                        : selection.guestCount === 250
                          ? "200-plus"
                          : null
              }
              onChange={(value) => {
                const mappedCount =
                  value === "lt-50"    ? 40  :
                  value === "50-100"   ? 75  :
                  value === "100-150"  ? 125 :
                  value === "150-200"  ? 175 : 250;
                handleSingleSelectChange(
                  (prev) => ({ ...prev, guestCount: mappedCount }),
                  "guestCount"
                );
              }}
            />
          )}

          {currentStep === "duration" && (
            <DurationStep
              value={selection.duration}
              onChange={(value) => handleSingleSelectChange(
                (prev) => ({ ...prev, duration: value as BookingSelection["duration"] }),
                "duration"
              )}
            />
          )}

          {currentStep === "foodService" && (
            <FoodServiceStep
              value={selection.foodPlan}
              onChange={(value) => handleSingleSelectChange(
                (prev) => ({ ...prev, foodPlan: value }),
                "foodService"
              )}
            />
          )}

          {currentStep === "barTier" && (
            <BarPackageStep
              value={selection.barTier}
              onChange={(value) => handleSingleSelectChange(
                (prev) => ({ ...prev, barTier: value as BookingSelection["barTier"] }),
                "barTier"
              )}
              config={pricingConfig}
              paymentModel={selection.barPaymentModel}
            />
          )}

          {currentStep === "barPaymentModel" && (
            <BarPaymentModelStep
              value={selection.barPaymentModel}
              ticketsPerGuest={selection.drinkTicketsPerGuest}
              onChange={(value) => handleSingleSelectChange(
                (prev) => ({ ...prev, barPaymentModel: value }),
                "barPaymentModel"
              )}
              onTicketsPerGuestChange={(value) =>
                setSelection((prev) => ({ ...prev, drinkTicketsPerGuest: value }))
              }
              config={pricingConfig}
            />
          )}

          {currentStep === "mocktailMenu" && (
            <MocktailMenuStep
              value={selection.mocktailMenu}
              onChange={(value) => handleSingleSelectChange(
                (prev) => ({ ...prev, mocktailMenu: value }),
                "mocktailMenu"
              )}
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
              onChange={(value) => handleSingleSelectChange(
                (prev) => ({ ...prev, travelType: value as BookingSelection["travelType"] }),
                "travelType"
              )}
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

        {isContactStep && (
          <div className="rounded-2xl border border-brand-chrome bg-white/82 p-4 shadow-sm">
            <div className="mb-3">
              <div className="text-sm font-bold text-brand-ink">Promo code</div>
              <div className="text-xs text-brand-ink/65">
                Optional, if you have one.
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={promoInput}
                onChange={(event) => {
                  setPromoInput(event.target.value.toUpperCase());
                  if (promoFeedback) setPromoFeedback(null);
                }}
                placeholder="Enter promo code"
                className="uppercase"
                disabled={Boolean(selection.promoCode)}
              />
              {selection.promoCode ? (
                <Button type="button" variant="outline" onClick={removePromoCode} className="shrink-0">
                  Remove
                </Button>
              ) : (
                <Button type="button" onClick={applyPromoCode} className="shrink-0">
                  Apply
                </Button>
              )}
            </div>
            {(promoFeedback || selection.promoCode) && (
              <div className="mt-2 text-xs text-brand-ink/70">
                {promoFeedback || selection.promoCode?.message}
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons - Sticky to bottom */}
        <div className="sticky bottom-[74px] md:bottom-0 bg-brand-primary/95 backdrop-blur border-t border-brand-chrome shadow-[0_-6px_20px_rgba(0,0,0,0.08)] p-4 rounded-b-3xl">
          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={goToPrevious}
              disabled={!canGoBack}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Back
            </Button>

            {isBuilderComplete ? (
              <div className="space-y-3 flex-1">
                <div className="text-xs text-brand-ink/70 text-center px-4">
                  Your estimate stays editable. Check availability when you're ready.
                </div>
                <Button
                  type="button"
                  onClick={openContactStep}
                  disabled={quote.estimatedRange.max === 0}
                  className="w-full"
                >
                  Check Availability
                </Button>
              </div>
            ) : canGoNext && !isAutoAdvanceStep ? (
              <Button
                type="button"
                onClick={goToNext}
                disabled={!canAdvance}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            ) : isAutoAdvanceStep ? (
              <div className="flex-1 text-right text-xs text-brand-ink/60">
                Select an option to continue.
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                <div className="text-xs text-brand-ink/70 text-center px-4">
                  Send your event details once. No payment required.
                </div>
                <Button
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={!canAdvance || submitting}
                  loading={submitting}
                  className="w-full"
                >
                  {submitting ? "Sending estimate..." : "Send My Estimate"}
                </Button>
              </div>
            )}
          </div>
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
        <QuoteSummary quote={quote} selection={selection} onReset={handleReset} onEdit={goToBuilderStart} />
      </div>

            {/* Mobile: Sticky bottom summary bar & drawer */}
      <MobileSummaryDrawer
        quote={quote}
        selection={selection}
        onReset={handleReset}
        onEdit={goToBuilderStart}
      />
    </div>
  );
}
