const PROMOS = {
  CLUBWAGON: {
    label: "Founder's Code",
    discountAmount: 150,
    maxRedemptions: 3,
  },
};

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    return sendJson(response, 204, {});
  }

  if (request.method !== "POST") {
    return sendJson(response, 405, { status: "pending", message: "Method not allowed." });
  }

  const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
  const code = String(body.code || "").trim().toUpperCase();
  const promo = PROMOS[code];

  if (!promo) {
    return sendJson(response, 404, { status: "pending", message: "That promo code is not active." });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey === "your_supabase_service_role_key") {
    return sendJson(response, 200, {
      status: "pending",
      message: `${promo.label} noted. We will confirm first-${promo.maxRedemptions} availability before final booking.`,
    });
  }

  try {
    const existing = await listRedemptions(supabaseUrl, serviceRoleKey, code);
    const uniqueKey = buildUniqueKey(body);
    const duplicate = existing.find((row) => row.unique_key === uniqueKey);

    if (duplicate) {
      return sendJson(response, 200, {
        status: "reserved",
        message: `${promo.label} is already reserved for this estimate request.`,
      });
    }

    if (existing.length >= promo.maxRedemptions) {
      return sendJson(response, 200, {
        status: "pending",
        message: `${promo.label} has reached its first-${promo.maxRedemptions} online reservations. We will confirm if a spot opens before final booking.`,
      });
    }

    await createRedemption(supabaseUrl, serviceRoleKey, {
      code,
      unique_key: uniqueKey,
      name: String(body.name || ""),
      email: String(body.email || ""),
      phone: String(body.phone || ""),
      event_date: String(body.eventDate || ""),
      discount_amount: promo.discountAmount,
      status: "reserved",
    });

    return sendJson(response, 200, {
      status: "reserved",
      message: `${promo.label} reserved. $${promo.discountAmount} off will be confirmed with your final booking.`,
    });
  } catch (error) {
    return sendJson(response, 200, {
      status: "pending",
      message: `${promo.label} noted. We will confirm first-${promo.maxRedemptions} availability before final booking.`,
    });
  }
}

async function listRedemptions(supabaseUrl, serviceRoleKey, code) {
  const url = new URL("/rest/v1/promo_redemptions", supabaseUrl);
  url.searchParams.set("code", `eq.${code}`);
  url.searchParams.set("status", "eq.reserved");
  url.searchParams.set("select", "id,unique_key");

  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) throw new Error("Could not list promo redemptions.");
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

async function createRedemption(supabaseUrl, serviceRoleKey, payload) {
  const url = new URL("/rest/v1/promo_redemptions", supabaseUrl);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("Could not create promo redemption.");
}

function buildUniqueKey(body) {
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").replace(/\D/g, "");
  const eventDate = String(body.eventDate || "").trim();
  return [email, phone, eventDate].filter(Boolean).join("|") || crypto.randomUUID();
}

function sendJson(response, status, payload) {
  for (const [key, value] of Object.entries(jsonHeaders)) {
    response.setHeader(key, value);
  }
  return response.status(status).json(payload);
}
