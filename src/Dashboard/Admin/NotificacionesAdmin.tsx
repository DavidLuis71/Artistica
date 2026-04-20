import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./NotificacionesAdmin.css";

export default function NotificacionesAdmin() {
  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificaciones = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notificaciones")
      .select("*")
      .order("fecha_creacion", { ascending: false });
    if (error) {
      console.error("Error cargando notificaciones:", error);
    } else {
      setNotificaciones(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotificaciones();
  }, []);

const handleSend = async () => {
  if (!titulo.trim() || !mensaje.trim()) return;

  setSending(true);
  setSuccess(false);

  // 1. Guardar en Supabase
  const { error } = await supabase
    .from("notificaciones")
    .insert([{ mensaje, estado: "activa", titulo }]);

  if (error) {
    console.error(error);
    alert("Error creando la notificación");
    setSending(false);
    return;
  }

  try {
    // 2. Disparar push al backend ( render)
    await fetch("https://push-server-u52s.onrender.com/send-all", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: titulo,
        body: mensaje,
         url: "/",
      }),
    });

    setSuccess(true);
    setTitulo("");
    setMensaje("");
    fetchNotificaciones();

  } catch (err) {
    console.error("Error enviando push:", err);
  }

  setSending(false);
};

  const toggleEstado = async (id: number, currentEstado: string) => {
    const nuevoEstado = currentEstado === "activa" ? "inactiva" : "activa";
    const { error } = await supabase
      .from("notificaciones")
      .update({ estado: nuevoEstado })
      .eq("id", id);

    if (error) {
      console.error("Error actualizando estado:", error);
    } else {
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, estado: nuevoEstado } : n))
      );
    }
  };

  const borrarNotificacion = async (id: number) => {
    const { error } = await supabase
      .from("notificaciones")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error borrando notificación:", error);
    } else {
      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    }
  };

  return (
    <div className="notificacionesAdmin-container">
      <h2 className="notificacionesAdmin-title">Crear Notificación</h2>
      <input
        className="notificacionesAdmin-input"
        placeholder="Título de la notificación"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
      />
      <textarea
        className="notificacionesAdmin-textarea"
        placeholder="Mensaje de la notificación"
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
      />

      <button
        className="notificacionesAdmin-button"
        onClick={handleSend}
        disabled={sending}
      >
        {sending ? "Enviando..." : "Crear"}
      </button>
      {success && (
        <p className="notificacionesAdmin-success">
          ✅ Notificación creada correctamente
        </p>
      )}

      <hr className="notificacionesAdmin-divider" />

      <h2 className="notificacionesAdmin-title">Notificaciones Existentes</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : notificaciones.length === 0 ? (
        <p>No hay notificaciones.</p>
      ) : (
        <div className="notificacionesAdmin-cards">
          {notificaciones.map((n) => (
            <div
              key={n.id}
              className={`notificacionesAdmin-card ${
                n.estado === "activa"
                  ? "notificacionesAdmin-activa"
                  : "notificacionesAdmin-inactiva"
              }`}
            >
              <h3 className="notificacionesAdmin-cardTitle">{n.titulo}</h3>
              <p className="notificacionesAdmin-cardMessage">{n.mensaje}</p>
              <p className="notificacionesAdmin-cardEstado">
                Estado: <strong>{n.estado}</strong>
              </p>
              <div className="notificacionesAdmin-cardActions">
                <button
                  className="notificacionesAdmin-actionButton"
                  onClick={() => toggleEstado(n.id, n.estado)}
                >
                  {n.estado === "activa" ? "Desactivar" : "Activar"}
                </button>
                <button
                  className="notificacionesAdmin-deleteButton"
                  onClick={() => borrarNotificacion(n.id)}
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
