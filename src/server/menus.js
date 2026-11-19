import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Server-side prices. Same files the browser shows, so a stale page gets a 409 instead of a wrong charge.
export const menus = {
  hamilton: require("../order/eventMenu.json").drinks,
  salsa: require("../order/salsaMenu.json"),
};
export const activeMenuId = require("../order/activeEvent.json").menu;
export const activeMenu = menus[activeMenuId];
