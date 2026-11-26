import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Copy, Crown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { accessQuery, teamQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Equipe — Agenda Jessica Norma" },
      { name: "description", content: "Libere o acesso dos integrantes da banda à agenda." },
      { property: "og:title", content: "Equipe — Agenda Jessica Norma" },
      { property: "og:description", content: "Gerencie quem da banda vê a agenda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ context }) => {
    const access = await context.queryClient.ensureQueryData(accessQuery);
    if (!access.isAdmin) throw redirect({ to: "/agenda" });
    await context.queryClient.ensureQueryData(teamQuery);
  },
  component: TeamPage,
});

function TeamPage() {
  const queryClient = useQueryClient();
  const { data: team } = useSuspenseQuery(teamQuery);

  async function toggleBand(userId: string, on: boolean) {
    const { error } = on
      ? await supabase.from("user_roles").insert({ user_id: userId, role: "banda" })
      : await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "banda");
    if (error) {
      toast.error("Não foi possível alterar", { description: error.message });
      return;
    }
    toast.success(on ? "Acesso liberado" : "Acesso removido");
    queryClient.invalidateQueries({ queryKey: ["team"] });
  }

  const inviteLink = typeof window !== "undefined" ? `${window.location.origin}/auth` : "/auth";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Equipe</p>
      <h1 className="mt-1 text-5xl font-semibold">Quem vê a agenda</h1>
      <p className="mt-2 text-muted-foreground">
        Envie o link abaixo para cada integrante da banda criar a conta. Depois, libere o acesso
        aqui. A banda vê só as agendas confirmadas — sem valores nem contato do contratante.
      </p>

      <div className="mt-5 flex items-center gap-2 rounded-2xl border bg-card p-2 pl-4 shadow-soft">
        <span className="truncate text-sm text-muted-foreground">{inviteLink}</span>
        <Button
          variant="secondary"
          size="sm"
          className="ml-auto"
          onClick={() => {
            navigator.clipboard.writeText(inviteLink);
            toast.success("Link copiado");
          }}
        >
          <Copy />
          Copiar
        </Button>
      </div>

      <div className="mt-8 divide-y overflow-hidden rounded-3xl border bg-card shadow-soft">
        {team.map((m) => (
          <div key={m.id} className="flex items-center gap-4 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent font-display text-lg font-semibold text-accent-foreground">
              {(m.display_name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{m.display_name || "Sem nome"}</p>
              <p className="text-xs text-muted-foreground">
                {m.isAdmin ? "Administradora" : m.isBand ? "Banda — com acesso" : "Aguardando liberação"}
              </p>
            </div>
            {m.isAdmin ? (
              <Crown className="size-5 text-gold" />
            ) : (
              <label className="flex items-center gap-2 text-sm">
                <span className="hidden sm:inline">Acesso à agenda</span>
                <Switch checked={m.isBand} onCheckedChange={(v) => toggleBand(m.id, v)} />
              </label>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
