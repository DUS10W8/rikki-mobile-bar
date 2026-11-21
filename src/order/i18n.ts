// Guest-facing English / Español. English text is the key, so untranslated text falls back to English.
// Phones set to Spanish start in Spanish; the guest's choice is remembered on that phone.
export type Lang = "en" | "es";
const STORAGE_KEY = "rikki-lang";

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "es") return saved;
  } catch {
    // Private mode or storage blocked: fall back to the phone's language.
  }
  const languages = typeof navigator === "undefined" ? [] : navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages.some((language) => /^es\b/i.test(language ?? "")) ? "es" : "en";
}

let current: Lang = typeof window === "undefined" ? "en" : detect();
if (typeof document !== "undefined") document.documentElement.lang = current;

export const getLang = () => current;

export function setLang(lang: Lang) {
  current = lang;
  if (typeof document !== "undefined") document.documentElement.lang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Not saved; it still applies for this visit.
  }
}

const es: Record<string, string> = {
  // Menu and checkout
  "Order from your seat and pay with Square. We'll tell you when it's ready at the pickup table by the bar door. 21+ with wristband.":
    "Pide desde tu lugar y paga con Square. Te avisamos cuando esté lista en la mesa de entrega junto a la puerta de la barra. Mayores de 21 con pulsera.",
  "Salsa Night Menu": "Menú de Noche de Salsa",
  "item": "artículo",
  "items": "artículos",
  "Pickup": "Recoger",
  "Where should we meet you?": "¿Dónde te encontramos?",
  "Name": "Nombre",
  "Phone": "Teléfono",
  "(optional)": "(opcional)",
  "Your order": "Tu pedido",
  "Opening Square checkout…": "Abriendo el pago con Square…",
  "Pay {amount}": "Pagar {amount}",
  "Choose your drinks": "Elige tus bebidas",
  "Upgrade to {name}": "Cambia a {name}",
  "Quantity for {name}": "Cantidad de {name}",
  "Remove one {name}": "Quitar un {name}",
  "Add one {name}": "Agregar un {name}",
  "Checkout is temporarily unavailable.": "El pago no está disponible en este momento.",
  "Add a name for your order.": "Agrega un nombre para tu pedido.",
  // Handoff
  "Pickup table at the bar door": "Mesa de entrega en la puerta de la barra",
  "Order from your seat, then come to the pickup table at the bar door when your order is ready. Have your wristband on.":
    "Pide desde tu lugar y ven a la mesa de entrega en la puerta de la barra cuando tu pedido esté listo. Trae puesta tu pulsera.",
  "Outdoor bar pickup": "Recoger en la barra de afuera",
  "Come to the outdoor bar when your drink is ready.": "Ven a la barra de afuera cuando tu bebida esté lista.",
  "Upstairs stairway doorway": "Puerta de la escalera de arriba",
  "Meet our runner at the doorway at the top of the stairs.": "Encuentra a nuestro mesero en la puerta de arriba de la escalera.",
  "Your drink is on the way. Meet us at the doorway at the top of the stairs and show your order number.":
    "Tu bebida va en camino. Encuéntranos en la puerta de arriba de la escalera y muestra tu número de pedido.",
  "Your drink is ready. Show your order number at the outdoor bar.": "Tu bebida está lista. Muestra tu número de pedido en la barra de afuera.",
  "Your order is ready. Come to the pickup table at the bar door, show this order number and your wristband.":
    "Tu pedido está listo. Ven a la mesa de entrega en la puerta de la barra y muestra este número de pedido y tu pulsera.",
  // Payment confirmation
  "Confirming your payment": "Confirmando tu pago",
  "Waiting for Square to confirm your payment": "Esperando a que Square confirme tu pago",
  "Check payment again": "Revisar el pago otra vez",
  "Payment is taking longer to confirm. Check again here before paying for another drink.":
    "El pago está tardando en confirmarse. Revisa aquí otra vez antes de pagar otra bebida.",
  "We couldn't confirm your payment yet. Check again before paying for another drink.":
    "Todavía no pudimos confirmar tu pago. Revisa otra vez antes de pagar otra bebida.",
  "Payment confirmed": "Pago confirmado",
  "Your order is in": "Tu pedido está hecho",
  "{name}, your {drink} has been sent to the bar.": "{name}, tu pedido ({drink}) ya se mandó a la barra.",
  "Order": "Pedido",
  "Table {number}": "Mesa {number}",
  "Keep this page open for handoff updates.": "Deja esta página abierta para ver cuándo está lista.",
  "Sound alert enabled": "Alerta de sonido activada",
  "Enable sound alert": "Activar alerta de sonido",
  "Want another drink later? Save this page.": "¿Otra bebida más tarde? Guarda esta página.",
  "Loved the service?": "¿Te gustó el servicio?",
  "Tip the Bar Team": "Deja propina al equipo",
  "Connect With Rikki's": "Conecta con Rikki's",
  "Place another order": "Hacer otro pedido",
  "We couldn't restore your last order. Please check with a staff member.":
    "No pudimos recuperar tu último pedido. Pregunta a alguien del equipo.",
  // Live status
  "Live status": "Estado en vivo",
  "Order received": "Pedido recibido",
  "In the queue": "En la fila",
  "Being made": "Preparándose",
  "Delivered": "Entregado",
  "Picked up": "Recogido",
  "On the way upstairs": "Subiendo",
  "Ready for pickup": "Listo para recoger",
  "Your drink is being made at the {station}.": "Tu bebida se está preparando en la {station}.",
  "Your drink is being made now.": "Tu bebida se está preparando ahora.",
  "Your drink is ready. We’ll bring it to Table {number}.": "Tu bebida está lista. La llevamos a la mesa {number}.",
  "Your drink is ready at the {station}!": "¡Tu bebida está lista en la {station}!",
  "Your drink is ready for pickup.": "Tu bebida está lista para recoger.",
  "Enjoy your drink!": "¡Disfruta tu bebida!",
  "Your drink should be ready soon.": "Tu bebida estará lista pronto.",
  "Your drink should be ready in about {minutes} minute.": "Tu bebida estará lista en aproximadamente {minutes} minuto.",
  "Your drink should be ready in about {minutes} minutes.": "Tu bebida estará lista en aproximadamente {minutes} minutos.",
  "We’ll bring your drink to Table {number} shortly.": "Pronto llevamos tu bebida a la mesa {number}.",
  "Your drink is ready! Please head to the pickup area.": "¡Tu bebida está lista! Pasa al área de entrega.",
  "Your drink has been delivered. Cheers!": "Tu bebida fue entregada. ¡Salud!",
  "Your order has been picked up. Cheers!": "Ya recogiste tu pedido. ¡Salud!",
  "Your drink is in the queue.": "Tu bebida está en la fila.",
  "Live updates are having trouble. Please check with a staff member.": "Las actualizaciones en vivo tienen problemas. Pregunta a alguien del equipo.",
  "Live updates paused. Pull to refresh or check with the bar.": "Las actualizaciones en vivo se pausaron. Recarga la página o pregunta en la barra.",
  "White Bar": "Barra Blanca",
  "Brown Bar": "Barra Café",
};

export function t(english: string, vars: Record<string, string | number> = {}) {
  const text = current === "es" ? es[english] ?? english : english;
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

/** Menu text: an item or label may carry its own Spanish ("name_es", "description_es"). */
export function pick(english: string | undefined, spanish: string | undefined) {
  return current === "es" && spanish ? spanish : english ?? "";
}
