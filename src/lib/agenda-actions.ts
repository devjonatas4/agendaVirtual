import { supabase } from "@/integrations/supabase/client";
import type { EventStatus } from "./booking";
import type { PrivateBooking } from "./queries";
import { triggerBandPush } from "./push-client";

export interface EventFormValues {
  title: string;
  event_date: string;
  start_time: string;
  soundcheck_time: string;
  congregation: string;
  address: string;
  city: string;
  status: EventStatus;
  band_notes: string;
  contractor_name: string;
  contractor_phone: string;
  fee: string;
  deposit: string;
  deposit_paid: boolean;
  admin_notes: string;
}

function money(v: string): number | null {
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return v.trim() === "" || Number.isNaN(n) ? null : n;
}

export async function saveEvent(values: EventFormValues, id?: string): Promise<string> {
  const eventRow = {
    title: values.title.trim(),
    event_date: values.event_date,
    start_time: values.start_time || null,
    soundcheck_time: values.soundcheck_time || null,
    congregation: values.congregation.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    status: values.status,
    band_notes: values.band_notes.trim(),
    ...(values.status === "confirmado" ? { confirmed_at: new Date().toISOString() } : {}),
  };

  let eventId = id;
  if (eventId) {
    const { error } = await supabase.from("events").update(eventRow).eq("id", eventId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from("events").insert(eventRow).select("id").single();
    if (error) throw new Error(error.message);
    eventId = data.id;
  }

  const privateRow: PrivateBooking & { event_id: string } = {
    event_id: eventId,
    contractor_name: values.contractor_name.trim(),
    contractor_phone: values.contractor_phone.trim(),
    fee: money(values.fee),
    deposit: money(values.deposit),
    deposit_paid: values.deposit_paid,
    admin_notes: values.admin_notes.trim(),
  };
  const { error: pErr } = await supabase.from("event_private").upsert(privateRow);
  if (pErr) throw new Error(pErr.message);

  if (values.status === "confirmado") {
    const local = [values.congregation, values.city].filter(Boolean).join(" - ");
    await triggerBandPush(
      "Evento confirmado na agenda! 🎤",
      `${values.event_date}${local ? ` • ${local}` : ""}`
    );
  }

  return eventId;
}

/** Payment received: mark the deposit as paid and confirm the date (it then shows to the band). */
export async function confirmPayment(eventId: string) {
  const { error: pErr } = await supabase
    .from("event_private")
    .upsert({ event_id: eventId, deposit_paid: true });
  if (pErr) throw new Error(pErr.message);
  const { error } = await supabase
    .from("events")
    .update({ status: "confirmado", confirmed_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) throw new Error(error.message);

  await triggerBandPush(
    "Data confirmada na agenda! 🎶",
    "Um evento teve o pagamento confirmado. Confira os horários no app."
  );
}

export async function deleteEvent(eventId: string) {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);
}