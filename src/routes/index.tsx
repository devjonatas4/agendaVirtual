import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Instagram, Lock, MessageCircle, Music, Youtube } from "lucide-react";

import agendajs from "@/assets/agenda-js.jpeg";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/booking";
import { getPublicProfile } from "@/lib/public-profile.functions";

const publicProfileQuery = queryOptions({
  queryKey: ["public_profile", "public"],
  queryFn: () => getPublicProfile(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jessica Norma — Cantora evangélica | Agendamentos" },
      {
        name: "description",
        content: "Leve o louvor de Jessica Norma à sua igreja. Fale direto no WhatsApp para agendar.",
      },
      { property: "og:title", content: "Jessica Norma — Cantora evangélica" },
      {
        property: "og:description",
        content: "Leve o louvor de Jessica Norma à sua igreja. Agende pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicProfileQuery),
  component: LinkPage,
});

function LinkPage() {
  const { data: profile } = useSuspenseQuery(publicProfileQuery);
  const name = profile?.artist_name || "Jessica Norma";
  const tagline = profile?.tagline || "Cantora evangélica";
  const message = profile?.booking_message || `Olá, ${name}! Gostaria de agendar uma data.`;

  const socials = [
    { href: profile?.instagram, label: "Instagram", icon: Instagram },
    { href: profile?.youtube, label: "YouTube", icon: Youtube },
    { href: profile?.spotify, label: "Ouvir as músicas", icon: Music },
  ].filter((s) => s.href);

  return (
    <main className="relative min-h-screen overflow-hidden bg-night text-night-foreground">
      <img
        src={agendajs}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center opacity-90"
      />
      <div className="absolute inset-0 bg-stage" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center px-6 pb-10 pt-[38vh] text-center">
        <p className="animate-rise text-xs font-semibold uppercase tracking-[0.35em] text-gold">
          {tagline}
        </p>
        <h1
          className="animate-rise mt-3 text-6xl font-semibold leading-none"
          style={{ animationDelay: "80ms" }}
        >
          {name}
        </h1>
        <div
          className="animate-rise mx-auto mt-5 h-px w-24 bg-gold-gradient"
          style={{ animationDelay: "140ms" }}
        />
        <p
          className="animate-rise mt-5 max-w-xs text-sm leading-relaxed text-night-foreground/80"
          style={{ animationDelay: "200ms" }}
        >
          Para agendar conosco entre em contato e nos acompanhe em nossas plataformas digitais
        </p>

        <div
          className="animate-rise mt-8 flex w-full flex-col gap-3"
          style={{ animationDelay: "280ms" }}
        >
          {profile?.whatsapp ? (
            <Button asChild variant="whatsapp" size="xl" className="w-full">
              <a href={whatsappLink(profile.whatsapp, message)} target="_blank" rel="noreferrer">
                <MessageCircle />
                Agendar pelo WhatsApp
              </a>
            </Button>
          ) : (
            <Button variant="whatsapp" size="xl" className="w-full" disabled>
              <MessageCircle />
              WhatsApp em breve
            </Button>
          )}

          {socials.map(({ href, label, icon: Icon }) => (
            <Button key={label} asChild variant="stage" size="xl" className="w-full">
              <a href={href} target="_blank" rel="noreferrer">
                <Icon />
                {label}
              </a>
            </Button>
          ))}
        </div>

        <div className="mt-auto pt-12">
          <Link
            to="/agenda"
            className="inline-flex items-center gap-1.5 text-xs text-night-foreground/50 transition-colors hover:text-gold"
          >
            <Lock className="size-3" />
            Área da equipe
          </Link>
        </div>
      </div>
    </main>
  );
}
