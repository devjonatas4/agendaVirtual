import { cn } from "@/lib/utils";
import { STATUS_LABEL, type EventStatus } from "@/lib/booking";

export const STATUS_DOT: Record<EventStatus, string> = {
  pre_reserva: "bg-status-pre",
  aguardando_pagamento: "bg-status-wait",
  confirmado: "bg-status-ok",
  cancelado: "bg-status-cancel",
};

const STATUS_CHIP: Record<EventStatus, string> = {
  pre_reserva: "bg-status-pre/15 text-foreground border-status-pre/40",
  aguardando_pagamento: "bg-status-wait/15 text-foreground border-status-wait/40",
  confirmado: "bg-status-ok/15 text-foreground border-status-ok/40",
  cancelado: "bg-status-cancel/15 text-muted-foreground border-status-cancel/40 line-through",
};

export function StatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_CHIP[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function eventChipClass(status: EventStatus) {
  return STATUS_CHIP[status];
}
