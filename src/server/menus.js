import { createRequire } from "node:module";
import { expandMenu } from "../order/drinkBuilder.js";

const require = createRequire(import.meta.url);

// Server-side prices. Same files the browser shows, so a stale page gets a 409 instead of a wrong charge.
const builder = require("../order/drinkBuilder.json");
export const menus = {
  hamilton: require("../order/eventMenu.json").drinks,
  // Includes the Don Julio versions of upgradable tequila drinks (see expandMenu).
  salsa: expandMenu(builder, require("../order/salsaMenu.json")),
};
export const activeMenuId = require("../order/activeEvent.json").menu;
export const activeMenu = menus[activeMenuId];
// Handoff choices guests may pick for the active event (no runner at Salsa Night: pickup only).
export const activeHandoffs = require("../order/activeEvent.json").handoffs ?? ["outdoor_pickup", "upstairs"];
// Register drink builder (liquor → style → options). Abe's iPad only; the guest QR menu doesn't use it.
export const drinkBuilder = builder;
