import React from "react";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import type { BookingSelection } from "../types";

interface ContactSubmitStepProps {
  value: BookingSelection["contact"];
  onChange: (value: BookingSelection["contact"]) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ContactSubmitStep({ value, onChange, onSubmit, isSubmitting }: ContactSubmitStepProps) {
  const updateField = (field: keyof typeof value, newValue: string) => {
    onChange({ ...value, [field]: newValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Contact information</h3>
        <p className="text-brand-ink/70 text-sm">We'll use this to confirm availability and finalize your quote.</p>
        <p className="text-xs text-brand-ink/60 mt-2">No payment required • Availability confirmed after submission</p>
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
