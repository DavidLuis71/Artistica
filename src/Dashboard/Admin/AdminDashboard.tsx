// src/pages/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Asistencias from "./Asistencias";
import UsuariosPendientes from "./UsuariosPendientes";
import Competiciones from "./Competiciones";
import Coreografias from "./Coreografias";
import Grupos from "./Grupos";
import Entrenamientos from "./Entrenamientos";
import TomasAlturas from "./TomasAlturas";
import EventosCalendario from "./EventosCalendario";
import Inicio from "./Inicio";
import "./AdminDashboard.css";
import TomasTiempos from "./TomasTiempos";
import NadadorasLogros from "./NadadorasLogros";
import { useNavigate } from "react-router-dom";
import ValoracionEntrenamientoAdmin from "./ValoracionEntrenamientoAdmin";
import HistorialSaludAdmin from "./HistorialSaludAdmin";
import EstadoEquipo from "./EstadoEquipo";
import { ChevronDown, ChevronRight } from "lucide-react";
import ComentariosAdmin from "./ComentariosAdmin";
import RetosAdmin from "./RetosAdmin";
import AsignarRetosAdmin from "./AsignarRetosAdmin";
import CoreografiasMovimientos from "./CoreografiasMovimientos";
import TomasTiemposCrono from "./TomasTiemposCrono";
import JuegosCartasAdmin from "./JuegosCartasAdmin";
import NotificacionesAdmin from "./NotificacionesAdmin";
import NadadoraInforme from "./NadadoraInforma";
import CartaPersonalizadaForm from "./CartaPersonalizada";

import MenuGeo from "./Juegos/MenuGeo";
// import EmailCampaignsAdmin from "./EmailCampaignsAdmin";

export default function AdminDashboard() {
  const [section, setSection] = useState<string>("inicio");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [submenuOpen, setSubmenuOpen] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [usuariosPendientesCount, setUsuariosPendientesCount] = useState(0);
  const [yaCalculadoSemana, setYaCalculadoSemana] = useState(false);
  const [yaCalculadoMes, setYaCalculadoMes] = useState(false);
  const [comentariosSinLeer, setComentariosSinLeer] = useState(0);

  const fetchUsuariosPendientes = async () => {
    const { data, error } = await supabase
      .from("users") // ajusta al nombre de tu tabla
      .select("id", { count: "exact" })
      .eq("aprobado", false); // o la condición que uses
    if (error) {
      console.error(error);
      return;
    }
    setUsuariosPendientesCount(data?.length || 0);
  };

  useEffect(() => {
    fetchUsuariosPendientes();
  }, []);
  const toggleSubmenu = (name: string) => {
    setSubmenuOpen((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const fetchComentariosSinLeer = async () => {
    const user = supabase.auth.getUser(); // o supabase.auth.user() según versión
    const { data, error } = await supabase
      .from("comentarios_nadadoras")
      .select("id")
      .eq("entrenador_id", (await user).data.user?.id) // uuid del entrenador
      .eq("remitente", "nadadora")
      .eq("leido", false);

    if (error) {
      console.error("Error al traer comentarios sin leer:", error);
      return;
    }

    setComentariosSinLeer(data?.length || 0);
  };

  useEffect(() => {
    fetchComentariosSinLeer();

    const interval = setInterval(() => {
      fetchComentariosSinLeer();
    }, 120000); // cada 120 segundos

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkLogrosHoy = async () => {
      const fechaHoy = new Date();
      const inicioDia = new Date(fechaHoy.setHours(0, 0, 0, 0)).toISOString();
      const finDia = new Date(fechaHoy.setHours(23, 59, 59, 999)).toISOString();

      // Logro semanal
      const { data: semanaData, error: semanaError } = await supabase
        .from("historial_puntos")
        .select("id")
        .eq("motivo", "Logro semanal")
        .gte("fecha", inicioDia)
        .lte("fecha", finDia);

      if (!semanaError && semanaData && semanaData.length > 0) {
        setYaCalculadoSemana(true);
      }

      // Logro mensual
      const { data: mesData, error: mesError } = await supabase
        .from("historial_puntos")
        .select("id")
        .eq("motivo", "Logro mensual")
        .gte("fecha", inicioDia)
        .lte("fecha", finDia);

      if (!mesError && mesData && mesData.length > 0) {
        setYaCalculadoMes(true);
      }
    };

    checkLogrosHoy();
  }, []);

  // Fecha de hoy
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0=Dom, 1=Lun, ..., 5=Vie, 6=Sab
  const diaActual = hoy.getDate();

  // Último día del mes
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

  // Día de la semana del último día del mes
  const diaSemanaUltimoDia = ultimoDiaMes.getDay(); // 0=Dom, ..., 6=Sab

  // Ajustamos para que, si cae en fin de semana, se active el viernes anterior
  let ultimoDiaHabilitado: number;
  if (diaSemanaUltimoDia === 6) {
    // sábado → viernes anterior
    ultimoDiaHabilitado = ultimoDiaMes.getDate() - 1;
  } else if (diaSemanaUltimoDia === 0) {
    // domingo → viernes anterior
    ultimoDiaHabilitado = ultimoDiaMes.getDate() - 2;
  } else {
    // lunes-viernes → mismo día
    ultimoDiaHabilitado = ultimoDiaMes.getDate();
  }

  // Botones
  const habilitarBotonSemana = diaSemana === 5; // viernes
  const habilitarBotonMes = diaActual === ultimoDiaHabilitado;

  // 🔹 Funciones para ejecutar las RPCs
  const calcularLogrosSemana = async () => {
    const { error } = await supabase.rpc("calcular_logro_asistencia_semana", {
      p_fecha: hoy.toISOString().slice(0, 10),
    });
    if (error) console.error(error);
    else alert("Logros semanales calculados ✅");
  };

  const calcularLogrosMes = async () => {
    const { error } = await supabase.rpc("calcular_logro_asistencia_mes", {
      p_fecha: hoy.toISOString().slice(0, 10),
    });
    if (error) console.error(error);
    else alert("Logros mensuales calculados ✅");
  };
  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  return (
    <div className="admin-dashboard">
      <header>
        <h1>Entrenador</h1>
        <button onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      </header>

      <div className="dashboard-content">
        <nav className={`admin-nav ${menuOpen ? "open" : ""}`}>
          <ul>
            <li
              onClick={() => {
                setSection("inicio");
                setMenuOpen(false);
              }}
            >
              Inicio
            </li>
            <li
              onClick={() => {
                setSection("estado");
                setMenuOpen(false);
              }}
            >
              Estado
            </li>
            <li onClick={() => toggleSubmenu("datos")}>
              Gestion de nadadoras{" "}
              {submenuOpen["datos"] ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              {usuariosPendientesCount > 0 && (
                <span
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: "red",
                    marginLeft: "5px",
                  }}
                ></span>
              )}
              {comentariosSinLeer > 0 && <span className="badge"></span>}
              {submenuOpen["datos"] && (
                <ul>
                  <li
                    onClick={() => {
                      setSection("asistencias");
                      setMenuOpen(false);
                    }}
                  >
                    Asistencias
                  </li>
                  <li
                    onClick={() => {
                      setSection("nadadora");
                      setMenuOpen(false);
                    }}
                  >
                    Nadadora
                  </li>
                  <li
                    onClick={() => {
                      setSection("grupos");
                      setMenuOpen(false);
                    }}
                  >
                    Grupos
                  </li>
                  <li
                    onClick={() => {
                      setSection("comentariosAdmin");
                      setMenuOpen(false);
                    }}
                  >
                    Comentarios
                    {comentariosSinLeer > 0 && (
                      <span className="badge">{comentariosSinLeer}</span>
                    )}
                  </li>
                  <li
                    onClick={() => {
                      setSection("notificaciones");
                      setMenuOpen(false);
                    }}
                  >
                    Notificaciones
                  </li>
                  {/* <li
                    onClick={() => {
                      setSection("emails");
                      setMenuOpen(false);
                    }}
                  >
                    Emails
                  </li> */}

                  <li
                    onClick={() => {
                      setSection("pendientes");
                      setMenuOpen(false);
                    }}
                  >
                    Usuarios
                    {usuariosPendientesCount > 0 && (
                      <span
                        style={{
                          display: "inline-block",
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: "red",
                          marginLeft: "5px",
                        }}
                      ></span>
                    )}
                  </li>
                </ul>
              )}
            </li>
            <li onClick={() => toggleSubmenu("eventos")}>
              Competiciones & Coreos & Eventos{" "}
              {submenuOpen["eventos"] ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              {submenuOpen["eventos"] && (
                <ul>
                  <li
                    onClick={() => {
                      setSection("competiciones");
                      setMenuOpen(false);
                    }}
                  >
                    Competiciones
                  </li>
                  <li
                    onClick={() => {
                      setSection("coreografias");
                      setMenuOpen(false);
                    }}
                  >
                    Coreografías
                  </li>
                  <li
                    onClick={() => {
                      setSection("movimientos");
                      setMenuOpen(false);
                    }}
                  >
                    Crear Esquema Coreo
                  </li>
                  <li
                    onClick={() => {
                      setSection("eventos");
                      setMenuOpen(false);
                    }}
                  >
                    Eventos
                  </li>
                </ul>
              )}
            </li>
            <li onClick={() => toggleSubmenu("entrenamiento")}>
              Entrenos & Rendimiento{" "}
              {submenuOpen["entrenamiento"] ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              {submenuOpen["entrenamiento"] && (
                <ul>
                  <li
                    onClick={() => {
                      setSection("entrenamientos");
                      setMenuOpen(false);
                    }}
                  >
                    Entrenamientos
                  </li>
                  <li
                    onClick={() => {
                      setSection("alturas");
                      setMenuOpen(false);
                    }}
                  >
                    Alturas
                  </li>
                  <li
                    onClick={() => {
                      setSection("tomas_tiempos");
                      setMenuOpen(false);
                    }}
                  >
                    Tomas Tiempos
                  </li>
                  <li
                    onClick={() => {
                      setSection("cronometro");
                      setMenuOpen(false);
                    }}
                  >
                    Cronómetro
                  </li>
                  <li
                    onClick={() => {
                      setSection("nadadorasLogros");
                      setMenuOpen(false);
                    }}
                  >
                    Logros
                  </li>
                  <li
                    onClick={() => {
                      setSection("retos");
                      setMenuOpen(false);
                    }}
                  >
                    Retos
                  </li>
                  <li
                    onClick={() => {
                      setSection("cartas");
                      setMenuOpen(false);
                    }}
                  >
                    Cartas
                  </li>
                </ul>
              )}
            </li>
            <li onClick={() => toggleSubmenu("valoracion")}>
              Valoraciones & Salud{" "}
              {submenuOpen["valoracion"] ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              {submenuOpen["valoracion"] && (
                <ul>
                  <li
                    onClick={() => {
                      setSection("valoracion");
                      setMenuOpen(false);
                    }}
                  >
                    Valoraciones
                  </li>
                  <li
                    onClick={() => {
                      setSection("salud");
                      setMenuOpen(false);
                    }}
                  >
                    Historial Salud
                  </li>
                </ul>
              )}
            </li>
            <li
              onClick={() => {
                setSection("mapa");
                setMenuOpen(false);
              }}
            >
              Mapa
            </li>
            <li onClick={logout}>Cerrar sesión</li>
          </ul>
        </nav>

        <main className="AdminDashboard-main">
          {section === "inicio" && <Inicio />}
          {section === "estado" && <EstadoEquipo />}
          {section === "asistencias" && <Asistencias />}
          {section === "grupos" && <Grupos />}
          {section === "comentariosAdmin" && <ComentariosAdmin />}
          {section === "notificaciones" && <NotificacionesAdmin />}
          {/* {section === "emails" && <EmailCampaignsAdmin />} */}
          {section === "nadadora" && <NadadoraInforme />}

          {section === "pendientes" && <UsuariosPendientes />}

          {section === "competiciones" && <Competiciones />}
          {section === "eventos" && <EventosCalendario />}
          {section === "coreografias" && <Coreografias />}
          {section === "movimientos" && <CoreografiasMovimientos />}

          {section === "entrenamientos" && <Entrenamientos />}
          {section === "alturas" && <TomasAlturas />}
          {section === "tomas_tiempos" && <TomasTiempos />}
          {section === "cronometro" && <TomasTiemposCrono />}
          {section === "nadadorasLogros" && <NadadorasLogros />}
          {section === "retos" && <RetosAdmin setSection={setSection} />}
          {section === "asignar_retos" && <AsignarRetosAdmin />}
          {section === "cartas" && (
            <JuegosCartasAdmin setSection={setSection} />
          )}
          {section === "cartapersonalizada" && <CartaPersonalizadaForm />}

          {section === "valoracion" && <ValoracionEntrenamientoAdmin />}
          {section === "salud" && <HistorialSaludAdmin />}
          {section === "mapa" && <MenuGeo />}
          {habilitarBotonSemana && !yaCalculadoSemana && (
            <button
              onClick={calcularLogrosSemana}
              className="BotonesCalcularLogros"
              style={{ margin: "10px", padding: "10px" }}
            >
              Calcular logros semanales
            </button>
          )}
          {habilitarBotonMes && !yaCalculadoMes && (
            <button
              onClick={calcularLogrosMes}
              className="BotonesCalcularLogros"
              style={{ margin: "10px", padding: "10px" }}
            >
              Calcular logros mensuales
            </button>
          )}
        </main>
      </div>
    </div>
  );
}
