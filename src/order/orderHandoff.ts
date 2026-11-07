export type OrderHandoff = "outdoor_pickup" | "upstairs";

export const HANDOFF_LABELS: Record<OrderHandoff, string> = {
  outdoor_pickup: "Outdoor bar pickup",
  upstairs: "Upstairs handoff",
};

export function shortOrderId(id: string) {
  return String(id).replace(/-/g, "").slice(0, 6).toUpperCase();
}
