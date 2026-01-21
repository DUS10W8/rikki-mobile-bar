import React, { useState } from "react";
import { X } from "lucide-react";
import { QuoteSummary } from "./QuoteSummary";
import type { Quote } from "./types";

interface MobileSummaryDrawerProps {
  quote: Quote;
}

export function MobileSummaryDrawer({ quote }: MobileSummaryDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show if there's something to display
  if (quote.lineItems.length === 0 && quote.estimatedTotal === 0) {
    return null;
  }

  return (
    <>
      {/* Sticky bottom bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-[45] bg-white border-t-2 border-brand-chrome shadow-[0_-8px_28px_rgba(0,0,0,0.12)]">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs text-brand-ink/60 mb-1">Estimated Total</div>
            <div className="text-xl font-bold text-brand-sea">
              ${quote.estimatedTotal > 0 ? quote.estimatedTotal.toLocaleString() : "—"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="px-6 py-2.5 rounded-2xl bg-brand-sea text-white font-semibold text-sm shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
          >
            View Summary
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
              <h3 className="text-lg font-bold">Estimate Summary</h3>
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
                <QuoteSummary quote={quote} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
