import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type EventStatus = "pre_reserva" | "aguardando_pagamento" | "confirmado" | "cancelado";

export const STATUS_LABEL: Record<EventStatus, string> = {
  pre_reserva: "Pré-reserva",
  aguardando_pagamento: "Aguardando pagamento",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
};

export const STATUS_ORDER: EventStatus[] = [
  "pre_reserva",
  "aguardando_pagamento",
  "confirmado",
  "cancelado",
];

export interface BookingEvent {
  id: string;
  title: string;
  event_date: string; // YYYY-MM-DD
  start_time: string | null;
  soundcheck_time: string | null;
  congregation: string;
  address: string;
  city: string;
  status: EventStatus;
  band_notes: string;
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Brazilian phone to WhatsApp digits: adds country code 55 when only DDD + number are given. */
export function normalizeBrPhone(raw: string): string {
  let digits = onlyDigits(raw).replace(/^0+/, "");
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return digits;
}

/** wa.me link. Without a phone, WhatsApp lets you pick the chat (e.g. the band group). */
export function whatsappLink(phone: string | null | undefined, text: string): string {
  const digits = phone ? normalizeBrPhone(phone) : "";
  const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

/** Parses YYYY-MM-DD as a local calendar date (no timezone shift). */
export function parseDateOnly(iso: string): Date {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toDateOnly(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDateLong(iso: string): string {
  const text = format(parseDateOnly(iso), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

export function mapsLink(address: string, city: string): string {
  const q = [address, city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Other active bookings on the same day (cancelled ones and the event itself don't count). */
export function findDateConflicts<T extends Pick<BookingEvent, "id" | "event_date" | "status">>(
  events: T[],
  date: string,
  ignoreId?: string,
): T[] {
  return events.filter(
    (e) => e.event_date === date && e.status !== "cancelado" && e.id !== ignoreId,
  );
}

function place(ev: BookingEvent) {
  return [ev.congregation, ev.address, ev.city].filter(Boolean).join(" — ");
}

export function contractorConfirmationMessage(
  ev: BookingEvent,
  artistName: string,
  contractorName?: string,
): string {
  const lines = [
    `Olá${contractorName ? `, ${contractorName}` : ""}! A paz do Senhor 🙏`,
    ``,
    `Sua agenda com ${artistName} está *confirmada*:`,
    `📅 ${formatDateLong(ev.event_date)}${ev.start_time ? ` às ${formatTime(ev.start_time)}` : ""}`,
    `⛪ ${place(ev)}`,
    ``,
    `Recebemos o pagamento do sinal. Qualquer dúvida, estamos por aqui. Deus abençoe!`,
  ];
  return lines.join("\n");
}

export function bandMessage(ev: BookingEvent): string {
  const lines = [
    `🎶 *Nova agenda confirmada*`,
    ev.title ? `*${ev.title}*` : "",
    `📅 ${formatDateLong(ev.event_date)}`,
    ev.soundcheck_time ? `🔊 Passagem de som: ${formatTime(ev.soundcheck_time)}` : "",
    ev.start_time ? `🎤 Início: ${formatTime(ev.start_time)}` : "",
    `⛪ ${place(ev)}`,
    ev.address || ev.city ? `📍 ${mapsLink(ev.address, ev.city)}` : "",
    ev.band_notes ? `\n📝 ${ev.band_notes}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
