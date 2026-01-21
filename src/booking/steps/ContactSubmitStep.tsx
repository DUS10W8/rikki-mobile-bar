import React, { useState } from "react";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import type { BookingSelection } from "../types";

interface ContactSubmitStepProps {
  value: BookingSelection["contact"];
  onChange: (value: BookingSelection["contact"]) => void;
  onSubmit: () => void;
}

const MIN_DATE = "2026-04-07";

export function ContactSubmitStep({ value, onChange, onSubmit }: ContactSubmitStepProps) {
  const [dateError, setDateError] = useState<string>("");

  const updateField = (field: keyof typeof value, newValue: string) => {
    if (field === "eventDate") {
      // Validate date is on or after 2026-04-07
      if (newValue && newValue < MIN_DATE) {
        setDateError("We're currently booking events starting April 7, 2026.");
      } else {
        setDateError("");
      }
    }
    onChange({ ...value, [field]: newValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Final validation before submit
    if (value.eventDate && value.eventDate < MIN_DATE) {
      setDateError("We're currently booking events starting April 7, 2026.");
      return;
    }
    if (dateError) {
      return;
    }
    onSubmit();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Check availability</h3>
        <p className="text-brand-ink/70 text-sm">We’ll use this to confirm your date and finalize the estimate.</p>
        <p className="text-xs text-brand-ink/60 mt-2">No payment required • Takes about 30 seconds</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Full name <span className="text-brand-rust">*</span>
          </label>
          <Input
            id="name"
            value={value.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email <span className="text-brand-rust">*</span>
          </label>
          <Input
            id="email"
            type="email"
            value={value.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-2">
            Phone <span className="text-brand-rust">*</span>
          </label>
          <Input
            id="phone"
            type="tel"
            value={value.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium mb-2">
            Event date <span className="text-brand-rust">*</span>
          </label>
          <Input
            id="eventDate"
            type="date"
            value={value.eventDate}
            onChange={(e) => updateField("eventDate", e.target.value)}
            min={MIN_DATE}
            required
            className={dateError ? "border-brand-rust" : ""}
          />
          {dateError && (
            <p className="text-sm text-brand-rust mt-1">{dateError}</p>
          )}
        </div>
        <div>
          <label htmlFor="bestTimeToContact" className="block text-sm font-medium mb-2">
            Best time to contact
          </label>
          <Input
            id="bestTimeToContact"
            placeholder="e.g., Weekday mornings, After 5pm, Anytime"
            value={value.bestTimeToContact}
            onChange={(e) => updateField("bestTimeToContact", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-2">
            Additional notes
          </label>
          <Textarea
            id="notes"
            placeholder="Anything else we should know?"
            value={value.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      </form>
    </div>
  );
}
