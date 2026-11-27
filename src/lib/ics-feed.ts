import { supabase } from "@/integrations/supabase/client";

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function formatIcsDateTime(dateStr: string, timeStr: string | null): { value: string; isDateOnly: boolean } {
  const cleanDate = dateStr.replace(/-/g, "");
  if (!timeStr) {
    return { value: cleanDate, isDateOnly: true };
  }
  const [hh = "00", mm = "00"] = timeStr.split(":");
  return { value: `${cleanDate}T${hh.padStart(2, "0")}${mm.padStart(2, "0")}00`, isDateOnly: false };
}

export async function generateBandIcsResponse(): Promise<Response> {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("id, title, event_date, start_time, soundcheck_time, congregation, address, city, band_notes")
      .eq("status", "confirmado")
      .order("event_date", { ascending: true });

    if (error) {
      return new Response(`Erro Supabase: ${error.message}`, {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Jessica Norma//Agenda Banda//PT-BR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Agenda Jessica Norma",
      "X-WR-TIMEZONE:America/Recife",
    ];

    const dtstamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

    for (const ev of events ?? []) {
      const start = formatIcsDateTime(ev.event_date, ev.start_time);
      const summary = escapeIcsText(ev.congregation || ev.title || "Agenda Jessica Norma");
      const location = escapeIcsText([ev.address, ev.city].filter(Boolean).join(" - "));
      const descParts = [
        ev.title ? `Evento: ${ev.title}` : "",
        ev.soundcheck_time ? `Passagem de som: ${ev.soundcheck_time.slice(0, 5)}` : "",
        ev.band_notes ? `Observações: ${ev.band_notes}` : "",
      ].filter(Boolean);
      const description = escapeIcsText(descParts.join("\n"));

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:event-${ev.id}@agendajn.app`);
      lines.push(`DTSTAMP:${dtstamp}`);

      if (start.isDateOnly) {
        lines.push(`DTSTART;VALUE=DATE:${start.value}`);
      } else {
        lines.push(`DTSTART;TZID=America/Recife:${start.value}`);
      }

      lines.push(`SUMMARY:${summary}`);
      if (location) lines.push(`LOCATION:${location}`);
      if (description) lines.push(`DESCRIPTION:${description}`);
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    return new Response(lines.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="calendario-jn-8492.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`Falha ao gerar ICS: ${message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}