self.addEventListener("install", (event) => {
  console.log("Service Worker instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activado");
  return self.clients.claim();
});

// 🔥 Este es el importante para push
self.addEventListener("push", function (event) {
  console.log("Push recibido:", event);

  const data = event.data ? event.data.json() : {};

  const title = data.title || "Nueva notificación";
  const options = {
    body: data.body || "",
    icon: "/logo.png", // asegúrate que exista
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
