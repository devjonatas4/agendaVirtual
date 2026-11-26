import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { findDateConflicts, STATUS_LABEL, STATUS_ORDER, type EventStatus } from "@/lib/booking";
import { saveEvent, type EventFormValues } from "@/lib/agenda-actions";
import type { AgendaEvent } from "@/lib/queries";

function toValues(ev: AgendaEvent | null, date: string | null): EventFormValues {
  const p = ev?.private;
  return {
    title: ev?.title ?? "",
    event_date: ev?.event_date ?? date ?? "",
    start_time: ev?.start_time?.slice(0, 5) ?? "",
    soundcheck_time: ev?.soundcheck_time?.slice(0, 5) ?? "",
    congregation: ev?.congregation ?? "",
    address: ev?.address ?? "",
    city: ev?.city ?? "",
    status: ev?.status ?? "pre_reserva",
    band_notes: ev?.band_notes ?? "",
    contractor_name: p?.contractor_name ?? "",
    contractor_phone: p?.contractor_phone ?? "",
    fee: p?.fee != null ? String(p.fee).replace(".", ",") : "",
    deposit: p?.deposit != null ? String(p.deposit).replace(".", ",") : "",
    deposit_paid: p?.deposit_paid ?? false,
    admin_notes: p?.admin_notes ?? "",
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: AgendaEvent | null;
  defaultDate: string | null;
  allEvents: AgendaEvent[];
  onSaved: (id: string) => void;
}

export function EventFormDialog({ open, onOpenChange, event, defaultDate, allEvents, onSaved }: Props) {
  const [values, setValues] = useState<EventFormValues>(() => toValues(event, defaultDate));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setValues(toValues(event, defaultDate));
  }, [open, event, defaultDate]);

  const set = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const conflicts = values.event_date
    ? findDateConflicts(allEvents, values.event_date, event?.id)
    : [];

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const id = await saveEvent(values, event?.id);
      toast.success(event ? "Agenda atualizada" : "Agenda criada");
      onSaved(id);
    } catch (err) {
      toast.error("Não foi possível salvar", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">
            {event ? "Editar agenda" : "Nova agenda"}
          </DialogTitle>
          <DialogDescription>
            Dados de contato e valores ficam visíveis só para você. A banda vê a agenda quando ela
            estiver confirmada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-6">
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              Evento
            </legend>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="title">Nome do evento</Label>
              <Input id="title" placeholder="Ex.: Culto de Missões" value={values.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" required value={values.event_date} onChange={(e) => set("event_date", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="sound">Passagem de som</Label>
                <Input id="sound" type="time" value={values.soundcheck_time} onChange={(e) => set("soundcheck_time", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="start">Início</Label>
                <Input id="start" type="time" value={values.start_time} onChange={(e) => set("start_time", e.target.value)} />
              </div>
            </div>
            {conflicts.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-status-wait/40 bg-status-wait/10 p-3 text-sm sm:col-span-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-wait" />
                <span>
                  Já existe agenda nesse dia:{" "}
                  <strong>{conflicts.map((c) => c.congregation || c.title || "evento").join(", ")}</strong>
                </span>
              </div>
            )}
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="cong">Congregação / Igreja</Label>
              <Input id="cong" required placeholder="Ex.: AD Ministério Belém — Sede" value={values.congregation} onChange={(e) => set("congregation", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="addr">Endereço</Label>
              <Input id="addr" placeholder="Rua, número, bairro" value={values.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" placeholder="Cidade — UF" value={values.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="notes">Recado para a banda</Label>
              <Textarea id="notes" rows={2} placeholder="Repertório, figurino, horário de saída…" value={values.band_notes} onChange={(e) => set("band_notes", e.target.value)} />
            </div>
          </fieldset>

          <fieldset className="grid gap-4 rounded-2xl border bg-muted/40 p-4 sm:grid-cols-2">
            <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-primary">
              Contratante e pagamento · só você vê
            </legend>
            <div className="grid gap-1.5">
              <Label htmlFor="cname">Nome do contratante</Label>
              <Input id="cname" placeholder="Ex.: Pastor João" value={values.contractor_name} onChange={(e) => set("contractor_name", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cphone">WhatsApp do contratante</Label>
              <Input id="cphone" type="tel" placeholder="(11) 98765-4321" value={values.contractor_phone} onChange={(e) => set("contractor_phone", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fee">Valor total (R$)</Label>
              <Input id="fee" inputMode="decimal" placeholder="0,00" value={values.fee} onChange={(e) => set("fee", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dep">Sinal (R$)</Label>
              <Input id="dep" inputMode="decimal" placeholder="0,00" value={values.deposit} onChange={(e) => set("deposit", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Situação</Label>
              <Select value={values.status} onValueChange={(v) => set("status", v as EventStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-3 self-end rounded-xl border bg-card px-3 py-2 text-sm">
              <Switch checked={values.deposit_paid} onCheckedChange={(v) => set("deposit_paid", v)} />
              Sinal pago
            </label>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="anotes">Anotações internas</Label>
              <Textarea id="anotes" rows={2} value={values.admin_notes} onChange={(e) => set("admin_notes", e.target.value)} />
            </div>
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <LoaderCircle className="animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
