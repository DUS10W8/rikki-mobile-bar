import { createClient } from "@supabase/supabase-js";
import { authorizeStaff } from "../src/server/staffSession.js";

// Bartender board reads and status changes. Replaces direct browser access to the
// orders table, which exposed guest phone numbers to anyone holding the public key.
const fields = "id,name,phone,drink,status,bar_station,square_order_id,handoff,table_number,created_at,updated_at,ready_sms_sent_at";
const statuses = { new: "New", in_progress: "In Progress", ready: "Ready", completed: "Completed" };
const stations = ["white_bar", "brown_bar"];
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const dbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!dbUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.WALKUP_STAFF_CODE) {
    return res.status(503).json({ error: "The bartender queue is not configured." });
  }
  if (req.headers["x-walkup-request"] !== "1") return res.status(403).json({ error: "Invalid request." });
  if (!authorizeStaff(req, res)) return res.status(401).json({ error: "Enter the staff code." });
  const db = createClient(dbUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    if (req.method === "GET") {
      const { data, error } = await db.from("orders").select(fields).not("square_order_id", "is", null)
        .order("created_at", { ascending: false }).limit(75);
      if (error) throw error;
      return res.status(200).json({ orders: data });
    }
    if (req.method !== "POST") return res.status(405).end();
    const { id, status, barStation } = req.body ?? {};
    if (typeof id !== "string" || !uuid.test(id) || !statuses[status] ||
        (barStation !== undefined && barStation !== null && !stations.includes(barStation))) {
      return res.status(400).json({ error: "Invalid status change." });
    }
    const update = { status: statuses[status], updated_at: new Date().toISOString() };
    if (barStation !== undefined) update.bar_station = barStation;
    const { data, error } = await db.from("orders").update(update).eq("id", id).select(fields).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Order not found." });
    return res.status(200).json({ order: data });
  } catch (error) {
    console.error("Bartender orders failed", error.code || error.message);
    return res.status(502).json({ error: "Could not reach the order queue." });
  }
}
