import { useState } from "react";
import { BadgeCheck, Church, Clock, LoaderCircle, MapPin, MessageCircle, Pencil, Send, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  bandMessage,
  contractorConfirmationMessage,
  formatDateLong,
  formatMoney,
  formatTime,
  mapsLink,
  whatsappLink,
} from "@/lib/booking";
import { confirmPayment, deleteEvent } from "@/lib/agenda-actions";
import type { AgendaEvent } from "@/lib/queries";
import { StatusBadge } from "./StatusBadge";

interface Props {
  event: AgendaEvent | null;
  isAdmin: boolean;
  artistName: string;
  onClose: () => void;
  onEdit: (ev: AgendaEvent) => void;
  onChanged: () => void;
}

export function EventDetailDialog({ event, isAdmin, artistName, onClose, onEdit, onChanged }: Props) {
  const [busy, setBusy] = useState<"confirm" | "delete" | null>(null);
  const ev = event;
  const p = ev?.private;

  async function handleConfirm() {
    if (!ev) return;
    setBusy("confirm");
    try {
      await confirmPayment(ev.id);
      toast.success("Pagamento confirmado! A agenda já aparece para a banda.");
      onChanged();
    } catch (err) {
      toast.error("Não foi possível confirmar", { description: (err as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!ev || !window.confirm("Excluir esta agenda? Isso não pode ser desfeito.")) return;
    setBusy("delete");
    try {
      await deleteEvent(ev.id);
      toast.success("Agenda excluída");
      onChanged();
      onClose();
    } catch (err) {
      toast.error("Não foi possível excluir", { description: (err as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={!!ev} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {ev && (
          <>
            <DialogHeader>
              <div className="mb-1">
                <StatusBadge status={ev.status} />
              </div>
              <DialogTitle className="font-display text-3xl leading-tight">
                {ev.title || ev.congregation || "Evento"}
              </DialogTitle>
              <DialogDescription>{formatDateLong(ev.event_date)}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 text-sm">
              <Row icon={Church} label="Congregação">{ev.congregation || "—"}</Row>
              <Row icon={MapPin} label="Local">
                {[ev.address, ev.city].filter(Boolean).join(" — ") || "—"}
                {(ev.address || ev.city) && (
                  <a
                    href={mapsLink(ev.address, ev.city)}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Abrir no mapa
                  </a>
                )}
              </Row>
              <Row icon={Clock} label="Horários">
                {ev.soundcheck_time ? `Passagem de som ${formatTime(ev.soundcheck_time)} · ` : ""}
                {ev.start_time ? `Início ${formatTime(ev.start_time)}` : "A definir"}
              </Row>
              {ev.band_notes && (
                <div className="rounded-xl bg-accent/50 p-3 text-accent-foreground">
                  <p className="text-xs font-semibold uppercase tracking-wider">Recado para a banda</p>
                  <p className="mt-1 whitespace-pre-line">{ev.band_notes}</p>
                </div>
              )}

              {isAdmin && (
                <div className="mt-2 grid gap-2 rounded-2xl border bg-muted/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Só você vê</p>
                  <Row icon={MessageCircle} label="Contratante">
                    {p?.contractor_name || "—"} {p?.contractor_phone && `· ${p.contractor_phone}`}
                  </Row>
                  <Row icon={Wallet} label="Valores">
                    Total {formatMoney(p?.fee)} · Sinal {formatMoney(p?.deposit)}{" "}
                    <strong className={p?.deposit_paid ? "text-status-ok" : "text-status-wait"}>
                      ({p?.deposit_paid ? "pago" : "pendente"})
                    </strong>
                  </Row>
                  {p?.admin_notes && <p className="whitespace-pre-line text-muted-foreground">{p.admin_notes}</p>}
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="mt-2 grid gap-2">
                {ev.status !== "confirmado" && ev.status !== "cancelado" && (
                  <Button variant="gold" size="lg" onClick={handleConfirm} disabled={busy !== null}>
                    {busy === "confirm" ? <LoaderCircle className="animate-spin" /> : <BadgeCheck />}
                    Pagamento recebido — confirmar agenda
                  </Button>
                )}
                {ev.status === "confirmado" && (
                  <>
                    <Button asChild variant="whatsapp" size="lg" disabled={!p?.contractor_phone}>
                      <a
                        href={whatsappLink(p?.contractor_phone, contractorConfirmationMessage(ev, artistName, p?.contractor_name))}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle />
                        Enviar confirmação ao contratante
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <a href={whatsappLink(null, bandMessage(ev))} target="_blank" rel="noreferrer">
                        <Send />
                        Avisar no grupo da banda
                      </a>
                    </Button>
                  </>
                )}
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => onEdit(ev)}>
                    <Pencil />
                    Editar
                  </Button>
                  <Button variant="ghost" className="text-destructive" onClick={handleDelete} disabled={busy !== null}>
                    <Trash2 />
                    Excluir
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-gold" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p>{children}</p>
      </div>
    </div>
  );
}
