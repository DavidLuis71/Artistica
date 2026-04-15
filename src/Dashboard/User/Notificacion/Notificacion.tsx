import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import "./Notificacion.css";

interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  estado: string;
}

export default function UserNotificationsSlider({
  userId,
  section,
}: {
  userId: string;
  section: string;
}) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchNotificaciones = async () => {
      if (!userId) return;

      // 1️⃣ Traer IDs de notificaciones ya vistas
      const { data: vistasData, error: vistasError } = await supabase
        .from("vistas_notificaciones")
        .select("notificacion_id")
        .eq("usuario_id", userId);

      if (vistasError) {
        console.error("Error trayendo vistas:", vistasError);
        return;
      }

      const vistasIds = vistasData?.map((v) => v.notificacion_id) || [];

      // 2️⃣ Traer notificaciones activas que NO estén en vistasIds
      let query = supabase
        .from("notificaciones")
        .select("*")
        .eq("estado", "activa");
      if (vistasIds.length > 0) {
        query = query.not("id", "in", `(${vistasIds.join(",")})`);
      }

      const { data, error } = await query.order("fecha_creacion", {
        ascending: true,
      });

      if (error) {
        console.error("Error cargando notificaciones:", error);
      } else if (data && data.length > 0) {
        setNotificaciones(data);
        setCurrentIndex(0);
      }
    };

    fetchNotificaciones();
  }, [userId, section]);

  const cerrarNotificaciones = async () => {
    if (!userId || notificaciones.length === 0) {
      setNotificaciones([]);
      return;
    }

    // Marcar como vistas
    const insertData = notificaciones.map((n) => ({
      usuario_id: userId,
      notificacion_id: n.id,
      fecha_vista: new Date(),
    }));

    const { error } = await supabase
      .from("vistas_notificaciones")
      .insert(insertData);
    if (error)
      console.error("Error marcando notificaciones como vistas:", error);

    setNotificaciones([]);
  };

  const siguiente = () =>
    setCurrentIndex((prev) => Math.min(prev + 1, notificaciones.length - 1));
  const anterior = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));

  if (notificaciones.length === 0) return null;
  const notif = notificaciones[currentIndex];

  return (
    <div className="notifSlider-topbar">
      <div className="notifSlider-content">
        <img src="/logo.png" alt="Logo" className="notifSlider-logo" />
        <div className="notifSlider-text">
          <h3 className="notifSlider-title">{notif.titulo}</h3>
          <p className="notifSlider-message">{notif.mensaje}</p>

          <div className="notifSlider-controls">
            <button
              className="notifSlider-nav"
              onClick={anterior}
              disabled={currentIndex === 0}
            >
              ◀ Anterior
            </button>
            <button
              className="notifSlider-nav"
              onClick={siguiente}
              disabled={currentIndex === notificaciones.length - 1}
            >
              Siguiente ▶
            </button>

            {currentIndex === notificaciones.length - 1 && (
              <button
                className="notifSlider-button"
                onClick={cerrarNotificaciones}
              >
                Aceptar
              </button>
            )}
          </div>

          <p className="notifSlider-counter">
            {currentIndex + 1} / {notificaciones.length}
          </p>
        </div>
      </div>
    </div>
  );
}
