import * as React from "react";
import { QrCode, Wifi, Tv, Radio, Camera, UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

export default function ComingSoon() {
  return (
    <section id="coming-soon" className="py-14 bg-white/60">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Upcoming Enhancements</h2>
          <p className="mt-2 text-brand-ink/80 max-w-2xl mx-auto">
            We're actively expanding the Rikki's Mobile Bar experience. These premium add-ons are in the works
            and will be available soon as we continue investing in upgrades:
          </p>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {[
            { icon: <Wifi className="size-5" />, title: "High-speed Starlink WiFi", desc: "Fast satellite connectivity for guests to keep menus, payments, and streams online." },
            { icon: <Tv className="size-5" />, title: "Onboard TV", desc: "Perfect for watch parties, game day, slides, or video loops—plug and play." },
            { icon: <Radio className="size-5" />, title: "Pro-level Sound System", desc: "Clear music and announcements without hauling extra gear." },
            { icon: <Camera className="size-5" />, title: "Live-stream–ready Setup", desc: "Let remote guests watch, chat, and even send a round." },
            { icon: <QrCode className="size-5" />, title: "Scan-to-order System", desc: "Guests order from their phone; tickets display for Rikki in real time for faster, seamless ordering." },
            { icon: <UtensilsCrossed className="size-5" />, title: "Food & Catering Options", desc: "Full food service with entrées and sides for events up to 100 guests. We're approved to offer four entrées—two cold and two hot—with sides." },
          ].map(({ icon, title, desc }) => (
            <Card key={title} className="rounded-2xl border border-brand-ink/20 bg-white opacity-90">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-xl">
                  <span aria-hidden="true">{icon}</span>
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brand-ink/80 text-center">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-sm text-brand-ink/70 text-center max-w-2xl mx-auto">
          Estimated launch: in the next 1–2 months as we complete our build-out. Ask us about upcoming upgrades when you inquire!
        </p>
      </div>
    </section>
  );
}

