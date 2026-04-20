// PushPrompt.tsx

import { supabase } from "./lib/supabaseClient";


function getDeviceId() {
  let id = localStorage.getItem("device_id");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }

  return id;
}
// Helper para convertir la VAPID key de Base64 a Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushPrompt() {
  const subscribePush = async () => {
    try {
      if (!("serviceWorker" in navigator)) {
        console.error("Service Worker no soportado");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        console.error("Usuario no autenticado");
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      const vapidPublicKey =
        "BPJRwqT3HrGjkMR33gNtDhwu2syRz_3_Zk0lF0fnCMCTgleTbXipHsdvfE5i08zFN1jhxsWEeu4pl0bAW17WlnE";

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log("Push subscription creada:", subscription);

      // 💾 Guardar en Supabase
     const device_id = getDeviceId();

const { error } = await supabase.from("push_subscriptions").upsert(
  [
    {
      user_id: user.id,
      device_id,
      subscription: subscription.toJSON(),
    },
  ],
  {
    onConflict: "user_id,device_id",
  }
);

      if (error) {
        console.error("Error guardando subscription:", error);
      } else {
        console.log("Subscription guardada en Supabase ✅");
      }

      return subscription;
    } catch (err) {
      console.error("Error en push:", err);
    }
  };

  const requestPushPermission = async () => {
    try {
      const permission = await Notification.requestPermission();

      console.log("Permiso de notificación:", permission);

      if (permission !== "granted") {
        console.log("Permiso denegado");
        return;
      }

      console.log("Permiso concedido, creando subscription...");
      await subscribePush();
    } catch (err) {
      console.error("Error pidiendo permiso:", err);
    }
  };

  return (
    <button onClick={requestPushPermission}>
      Activar notificaciones 🔔
    </button>
  );
}