import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./ComentariosUser.css";

interface Comentario {
  id: number;
  mensaje: string;
  fecha: string;
  leido: boolean;
  remitente: "entrenador" | "nadadora";
  entrenador?: { nombre: string; id: string };
  nadadora?: { nombre: string };
}

interface ComentariosUserProps {
  nadadoraId: number;
}

export default function ComentariosUser({ nadadoraId }: ComentariosUserProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [comentarioActivo, setComentarioActivo] = useState<Comentario | null>(
    null
  );
  const [mensajeNuevo, setMensajeNuevo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [entrenadores, setEntrenadores] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [entrenadorSeleccionado, setEntrenadorSeleccionado] =
    useState<string>("");
  const comentariosEndRef = useRef<HTMLDivElement | null>(null);

  // Cargar entrenadores al montar el componente
  useEffect(() => {
    const cargarEntrenadores = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, nombre")
        .eq("rol_id", 1); // suponiendo que rol_id=2 es entrenador
      if (!error && data) setEntrenadores(data);
    };
    cargarEntrenadores();
  }, []);

  useEffect(() => {
    cargarComentarios();
  }, [nadadoraId]);

  const cargarComentarios = async () => {
    const { data, error } = await supabase
      .from("comentarios_nadadoras")
      .select(
        `
        id,
        mensaje,
        fecha,
        leido,
        users:entrenador_id ( nombre,id ),
        remitente
      `
      )
      .eq("nadadora_id", nadadoraId)
      .order("fecha", { ascending: true });

    if (!error && data) {
      const mapped = data.map((c: any) => ({
        id: c.id,
        mensaje: c.mensaje,
        fecha: c.fecha,
        leido: c.leido,
        remitente: c.remitente, // 🔹 añadir esto
        entrenador: c.users
          ? { id: c.users.id.toString(), nombre: c.users.nombre }
          : undefined,
      }));

      setComentarios(mapped);
    }
  };

  const abrirComentario = async (comentario: Comentario) => {
    setComentarioActivo(comentario);
    setModalAbierto(true);

    // Si ya estaba leído → no actualizar
    if (!comentario.leido && comentario.remitente === "entrenador") {
      // Actualizar en BD
      await supabase
        .from("comentarios_nadadoras")
        .update({ leido: true })
        .eq("id", comentario.id);

      // Actualizar visualmente
      setComentarios((prev) =>
        prev.map((c) => (c.id === comentario.id ? { ...c, leido: true } : c))
      );
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setComentarioActivo(null);
  };

  const enviarComentario = async () => {
    if (mensajeNuevo.trim() === "") return;

    setEnviando(true);
    setConfirmacion("");

    // Obtener usuario actual (nadadora)
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    // Insertar en BD
    const { error } = await supabase.from("comentarios_nadadoras").insert({
      mensaje: mensajeNuevo,
      nadadora_id: nadadoraId,
      entrenador_id: entrenadorSeleccionado,
      remitente: "nadadora",
      fecha: new Date().toISOString(),
      leido: false,
    });

    setEnviando(false);

    if (error) {
      setConfirmacion("❌ Error al enviar el comentario");
    } else {
      setConfirmacion("✅ Comentario enviado correctamente");
      setMensajeNuevo("");
      cargarComentarios(); // refrescar lista
    }
  };
  const comentariosFiltrados = comentarios.filter((c) => {
    if (!entrenadorSeleccionado) return false;

    const entrenadorId = c.entrenador?.id?.toString();

    if (c.remitente === "nadadora" && entrenadorId === entrenadorSeleccionado)
      return true;

    if (c.remitente === "entrenador" && entrenadorId === entrenadorSeleccionado)
      return true;

    return false;
  });

  // ✅ Scroll automático al final
  useEffect(() => {
    if (comentariosEndRef.current) {
      comentariosEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [comentariosFiltrados]);

  return (
    <div className="ComentariosUser-container">
      <div className="ComentariosUser-lista">
        {comentariosFiltrados.length === 0 && (
          <p className="ComentariosUser-vacio">No hay comentarios aún.</p>
        )}

        {comentariosFiltrados.map((c) => (
          <div
            key={c.id}
            className={`ComentarioCard ${c.leido ? "leido" : "nuevo"} ${
              c.remitente === "nadadora" ? "desde-nadadora" : "desde-entrenador"
            }`}
            onClick={() => abrirComentario(c)}
          >
            <div className="ComentarioCard-header">
              {/* Puntito para los mensajes no leídos del entrenador */}
              {!c.leido && c.remitente === "entrenador" && (
                <span className="ComentarioCard-punto" />
              )}

              <span className="ComentarioCard-fecha">
                {new Date(c.fecha).toLocaleString()}
              </span>
            </div>
            <p className="ComentarioCard-mensaje">{c.mensaje}</p>
            {/* Check para mensajes de la nadadora */}
            {c.remitente === "nadadora" && (
              <span
                className={`ComentarioCard-check ${
                  c.leido ? "leido" : "no-leido"
                }`}
              >
                {c.leido ? "✔✔" : "✔"}
              </span>
            )}
            <p className="ComentarioCard-autor">
              —{" "}
              {c.remitente === "entrenador"
                ? c.entrenador?.nombre || "Entrenador"
                : "Tú"}
            </p>
          </div>
        ))}
        <div ref={comentariosEndRef} />
      </div>
      <div className="ComentariosUser-enviar">
        <label>Selecciona entrenador:</label>
        <select
          value={entrenadorSeleccionado}
          onChange={(e) => setEntrenadorSeleccionado(e.target.value)}
        >
          <option value="">-- Elige un entrenador --</option>
          {entrenadores.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
        <textarea
          value={mensajeNuevo}
          onChange={(e) => setMensajeNuevo(e.target.value)}
          placeholder="Escribe tu comentario..."
        />
        <button
          onClick={enviarComentario}
          disabled={enviando || mensajeNuevo.trim() === ""}
        >
          {enviando ? "Enviando..." : "Enviar"}
        </button>
        {confirmacion && (
          <p className="ComentariosUser-confirm">{confirmacion}</p>
        )}
      </div>

      {/* ✅ Modal */}
      {modalAbierto && comentarioActivo && (
        <div className="ComentarioModal-overlay" onClick={cerrarModal}>
          <div className="ComentarioModal" onClick={(e) => e.stopPropagation()}>
            <p className="ComentarioModal-fecha">
              {new Date(comentarioActivo.fecha).toLocaleString()}
            </p>
            <p className="ComentarioModal-mensaje">
              {comentarioActivo.mensaje}
            </p>
            <p className="ComentarioModal-autor">
              —{" "}
              {comentarioActivo.remitente === "entrenador"
                ? comentarioActivo.entrenador?.nombre || "Entrenador"
                : "Tú"}
            </p>

            <button className="ComentarioModal-btn" onClick={cerrarModal}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
