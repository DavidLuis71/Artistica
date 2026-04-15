import { useEffect, useRef } from "react";
import { registerSW } from "virtual:pwa-register";

export default function PWAUpdater() {
  const updateSWRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    updateSWRef.current = registerSW({
      onNeedRefresh() {
        // Fuerza la actualización automáticamente
        updateSWRef.current?.();
        console.log("Nueva versión disponible: actualizando PWA...");
      },
    });
  }, []);

  return null; // no renderiza nada en la UI
}
