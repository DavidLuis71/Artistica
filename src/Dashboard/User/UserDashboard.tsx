import { useEffect, useState, type JSX } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./UserDashboard.css";
import AsistenciasUser from "./AsistenciasUser";
import CompeticionesUser from "./CompeticionesUser";
import CalendarioUser from "./CalendarioUser";
import EntrenamientoUser from "./EntrenamientosUser";
import HistorialAlturasUser from "./HistorialAlturasUser";
import CoreografiasUser from "./CoreografiasUser";
import InicioUser from "./InicioUser";
import InicioUser2 from "./InicioUser2";
import PerfilUsuario from "./PerfilUsuario";
import {
  Home,
  Calendar,
  CheckCircle,
  Trophy,
  FileMusic,
  Dumbbell,
  Activity,
  HeartPulse,
  Clipboard,
  MessageSquare,
  Target,
  Users,
  BarChart2,
  Gamepad2,
} from "lucide-react";
import AjustesTema from "./AjustesTema";
import ValoracionEntrenamiento from "./ValoracionEntrenamiento";
import HistorialSaludUser from "./HistorialSaludUser";
import ComentariosUser from "./ComentariosUser";
import RetosUser from "./RetosUser";
import MuroNadadoras from "./MuroNadadoras";
import HistorialTiemposUser from "./HistorialTiemposUser";
import UserNotificationsSlider from "./Notificacion/Notificacion";
import AlbumCartas, { type CartaNadadora } from "./Cartas/CartasUser2";
import MiniTriviaUser from "./juegos/trivial/MiniTriviaUser";
import TableroCoreografia from "./Cartas/TableroCoreografia";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

import { enablePush } from "../../pushService";
// import PushPrompt from "../../PushPrompt";
// import SnowEffect from "./SnowEffect";

interface Nadadora {
  id: number;
  nombre: string;
  codigo_unico: string;
  user_id: string;
}
interface SubSeccion {
  key: string;
  label: string;
  component: React.ComponentType<any>;
  icon?: JSX.Element;
}
interface Seccion {
  key: string;
  label: string;
  icon: JSX.Element;
  roles: ("padre" | "nadadora")[];
  subsecciones?: SubSeccion[];
}

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null);
  const [rol, setRol] = useState<"padre" | "nadadora" | null>(null);
  const [hijas, setHijas] = useState<Nadadora[]>([]);
  const [selectedHija, setSelectedHija] = useState<Nadadora | null>(null);
  const [hijaToast, setHijaToast] = useState<string | null>(null);
  const [loadingSection, setLoadingSection] = useState(false);
  const [userMenuPos, setUserMenuPos] = useState({ x: 0, y: 0 });
  const [hayComentariosNuevos, setHayComentariosNuevos] = useState(false);
  const [hayEventoHoy, setHayEventoHoy] = useState(false);
  const [hayMensajesNuevos, setHayMensajesNuevos] = useState(false);
  const [numeroMensajes, setNumeroMensajes] = useState(0);
const [hayPostsNuevos, setHayPostsNuevos] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [section, setSection] = useState("inicio");
  const [cartasCoreografia, setCartasCoreografia] = useState<CartaNadadora[]>(
    [],
  );
const [showPushModal, setShowPushModal] = useState(false);



useEffect(() => {
  let deviceId = localStorage.getItem("device_id");

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
  }
}, []);

useEffect(() => {
  if (!user?.id || !rol) return;

  const checkPush = async () => {
    const deviceId = localStorage.getItem("device_id");

    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("device_id", deviceId)
      .maybeSingle();

    if (error) return console.error(error);

    // Si este dispositivo no existe → pedir permiso
    if (!data) {
      setShowPushModal(true);
    }
  };

  checkPush();
}, [user?.id, rol]);
  // const [hayJuegoHoy, setHayJuegoHoy] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const [loaderTurn, setLoaderTurn] = useState(0); // contador de cambios
  const [inicioDefault, setInicioDefault] = useState<string | null>(null);
  const handleSectionChange = (key: string) => {
    setLoadingSection(true);

    // Si es una sección con subsecciones, cargar la primera automáticamente
    const seccionActual = secciones.find((s) => s.key === key);
    if (seccionActual?.subsecciones?.length) {
      setSection(seccionActual.subsecciones[0].key); // miniTrivia, etc.
    } else {
      setSection(key);
    }

    setLoaderTurn((prev) => prev + 1);

    if (key === "comentarios") setHayComentariosNuevos(false);

    setTimeout(() => setLoadingSection(false), 500);
  };

  const labelsExtras: Record<string, string> = {
    perfil: "Perfil",
    ajustesTema: "Ajustes",
  };


  useEffect(() => {
  if (!selectedHija) return;

  async function verificarPostsNuevos() {
    // Último post global
    const { data: ultimoPost } = await supabase
      .from("posts_nadadoras")
      .select("creado_en, nadadora_id")
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!ultimoPost) {
      setHayPostsNuevos(false);
      return;
    }

    // Última vista de esta nadadora
    const { data: lectura } = await supabase
      .from("posts_nadadoras_leidos")
      .select("ultimo_post_visto")
      .eq("nadadora_id", selectedHija?.id)
      .maybeSingle();

    // Si nunca ha abierto el muro
    if (!lectura?.ultimo_post_visto) {
      setHayPostsNuevos(true);
      return;
    }

    const fechaPost = new Date(ultimoPost.creado_en).getTime();
    const fechaVista = new Date(
      lectura.ultimo_post_visto,
    ).getTime();

    setHayPostsNuevos(fechaPost > fechaVista);
  }

  verificarPostsNuevos();
}, [selectedHija, section]);

  useEffect(() => {
    if (!selectedHija) return;

    async function verificarEventosHoy() {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Buscar eventos personales o generales
      const { data: eventos } = await supabase
        .from("eventos_calendario")
        .select("id")

        .eq("fecha", today)
        .limit(1); // solo necesitamos saber si hay alguno

      // Buscar competiciones
      const { data: competis } = await supabase
        .from("competiciones")
        .select("id")
        .eq("fecha", today)
        .limit(1);

      setHayEventoHoy(
        (!!eventos && eventos.length > 0) ||
          (!!competis && competis.length > 0),
      );
    }

    verificarEventosHoy();
  }, [selectedHija]);

  // useEffect(() => {
  //   if (!selectedHija) return;

  //   async function verificarCartasHoy() {
  //     const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  //     // 1️⃣ Verificar si hay juego hoy
  //     const { data: juegoHoy, error: errorJuego } = await supabase
  //       .from("juegos")
  //       .select("id")
  //       .eq("juego_fecha", today)
  //       .single();

  //     if (errorJuego || !juegoHoy) {
  //       setHayJuegoHoy(false);
  //       return;
  //     }

  //     const juegoId = juegoHoy.id;

  //     // 2️⃣ Verificar si la nadadora ya envió alguna carta a este juego
  //     const { data: cartasEnviadas } = await supabase
  //       .from("cartas_juego")
  //       .select("id")
  //       .eq("juego_id", juegoId)
  //       .eq("nadadora_id", selectedHija?.id)
  //       .limit(1); // solo necesitamos saber si existe alguna

  //     // 3️⃣ Actualizar estado del círculo
  //     setHayJuegoHoy(cartasEnviadas?.length === 0); // true si hay juego y no ha enviado carta
  //   }

  //   verificarCartasHoy();
  // }, [selectedHija, section]);

  useEffect(() => {
    if (!selectedHija) return;

    async function verificarMensajes() {
      // Primero obtenemos los chats de la nadadora
      const { data: chats } = await supabase

        .from("chats")
        .select("id")
        .or(
          `nadadora_1_id.eq.${selectedHija?.id},nadadora_2_id.eq.${selectedHija?.id}`,
        );
      if (!chats || chats.length === 0) {
        setHayMensajesNuevos(false);
        return;
      }

      const chatIds = chats.map((c: any) => c.id);

      // Ahora buscamos mensajes no leídos
      const { data: mensajes, error } = await supabase
        .from("mensajes_chats")
        .select("id")
        .in("chat_id", chatIds)
        .eq("leido", false)
        .neq("remitente_id", selectedHija?.id); // que no sean enviados por la propia nadadora

      if (!error && mensajes) {
        setHayMensajesNuevos(mensajes.length > 0);
        setNumeroMensajes(mensajes.length);
      }
    }

    verificarMensajes();
  }, [selectedHija, section]);

  const secciones: Seccion[] = [
    {
      key: "inicio",
      label: "Inicio",
      icon: <Home size={18} />,
      roles: ["padre", "nadadora"],
    },
    {
      key: "inicio2",
      label: "Inicio",
      icon: <Home size={18} />,
      roles: ["padre", "nadadora"],
    },
    {
      key: "asistencias",
      label: "Asistencias",
      icon: <CheckCircle size={18} />,
      roles: ["padre", "nadadora"],
    },
    {
      key: "competiciones",
      label: "Competiciones",
      icon: <Trophy size={18} />,
      roles: ["padre", "nadadora"],
    },
    {
      key: "coreografias",
      label: "Coreografias",
      icon: <FileMusic size={18} />,
      roles: ["padre", "nadadora"],
    },
    {
      key: "calendario",
      label: "Agenda",
      icon: <Calendar size={18} />,
      roles: ["nadadora"],
    },

    // ==========================
    // 🟢 GRUPO ENTRENAMIENTO
    // ==========================
    {
      key: "entrenamientoGrupo",
      label: "Entrenamiento",
      icon: <Dumbbell size={18} />,
      roles: ["padre", "nadadora"],
      subsecciones: [
        {
          key: "entrenamientos",
          label: "Entrenamientos",
          component: EntrenamientoUser,
          icon: <Dumbbell size={16} />,
        },
        {
          key: "valoracion",
          label: "Bienestar",
          component: ValoracionEntrenamiento,
          icon: <Clipboard size={16} />,
        },
        {
          key: "salud",
          label: "Salud",
          component: HistorialSaludUser,
          icon: <HeartPulse size={16} />,
        },
        {
          key: "retos",
          label: "Retos",
          component: RetosUser,
          icon: <Target size={16} />,
        },
      ],
    },
    // ==========================
    // 🔵 GRUPO HISTORIAL
    // ==========================
    {
      key: "historialGrupo",
      label: "Historial",
      icon: <BarChart2 size={18} />,
      roles: ["nadadora"],
      subsecciones: [
        {
          key: "historialAlturas",
          label: "Alturas",
          component: HistorialAlturasUser,
          icon: <Activity size={16} />,
        },
        {
          key: "historialTiempos",
          label: "Tiempos",
          component: HistorialTiemposUser,
          icon: <CheckCircle size={16} />,
        },
      ],
    },

    // ==========================
    // 🟣 GRUPO COMUNIDAD
    // ==========================
    {
      key: "comunidadGrupo",
      label: "Comunidad",
      icon: <Users size={18} />,
      roles: ["nadadora"],
      subsecciones: [
        {
          key: "comentarios",
          label: "Entrenadores",
          component: ComentariosUser,
          icon: <MessageSquare size={16} />,
        },
        {
          key: "chat",
          label: "Chat",
          component: MuroNadadoras,
          icon: <MessageSquare size={16} />,
        },
      ],
    },

    // ==========================
    // 🎮 GRUPO JUEGOS
    // ==========================
    {
      key: "juegos",
      label: "Juegos",
      icon: <Gamepad2 size={18} />,
      roles: ["nadadora"],
      subsecciones: [
        {
          key: "miniTrivia",
          label: "Mini Trivial",
          component: MiniTriviaUser,
          icon: <Gamepad2 size={16} />,
        },
        {
          key: "cartas",
          label: "Cartas",
          component: AlbumCartas,
          icon: <span style={{ fontSize: 16 }}>🂡</span>, // icono de carta
        },
      ],
    },
  ];

  useEffect(() => {
    if (!rol) return;

    // Determinar el user_id que queremos usar para la config
    const targetUserId = rol === "padre" ? selectedHija?.user_id : user?.id;

    if (!targetUserId) return;

    async function cargarConfig() {
      let { data: config } = await supabase
        .from("config_usuarios")
        .select("*")
        .eq("user_id", targetUserId)
        .single();

      if (!config) {
        const { data: nuevaConfig } = await supabase
          .from("config_usuarios")
          .insert({ user_id: targetUserId })
          .select()
          .single();

        config = nuevaConfig;
      }

      // Aplicar colores
      document.documentElement.style.setProperty(
        "--color-header",
        config.color_header,
      );
      document.documentElement.style.setProperty(
        "--color-texto-header",
        config.color_texto_header,
      );
      document.documentElement.style.setProperty(
        "--color-fondo-dashboard",
        config.color_fondo_dashboard,
      );
      document.documentElement.style.setProperty(
        "--color-menu-lateral",
        config.color_menu_lateral,
      );
      document.documentElement.style.setProperty(
        "--color-menu-activo",
        config.color_menu_activo,
      );

      if (config.inicio_default) setInicioDefault(config.inicio_default);
    }

    cargarConfig();
  }, [selectedHija, rol, user?.id]);

  useEffect(() => {
    if (!selectedHija) return;
    if (!inicioDefault) return;

    if (["inicio", "inicio2"].includes(inicioDefault)) {
      setSection(inicioDefault);
    }
  }, [selectedHija, inicioDefault]);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("id, nombre, rol_id")
        .eq("id", authData.user.id)
        .single();

      setUser(userData);
      const { data: fotoData } = supabase.storage
        .from("fotos-perfil")
        .getPublicUrl(userData?.id + ".jpg");

      setUser((u: any) => ({
        ...u,
        fotoUrl: fotoData?.publicUrl || null,
      }));

      const esPadre = userData?.rol_id === 3;
      const esNadadora = userData?.rol_id === 2;
      setRol(esPadre ? "padre" : "nadadora");

      if (esPadre) {
        const { data: padreData } = await supabase
          .from("padres")
          .select("id")
          .eq("user_id", authData.user.id)
          .single();

        if (padreData) {
          const { data: hijasData } = await supabase
            .from("padres_nadadoras")
            .select("nadadoras(id,user_id, nombre, codigo_unico)")
            .eq("padre_id", padreData.id);
          if (hijasData) {
            const lista = hijasData.map((x: any) => x.nadadoras);
            setHijas(lista);

            if (lista.length > 0) {
              const hija0 = lista[0];
              setSelectedHija(hija0);

              // ✅ Sobrescribir user.id por el id de la hija
              setUser((u: any) => ({
                ...u,
                originalId: authData.user.id, // UUID real del padre
                id: hija0.user_id, // 🔥 aquí está la magia
              }));
            }
          }
        }
      }

      if (esNadadora) {
        const { data: nData } = await supabase
          .from("nadadoras")
          .select("*")
          .eq("user_id", authData.user.id)
          .single();

        if (nData) setSelectedHija(nData);
        // Parsear foto_pos si existe
        const pos = nData.foto_pos
          ? JSON.parse(nData.foto_pos)
          : { x: 0, y: 0 };

        // Verificar si la foto realmente existe
        const { data: fileData, error: fileError } = await supabase.storage
          .from("fotos-perfil")
          .download(authData.user.id + ".jpg");

        setUser((u: any) => ({
          ...u,
          fotoUrl: fileError ? null : URL.createObjectURL(fileData),
          fotoPos: pos,
        }));
      }
    };

    cargarDatos();
  }, []);

  const onCambiarHija = (hija: Nadadora) => {
    setSelectedHija(hija);
    setUser((u: any) => ({
      ...u,
      id: hija.user_id,
      originalId: u.originalId, // mantener UUID del padre
    }));
    setHijaToast(`Viendo datos de: ${hija.nombre}`);

    setTimeout(() => setHijaToast(null), 2500);
  };
  useEffect(() => {
    if (!selectedHija) return;

    async function verificarComentarios() {
      const { data, error } = await supabase
        .from("comentarios_nadadoras")
        .select("id")
        .eq("nadadora_id", selectedHija?.id)
        .eq("leido", false)
        .eq("remitente", "entrenador");

      if (!error && data) {
        setHayComentariosNuevos(data.length > 0);
      }
    }

    verificarComentarios();
  }, [selectedHija, section]);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!user)
    return (
      <div className="splash-container">
        <div className="splash-ripple"></div>
        <img src="/logo.png" className="splash-logo" />
      </div>
    );

  return (
    <div className="userDashboard-container">
      {/* <SnowEffect /> */}
      {/* ✅ HEADER */}
      <header className="userDashboard-header">
        {/* ✅ Menú del usuario */}
        <div className="userDashboard-header-Perfil-Nombre">
          {" "}
          <div
            className="userDashboard-perfilIcono"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setUserMenuPos({
                x: rect.left,
                y: rect.bottom + 8,
              });
              setUserMenuOpen(!userMenuOpen);
            }}
          >
            {user?.fotoUrl && rol !== "padre" ? (
              <div
                className="userDashboard-perfilFotoWrapper"
                style={{
                  width: "50px", // tamaño del círculo
                  height: "50px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <img
                  src={user.fotoUrl}
                  alt="Foto de perfil"
                  onError={() => setUser((u: any) => ({ ...u, fotoUrl: null }))}
                  style={{
                    position: "relative",
                    width: "100%", // ajustar según necesites: puede ser más grande que el wrapper
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffffff",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "#000000ff",
                  fontSize: "24px",
                  fontWeight: "bold",
                }}
              >
                {user?.nombre?.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="userDashboard-header-contenedorNombre-hijas">
            {/* <h1>{user?.nombre}</h1> */}
            <h1>
              {(() => {
                // Buscar en secciones principales
                const seccion = secciones.find((s) => s.key === section);
                if (seccion) return seccion.label;

                // Buscar en subsecciones
                for (const s of secciones) {
                  if (s.subsecciones) {
                    const sub = s.subsecciones.find(
                      (sub) => sub.key === section,
                    );
                    if (sub) return sub.label;
                  }
                }

                // Buscar en labelsExtras
                if (labelsExtras[section]) return labelsExtras[section];

                return "Dashboard";
              })()}
            </h1>
            {/* <h1>
              {(() => {
                // Buscar en secciones principales
                const seccion = secciones.find((s) => s.key === section);
                if (seccion) return seccion.label;

                // Buscar en subsecciones
                for (const s of secciones) {
                  if (s.subsecciones) {
                    const sub = s.subsecciones.find(
                      (sub) => sub.key === section
                    );
                    if (sub) return sub.label;
                  }
                }

                // Buscar en labelsExtras
                if (labelsExtras[section]) return labelsExtras[section];

                return "Dashboard";
              })()}
              {(() => {
                // Solo mostrar gorro en diciembre o enero En enero mediados, quitar este h1 y dejar el de antes
                const month = new Date().getMonth();
                if (month === 11 || month === 0) return " 🎅";
                return null;
              })()}
            </h1> */}

            {rol === "padre" && hijas.length > 1 && (
              <div className="userDashboard-hijasSelector">
                {hijas.map((h) => (
                  <button
                    key={h.id}
                    className={`hijaChip ${
                      selectedHija?.id === h.id ? "selected" : ""
                    }`}
                    onClick={() => onCambiarHija(h)}
                  >
                    {h.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ✅ Menú hamburguesa */}
        <button
          className="userDashboard-hamburguer"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ position: "relative" }}
        >
          ☰
          {(hayMensajesNuevos || hayPostsNuevos || hayComentariosNuevos) && (
            <span className="hamburguerNotificacion">
              {hayMensajesNuevos
                ? numeroMensajes > 99
                  ? "99+"
                  : numeroMensajes
                : "•"}
            </span>
          )}
        </button>

        {/* ✅ Panel del usuario */}
        {userMenuOpen && (
          <div
            className="userDashboard-perfilMenu"
            style={{
              top: userMenuPos.y,
              left: userMenuPos.x,
            }}
          >
            <p
              onClick={() => {
                setSection("perfil");
                setUserMenuOpen(false); // ✅ cerrar menú
              }}
            >
              Ver perfil
            </p>{" "}
            <p
              onClick={() => {
                setSection("ajustesTema");
                setUserMenuOpen(false); // ✅ cerrar menú
              }}
            >
              Ajustes
            </p>
            <p
              className="userDashboard-cerrarSesion"
              onClick={() => {
                setUserMenuOpen(false);
                logout();
              }}
            >
              Cerrar sesión
            </p>
          </div>
        )}
      </header>
      {hijaToast && <div className="userDashboard-toast">{hijaToast}</div>}

      {/* ✅ Layout principal */}
      <div className="userDashboard-content">
        {/* NAV LATERAL */}
        <nav className={`userDashboard-nav ${menuOpen ? "open" : ""} ${rol}`}>
          <ul>
            {secciones
              .filter((s) => {
                if (!s.roles.includes(rol!)) return false;

                // 👇 ocultar el inicio que NO corresponda
                if (s.key === "inicio" && inicioDefault === "inicio2")
                  return false;
                if (s.key === "inicio2" && inicioDefault !== "inicio2")
                  return false;

                return true;
              })
              .map((s) => {
                const tieneSub = s.subsecciones && s.subsecciones.length > 0;
                const isActive =
                  section === s.key ||
                  (tieneSub &&
                    s.subsecciones!.some((sub) => sub.key === section));

                return (
                  <li key={s.key} className={section === s.key ? "active" : ""}>
                    <div
                      className={`nav-item ${isActive ? "active" : ""}`}
                      onClick={() => {
                        if (!tieneSub) {
                          handleSectionChange(s.key);
                          setMenuOpen(false);
                        } else {
                          // Toggle submenú
                          setOpenSubmenus((prev) => ({
                            ...prev,
                            [s.key]: !prev[s.key],
                          }));
                        }
                      }}
                    >
                      <span className="navIcon">
                        {s.icon}
                        {s.key === "comentarios" && hayComentariosNuevos && (
                          <span className="navNotificacionPunto"></span>
                        )}
                        {/* {s.key === "cartas" && hayJuegoHoy && (
                          <span className="navNotificacionPunto juegoHoy"></span>
                        )} */}
                        {s.key === "calendario" && hayEventoHoy && (
                          <span className="navNotificacionPunto eventoHoy"></span>
                        )}
                          {s.key === "comunidadGrupo" &&
                            (
                              hayMensajesNuevos ||
                              hayComentariosNuevos ||
                              hayPostsNuevos
                            ) && (
                              <span className="navNotificacionPunto mensajesNuevosComunidad"></span>
                          )}
                      </span>
                      {s.label}
                      {tieneSub && (
                        <span style={{ marginLeft: "auto" }}>
                          {openSubmenus[s.key] ? "▾" : "▸"}
                        </span>
                      )}
                    </div>

                    {/* Submenú */}
                    {tieneSub && openSubmenus[s.key] && (
                      <ul className="submenu">
                        {s.subsecciones!.map((sub) => (
                          <li
                            key={sub.key}
                            className={section === sub.key ? "active" : ""}
                            onClick={() => {
                              handleSectionChange(sub.key);
                              setMenuOpen(false);
                            }}
                          >
                            <div className="submenu-item">
                              {sub.icon && (
                                <span className="navIcon">
                                  {sub.icon}
                                  {sub.key === "comentarios" &&
                                    hayComentariosNuevos && (
                                      <span className="navNotificacionPunto"></span>
                                    )}
                                  {/* {sub.key === "cartas" && hayJuegoHoy && (
                                    <span className="navNotificacionPunto juegoHoy"></span>
                                  )} */}
                                 {sub.key === "chat" &&
                                    (hayMensajesNuevos || hayPostsNuevos) && (
                                      <span className="navNotificacionPunto mensajesNuevos">
                                        {hayMensajesNuevos ? numeroMensajes : ""}
                                      </span>
                                  )}
                                </span>
                              )}
                              <span className="submenu-label">{sub.label}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
          </ul>
        </nav>

        <UserNotificationsSlider
          userId={rol === "padre" ? user.originalId : user.id}
          section={section}
        />

        {/* ✅ MAIN */}
        <main className="userDashboard-main">
          {loadingSection && (
            <div className="userDashboard-loader-alternate">
              {loaderTurn % 2 === 0 ? (
                // <div className="userDashboard-loader-logoSpin">
                //   <img src="/logo.png" alt="Loading..." />
                // </div>
                <div className="userDashboard-loader-rippleLogo">
                  <div className="circle"></div>
                  <div className="circle"></div>
                  <img src="/logo.png" alt="Loading..." />
                </div>
              ) : (
                <div className="userDashboard-loader-rippleLogo">
                  <div className="circle"></div>
                  <div className="circle"></div>
                  <img src="/logo.png" alt="Loading..." />
                </div>
              )}
            </div>
          )}

          {!loadingSection &&
            (() => {
              if (!selectedHija) return null;

              // Buscar sección actual
              const seccionActual = secciones.find((s) => s.key === section);

              // Renderizar subsección si existe
              if (
                seccionActual?.subsecciones &&
                seccionActual.subsecciones.length > 0
              ) {
                const subseccionActual = seccionActual.subsecciones.find(
                  (sub) => sub.key === section,
                );
                if (subseccionActual) {
                  const Componente = subseccionActual.component;
                  return <Componente nadadoraId={selectedHija.id} />;
                }
              }

              // Renderizar secciones normales
              switch (section) {
                case "perfil":
                  return <PerfilUsuario userId={user.id} />;
                case "ajustesTema":
                  return (
                    <AjustesTema
                      userId={user.id}
                      onCambioInicio={(nuevoInicio) => {
                        setInicioDefault(nuevoInicio);
                        setSection(nuevoInicio); // 🔥 cambiar automáticamente
                      }}
                    />
                  );
                case "inicio":
                  return (
                    <InicioUser
                      nadadoraId={selectedHija.id}
                      setSection={setSection}
                      rol={rol!}
                    />
                  );
                case "inicio2":
                  return (
                    <InicioUser2
                      nadadoraId={selectedHija.id}
                      setSection={setSection}
                      rol={rol!}
                    />
                  );

                case "asistencias":
                  return <AsistenciasUser userId={user.id} />;
                case "competiciones":
                  return <CompeticionesUser userId={user.id} />;
                case "calendario":
                  return <CalendarioUser userId={user.id} />;
                case "entrenamientos":
                  return <EntrenamientoUser userId={user.id} />;
                case "historialAlturas":
                  return <HistorialAlturasUser userId={user.id} />;
                case "historialTiempos":
                  return <HistorialTiemposUser nadadoraId={selectedHija.id} />;
                case "retos":
                  return <RetosUser nadadoraId={selectedHija.id} />;
                case "coreografias":
                  return <CoreografiasUser userId={user.id} />;
                case "valoracion":
                  return (
                    <ValoracionEntrenamiento userId={user.id} rol={rol!} />
                  );
                case "salud":
                  return <HistorialSaludUser nadadoraId={selectedHija.id} />;
                case "comentarios":
                  return <ComentariosUser nadadoraId={selectedHija.id} />;
                case "chat":
                  return <MuroNadadoras nadadoraId={selectedHija.id} />;
                case "cartas":
                  return (
                    <AlbumCartas
                      nadadoraId={selectedHija.id}
                      irACoreografia={(cartas) => {
                        setCartasCoreografia(cartas);
                        setSection("juegoCartas");
                      }}
                    />
                  );
                case "juegoCartas":
                  return (
                    <TableroCoreografia cartasDisponibles={cartasCoreografia} />
                  );
                case "miniTrivia":
                  return <MiniTriviaUser nadadoraId={selectedHija.id} />;
                default:
                  return null;
              }
            })()}
        </main>
              {showPushModal && (
<Dialog
  open={showPushModal}
  onClose={() => setShowPushModal(false)}
  fullWidth
  maxWidth="xs"
>
  <DialogTitle>Activar notificaciones</DialogTitle>

  <DialogContent>
    Te avisaremos de eventos importantes y mensajes relevantes.
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setShowPushModal(false)} color="inherit">
      Ahora no
    </Button>

    <Button
      variant="contained"
      onClick={async () => {
        const ok = await enablePush(user.id);
        if (ok) setShowPushModal(false);
      }}
    >
      Activar 🔔
    </Button>
  </DialogActions>
</Dialog>
)}
      </div>

    </div>
  );
}
