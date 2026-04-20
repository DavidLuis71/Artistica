import { supabase } from "./lib/supabaseClient";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

export async function enablePush(userId: string) {
  if (!("serviceWorker" in navigator)) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.ready;

  const vapidPublicKey =
    "BPJRwqT3HrGjkMR33gNtDhwu2syRz_3_Zk0lF0fnCMCTgleTbXipHsdvfE5i08zFN1jhxsWEeu4pl0bAW17WlnE";

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
const deviceId = localStorage.getItem("device_id");
  await supabase.from("push_subscriptions").insert([
    {
      user_id: userId,
      device_id: deviceId,
      subscription: subscription.toJSON(),
    },
  ]);

  await supabase
    .from("config_usuarios")
    .update({ push_prompt_aceptado: true })
    .eq("user_id", userId);

  return true;
}