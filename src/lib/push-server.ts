import * as webpush from "web-push";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

let configured = false;

function ensureVapid() {
  if (configured) return;
  const publicKey = process.env["VITE_VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"] || "mailto:admin@agendajn.com";

  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
}

interface PushSubRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function handlePushNotifyRequest(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  ensureVapid();
  if (!configured) {
    return new Response(JSON.stringify({ ok: false, reason: "VAPID not configured" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { title, body, url = "/agenda" } = (await request.json()) as {
    title: string;
    body: string;
    url?: string;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as any;
  const { data: subs, error } = (await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")) as { data: PushSubRow[] | null; error: unknown };

  if (error || !subs?.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = JSON.stringify({ title, body, url });
  let sent = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }),
  );

  return new Response(JSON.stringify({ ok: true, sent }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}