import * as React from "react";
import { Flame, Sandwich, IceCreamBowl, UsersRound, ChefHat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";   // <-- was ./ui/card
import { Badge } from "./badge";                                     // <-- was ./ui/badge

export default function FoodOptions() {
  return (
    <section id="food" className="py-14 bg-white/60">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <Badge variant="sea">Optional Add-On</Badge>
          <h2 className="mt-3 text-3xl font-bold">Food Options</h2>
          <p className="mt-2 text-brand-ink/80 max-w-2xl mx-auto">
            We’re approved to offer four entrées with sides—two cold and two hot.
            Food is optional and designed for events up to <strong>100 guests</strong>.
            Because of prep and staffing, it’s a premium add-on.
          </p>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6 items-stretch">
          {/* Cold */}
          <Card className="rounded-2xl border border-brand-ink/20 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sandwich className="size-5" aria-hidden="true" />
                Cold Entrées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-brand-ink/85">
              <ul className="list-disc pl-5 space-y-1">
                <li>Chicken Caesar Wrap</li>
                <li>Club Sandwich <span className="text-brand-ink/60">(with chips)</span></li>
              </ul>
              <div className="text-sm text-brand-ink/70">
                Sides: house chips or salad as available.
              </div>
            </CardContent>
          </Card>

          {/* Hot */}
          <Card className="rounded-2xl border border-brand-ink/20 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Flame className="size-5" aria-hidden="true" />
                Hot Entrées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-brand-ink/85">
              <ul className="list-disc pl-5 space-y-1">
                <li>Shepherd’s Pie</li>
                <li>Chicken Sandwich</li>
              </ul>
              <div className="text-sm text-brand-ink/70">
                Sides: house chips or salad as available.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <Fact icon={<UsersRound className="size-5" />} title="Guest Capacity" text="Comfortably up to 100" />
          <Fact icon={<ChefHat className="size-5" />} title="Lead Time" text="Menu locked 14+ days out" />
          <Fact icon={<IceCreamBowl className="size-5" />} title="Service Style" text="Simple, satisfying, portable" />
        </div>

        <p className="mt-6 text-sm text-brand-ink/60 text-center">
          Looking for bar-only service? Perfect—that’s our core. Food is available by request.
        </p>
      </div>
    </section>
  );
}

function Fact({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-brand-chrome bg-white p-5">
      <div className="text-sm font-semibold flex items-center gap-2">
        <span aria-hidden="true">{icon}</span>
        {title}
      </div>
      <div className="mt-1 text-brand-ink/80">{text}</div>
    </div>
  );
}
