import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ExternalLink, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { accessQuery, publicProfileAdminQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/links")({
  head: () => ({
    meta: [
      { title: "Minha página — Jessica Norma" },
      { name: "description", content: "Edite o WhatsApp e as redes da página de link na bio." },
      { property: "og:title", content: "Minha página — Jessica Norma" },
      { property: "og:description", content: "Edite a página de link na bio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ context }) => {
    const access = await context.queryClient.ensureQueryData(accessQuery);
    if (!access.isAdmin) throw redirect({ to: "/agenda" });
    await context.queryClient.ensureQueryData(publicProfileAdminQuery);
  },
  component: LinksPage,
});

const FIELDS = [
  { key: "artist_name", label: "Nome artístico" },
  { key: "tagline", label: "Frase de destaque", placeholder: "Cantora evangélica" },
  { key: "whatsapp", label: "WhatsApp para agendamentos", placeholder: "(11) 98765-4321" },
  { key: "instagram", label: "Link do Instagram", placeholder: "https://instagram.com/..." },
  { key: "youtube", label: "Link do YouTube", placeholder: "https://youtube.com/@..." },
  { key: "spotify", label: "Link das músicas (Spotify, Deezer…)", placeholder: "https://open.spotify.com/..." },
] as const;

function LinksPage() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(publicProfileAdminQuery);
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const update = {
      artist_name: String(f.get("artist_name") ?? "").trim(),
      tagline: String(f.get("tagline") ?? "").trim(),
      whatsapp: String(f.get("whatsapp") ?? "").trim(),
      instagram: String(f.get("instagram") ?? "").trim(),
      youtube: String(f.get("youtube") ?? "").trim(),
      spotify: String(f.get("spotify") ?? "").trim(),
      booking_message: String(f.get("booking_message") ?? "").trim(),
    };
    setBusy(true);
    const { error } = await supabase.from("public_profile").update(update).eq("id", 1);
    setBusy(false);
    if (error) {
      toast.error("Não foi possível salvar", { description: error.message });
      return;
    }
    toast.success("Página atualizada");
    queryClient.invalidateQueries({ queryKey: ["public_profile"] });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Link na bio</p>
          <h1 className="mt-1 text-5xl font-semibold">Minha página</h1>
        </div>
        <Button asChild variant="outline">
          <Link to="/" target="_blank">
            <ExternalLink />
            Ver página
          </Link>
        </Button>
      </div>
      <p className="mt-2 text-muted-foreground">
        É isso que o público vê. Só aparece o botão do WhatsApp e as redes que você preencher — a
        agenda continua privada.
      </p>

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-3xl border bg-card p-6 shadow-soft">
        {FIELDS.map((field) => (
          <div key={field.key} className="grid gap-1.5">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              name={field.key}
              defaultValue={data[field.key] ?? ""}
              placeholder={"placeholder" in field ? field.placeholder : undefined}
            />
          </div>
        ))}
        <div className="grid gap-1.5">
          <Label htmlFor="booking_message">Mensagem que já vem escrita no WhatsApp</Label>
          <Textarea id="booking_message" name="booking_message" rows={3} defaultValue={data.booking_message} />
        </div>
        <Button type="submit" disabled={busy} className="justify-self-start">
          {busy && <LoaderCircle className="animate-spin" />}
          Salvar
        </Button>
      </form>
    </main>
  );
}
