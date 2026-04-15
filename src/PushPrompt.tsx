// PushPrompt.tsx

// Helper para convertir la VAPID key de Base64 a Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushPrompt() {
  const subscribePush = async () => {
    if (!("serviceWorker" in navigator)) return;

    const registration = await navigator.serviceWorker.ready;

    const vapidPublicKey = "TU_VAPID_PUBLIC_KEY_BASE64"; // Pon tu clave de Supabase
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    console.log("Push subscription:", subscription);
    return subscription;
  };

  const requestPushPermission = async () => {
    if (Notification.permission === "granted") {
      console.log("Notificaciones ya activadas");
      return;
    }

    const permission = await Notification.requestPermission();
    console.log("Permiso de notificación:", permission);

    if (permission !== "granted") return;

    console.log("Usuario aceptó recibir notificaciones");
    await subscribePush(); // <-- ahora sí se encuentra
  };

  return (
    <button onClick={requestPushPermission}>Activar notificaciones 🔔</button>
  );
}
