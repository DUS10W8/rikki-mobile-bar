const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Bartender-Pin",
};

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    return response.status(204).setHeader("Access-Control-Allow-Origin", "*").end();
  }

  if (request.method !== "POST") {
    return sendJson(response, 405, { message: "Method not allowed." });
  }

  const configuredPin = (process.env.BARTENDER_PIN || process.env.VITE_BARTENDER_PIN || "").trim();
  const submittedPin = String(request.headers["x-bartender-pin"] || request.body?.pin || "").trim();

  if (!configuredPin || submittedPin !== configuredPin) {
    return sendJson(response, 401, { message: "Unauthorized." });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return sendJson(response, 500, { message: "Twilio is not configured." });
  }

  const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
  const order = await getOrder(body);

  if (!order.phone || !order.orderId) {
    return sendJson(response, 400, { message: "Missing order id or phone number." });
  }

  if (order.ready_sms_sent_at) {
    return sendJson(response, 200, { skipped: true, message: "Ready SMS already sent." });
  }

  const origin = request.headers.origin || `https://${request.headers.host}`;
  const tipUrl = new URL("/tip", origin).toString();
  const reorderUrl = new URL("/order", origin).toString();
  const message = `Your drink is ready at Rikki's Mobile Bar. Tip: ${tipUrl} Reorder: ${reorderUrl} Reply STOP to opt out.`;

  const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: order.phone,
      From: fromNumber,
      Body: message,
    }),
  });

  const twilioPayload = await twilioResponse.json().catch(() => ({}));

  if (!twilioResponse.ok) {
    return sendJson(response, twilioResponse.status, {
      message: twilioPayload.message || "Twilio could not send the ready SMS.",
    });
  }

  await markSmsSent(order.orderId);

  return sendJson(response, 200, { message: "Ready SMS sent.", sid: twilioPayload.sid });
}

async function getOrder(body) {
  const orderId = String(body.orderId || "");
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (orderId && supabaseUrl && serviceRoleKey) {
    const url = new URL("/rest/v1/orders", supabaseUrl);
    url.searchParams.set("id", `eq.${orderId}`);
    url.searchParams.set("select", "id,name,phone,drink,status,ready_sms_sent_at");
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    const rows = await response.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : null;

    if (row) {
      return {
        orderId: row.id,
        name: row.name,
        phone: row.phone,
        drink: row.drink,
        ready_sms_sent_at: row.ready_sms_sent_at,
      };
    }
  }

  return {
    orderId,
    name: String(body.name || ""),
    phone: String(body.phone || ""),
    drink: String(body.drink || ""),
    ready_sms_sent_at: null,
  };
}

async function markSmsSent(orderId) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!orderId || !supabaseUrl || !serviceRoleKey) return;

  const url = new URL("/rest/v1/orders", supabaseUrl);
  url.searchParams.set("id", `eq.${orderId}`);

  await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ ready_sms_sent_at: new Date().toISOString() }),
  }).catch(() => undefined);
}

function sendJson(response, status, payload) {
  for (const [key, value] of Object.entries(jsonHeaders)) {
    response.setHeader(key, value);
  }
  return response.status(status).json(payload);
}
