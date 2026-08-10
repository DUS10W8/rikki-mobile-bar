export type EventDrink = {
  id: string;
  name: string;
  description: string;
  category: string;
  active: true;
};

export const EVENT_DRINK_MENU: EventDrink[] = [
  {
    id: "event-watermelon-rum-cooler",
    name: "Watermelon Rum Cooler",
    category: "Cocktail",
    description: "White rum, fresh watermelon juice, fresh lime juice, simple syrup, fresh mint, club soda",
    active: true,
  },
  {
    id: "event-honey-lemon-gin-sour",
    name: "Honey Lemon Gin Sour",
    category: "Cocktail",
    description: "Gin, fresh lemon juice, local honey syrup, egg white, basil leaves",
    active: true,
  },
];
