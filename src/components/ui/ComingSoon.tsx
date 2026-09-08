import * as React from "react";
import { QrCode, Wifi, Tv, Radio, Camera, UtensilsCrossed } from "lucide-react";

const upcoming = [
  { icon: <Wifi className="size-3.5" />, label: "Starlink WiFi" },
  { icon: <Tv className="size-3.5" />, label: "Onboard TV" },
  { icon: <Radio className="size-3.5" />, label: "Pro sound system" },
  { icon: <Camera className="size-3.5" />, label: "Live-stream setup" },
  { icon: <QrCode className="size-3.5" />, label: "Scan-to-order" },
  { icon: <UtensilsCrossed className="size-3.5" />, label: "Expanded catering" },
];

export default function ComingSoon() {
  return (
    <section id="coming-soon" className="border-t border-brand-chrome/60 bg-brand-primary/40 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-ink/60">
            Also in the works — ask us when you inquire
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
            {upcoming.map(({ icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-chrome/70 bg-white/70 px-3 py-1 text-xs font-medium text-brand-ink/75"
              >
                {icon}
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
