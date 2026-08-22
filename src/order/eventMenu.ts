export type EventDrink = {
  id: string;
  name: string;
  description: string;
  category: string;
  active: true;
};

export const EVENT_DRINK_MENU: EventDrink[] = [
  {
    id: "event-emilys-75",
    name: "Emily's 75",
    category: "Cocktail",
    description: "",
    active: true,
  },
  {
    id: "event-coco-mojito",
    name: "Coco Mojito",
    category: "Cocktail",
    description: "",
    active: true,
  },
  {
    id: "event-strawberry-margarita",
    name: "Strawberry Margarita",
    category: "Cocktail",
    description: "",
    active: true,
  },
  {
    id: "event-aperol-spritz",
    name: "Aperol Spritz",
    category: "Cocktail",
    description: "",
    active: true,
  },
  {
    id: "event-classic-cocktail-custom",
    name: "Type your own",
    category: "Classic Cocktail",
    description: "Tell us which classic cocktail you'd like and we'll do our best to make it.",
    active: true,
  },
  {
    id: "event-stella-artois",
    name: "Stella Artois",
    category: "Beer",
    description: "",
    active: true,
  },
  {
    id: "event-modelo",
    name: "Modelo",
    category: "Beer",
    description: "",
    active: true,
  },
  {
    id: "event-kona-big-wave",
    name: "Kona Big Wave",
    category: "Beer",
    description: "",
    active: true,
  },
  {
    id: "event-na-custom",
    name: "Type your own",
    category: "N/A",
    description: "Tell us what non-alcoholic drink you'd like.",
    active: true,
  },
];
