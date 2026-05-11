import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./ComentariosAdmin.css";
import AutocompleteSimple from "../../utils/AutocompleteSimple";

interface Nadadora {
  id: number;
  nombre: string;
  apellido: string;
}

interface Comentario {
  id: number;
  mensaje: string;
  fecha: string;
  leido: boolean;
  remitente: "entrenador" | "nadadora";
  nadadora_id: number;
  entrenador_id?: string;
}
export default function ComentariosAdmin() {
  const [nadadoras, setNadadoras] = useState<Nadadora[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  console.log("🚀 ~ ComentariosAdmin ~ confirmacion:", confirmacion)
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [comentariosGlobales, setComentariosGlobales] = useState<Comentario[]>(
    [],
  ); // para los círculos
  const [entrenadorId, setEntrenadorId] = useState<string | null>(null);

  useEffect(() => {
    cargarNadadoras();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) setEntrenadorId(auth.user.id);
    };
    fetchUser();
  }, []);
  useEffect(() => {
    const cargarTodosComentarios = async () => {
      const { data, error } = await supabase
        .from("comentarios_nadadoras")
        .select("*")
        .eq("entrenador_id", entrenadorId)
        .order("fecha", { ascending: true });

      if (!error && data) setComentariosGlobales(data as Comentario[]);
    };

    cargarTodosComentarios();
  }, []);

  const nadadoraTieneMensajes = (nadadoraId: number) => {
    if (!entrenadorId) return false;
    return comentariosGlobales.some(
      (c) =>
        c.nadadora_id === nadadoraId &&
        !c.leido &&
        c.remitente === "nadadora" &&
        c.entrenador_id === entrenadorId,
    );
  };

useEffect(() => {
  setComentarios([]);

  if (selected && entrenadorId) {
    cargarComentarios();
  }
}, [selected, entrenadorId]);

  const cargarNadadoras = async () => {
    const { data, error } = await supabase
      .from("nadadoras")
      .select("id, nombre, apellido")
      .order("nombre");

    if (!error && data) {
      setNadadoras(data);
    }
  };

  const cargarComentarios = async () => {
    const { data, error } = await supabase
      .from("comentarios_nadadoras")
      .select("*")
      .eq("nadadora_id", selected)
       .eq("entrenador_id", entrenadorId)
      .order("fecha", { ascending: true });

    if (!error && data) setComentarios(data as Comentario[]);
  };
  const enviarComentario = async () => {
    if (!selected || mensaje.trim().length === 0) {
      setConfirmacion("Debes seleccionar una nadadora y escribir un mensaje.");
      return;
    }

    setEnviando(true);
    setConfirmacion("");

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { error } = await supabase.from("comentarios_nadadoras").insert({
      mensaje,
      nadadora_id: selected,
      entrenador_id: auth.user.id,
      fecha: new Date().toISOString(),
      leido: false,
      remitente: "entrenador",
    });

    setEnviando(false);

    if (error) {
      setConfirmacion("❌ Error al enviar el comentario");
    } else {
      setConfirmacion("✅ Comentario enviado correctamente");
      setMensaje("");
      cargarComentarios();
    }
  };

  const marcarLeido = async (comentarioId: number) => {
    const { error } = await supabase
      .from("comentarios_nadadoras")
      .update({ leido: true })
      .eq("id", comentarioId);

    if (!error) {
      // Actualizamos el estado local
      setComentarios((prev) =>
        prev.map((c) => (c.id === comentarioId ? { ...c, leido: true } : c)),
      );
    }
  };

  useEffect(() => {
    const chatDiv = document.querySelector<HTMLDivElement>(
      ".ComentariosAdmin-chat",
    );
    if (chatDiv) chatDiv.scrollTop = chatDiv.scrollHeight;
  }, [comentarios]);

  const opcionesNadadoras = nadadoras.map((n) => ({
    id: n.id,
    label: `${n.nombre} ${n.apellido}`,
  }));

  return (
    <div className="ComentariosAdmin-wrapper">
      {/* Lista de nadadoras / chip seleccionado */}
      <div className="ComentariosAdmin-nadadoras">
        {selected ? (
          <div className="ComentariosAdmin-chip-selected">
            {opcionesNadadoras.find((n) => n.id === selected)?.label}
            <button
              onClick={() => setSelected(null)}
              className="ComentariosAdmin-chip-remove"
            >
              ✕
            </button>
          </div>
        ) : (
          <AutocompleteSimple
            options={opcionesNadadoras}
            value={selected}
            onChange={(id) => setSelected(id ?? null)}
            placeholder="Selecciona una nadadora..."
            badgeIds={nadadoras
              .filter((n) => nadadoraTieneMensajes(n.id))
              .map((n) => n.id)}
          />
        )}
      </div>

      {/* Chat */}
      <div className="ComentariosAdmin-chat-wrapper">
        <div className="ComentariosAdmin-chat">
          {comentarios.map((c) => (
            <div
              key={c.id}
              className={`ComentariosAdmin-chat-bubble ${
                c.remitente === "entrenador" ? "entrenador" : "nadadora"
              } ${c.leido ? "leido" : ""}`}
              onClick={() => {
                if (c.remitente === "nadadora" && !c.leido) marcarLeido(c.id);
              }}
            >
              <p>{c.mensaje}</p>
              <span className="fecha">
                {new Date(c.fecha).toLocaleString()}
                {c.remitente === "entrenador" && (
                  <span className={`check ${c.leido ? "leido" : "no-leido"}`}>
                    {c.leido ? "✔✔" : "✔"}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Área de escritura */}
        {selected && (
          <div className="ComentariosAdmin-send-bar">
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe tu mensaje..."
            />
            <button
              onClick={enviarComentario}
              disabled={enviando || !mensaje.trim()}
            >
              {enviando ? "Enviando..." : "Enviar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
