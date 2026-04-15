// import { supabase } from "./lib/supabaseClient";
// function urlBase64ToUint8Array(base64String: string) {
//   const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
//   const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
//   const rawData = atob(base64);
//   return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
// }

// export async function subscribeUserToPush(
//   userId: string,
//   vapidPublicKey: string
// ) {
//   if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
//     throw new Error("Push no soportado en este navegador");
//   }

//   // 1️⃣ Espera a que el Service Worker esté listo
//   const registration = await navigator.serviceWorker.ready;

//   // 2️⃣ Pide permiso al usuario
//   const permission = await Notification.requestPermission();
//   if (permission !== "granted") {
//     throw new Error("Permiso de notificaciones denegado");
//   }

//   // 3️⃣ Suscribirse al push
//   const subscription = await registration.pushManager.subscribe({
//     userVisibleOnly: true,
//     applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
//   });

//   // 4️⃣ Guardar la suscripción en Supabase
//   const { data, error } = await supabase
//     .from("push_subscriptions")
//     .insert([{ user_id: userId, subscription: subscription.toJSON() }]);

//   if (error) throw error;

//   return data;
// }
