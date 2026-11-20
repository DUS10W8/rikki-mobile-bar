export type BuilderOption = { id: string; name: string; priceCents?: number; double?: boolean; recipe?: [string, number][]; styles?: string[] };
export type BuilderGroup = {
  id: string; name: string; select: "one" | "many"; default?: string | string[];
  styles?: string[]; exceptStyles?: string[]; options: BuilderOption[];
};
export type BuilderStyle = {
  id: string; section: string; name: string; label: string; priceCents?: number; iced: boolean;
  recipe: [string, number][]; defaults?: Record<string, string | string[]>;
};
export type BuilderLiquor = { id: string; name: string; type: string; tier: string };
export type BuilderConfig = {
  pourOz: number;
  tiers: Record<string, { name: string; priceCents: number; doubleCents: number }>;
  liquorTypes: string[];
  liquors: BuilderLiquor[];
  styleSections: string[];
  styles: BuilderStyle[];
  signatures: Record<string, { style: string; liquor: string }>;
  groups: BuilderGroup[];
};
export type Mods = Record<string, string | string[]>;
export type TicketLine =
  | { kind: "build"; liquor: string; style: string; mods: Mods; note?: string; quantity: number }
  | { kind: "item"; id: string; mods?: Mods; note?: string; quantity: number };
export type MenuItem = { id: string; name: string; priceCents: number };
export type PricedLine = { unitCents: number; quantity: number; label: string; mods: string[]; text: string; components: { id: string; name: string }[] };
export type DisplayLine = { name: string; mods: string[]; quantity: number; unit_price_cents: number };

export function groupsFor(config: BuilderConfig, styleId: string): BuilderGroup[];
export function defaultMods(config: BuilderConfig, styleId: string): Mods;
export function priceLine(config: BuilderConfig, menu: MenuItem[], line: TicketLine): PricedLine;
export function priceTicket(config: BuilderConfig, menu: MenuItem[], lines: TicketLine[]): {
  amountCents: number; drink: string; displayLines: DisplayLine[];
  items: { id: string; name: string; quantity: number; price_cents: number }[];
};
export function componentRecipes(config: BuilderConfig): [string, string, number][];
