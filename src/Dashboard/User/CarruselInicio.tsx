import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./CarruselInicio.css";

interface CarruselInicioProps {
  nadadoraId: number;
}

interface ResultadoTiempo {
  prueba: string;
  tiempo: number;
  fecha: string;
}

const MAPEO_PRUEBAS: Record<string, string> = {
  "50m_libre": "50 libres",
  "100m_libre": "100 libres",
  "50m_kick": "50 kick-pull",
  "100_kick": "100 kick-pull",
  "200_estilos": "200 estilos",
};
const MAPEO_COLORES_COMPETICION: Record<string, string> = {
  rutinas: "#6c5ce7",
  figuras: "#00b894",
  tiempos: "#fd79a8",
  niveles: "#f1c40f",
};

const formatearTiempo = (tiempo: number) => {
  if (tiempo < 60) return tiempo.toFixed(2) + "s"; // menos de 1 minuto
  const minutos = Math.floor(tiempo / 60);
  const segundos = Math.floor(tiempo % 60);
  const decimales = Math.floor((tiempo % 1) * 100);
  return `${minutos}:${segundos.toString().padStart(2, "0")}.${decimales
    .toString()
    .padStart(2, "0")}`;
};

export default function CarruselInicio({ nadadoraId }: CarruselInicioProps) {
  const [mejoresResultados, setMejoresResultados] = useState<ResultadoTiempo[]>(
    [],
  );
  const [proximaCompeticion, setProximaCompeticion] = useState<any | null>(
    null,
  );

  const [asistenciasMes, setAsistenciasMes] = useState<{
    porcentajeAsistencia: number;
    porcentajeRetrasos: number;
    porcentajeFaltas: number;
    total: number;
  }>({
    porcentajeAsistencia: 0,
    porcentajeRetrasos: 0,
    porcentajeFaltas: 0,
    total: 0,
  });

  const carruselRef = useRef<HTMLDivElement>(null);
  // const [indiceActivo, setIndiceActivo] = useState(0);
  // const totalTarjetas = 4;

  const [historialPuntos, setHistorialPuntos] = useState<
    {
      id: number;
      puntos: number;
      motivo: string;
      detalle: string | null;
      origen: string;
      fecha: string;
    }[]
  >([]);

  useEffect(() => {
    if (!nadadoraId) return;
    const cargarHistorialPuntos = async () => {
      const { data, error } = await supabase
        .from("historial_puntos")
        .select("id, puntos, motivo, detalle, origen, fecha")
        .eq("nadadora_id", nadadoraId)
        .order("fecha", { ascending: false });
      if (error) return console.error(error);
      if (data) setHistorialPuntos(data);
    };
    cargarHistorialPuntos();
  }, [nadadoraId]);

  // ✅ Cargar asistencias del mes
  useEffect(() => {
    if (!nadadoraId) return;

    const cargarAsistenciasMes = async () => {
      // 1️⃣ Buscar todos los grupos de la nadadora
      const { data: grupos, error: errorGrupos } = await supabase
        .from("nadadora_grupos")
        .select("id")
        .eq("nadadora_id", nadadoraId);

      if (errorGrupos || !grupos) return console.error(errorGrupos);

      const nadadoraGrupoIds = grupos.map((g) => g.id);

      const hoy = new Date();
      const firstOfMonth = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const todayStr = hoy.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("asistencias")
        .select("*")
        .eq("nadadora_grupo_id", nadadoraGrupoIds)
        .gte("fecha", firstOfMonth)
        .lte("fecha", todayStr);

      if (error) return console.error(error);

      const asistencias =
        data?.filter((a) => a.asistencia === "Asistencia").length ?? 0;
      const retrasos =
        data?.filter((a) => a.asistencia === "Retraso").length ?? 0;
      const faltas =
        data?.filter(
          (a) =>
            a.asistencia === "Falta" ||
            a.asistencia === "FaltaJustificada" ||
            a.asistencia === "Enferma",
        ).length ?? 0;

      const total = asistencias + retrasos + faltas;

      const porcentajeAsistencia = total ? (asistencias / total) * 100 : 0;
      const porcentajeRetrasos = total ? (retrasos / total) * 100 : 0;
      const porcentajeFaltas = total ? (faltas / total) * 100 : 0;

      setAsistenciasMes({
        porcentajeAsistencia,
        porcentajeRetrasos,
        porcentajeFaltas,
        total,
      });
    };

    cargarAsistenciasMes();
  }, [nadadoraId]);

  // ✅ Cargar mejores resultados
  useEffect(() => {
    if (!nadadoraId) return;
    const cargarTiempos = async () => {
      const { data, error } = await supabase
        .from("tiempos")
        .select("prueba, tiempo, fecha")
        .eq("nadadora_id", nadadoraId);
      if (error) return console.error(error);

      if (data) {
        const mejores: Record<string, ResultadoTiempo> = {};
        for (const r of data as any[]) {
          const tiempoNum = parseFloat(r.tiempo);
          if (!mejores[r.prueba] || tiempoNum < mejores[r.prueba].tiempo) {
            mejores[r.prueba] = {
              prueba: r.prueba,
              tiempo: tiempoNum,
              fecha: new Date(r.fecha).toLocaleDateString(),
            };
          }
        }
        setMejoresResultados(Object.values(mejores));
      }
    };
    cargarTiempos();
  }, [nadadoraId]);

  // ✅ Próxima competición
  useEffect(() => {
    if (!nadadoraId) return;
    const cargarProximaCompeticion = async () => {
      const { data, error } = await supabase
        .from("competiciones")
        .select("*")
        .gte("fecha", new Date().toISOString().split("T")[0])
        .order("fecha", { ascending: true })
        .limit(1)
        .single();
      if (error) return console.error(error);
      if (data) setProximaCompeticion(data);
    };
    cargarProximaCompeticion();
  }, [nadadoraId]);

  const irSiguiente = () => {
    const carrusel = carruselRef.current;
    if (!carrusel) return;

    carrusel.scrollBy({ left: 280, behavior: "smooth" }); // 260px tarjeta + 20px gap
    // setIndiceActivo((prev) => (prev + 1) % totalTarjetas);
  };

  const irAnterior = () => {
    const carrusel = carruselRef.current;
    if (!carrusel) return;

    carrusel.scrollBy({ left: -280, behavior: "smooth" });
    // setIndiceActivo((prev) => (prev - 1 + totalTarjetas) % totalTarjetas);
  };

  return (
    <div className="CarruselInicio-User-carrusel-wrapper">
      {/* Flechas */}
      <button className="CarruselInicio-Flecha izquierda" onClick={irAnterior}>
        ◀
      </button>
      <button className="CarruselInicio-Flecha derecha" onClick={irSiguiente}>
        ▶
      </button>
      <div className="CarruselInicio-User-carrusel" ref={carruselRef}>
        {/* Tarjeta 1 */}
        <div
          className="CarruselInicio-User-tarjeta"
          style={{ background: "rgba(76, 231, 81, 0.15)" }}
        >
          <h3 className="CarruselInicio-User-titulo">Top resultados</h3>
          {mejoresResultados.length ? (
            <div className="CarruselInicio-User-resultados">
              {mejoresResultados.map((r) => (
                <div
                  key={r.prueba}
                  className="CarruselInicio-User-resultado-item"
                >
                  <span className="CarruselInicio-User-resultado-prueba">
                    {MAPEO_PRUEBAS[r.prueba] || r.prueba}
                  </span>
                  <span className="CarruselInicio-User-resultado-tiempo">
                    {formatearTiempo(r.tiempo)}
                  </span>
                  <span className="CarruselInicio-User-resultado-fecha">
                    ({r.fecha})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="CarruselInicio-User-sinResultados">
              No hay resultados aún
            </p>
          )}
        </div>
        {/* Tarjeta 2 */}
        <div
          className="CarruselInicio-User-tarjeta"
          style={{
            background: proximaCompeticion
              ? MAPEO_COLORES_COMPETICION[proximaCompeticion.tipo] + "20" // translúcido
              : "rgba(255,255,255,0.7)",
          }}
        >
          <h3 className="CarruselInicio-User-titulo CarruselInicio-User-titulo--competicion">
            Próxima competición
          </h3>

          {proximaCompeticion ? (
            <div className="CarruselInicio-User-competicion-detalle">
              <span className="CarruselInicio-User-competicion-nombre">
                {proximaCompeticion.nombre}
              </span>
              <span
                className="CarruselInicio-User-competicion-tipo-badge"
                style={{
                  background:
                    MAPEO_COLORES_COMPETICION[proximaCompeticion.tipo],
                }}
              >
                {proximaCompeticion.tipo.toUpperCase()}
              </span>
              <span className="CarruselInicio-User-competicion-fecha">
                Fecha: {new Date(proximaCompeticion.fecha).toLocaleDateString()}
              </span>

              <span className="competicion-hora llegada">
                ⏱ Llegada: {proximaCompeticion.hora_llegada.slice(0, 5)}
              </span>
              <span className="competicion-hora inicio">
                🏊 Inicio: {proximaCompeticion.hora_comienzo.slice(0, 5)}
              </span>

              <span className="CarruselInicio-User-competicion-lugar">
                Lugar: {proximaCompeticion.lugar}
              </span>
            </div>
          ) : (
            <p className="CarruselInicio-User-sinResultados">
              No hay competiciones programadas
            </p>
          )}
        </div>
        {/* Tarjeta 3 */}
        <div
          className="CarruselInicio-User-tarjeta"
          style={{ background: "rgba(53, 174, 255, 0.15)" }}
        >
          <h3 className="CarruselInicio-User-titulo">Asistencias Mes</h3>

          <div className="mini-kpi-container tri-layout">
            <div className="mini-kpi">
              <div
                className="mini-kpi-circle"
                style={
                  {
                    "--porcentaje": asistenciasMes.porcentajeAsistencia,
                    "--color": "#4ce751",
                  } as React.CSSProperties
                }
              >
                ✅
              </div>
              <strong>{asistenciasMes.porcentajeAsistencia.toFixed(0)}%</strong>
              <small>Asistencias</small>
            </div>
            <div className="mini-kpi">
              <div
                className="mini-kpi-circle"
                style={
                  {
                    "--porcentaje": asistenciasMes.porcentajeRetrasos,
                    "--color": "#f39c12",
                  } as React.CSSProperties
                }
              >
                ⏱️
              </div>
              <strong>{asistenciasMes.porcentajeRetrasos.toFixed(0)}%</strong>
              <small>Retrasos</small>
            </div>
            <div className="mini-kpi">
              <div
                className="mini-kpi-circle"
                style={
                  {
                    "--porcentaje": asistenciasMes.porcentajeFaltas,
                    "--color": "#ff6150",
                  } as React.CSSProperties
                }
              >
                ❌
              </div>
              <strong>{asistenciasMes.porcentajeFaltas.toFixed(0)}%</strong>
              <small>Faltas</small>
            </div>
          </div>
        </div>
        {/* Tarjeta 4: Historial de puntos */}
        <div
          className="CarruselInicio-User-tarjeta"
          style={{ background: "rgba(255, 223, 93, 0.15)" }}
        >
          <h3 className="CarruselInicio-User-titulo">Historial de puntos</h3>

          <div className="CarruselInicio-User-historialScroll">
            {historialPuntos.length ? (
              historialPuntos.map((h) => {
                let detalleAMostrar = h.detalle;

                // Formateo especial para cambios de asistencia
                if (h.origen === "asistencia") {
                  if (h.detalle?.includes("→ Asistencia")) {
                    detalleAMostrar = "Asistencia";
                  } else if (h.detalle?.includes("→ Retraso")) {
                    detalleAMostrar = "Retraso";
                  }
                }
                // Formateo especial para puntos manuales
                if (h.origen === "manual") {
                  detalleAMostrar = "Manual";
                }

                return (
                  <div key={h.id} className="CarruselInicio-User-historialItem">
                    <div
                      className="historial-puntos-circle"
                      style={{
                        background:
                          h.origen === "logro"
                            ? "#FFD700"
                            : h.origen === "asistencia"
                              ? h.detalle?.includes("Asistencia")
                                ? "#4CE751"
                                : h.detalle?.includes("Retraso")
                                  ? "#f39c12"
                                  : "#4CE7F1"
                              : h.origen === "manual"
                                ? "#a67df7"
                                : h.origen === "reto"
                                  ? "#4CAF50"
                                  : h.origen === "Mejora de tiempo"
                                    ? "#fd79a8"
                                    : "#999",
                      }}
                    >
                      {h.origen === "logro"
                        ? "🏆"
                        : h.origen === "asistencia"
                          ? h.detalle?.includes("Asistencia")
                            ? "✅"
                            : h.detalle?.includes("Retraso")
                              ? "⏱️"
                              : "💧"
                          : h.origen === "manual"
                            ? "✏️"
                            : h.origen === "reto"
                              ? "🎯"
                              : h.origen === "Mejora de tiempo"
                                ? "⏱️"
                                : "❔"}
                    </div>
                    <div className="historial-detalle">
                      <strong>{detalleAMostrar || h.motivo}</strong>
                      <span className="historial-fecha">
                        {new Date(h.fecha).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="historial-puntos-number">
                      {h.puntos} pts
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="CarruselInicio-User-sinResultados">
                No hay historial de puntos
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
