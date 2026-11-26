import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EventDetailDialog } from "@/components/app/EventDetailDialog";
import { EventFormDialog } from "@/components/app/EventFormDialog";
import { MonthCalendar } from "@/components/app/MonthCalendar";
import { StatusBadge, STATUS_DOT } from "@/components/app/StatusBadge";
import { cn } from "@/lib/utils";
import { formatDateLong, formatTime, parseDateOnly, STATUS_LABEL, STATUS_ORDER, toDateOnly } from "@/lib/booking";
import { accessQuery, eventsQuery, publicProfileAdminQuery, type AgendaEvent } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Jessica Norma" },
      { name: "description", content: "Calendário de eventos da cantora Jessica Norma e banda." },
      { property: "og:title", content: "Agenda — Jessica Norma" },
      { property: "og:description", content: "Calendário de eventos da cantora e banda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ context }) => {
    const access = await context.queryClient.ensureQueryData(accessQuery);
    await context.queryClient.ensureQueryData(eventsQuery(access.isAdmin));
  },
  component: AgendaPage,
});

function AgendaPage() {
  const queryClient = useQueryClient();
  const { data: access } = useSuspenseQuery(accessQuery);
  const { data: events } = useSuspenseQuery(eventsQuery(access.isAdmin));
  const { data: profile } = useQuery({ ...publicProfileAdminQuery, enabled: access.isAdmin });

  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<{ open: boolean; event: AgendaEvent | null; date: string | null }>({
    open: false,
    event: null,
    date: null,
  });

  const dayPanelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    // On phones the day panel sits below the calendar: bring it into view after a tap.
    if (selectedDate && window.matchMedia("(max-width: 1023px)").matches) {
      dayPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedDate]);

  const openEvent = events.find((e) => e.id === openId) ?? null;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["events"] });

  const today = toDateOnly(new Date());
  const upcoming = useMemo(
    () => events.filter((e) => e.event_date >= today && e.status !== "cancelado").slice(0, 8),
    [events, today],
  );
  const dayEvents = selectedDate ? events.filter((e) => e.event_date === selectedDate) : [];

  const confirmedCount = events.filter((e) => e.status === "confirmado" && e.event_date >= today).length;
  const pendingCount = events.filter(
    (e) => (e.status === "pre_reserva" || e.status === "aguardando_pagamento") && e.event_date >= today,
  ).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            {access.isAdmin ? "Painel da cantora" : "Agenda da banda"}
          </p>
          <h1 className="mt-1 text-5xl font-semibold">Olá, {access.displayName.split(" ")[0]}</h1>
          <p className="mt-1 text-muted-foreground">
            {confirmedCount} {confirmedCount === 1 ? "agenda confirmada" : "agendas confirmadas"}
            {access.isAdmin && ` · ${pendingCount} aguardando confirmação`}
          </p>
        </div>
        {access.isAdmin && (
          <Button size="lg" onClick={() => setForm({ open: true, event: null, date: selectedDate })}>
            <Plus />
            Nova agenda
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-3">
          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onOpenEvent={(ev) => setOpenId(ev.id)}
          />
          {access.isAdmin && (
            <div className="flex flex-wrap gap-4 px-1 text-xs text-muted-foreground">
              {STATUS_ORDER.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span className={cn("size-2 rounded-full", STATUS_DOT[s])} />
                  {STATUS_LABEL[s]}
                </span>
              ))}
            </div>
          )}
        </div>

        <aside className="grid content-start gap-4">
          {selectedDate && (
            <section ref={dayPanelRef} className="scroll-mt-20 rounded-3xl border bg-card p-5 shadow-soft">
              <h3 className="text-2xl font-semibold first-letter:uppercase">
                {format(parseDateOnly(selectedDate), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
              {dayEvents.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Data livre.</p>
              ) : (
                <div className="mt-3 grid gap-2">
                  {dayEvents.map((ev) => (
                    <EventCard key={ev.id} ev={ev} onOpen={() => setOpenId(ev.id)} compact />
                  ))}
                </div>
              )}
              {access.isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => setForm({ open: true, event: null, date: selectedDate })}
                >
                  <Plus />
                  Agendar neste dia
                </Button>
              )}
            </section>
          )}

          <section className="rounded-3xl border bg-card p-5 shadow-soft">
            <h3 className="text-2xl font-semibold">Próximas agendas</h3>
            {upcoming.length === 0 ? (
              <div className="mt-4 flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                <CalendarDays className="size-8 text-gold" />
                {access.isAdmin
                  ? "Nenhuma agenda ainda. Clique em “Nova agenda” para começar."
                  : "Nenhuma agenda confirmada por enquanto."}
              </div>
            ) : (
              <div className="mt-3 grid gap-2">
                {upcoming.map((ev) => (
                  <EventCard key={ev.id} ev={ev} onOpen={() => setOpenId(ev.id)} />
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      <EventDetailDialog
        event={openEvent}
        isAdmin={access.isAdmin}
        artistName={profile?.artist_name || "Jessica Norma"}
        onClose={() => setOpenId(null)}
        onEdit={(ev) => {
          setOpenId(null);
          setForm({ open: true, event: ev, date: ev.event_date });
        }}
        onChanged={refresh}
      />

      {access.isAdmin && (
        <EventFormDialog
          open={form.open}
          onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
          event={form.event}
          defaultDate={form.date}
          allEvents={events}
          onSaved={async (id) => {
            await refresh();
            setForm({ open: false, event: null, date: null });
            setOpenId(id);
          }}
        />
      )}
    </main>
  );
}

function EventCard({ ev, onOpen, compact }: { ev: AgendaEvent; onOpen: () => void; compact?: boolean }) {
  const d = parseDateOnly(ev.event_date);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border bg-background p-3 text-left transition-colors hover:border-gold hover:bg-accent/30"
      title={formatDateLong(ev.event_date)}
    >
      {!compact && (
        <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-primary py-1.5 text-primary-foreground">
          <span className="font-display text-2xl font-semibold leading-none">{format(d, "dd")}</span>
          <span className="text-[10px] uppercase tracking-wider">{format(d, "MMM", { locale: ptBR })}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{ev.congregation || ev.title || "Evento"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[ev.city, ev.start_time && formatTime(ev.start_time)].filter(Boolean).join(" · ") || "—"}
        </p>
        <StatusBadge status={ev.status} className="mt-1.5" />
      </div>
    </button>
  );
}
