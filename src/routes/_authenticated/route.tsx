import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, Link as LinkIcon, LogOut, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { accessQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(accessQuery),
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { data: access } = useSuspenseQuery(accessQuery);
  const hasAccess = access.isAdmin || access.isBand;

  const nav = [
    { to: "/agenda", label: "Agenda", icon: CalendarDays, show: hasAccess },
    { to: "/equipe", label: "Equipe", icon: Users, show: access.isAdmin },
    { to: "/links", label: "Minha página", icon: LinkIcon, show: access.isAdmin },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link to="/agenda" className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold text-primary">Jessica Norma</span>
            <span className="hidden text-xs uppercase tracking-[0.25em] text-muted-foreground sm:inline">
              agenda
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            {nav
              .filter((n) => n.show)
              .map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "bg-accent text-accent-foreground" }}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              ))}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sair"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut />
            </Button>
          </nav>
        </div>
      </header>

      {hasAccess ? (
        <Outlet />
      ) : (
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Clock className="size-6" />
          </div>
          <h1 className="text-4xl font-semibold">Aguardando liberação</h1>
          <p className="mt-3 text-muted-foreground">
            Olá, {access.displayName}! Sua conta foi criada. Assim que a Jessica liberar seu acesso,
            a agenda da banda aparece aqui.
          </p>
        </div>
      )}
    </div>
  );
}
