import * as React from "react";
import { QrCode, Wifi, Tv, Radio, Camera, Boxes } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";  // <-- sibling import

export default function TechFeatures() {
  return (
    <section id="features" className="py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Tech-Forward, Anywhere</h2>
          <p className="mt-2 text-brand-ink/80 max-w-2xl mx-auto">
            Mid-century aesthetic, future-ready service. QR ordering, fast satellite Wi-Fi, TV for
            sports or slide decks, big sound, and even private livestreams—plus a modular bar that
            reconfigures to fit courtyards, barns, rooftops, and more.
          </p>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {[
            { icon: <QrCode className="size-5" />, title: "Scan-to-Order", desc: "Guests order from their phone; tickets display for Rikki in real time." },
            { icon: <Wifi className="size-5" />, title: "Fast Wi-Fi", desc: "Satellite connectivity keeps menus, payments, and streams online." },
            { icon: <Tv className="size-5" />, title: "TV Onboard", desc: "Game day, slides, or video loops—plug and play." },
            { icon: <Radio className="size-5" />, title: "Pro Sound", desc: "Clear music and announcements without hauling extra gear." },
            { icon: <Camera className="size-5" />, title: "Livestream Ready", desc: "Let remote guests watch, chat, and even send a round." },
            { icon: <Boxes className="size-5" />, title: "Modular Setup", desc: "Sink, fridge, keg, ice, batteries, and bar all move to fit the venue." },
          ].map(({ icon, title, desc }) => (
            <Card key={title} className="rounded-2xl border border-brand-ink/20 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <span aria-hidden="true">{icon}</span>
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brand-ink/80">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}