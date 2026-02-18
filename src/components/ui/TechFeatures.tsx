import * as React from "react";
import { Boxes } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";  // <-- sibling import

export default function TechFeatures() {
  return (
    <section id="features" className="py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Setup & Equipment</h2>
          <p className="mt-2 text-brand-ink/80 max-w-2xl mx-auto">
            Our mobile bar is designed for flexibility. The modular setup adapts to your venue,
            whether it's a backyard, barn, vineyard, or riverside location.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          {[
            { icon: <Boxes className="size-5" />, title: "Modular Setup", desc: "Sink, fridge, keg, ice, batteries, and bar all move to fit the venue. Fast setup and tidy teardown." },
          ].map(({ icon, title, desc }) => (
            <Card key={title} className="rounded-2xl border border-brand-ink/20 bg-white max-w-md w-full">
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
      </div>
    </section>
  );
}