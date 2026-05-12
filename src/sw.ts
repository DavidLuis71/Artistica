/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: any;
};

const sw = self;

// 🔥 obligatorio injectManifest
precacheAndRoute(self.__WB_MANIFEST);

// lifecycle
sw.addEventListener("install", () => {
  sw.skipWaiting();
});

sw.addEventListener("activate", () => {
  sw.clients.claim();
});

// sw.addEventListener("activate", (event) => {
//   event.waitUntil(
//     (async () => {
//       await sw.clients.claim();
//     })()
//   );
// });

sw.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    sw.skipWaiting();
  }
});

// PUSH
sw.addEventListener("push", (event: any) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || "NatArt";

  const options = {
    body: data.body || "",
    icon: "/logo192.png",
     data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(
    sw.registration.showNotification(title, options)
  );
});

sw.addEventListener("notificationclick", (event: any) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    sw.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Si ya hay una pestaña abierta
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      // Si no hay, abrir nueva
      return sw.clients.openWindow(url);
    })
  );
});