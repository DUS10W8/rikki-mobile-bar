const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    return response.status(204).setHeader("Access-Control-Allow-Origin", "*").end();
  }

  // Temporary, safe diagnostic: reports credential shape only (length, whitespace,
  // masked prefix/suffix) -- never the actual secret value. Remove after debugging.
  if (request.method === "GET" && request.query?.diag === "rikki2026") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    const authToken = process.env.TWILIO_AUTH_TOKEN || "";
    const fromNumber = process.env.TWILIO_FROM_NUMBER || "";
    const notifyNumber = process.env.QUOTE_NOTIFY_PHONE || "";
    const describe = (value) => ({
      length: value.length,
      hasLeadingWhitespace: /^\s/.test(value),
      hasTrailingWhitespace: /\s$/.test(value),
      hasInternalWhitespace: /\s/.test(value.trim()),
      preview: value.length > 4 ? `${value.slice(0, 2)}...${value.slice(-2)}` : "(too short)",
    });
    return sendJson(response, 200, {
      accountSid: describe(accountSid),
      authToken: describe(authToken),
      fromNumber: describe(fromNumber),
      notifyNumber: describe(notifyNumber),
    });
  }

  if (request.method !== "POST") {
    return sendJson(response, 405, { message: "Method not allowed." });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const notifyNumber = process.env.QUOTE_NOTIFY_PHONE;

  if (!accountSid || !authToken || !fromNumber || !notifyNumber) {
    return sendJson(response, 500, { message: "Quote SMS notifications are not configured." });
  }

  const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();

  if (!name) {
    return sendJson(response, 400, { message: "Missing name." });
  }

  const parts = [];
  if (body.eventType) parts.push(String(body.eventType));
  if (body.guestCountEstimate) parts.push(`~${body.guestCountEstimate} guests`);
  if (body.duration) parts.push(String(body.duration));

  const detailLine = parts.length ? parts.join(", ") : null;
  const eventDate = body.eventDate ? `Date: ${body.eventDate}. ` : "";
  const estimate = body.estimatedRange ? `Est: ${body.estimatedRange}. ` : "";

  const message = [
    `New quote request: ${name}${phone ? ` (${phone})` : ""}.`,
    detailLine ? `${detailLine}.` : "",
    eventDate,
    estimate,
    "Check Formspree for full details.",
  ]
    .filter(Boolean)
    .join(" ");

  const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: notifyNumber,
      From: fromNumber,
      Body: message,
    }),
  });

  const twilioPayload = await twilioResponse.json().catch(() => ({}));

  if (!twilioResponse.ok) {
    return sendJson(response, twilioResponse.status, {
      message: twilioPayload.message || "Twilio could not send the quote notification SMS.",
    });
  }

  return sendJson(response, 200, { message: "Quote notification SMS sent.", sid: twilioPayload.sid });
}

function sendJson(response, status, payload) {
  for (const [key, value] of Object.entries(jsonHeaders)) {
    response.setHeader(key, value);
  }
  return response.status(status).json(payload);
}
