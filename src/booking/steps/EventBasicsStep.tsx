import React from "react";
import { Input } from "../../components/ui/input";
import type { BookingSelection } from "../types";

interface EventBasicsStepProps {
  value: BookingSelection["eventBasics"];
  onChange: (value: BookingSelection["eventBasics"]) => void;
}

export function EventBasicsStep({ value, onChange }: EventBasicsStepProps) {
  const updateField = (field: keyof typeof value, newValue: string | number | null) => {
    onChange({ ...value, [field]: newValue });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold mb-2">Date & location</h3>
        <p className="text-brand-ink/70 text-sm">When and where is your event?</p>
      </div>
      <div className="grid gap-4">
        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium mb-2">
            Event date <span className="text-brand-rust">*</span>
          </label>
          <Input
            id="eventDate"
            type="date"
            value={value.date}
            onChange={(e) => updateField("date", e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-2">
            Location / City / Venue <span className="text-brand-rust">*</span>
          </label>
          <Input
            id="location"
            placeholder="e.g., Richland, WA or The Venue Name"
            value={value.location}
            onChange={(e) => updateField("location", e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium mb-2">
              Start time (approx.)
            </label>
            <Input
              id="startTime"
              type="time"
              value={value.startTime}
              onChange={(e) => updateField("startTime", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium mb-2">
              End time (approx.)
            </label>
            <Input
              id="endTime"
              type="time"
              value={value.endTime}
              onChange={(e) => updateField("endTime", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
