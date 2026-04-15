import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

import "./InicioUser.css";
import CarruselInicio from "./CarruselInicio";
import { CATEGORIAS } from "../../utils/categorias";
import { FRASES } from "../../utils/frasesMotivacion";

interface InicioUserProps {
  nadadoraId: number;
  setSection: (s: string) => void;
  rol: "padre" | "nadadora";
}

const MAPEO_ASISTENCIAS: Record<
  string,
  { texto: string; icono: string; color: string }
> = {
  asistencia: { texto: "Asistencia", icono: "✅", color: "#4ce751ff" },
  falta: { texto: "Falta", icono: "❌", color: "#ff6150ff" },
  retraso: { texto: "Retraso", icono: "⏰", color: "#f39c12" },
  enferma: { texto: "Enferma", icono: "🤒", color: "#c873e9ff" },
  justificada: { texto: "Justificada", icono: "📄", color: "#35aeffff" },
};

function obtenerCategoriaPorNivel(nivel: number) {
  const categoria = CATEGORIAS.find((cat) => cat.niveles.includes(nivel));
  return categoria || { nombre: "Sin categoría", icono: "", color: "#999" };
}

export default function InicioUser({
  nadadoraId,
  setSection,
  rol,
}: InicioUserProps) {
  const [nivel, setNivel] = useState(0);
  const [progreso, setProgreso] = useState(0);
  const [puntos, setPuntos] = useState(0);
  const [nombre, setNombre] = useState("");
  const [ultimaAsistencia, setUltimaAsistencia] = useState<{
    fecha: string;
    asistencia: string;
  } | null>(null);
  const [registroValoracionHoy, setRegistroValoracionHoy] = useState(false);
  const hoyStr = new Date().toISOString().split("T")[0];
  const ultimaAsistenciaHoy =
    ultimaAsistencia &&
    new Date(ultimaAsistencia.fecha).toISOString().split("T")[0] === hoyStr;
  const [racha, setRacha] = useState(0);
  const [emojiRacha, setEmojiRacha] = useState("💧");

  useEffect(() => {
    const checkValoracionHoy = async () => {
      const { data } = await supabase
        .from("valoracion_entrenamiento")
        .select("id")
        .eq("nadadora_id", nadadoraId)
        .eq("fecha", hoyStr)
        .maybeSingle();

      setRegistroValoracionHoy(!!data);
    };

    checkValoracionHoy();
  }, [nadadoraId, hoyStr]);

  useEffect(() => {
    const cargarDatos = async () => {
      // ✅ 1. Cargar datos generales
      const { data, error } = await supabase
        .from("nadadoras")
        .select(
          `
          id,
          nombre,
          puntos,
          nivel,
          progreso,
          nadadoras_logros(
            logro_id,
            fecha,
            logros(
              id,
              nombre,
              tipo
            )
          )
        `,
        )
        .eq("id", nadadoraId)
        .maybeSingle();

      if (error) {
        console.error("Error al cargar datos:", error);
        return;
      }

      if (data) {
        setNombre(data.nombre);
        setPuntos(data.puntos || 0);
        setNivel(data.nivel || 1);
        setProgreso(data.progreso || 0);
      }
    };

    cargarDatos();
  }, [nadadoraId]);

  // ✅ 3. Cargar última asistencia REAL
  useEffect(() => {
    const cargarUltimaAsistencia = async () => {
      const { data: grupoActual, error: errorGrupo } = await supabase
        .from("nadadora_grupos")
        .select("id")
        .eq("nadadora_id", nadadoraId)
        .order("fecha_asignacion", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (errorGrupo || !grupoActual) {
        console.log("No se encontró grupo actual");
        return;
      }

      const { data, error } = await supabase
        .from("asistencias")
        .select("fecha, asistencia")
        .eq("nadadora_grupo_id", grupoActual.id)
        .order("fecha", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.log("Error obteniendo asistencia:", error);
        return;
      }

      if (data) setUltimaAsistencia(data);
    };

    cargarUltimaAsistencia();
  }, [nadadoraId]); // ✅ Se ejecuta SOLO cuando cambias de hija

  const [fraseDiaria, setFraseDiaria] = useState("");
  // Frase diaria: cambia una vez al día
  useEffect(() => {
    const indice = new Date().getDate() % FRASES.length; // Cambia cada día
    setFraseDiaria(FRASES[indice]);
  }, []);

  useEffect(() => {
    const calcularRacha = async () => {
      // 1️⃣ Obtener últimas asistencias (los últimos 30 días por ejemplo)
      const { data: grupoActual } = await supabase
        .from("nadadora_grupos")
        .select("id")
        .eq("nadadora_id", nadadoraId)
        .order("fecha_asignacion", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!grupoActual) return;

      const { data: asistencias } = await supabase
        .from("asistencias")
        .select("fecha, asistencia")
        .eq("nadadora_grupo_id", grupoActual.id)
        .order("fecha", { ascending: false })
        .limit(30); // últimos 30 días

      if (!asistencias) return;

      let r = 0;
      for (const a of asistencias) {
        const tipo = a.asistencia.toLowerCase();
        if (tipo === "asistencia") r++;
        else if (tipo === "falta" || tipo === "retraso")
          break; // rompe la racha
        else continue; // enferma, justificada, noletocabaentrenar → mantener racha
      }
      setRacha(r);

      // Cambiar emoji según racha
      if (r === 0)
        setEmojiRacha("💧"); // gota pequeña
      else if (r < 4)
        setEmojiRacha("🌊"); // ola pequeña
      else if (r <= 7) setEmojiRacha("🐠");
      else if (r <= 10) setEmojiRacha("🐬");
      else if (r < 15)
        setEmojiRacha("🏊‍♀️"); // nadadora
      else setEmojiRacha("🏆"); // premio/medalla por racha larga
    };

    calcularRacha();
  }, [nadadoraId]);
  const escalaPulso = racha === 0 ? 5 : 5 + Math.min(racha * 2, 35);

  return (
    <div className="InicioUser-container">
      <h2 className="InicioUser-saludo">Hola, {nombre}</h2>
      <div className="InicioUser-rachaContainer">
        <div
          className={`InicioUser-circuloRacha ${racha > 4 ? "pulsing" : ""}`}
          style={
            {
              background: `conic-gradient( rgba(0, 191, 255, 0.64) ${racha * 7}%, #d3f0ff 0)`,
              transition: "background 0.5s ease",
              "--glow-intensity": `${escalaPulso}px`,
            } as React.CSSProperties
          }
        >
          {emojiRacha}
        </div>
        <p className="InicioUser-textoRacha">
          {racha} días seguidos {emojiRacha === "🏆" ? "🏆" : "💦"}
        </p>
      </div>

      {/* ✅ NIVEL / PUNTOS */}
      <div className="InicioUser-nivelContainer">
        <div className="InicioUser-nivelCategoria">
          <p className="InicioUser-nivel">Nivel: {nivel}</p>
          <p
            className="InicioUser-categoria"
            style={{
              backgroundColor: obtenerCategoriaPorNivel(nivel).color,
              padding: "2px 6px",
              borderRadius: "6px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            {obtenerCategoriaPorNivel(nivel).icono}{" "}
            {obtenerCategoriaPorNivel(nivel).nombre}
          </p>
        </div>

        <p className="InicioUser-puntos">Puntos: {puntos}</p>

        <div className="InicioUser-barraFondo">
          <div
            className="InicioUser-barraProgreso"
            style={{ width: `${progreso}%` }}
          />
        </div>
        <p className="InicioUser-progreso">
          {progreso.toFixed(0)}% hacia el siguiente nivel
        </p>
      </div>
      <p className="InicioUser-fraseDiariaCard">💡 {fraseDiaria}</p>
      {ultimaAsistenciaHoy && !registroValoracionHoy && rol !== "padre" && (
        <div
          className="InicioUser-valoracionAlertMobile"
          onClick={() => setSection("valoracion")}
        >
          <span className="InicioUser-valoracionIcon">📝</span>
          <div className="InicioUser-valoracionTextContainer">
            <span className="InicioUser-valoracionText">
              No olvides registrar tu bienestar de hoy
            </span>
            <span className="InicioUser-valoracionTap">Toca aquí ➤</span>
          </div>
        </div>
      )}

      {ultimaAsistencia &&
        (() => {
          const clave = ultimaAsistencia.asistencia.toLowerCase();

          return (
            <div
              className="InicioUser-asistenciaCard"
              style={{
                borderLeftColor: MAPEO_ASISTENCIAS[clave]?.color || "#999",
              }}
            >
              <p className="InicioUser-asistenciaTitulo">Última asistencia</p>

              <p className="InicioUser-asistenciaEstado">
                {MAPEO_ASISTENCIAS[clave]?.icono}{" "}
                {MAPEO_ASISTENCIAS[clave]?.texto || ultimaAsistencia.asistencia}
              </p>

              <p className="InicioUser-asistenciaFecha">
                {new Date(ultimaAsistencia.fecha).toLocaleDateString()}
              </p>
            </div>
          );
        })()}

      {/* ✅ CARRUSEL */}
      <div className="InicioUser-carrusel">
        <CarruselInicio nadadoraId={nadadoraId} />
      </div>
    </div>
  );
}
