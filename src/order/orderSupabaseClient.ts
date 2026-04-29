import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "";

function validateSupabaseConfig(url: string, anonKey: string) {
  if (!url || !anonKey) {
    return "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.";
  }

  try {
    const parsed = new URL(url);
    const isLocalSupabase = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
    const isHostedSupabase = parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");

    if (!isLocalSupabase && !isHostedSupabase) {
      return "VITE_SUPABASE_URL should be a hosted Supabase URL or local Supabase URL.";
    }
  } catch {
    return "VITE_SUPABASE_URL is not a valid URL.";
  }

  return "";
}

export const orderSupabaseConfig = {
  url: supabaseUrl,
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  error: validateSupabaseConfig(supabaseUrl, supabaseAnonKey),
};

export const orderSupabase = orderSupabaseConfig.error ? null : createClient(supabaseUrl, supabaseAnonKey);
