import hamiltonMenu from "./eventMenu.json";
import salsaMenu from "./salsaMenu.json";
import activeEvent from "./activeEvent.json";

export type EventMenuItem = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  description?: string;
  name_es?: string;
  description_es?: string;
};

// To switch the guest QR menu, change "menu" in activeEvent.json. The server reads the same file.
export const EVENT_MENUS: Record<string, EventMenuItem[]> = { hamilton: hamiltonMenu.drinks, salsa: salsaMenu };
export const ACTIVE_EVENT = activeEvent;
export const EVENT_DRINK_MENU: EventMenuItem[] = EVENT_MENUS[activeEvent.menu];

export function sortCategories(categories: string[]) {
  const rank = (category: string) => {
    const index = activeEvent.categoryOrder.indexOf(category);
    return index === -1 ? activeEvent.categoryOrder.length : index;
  };
  return [...categories].sort((a, b) => rank(a) - rank(b));
}
