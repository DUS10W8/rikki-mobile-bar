// "outdoor_pickup" and "upstairs" are kept so past orders still display.
export type OrderHandoff = "doorway_pickup" | "outdoor_pickup" | "upstairs";

export const HANDOFF_LABELS: Record<OrderHandoff, string> = {
  doorway_pickup: "Pickup table at the bar door",
  outdoor_pickup: "Outdoor bar pickup",
  upstairs: "Upstairs stairway doorway",
};

export const HANDOFF_DETAILS: Record<OrderHandoff, string> = {
  doorway_pickup: "Order from your seat, then come to the pickup table at the bar door when your order is ready. Have your wristband on.",
  outdoor_pickup: "Come to the outdoor bar when your drink is ready.",
  upstairs: "Meet our runner at the doorway at the top of the stairs.",
};

export function handoffReadyMessage(handoff: OrderHandoff) {
  if (handoff === "upstairs") return "Your drink is on the way. Meet us at the doorway at the top of the stairs and show your order number.";
  if (handoff === "outdoor_pickup") return "Your drink is ready. Show your order number at the outdoor bar.";
  return "Your order is ready. Come to the pickup table at the bar door, show this order number and your wristband.";
}

export function isDelivered(handoff?: OrderHandoff | null) {
  return handoff === "upstairs";
}

export function shortOrderId(id: string) {
  return String(id).replace(/-/g, "").slice(0, 6).toUpperCase();
}
