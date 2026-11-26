import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, MicVocal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Agenda Jessica Norma" },
      { name: "description", content: "Acesso da cantora e da banda à agenda de eventos." },
      { property: "og:title", content: "Entrar — Agenda Jessica Norma" },
      { property: "og:description", content: "Acesso da cantora e da banda à agenda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function GoogleLogo() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/agenda" });
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/agenda" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setBusy(false);
    if (error) toast.error("E-mail ou senha incorretos.");
  }

  async function signUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: String(f.get("email")),
      password: String(f.get("password")),
      options: {
        emailRedirectTo: window.location.origin + "/agenda",
        data: { display_name: String(f.get("name")) },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) setCheckEmail(true);
  }

  async function social(provider: "google") {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) toast.error("Não foi possível entrar. Tente novamente.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-gold-gradient text-gold-foreground shadow-glow">
            <MicVocal className="size-5" />
          </div>
          <h1 className="text-4xl font-semibold">Agenda da equipe</h1>
          <p className="mt-2 text-sm text-muted-foreground">Jessica Norma & banda</p>
        </div>

        {checkEmail ? (
          <div className="rounded-2xl border bg-card p-6 text-center shadow-soft">
            <h2 className="text-2xl font-semibold">Confira seu e-mail</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enviamos um link de confirmação. Depois de confirmar, volte aqui para entrar.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <div className="flex flex-col gap-2">
              <Button type="button" variant="google" className="w-full" onClick={() => social("google")}>
                <GoogleLogo />
                Continuar com Google
              </Button>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              ou com e-mail
              <div className="h-px flex-1 bg-border" />
            </div>

            <Tabs defaultValue="entrar">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entrar">Entrar</TabsTrigger>
                <TabsTrigger value="criar">Criar conta</TabsTrigger>
              </TabsList>
              <TabsContent value="entrar">
                <form onSubmit={signIn} className="mt-4 flex flex-col gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="in-email">E-mail</Label>
                    <Input id="in-email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="in-pass">Senha</Label>
                    <Input id="in-pass" name="password" type="password" required autoComplete="current-password" />
                  </div>
                  <Button type="submit" disabled={busy} className="mt-1">
                    {busy && <LoaderCircle className="animate-spin" />}
                    Entrar
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="criar">
                <form onSubmit={signUp} className="mt-4 flex flex-col gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="up-name">Seu nome</Label>
                    <Input id="up-name" name="name" required />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="up-email">E-mail</Label>
                    <Input id="up-email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="up-pass">Senha</Label>
                    <Input id="up-pass" name="password" type="password" minLength={6} required autoComplete="new-password" />
                  </div>
                  <Button type="submit" disabled={busy} className="mt-1">
                    {busy && <LoaderCircle className="animate-spin" />}
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </main>
  );
}
