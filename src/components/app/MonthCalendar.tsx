import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toDateOnly } from "@/lib/booking";
import type { AgendaEvent } from "@/lib/queries";
import { eventChipClass, STATUS_DOT } from "./StatusBadge";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface Props {
  month: Date;
  onMonthChange: (d: Date) => void;
  events: AgendaEvent[];
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
  onOpenEvent: (ev: AgendaEvent) => void;
}

export function MonthCalendar({
  month,
  onMonthChange,
  events,
  selectedDate,
  onSelectDate,
  onOpenEvent,
}: Props) {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  const byDate = new Map<string, AgendaEvent[]>();
  for (const ev of events) {
    const list = byDate.get(ev.event_date) ?? [];
    list.push(ev);
    byDate.set(ev.event_date, list);
  }

  return (
    <section className="overflow-hidden rounded-3xl border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-3xl font-semibold capitalize">
          {format(month, "MMMM", { locale: ptBR })}{" "}
          <span className="text-muted-foreground">{format(month, "yyyy")}</span>
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onMonthChange(new Date())}>
            Hoje
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mês anterior"
            onClick={() => onMonthChange(addMonths(month, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Próximo mês"
            onClick={() => onMonthChange(addMonths(month, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b bg-muted/50 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const iso = toDateOnly(day);
          const dayEvents = byDate.get(iso) ?? [];
          const inMonth = isSameMonth(day, month);
          const selected = selectedDate === iso;
          return (
            <div
              key={iso}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDate(iso)}
              onKeyDown={(e) => e.key === "Enter" && onSelectDate(iso)}
              className={cn(
                "group min-h-20 cursor-pointer border-b border-r p-1.5 text-left transition-colors sm:min-h-28 sm:p-2",
                !inMonth && "bg-muted/40 text-muted-foreground/60",
                selected ? "bg-accent/60" : "hover:bg-muted/60",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-sm",
                  isToday(day) && "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 hidden flex-col gap-1 sm:flex">
                {dayEvents.slice(0, 3).map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEvent(ev);
                    }}
                    className={cn(
                      "truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] font-medium",
                      eventChipClass(ev.status),
                    )}
                  >
                    {ev.congregation || ev.title || "Evento"}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[11px] text-muted-foreground">
                    +{dayEvents.length - 3} mais
                  </span>
                )}
              </div>
              <div className="mt-1 flex gap-1 sm:hidden">
                {dayEvents.map((ev) => (
                  <span key={ev.id} className={cn("size-1.5 rounded-full", STATUS_DOT[ev.status])} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
