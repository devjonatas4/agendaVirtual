import { supabase } from "@/integrations/supabase/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function subscribeDeviceToPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error(
      "Este navegador não suporta notificações push. No iPhone, instale o app na Tela de Início primeiro.",
    );
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;
  const vapidPublicKey = import.meta.env["VITE_VAPID_PUBLIC_KEY"] as string | undefined;
  if (!vapidPublicKey) throw new Error("Chave VAPID pública não configurada.");

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const json = subscription.toJSON();
  const p256dh = json.keys?.["p256dh"];
  const auth = json.keys?.["auth"];

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user || !json.endpoint || !p256dh || !auth) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db.from("push_subscriptions").upsert(
    {
      user_id: userData.user.id,
      endpoint: json.endpoint,
      p256dh,
      auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) throw new Error(error.message);
  return true;
}

export async function triggerBandPush(title: string, body: string) {
  await fetch("/api/push-notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body, url: "/agenda" }),
  }).catch((err) => console.error("Falha ao disparar push:", err));
}