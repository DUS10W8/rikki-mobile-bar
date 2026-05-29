import React, { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { Button } from "../components/ui/button";
import { QuoteSummary } from "./QuoteSummary";
import { pricingConfig } from "./pricingConfig";
import type { Quote, BookingSelection } from "./types";

interface MobileSummaryDrawerProps {
  quote: Quote;
  selection?: BookingSelection;
  onReset?: () => void;
  onEdit?: () => void;
}

export function MobileSummaryDrawer({ quote, selection, onReset, onEdit }: MobileSummaryDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasEstimate = quote.estimatedRange.max > 0;
  const serviceLabel = selection?.serviceType
    ? selection.serviceType === "bar"
      ? "Bar service"
      : selection.serviceType === "tech"
        ? "Event tech"
        : "Bar + tech"
    : null;
  const paymentLabel = selection?.barPaymentModel
    ? pricingConfig.barPaymentModels.find((model) => model.id === selection.barPaymentModel)?.summaryLabel
    : null;
  const estimateLabel = quote.estimatedRange.min === quote.estimatedRange.max
    ? `$${quote.estimatedRange.min.toLocaleString()}`
    : `$${quote.estimatedRange.min.toLocaleString()} - $${quote.estimatedRange.max.toLocaleString()}`;

  return (
    <>
      {/* Sticky bottom bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-[45] bg-white border-t-2 border-brand-chrome shadow-[0_-8px_28px_rgba(0,0,0,0.12)]">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs text-brand-ink/60 mb-1">{pricingConfig.estimateLanguage.rangeLabel}</div>
            <div className="text-xl font-bold text-brand-sea transition-all duration-200">
              {hasEstimate
                ? estimateLabel
                : "Build your event"}
            </div>
            {(serviceLabel || paymentLabel) && (
              <div className="text-xs text-brand-ink/60 mt-1">
                {[serviceLabel, paymentLabel].filter(Boolean).join(" / ")}
              </div>
            )}
            {selection?.promoCode && (
              <div className="text-xs font-semibold text-brand-sea mt-1">
                {selection.promoCode.code}: -${selection.promoCode.discountAmount.toLocaleString()}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="px-6 py-2.5 rounded-2xl bg-brand-sea text-white font-semibold text-sm shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
          >
            View details
          </button>
        </div>
      </div>

      {/* Drawer overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60] md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`fixed bottom-0 left-0 right-0 z-[70] md:hidden bg-white rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.2)] transition-transform ${
              isOpen ? "translate-y-0" : "translate-y-full"
            }`}
            style={{ maxHeight: "85vh" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-brand-chrome">
              <h3 className="text-lg font-bold">Your Event Estimate</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-brand-chrome/30 transition-colors"
                aria-label="Close summary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 73px)" }}>
              <div className="p-4">
                <QuoteSummary quote={quote} selection={selection} onReset={onReset} onEdit={onEdit} />
              </div>
            </div>
            {onReset && selection && (
              selection.serviceType !== null ||
              selection.eventType !== null ||
              selection.guestCount !== null ||
              selection.duration !== null ||
              selection.barPaymentModel !== null ||
              selection.barTier !== null ||
              selection.travelType !== null ||
              selection.djService ||
              selection.customBranding ||
              selection.promoCode !== null ||
              (selection.techModules.starlinkWifi || selection.techModules.tvDisplay || selection.techModules.soundMic)
            ) && (
              <div className="p-4 border-t border-brand-chrome">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="w-full text-sm text-brand-ink/60 hover:text-brand-ink"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset estimate
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
