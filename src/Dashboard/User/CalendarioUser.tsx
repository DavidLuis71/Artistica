import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Calendar from "react-calendar";
import { Trophy, User, CalendarDays } from "lucide-react";
import "react-calendar/dist/Calendar.css";
import "./CalendarioUser.css";

interface Evento {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  created_at: string;
  user_id: string | null;
  creado_por: string | null;
  color?: string; // nuevo campo
}

interface Competicion {
  id: number;
  nombre: string;
  tipo: "rutinas" | "figuras" | "tiempos" | "niveles";
  fecha: string;
  lugar: string;
}

interface Props {
  userId: string;
}
type ProximoEvento =
  | (Omit<Evento, "tipo"> & { tipo: "evento" })
  | (Omit<Competicion, "tipo"> & { tipo: "competicion" });

export default function CalendarioUser({ userId }: Props) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [competiciones, setCompeticiones] = useState<Competicion[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [eventosDia, setEventosDia] = useState<Evento[]>([]);
  const [competicionesDia, setCompeticionesDia] = useState<Competicion[]>([]);

  const [isEventosModalOpen, setIsEventosModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");

  const [coloresUsuario, setColoresUsuario] = useState<{
    [id: number]: string;
  }>({});
  const coloresDisponibles = ["#f63bedff", "#10b981", "#f59e0b"];

  // ==============================
  //   Cargar eventos y competiciones
  // ==============================
  useEffect(() => {
    fetchEventos();
    fetchCompeticiones();
  }, []);

  async function fetchEventos() {
    const { data } = await supabase
      .from("eventos_calendario")
      .select("*")
      .order("fecha", { ascending: true });

    // Filtrar eventos: generales (user_id=null) o propios (user_id=userId)
    const eventosFiltrados = (data || [])
      .filter((ev) => !ev.user_id || ev.user_id === userId)
      .map((ev) => ({
        ...ev,
        fecha: new Date(ev.fecha).toLocaleDateString("sv-SE"),
      }));

    setEventos(eventosFiltrados);

    // Actualizar eventos del día si el modal está abierto
    if (isEventosModalOpen) {
      const dateStr = selectedDate.toLocaleDateString("sv-SE");
      setEventosDia(eventosFiltrados.filter((e) => e.fecha === dateStr));
    }
  }

  async function fetchCompeticiones() {
    const { data } = await supabase
      .from("competiciones")
      .select("id, nombre, tipo, fecha, lugar")
      .order("fecha", { ascending: true });

    setCompeticiones(
      (data || []).map((cp) => ({
        ...cp,
        fecha: new Date(cp.fecha).toLocaleDateString("sv-SE"),
      })),
    );
  }

  // Devuelve el próximo evento (general o personal) o competición
  const getProximoEvento = (): ProximoEvento | null => {
    const hoy = new Date();
    const todosEventos: ProximoEvento[] = [
      ...eventos.map((e) => ({ ...e, tipo: "evento" as const })),
      ...competiciones.map((c) => ({ ...c, tipo: "competicion" as const })),
    ];

    // Primero filtramos eventos de hoy
    const eventosHoy = todosEventos.filter(
      (e) => new Date(e.fecha).toDateString() === hoy.toDateString(),
    );
    if (eventosHoy.length > 0) {
      // Ordenamos por fecha y devolvemos el primero de hoy
      eventosHoy.sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      );
      return eventosHoy[0];
    }

    // Si no hay eventos hoy, buscamos futuros
    const futuros = todosEventos.filter((e) => new Date(e.fecha) > hoy);
    futuros.sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );
    return futuros[0] || null;
  };

  const proximoEvento = getProximoEvento();

  function calcularDiasRestantes(fecha: string) {
    const hoy = new Date();
    const fechaEvento = new Date(fecha);

    const diffTime = fechaEvento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Mañana";
    if (diffDays > 1) return `En ${diffDays} días`;
    return "Ya pasó";
  }

  // ===============================
  //   Abrir eventos del día
  // ===============================
  function abrirEventosDelDia(date: Date) {
    setSelectedDate(date);

    const eventosFiltrados = eventos
      .filter((e) => new Date(e.fecha).toDateString() === date.toDateString())
      .filter((e) => !e.user_id || e.user_id === userId);

    const competicionesFiltradas = competiciones.filter(
      (c) => new Date(c.fecha).toDateString() === date.toDateString(),
    );

    setEventosDia(eventosFiltrados);
    setCompeticionesDia(competicionesFiltradas);

    setIsEventosModalOpen(true);
  }

  // ===============================
  //   Crear evento
  // ===============================
  function abrirCrearEvento() {
    setNuevoTitulo("");
    setNuevaDescripcion("");
    setIsCreateModalOpen(true);
  }

  async function crearEvento() {
    if (!nuevoTitulo.trim()) return;
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const fechaFormateada = `${year}-${month}-${day}`;
    await supabase.from("eventos_calendario").insert([
      {
        titulo: nuevoTitulo,
        descripcion: nuevaDescripcion || null,
        fecha: fechaFormateada,
        user_id: userId, // Evento de la deportista
        creado_por: userId,
      },
    ]);

    setIsCreateModalOpen(false);

    // Recargar

    fetchEventos();
  }

  // ===============================
  //   Pintar puntos en el calendario
  // ===============================
  // const tileContent = ({ date, view }: { date: Date; view: string }) => {
  //   if (view !== "month") return null;

  //   const dateStr = date.toLocaleDateString("sv-SE"); // YYYY-MM-DD local sin UTC

  //   const eventosDia = eventos.filter(
  //     (ev) => ev.fecha === dateStr && (!ev.user_id || ev.user_id === userId),
  //   );

  //   const competisDia = competiciones.filter((cp) => cp.fecha === dateStr);
  //   return (
  //     <div className="CalendarioUser-tileWrapper">
  //       <div className="CalendarioUser-dayNumber">{date.getDate()}</div>
  //       <div className="CalendarioUser-tile">
  //         {eventosDia.map((ev) => {
  //           let color = "#3b82f6"; // por defecto azul
  //           if (ev.user_id === userId) {
  //             color = coloresUsuario[ev.id] || "#10b981"; // verde por defecto
  //           }
  //           return (
  //             <span
  //               key={ev.id}
  //               className="CalendarioUser-dot"
  //               style={{ backgroundColor: color }}
  //             />
  //           );
  //         })}
  //         {competisDia.length > 0 && (
  //           <span className="CalendarioUser-dot CalendarioUser-competi"></span>
  //         )}
  //       </div>
  //     </div>
  //   );
  // };
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const dateStr = date.toLocaleDateString("sv-SE");

    const eventosDia = eventos.filter(
      (ev) => ev.fecha === dateStr && (!ev.user_id || ev.user_id === userId),
    );

    const competisDia = competiciones.filter((cp) => cp.fecha === dateStr);

    const hayPersonal = eventosDia.some((e) => e.user_id === userId);
    const hayGeneral = eventosDia.some((e) => e.user_id === null);
    const hayCompeticion = competisDia.length > 0;

    return (
      <div className="CalendarioUser-tileWrapper">
        <div className="CalendarioUser-dayNumber">{date.getDate()}</div>

        <div className="CalendarioUser-icons">
          {hayPersonal && (
            <User size={14} className="CalendarioUser-icon personal" />
          )}

          {hayGeneral && (
            <CalendarDays size={14} className="CalendarioUser-icon general" />
          )}

          {hayCompeticion && (
            <Trophy size={14} className="CalendarioUser-icon competicion" />
          )}
        </div>
      </div>
    );
  };
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return "";

    const dateStr = date.toLocaleDateString("sv-SE");

    const hayPersonal = eventos.some(
      (ev) => ev.fecha === dateStr && ev.user_id === userId,
    );

    const hayGeneral = eventos.some(
      (ev) => ev.fecha === dateStr && ev.user_id === null,
    );

    const hayCompeticion = competiciones.some((cp) => cp.fecha === dateStr);

    if (hayCompeticion) return "tile-competicion";
    if (hayPersonal) return "tile-personal";
    if (hayGeneral) return "tile-general";

    return "";
  };

  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null);

  function abrirEditarEvento(evento: Evento) {
    setEventoEditando(evento);
    setNuevoTitulo(evento.titulo);
    setNuevaDescripcion(evento.descripcion || "");
    setIsCreateModalOpen(true); // usamos el mismo modal de crear
  }

  async function guardarEventoEditado() {
    if (!eventoEditando) return;

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const fechaFormateada = `${year}-${month}-${day}`;

    await supabase
      .from("eventos_calendario")
      .update({
        titulo: nuevoTitulo,
        descripcion: nuevaDescripcion || null,
        fecha: fechaFormateada,
      })
      .eq("id", eventoEditando.id);

    setEventoEditando(null);
    setIsCreateModalOpen(false);
    fetchEventos();
  }

  async function eliminarEvento(id: number) {
    await supabase.from("eventos_calendario").delete().eq("id", id);
    fetchEventos();
  }

  const eventosMes = eventos.filter((e) => {
    const fecha = new Date(e.fecha);
    return (
      fecha.getMonth() === selectedDate.getMonth() &&
      fecha.getFullYear() === selectedDate.getFullYear()
    );
  });

  const competicionesMes = competiciones.filter((c) => {
    const fecha = new Date(c.fecha);
    return (
      fecha.getMonth() === selectedDate.getMonth() &&
      fecha.getFullYear() === selectedDate.getFullYear()
    );
  });

  return (
    <div className="CalendarioUser-container">
      <h2 className="CalendarioUser-title">Este mes, tenemos:</h2>
      <div className="CalendarioUser-stats">
        <div className="CalendarioUser-stat">
          <span>{eventosMes.length}</span>
          <p>Eventos</p>
        </div>
        <div className="CalendarioUser-stat">
          <span>{competicionesMes.length}</span>
          <p>Competiciones</p>
        </div>
      </div>

      {proximoEvento && (
        <div
          className={`CalendarioUser-proximoEvento ${
            proximoEvento.tipo === "competicion"
              ? "CalendarioUser-proximoCompeticion"
              : ""
          }`}
        >
          <div className="CalendarioUser-proximoHeader">
            <span className="CalendarioUser-badge">
              {proximoEvento.tipo === "competicion"
                ? "🏆 Competición"
                : "📅 Evento"}
            </span>
            <span className="CalendarioUser-countdown">
              {calcularDiasRestantes(proximoEvento.fecha)}
            </span>
          </div>

          <h2>
            {proximoEvento.tipo === "evento"
              ? proximoEvento.titulo
              : proximoEvento.nombre}
          </h2>

          {proximoEvento.tipo === "evento" && proximoEvento.descripcion && (
            <p>{proximoEvento.descripcion}</p>
          )}

          <p className="CalendarioUser-fecha">
            {new Date(proximoEvento.fecha).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="CalendarioUser-calendar">
        <Calendar
          className="CalendarioUser-calendar"
          onClickDay={abrirEventosDelDia}
          tileContent={tileContent}
          tileClassName={tileClassName}
        />
      </div>

      {/* =======================
           MODAL EVENTOS DEL DÍA
         ======================= */}
      {isEventosModalOpen && (
        <div
          className="CalendarioUser-modalOverlay"
          onClick={() => setIsEventosModalOpen(false)}
        >
          <div
            className="CalendarioUser-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Eventos del {selectedDate.toLocaleDateString()}</h3>
            {/* Eventos creados */}
            {eventosDia.length > 0 ? (
              eventosDia.map((e) => (
                <div key={e.id} className="CalendarioUser-card">
                  <h4>{e.titulo}</h4>
                  {e.descripcion && <p>{e.descripcion}</p>}
                  <p className="CalendarioUser-small">
                    {e.user_id ? "Actividad personal" : "Entrenador"}
                  </p>

                  {/* Botones solo si el evento pertenece al usuario */}
                  {e.user_id === userId && (
                    <div className="CalendarioUser-cardButtons">
                      <button
                        onClick={() => abrirEditarEvento(e)}
                        className="CalendarioUser-btnSmall"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarEvento(e.id)}
                        className="CalendarioUser-btnSmall CalendarioUser-btnDelete"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>No hay eventos.</p>
            )}
            {/* Competiciones */}
            {competicionesDia.length > 0 && (
              <>
                <h3 className="CalendarioUser-subtitle">Competiciones</h3>
                {competicionesDia.map((c) => (
                  <div
                    key={c.id}
                    className="CalendarioUser-card CalendarioUser-competiCard"
                  >
                    <h4>{c.nombre}</h4>
                    <p>Tipo: {c.tipo}</p>
                    <p>Lugar: {c.lugar}</p>
                  </div>
                ))}
              </>
            )}
            <button className="CalendarioUser-btn" onClick={abrirCrearEvento}>
              Crear evento
            </button>
            <button
              className="CalendarioUser-btnClose"
              onClick={() => setIsEventosModalOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      {/* {proximoEvento && (
        <div className="CalendarioUser-proximoEvento">
          <h3>
            Próximo {proximoEvento.tipo === "evento" ? "evento" : "competición"}
          </h3>
          <h4>
            {proximoEvento.tipo === "evento"
              ? proximoEvento.titulo
              : proximoEvento.nombre}
          </h4>
          {proximoEvento.tipo === "evento" && proximoEvento.descripcion && (
            <p>{proximoEvento.descripcion}</p>
          )}
          <p>{new Date(proximoEvento.fecha).toLocaleDateString()}</p>
        </div>
      )} */}

      {/* =======================
     MODAL CREAR EVENTO
   ======================= */}
      {isCreateModalOpen && (
        <div
          className="CalendarioUser-modalOverlay"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="CalendarioUser-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{eventoEditando ? "Editar evento" : "Crear evento"}</h3>

            <input
              placeholder="Título"
              value={nuevoTitulo}
              onChange={(e) => setNuevoTitulo(e.target.value)}
              className="CalendarioUser-input"
            />

            <textarea
              placeholder="Descripción"
              value={nuevaDescripcion}
              onChange={(e) => setNuevaDescripcion(e.target.value)}
              className="CalendarioUser-textarea"
            />

            {/* Selector de color, solo si es un evento del usuario */}
            {eventoEditando?.user_id === userId && (
              <div style={{ marginBottom: "10px" }}>
                <label>Color del evento:</label>
                <div style={{ display: "flex", gap: "8px", marginTop: "5px" }}>
                  {coloresDisponibles.map((c) => (
                    <div
                      key={c}
                      onClick={() =>
                        setColoresUsuario({
                          ...coloresUsuario,
                          [eventoEditando.id]: c,
                        })
                      }
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: c,
                        border:
                          coloresUsuario[eventoEditando.id] === c
                            ? "2px solid black"
                            : "1px solid #ccc",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              className="CalendarioUser-btn"
              onClick={eventoEditando ? guardarEventoEditado : crearEvento}
            >
              {eventoEditando ? "Guardar cambios" : "Crear"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
