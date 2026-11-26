import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BookingEvent } from "./booking";

export interface Access {
  userId: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isBand: boolean;
}

export const accessQuery = queryOptions({
  queryKey: ["access"],
  queryFn: async (): Promise<Access> => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) throw new Error("Not signed in");
    const user = userData.user;
    const [{ data: roles, error: rolesError }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    ]);
    if (rolesError) throw new Error(rolesError.message);
    const list = (roles ?? []).map((r) => r.role);
    return {
      userId: user.id,
      email: user.email ?? "",
      displayName: profile?.display_name || user.email || "",
      isAdmin: list.includes("admin"),
      isBand: list.includes("banda"),
    };
  },
});

export interface PrivateBooking {
  contractor_name: string;
  contractor_phone: string;
  fee: number | null;
  deposit: number | null;
  deposit_paid: boolean;
  admin_notes: string;
}

export type AgendaEvent = BookingEvent & { private: PrivateBooking | null };

export const eventsQuery = (isAdmin: boolean) =>
  queryOptions({
    queryKey: ["events", isAdmin],
    queryFn: async (): Promise<AgendaEvent[]> => {
      const cols =
        "id, title, event_date, start_time, soundcheck_time, congregation, address, city, status, band_notes";
      if (isAdmin) {
        const { data, error } = await supabase
          .from("events")
          .select(`${cols}, event_private(*)`)
          .order("event_date")
          .order("start_time");
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => {
          const { event_private, ...ev } = row as typeof row & { event_private: unknown };
          const p = Array.isArray(event_private) ? event_private[0] : event_private;
          return { ...(ev as BookingEvent), private: (p as PrivateBooking) ?? null };
        });
      }
      const { data, error } = await supabase
        .from("events")
        .select(cols)
        .order("event_date")
        .order("start_time");
      if (error) throw new Error(error.message);
      return (data ?? []).map((ev) => ({ ...(ev as BookingEvent), private: null }));
    },
  });

export const publicProfileAdminQuery = queryOptions({
  queryKey: ["public_profile"],
  queryFn: async () => {
    const { data, error } = await supabase.from("public_profile").select("*").eq("id", 1).single();
    if (error) throw new Error(error.message);
    return data;
  },
});

export interface TeamMember {
  id: string;
  display_name: string;
  instrument: string | null;
  isAdmin: boolean;
  isBand: boolean;
}

export const teamQuery = queryOptions({
  queryKey: ["team"],
  queryFn: async (): Promise<TeamMember[]> => {
    const [{ data: profiles, error }, { data: roles, error: rErr }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, instrument, created_at").order("created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (error) throw new Error(error.message);
    if (rErr) throw new Error(rErr.message);
    return (profiles ?? []).map((p) => {
      const mine = (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role);
      return {
        id: p.id,
        display_name: p.display_name,
        instrument: p.instrument,
        isAdmin: mine.includes("admin"),
        isBand: mine.includes("banda"),
      };
    });
  },
});
