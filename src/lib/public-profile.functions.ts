import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface PublicProfile {
  artist_name: string;
  tagline: string;
  whatsapp: string;
  booking_message: string;
  instagram: string;
  youtube: string;
  spotify: string;
}

export const getPublicProfile = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicProfile | null> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Backend is not configured");

    const sb = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const { data, error } = await sb
      .from("public_profile")
      .select("artist_name, tagline, whatsapp, booking_message, instagram, youtube, spotify")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
);
