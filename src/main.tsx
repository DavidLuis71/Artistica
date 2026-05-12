import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  immediate: true,

  onNeedRefresh() {
    // hay nueva versión disponible
    updateSW(true); // activa nueva versión
     window.location.reload();
  },

  onOfflineReady() {
    console.log("App lista offline");
  },
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
