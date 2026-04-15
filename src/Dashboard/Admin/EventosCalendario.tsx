import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Calendar from "react-calendar";
import { mostrarNombreConReglas } from "../../utils/nombres";

import "react-calendar/dist/Calendar.css";
import "./EventosCalendario.css";

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  user_id: string;
}

interface Evento {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  created_at: string;
  user_id: string | null;
  creado_por: string | null;
}

function formatFechaLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CalendarioAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtroUsuario, setFiltroUsuario] = useState<string | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [userId, setUserId] = useState<string | null>(null);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEventosModalOpen, setIsEventosModalOpen] = useState(false);
  const [eventosDia, setEventosDia] = useState<Evento[]>([]);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [mostrarListaUsuarios, setMostrarListaUsuarios] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  useEffect(() => {
    fetchEventos(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
  }, [selectedDate, filtroUsuario]);

  async function fetchUsuarios() {
    const { data } = await supabase
      .from("nadadoras")
      .select("id, nombre,apellido, user_id");
    setUsuarios(data || []);
  }

  async function fetchEventos(year: number, month: number) {
    const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const end = new Date(year, month, 0).toISOString().slice(0, 10);

    let query = supabase
      .from("eventos_calendario")
      .select("*")
      .gte("fecha", start)
      .lte("fecha", end)
      .order("fecha", { ascending: true });

    if (filtroUsuario) {
      query = query.or(`user_id.eq.${filtroUsuario},user_id.is.null`);
    }

    const { data } = await query;
    setEventos(data || []);
  }

  function abrirEventosDelDia(date: Date) {
    const lista = eventos.filter(
      (e) => new Date(e.fecha).toDateString() === date.toDateString(),
    );

    setEventosDia(lista);
    setSelectedDate(date);
    setIsEventosModalOpen(true);
  }

  function abrirCrearEvento(date: Date) {
    setSelectedDate(date);
    setNuevoTitulo("");
    setNuevaDescripcion("");
    setIsCreateModalOpen(true);
  }

  async function crearEvento() {
    if (!nuevoTitulo.trim()) return;

    await supabase.from("eventos_calendario").insert([
      {
        titulo: nuevoTitulo,
        descripcion: nuevaDescripcion || null,
        fecha: formatFechaLocal(selectedDate),
        user_id: filtroUsuario,
        creado_por: userId,
      },
    ]);

    setIsCreateModalOpen(false);
    fetchEventos(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
  }

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const diaEventos = eventos.filter(
      (e) => new Date(e.fecha).toDateString() === date.toDateString(),
    );

    return (
      <div className="calendario-tile-wrapper">
        <div className="calendario-tile-eventos">
          {date.getDate()}
          {diaEventos.map((e) => (
            <div
              key={e.id}
              className={`calendario-evento ${
                e.user_id
                  ? "calendario-evento-nadadora"
                  : "calendario-evento-general"
              }`}
            >
              {e.titulo}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="calendario-container">
      <h2>Calendario de Eventos</h2>

      {/* Filtro */}
      <div className="calendario-filtro">
        <label>Filtrar por nadadora:</label>

        <div className="calendario-autocomplete-wrapper">
          <input
            type="text"
            placeholder="Buscar nadadora..."
            value={
              filtroUsuario
                ? mostrarNombreConReglas(
                    `${
                      usuarios.find((u) => u.user_id === filtroUsuario)
                        ?.nombre || ""
                    } ${
                      usuarios.find((u) => u.user_id === filtroUsuario)
                        ?.apellido || ""
                    }`,
                  )
                : busquedaUsuario
            }
            onChange={(e) => {
              setFiltroUsuario(null);
              setBusquedaUsuario(e.target.value);
              setMostrarListaUsuarios(true);
            }}
            onFocus={() => setMostrarListaUsuarios(true)}
          />

          {mostrarListaUsuarios && (
            <div className="calendario-autocomplete-list">
              {/* Opción TODOS */}
              <div
                className="calendario-autocomplete-item"
                onClick={() => {
                  setFiltroUsuario(null);
                  setBusquedaUsuario("");
                  setMostrarListaUsuarios(false);
                }}
              >
                Todos
              </div>

              {/* Nadadoras */}
              {usuarios
                .filter((u) =>
                  (u.nombre ?? "")
                    .toLowerCase()
                    .includes(busquedaUsuario.toLowerCase()),
                )
                .map((u) => (
                  <div
                    key={u.id}
                    className="calendario-autocomplete-item"
                    onClick={() => {
                      setFiltroUsuario(u.user_id);
                      setBusquedaUsuario(u.nombre);
                      setMostrarListaUsuarios(false);
                    }}
                  >
                    {mostrarNombreConReglas(`${u.nombre} ${u.apellido || ""}`)}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Calendario */}
      <div className="calendario-calendar">
        <Calendar
          className="calendario-admin"
          onClickDay={abrirEventosDelDia}
          onActiveStartDateChange={({ activeStartDate }) => {
            if (activeStartDate) {
              fetchEventos(
                activeStartDate.getFullYear(),
                activeStartDate.getMonth() + 1,
              );
            }
          }}
          tileContent={tileContent}
        />
      </div>
      {/* Mini agenda de eventos del mes */}
      <h3>Eventos del mes</h3>
      <div className="calendario-agenda">
        {eventos.length === 0 ? (
          <p>No hay eventos este mes.</p>
        ) : (
          eventos.map((e) => (
            <div
              key={e.id}
              className={`calendario-evento-card ${
                e.user_id
                  ? "calendario-evento-card-nadadora"
                  : "calendario-evento-card-general"
              }`}
            >
              <h4>{e.titulo}</h4>
              {e.descripcion && <p>{e.descripcion}</p>}
              <p>
                <em>
                  {new Date(e.fecha).toLocaleDateString()} -{" "}
                  {e.user_id
                    ? mostrarNombreConReglas(
                        `${
                          usuarios.find((u) => u.user_id === e.user_id)
                            ?.nombre || ""
                        } ${
                          usuarios.find((u) => u.user_id === e.user_id)
                            ?.apellido || ""
                        }`,
                      )
                    : "Evento general"}
                </em>
              </p>
            </div>
          ))
        )}
      </div>
      {/* Modal VER EVENTOS */}
      {isEventosModalOpen && (
        <div className="calendario-modal">
          <div className="calendario-modal-panel">
            <h3>Eventos del {selectedDate.toLocaleDateString()}</h3>
            {eventosDia.length === 0 ? (
              <p>No hay eventos en este día.</p>
            ) : (
              <div className="calendario-eventos-dia">
                {eventosDia.map((e) => (
                  <div
                    key={e.id}
                    className={`calendario-evento-card ${
                      e.user_id
                        ? "calendario-evento-card-nadadora"
                        : "calendario-evento-card-general"
                    }`}
                  >
                    <h4>{e.titulo}</h4>
                    {e.descripcion && <p>{e.descripcion}</p>}
                    <p>
                      <em>
                        {e.user_id
                          ? `De: ${mostrarNombreConReglas(
                              `${
                                usuarios.find((u) => u.user_id === e.user_id)
                                  ?.nombre || ""
                              } ${
                                usuarios.find((u) => u.user_id === e.user_id)
                                  ?.apellido || ""
                              }`,
                            )}`
                          : "Evento general"}
                      </em>
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="calendario-modal-buttons">
              <button
                className="calendario-btn"
                onClick={() => setIsEventosModalOpen(false)}
              >
                Cerrar
              </button>
              <button
                className="calendario-btn calendario-btn-primary"
                onClick={() => {
                  setIsEventosModalOpen(false);
                  abrirCrearEvento(selectedDate);
                }}
              >
                Crear evento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal CREAR EVENTO */}
      {isCreateModalOpen && (
        <div className="calendario-modal">
          <div className="calendario-modal-panel">
            <h3>Crear evento</h3>
            <input
              placeholder="Título"
              value={nuevoTitulo}
              onChange={(e) => setNuevoTitulo(e.target.value)}
            />
            <textarea
              placeholder="Descripción"
              value={nuevaDescripcion}
              onChange={(e) => setNuevaDescripcion(e.target.value)}
            />
            <button
              className="calendario-btn calendario-btn-primary"
              onClick={crearEvento}
            >
              Crear
            </button>
            <button
              className="calendario-btn"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
