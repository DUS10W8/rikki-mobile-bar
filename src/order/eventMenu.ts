export type EventDrink = {
  id: string;
  name: string;
  description: string;
  category: string;
  active: true;
};

export const EVENT_DRINK_MENU: EventDrink[] = [
  {
    id: "event-old-fashioned",
    name: "Old Fashioned",
    category: "Cocktail",
    description: "Bourbon, aromatic bitters, simple sugar, expressed orange",
    active: true,
  },
  {
    id: "event-mojito",
    name: "Mojito",
    category: "Cocktail",
    description: "Fresh mint, lime, white rum, sparkling soda",
    active: true,
  },
  {
    id: "event-malhan-margarita",
    name: "Malhan Margarita",
    category: "Cocktail",
    description: "Premium tequila, fresh lime, orange liqueur, handcrafted citrus blend",
    active: true,
  },
  {
    id: "event-no-jito",
    name: "No-Jito (N/A)",
    category: "Mocktail / Non-Alcoholic",
    description: "Fresh mint, lime, cane sugar, sparkling soda",
    active: true,
  },
  {
    id: "event-bookwalter-prefix",
    name: "Bookwalter Prefix",
    category: "Red Wine",
    description: "Red wine",
    active: true,
  },
  {
    id: "event-modelo",
    name: "Modelo",
    category: "Beer",
    description: "Beer",
    active: true,
  },
  {
    id: "event-mac-and-jacks",
    name: "Mac and Jack's",
    category: "Beer",
    description: "Beer",
    active: true,
  },
];
