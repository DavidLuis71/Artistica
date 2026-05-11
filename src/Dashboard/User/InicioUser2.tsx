import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { FRASES } from "../../utils/frasesMotivacion";
import "./InicioUser2.css";
import { Droplet } from "lucide-react";
import BurbujaDiaria from "../../utils/BurbujaDiaria";
import {
  formatearDiaEntrenamiento,
  formatearPrueba,
  formatearTiempo,
} from "../../utils/Formatear";

interface InicioUser2Props {
  nadadoraId: number;
  setSection: (s: string) => void;
  rol: "padre" | "nadadora";
}


interface BloqueEntreno {
  titulo: string;
  series: string[];
}

interface Entrenamiento {
  id: number;
  descripcion: BloqueEntreno[];
  hora_inicio: string;
  tipo_sesion: string;
  fecha: string;
}
interface Vacacion {
  id: number;
  titulo: string;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion?: string;
}

interface Competicion {
  id: number;
  nombre: string;
  fecha: string;
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

export default function InicioUser2({
  nadadoraId,
  setSection,
  rol,
}: InicioUser2Props) {
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState(1);
  const [progreso, setProgreso] = useState(0);
  const [puntos, setPuntos] = useState(0);
  const [racha, setRacha] = useState(0);
  const [emojiRacha, setEmojiRacha] = useState("💧");
  const [fraseDiaria, setFraseDiaria] = useState("");
  const [proximoEntrenamiento, setProximoEntrenamiento] = useState<
    | { tipo: "sesion"; info: Entrenamiento }
    | { tipo: "vacaciones"; info: Vacacion; siguiente?: Entrenamiento }
    | null
  >(null);
  const [proximasCompeticiones, setProximasCompeticiones] = useState<
    Competicion[]
  >([]);
  const [mejoresTiempos, setMejoresTiempos] = useState<
    { prueba: string; tiempo: number; fecha: string }[]
  >([]);

  const [ultimaAsistencia, setUltimaAsistencia] = useState<{
    fecha: string;
    asistencia: string;
  } | null>(null);
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
  const [rankingPctPuro, setRankingPctPuro] = useState<number | null>(null);
  const hoyStr = new Date().toISOString().split("T")[0];
  const [registroValoracionHoy, setRegistroValoracionHoy] = useState(false);
  const ultimaAsistenciaHoy =
    ultimaAsistencia &&
    new Date(ultimaAsistencia.fecha).toISOString().split("T")[0] === hoyStr;

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
    const pruebaRanking = async () => {
      const { data } = await supabase.rpc("get_ranking_nadadoras");

      const { data: asistenciasData, error: asistenciasError } =
        await supabase.rpc("get_asistencias_nadadoras");
      if (asistenciasError) throw asistenciasError;

      const datosCombinados = data.map((n: any) => {
        const asistencia = asistenciasData.find(
          (a: any) => a.nadadora_id === n.nadadora_id,
        );

        return {
          ...n,
          dias_asistencia: asistencia?.dias_asistencia || 0,
          dias_falta: asistencia?.dias_falta || 0,
          dias_retraso: asistencia?.dias_retraso || 0,
          dias_justificada: asistencia?.dias_justificada || 0,
          dias_enferma: asistencia?.dias_enferma || 0,
        };
      });
      // console.log("🚀 ~ datosCombinados:", datosCombinados);
      const ranking = calcularRanking(datosCombinados, nadadoraId);
      // console.log(ranking);

      // Guardamos el % en estado
      setRankingPctPuro(ranking.pctRanking);
    };
    pruebaRanking();
  }, [nadadoraId]);
  // Suponiendo que 'data' es el array de todas las nadadoras
  const calcularRanking = (nadadoras: any[], nadadoraId: number) => {
    const maxCartas = Math.max(...nadadoras.map((n) => n.cant_cartas));
    const maxValoraciones = Math.max(
      ...nadadoras.map((n) => n.cant_valoraciones),
    );
    const maxPuntos = Math.max(...nadadoras.map((n) => n.puntos_totales));
    const PUNTOS_ASISTENCIA = 1; // asistencia normal
    const PUNTOS_FALTA = -1; // falta
    const PUNTOS_RETRASO = 0.3; // retraso leve
    const PUNTOS_JUSTIFICADA = -0.4; // justificada leve
    const PUNTOS_ENFERMA = -0.1; // no afecta
    const nadadorasConScore = nadadoras.map((n) => {
      // Normalizamos cartas, valoraciones y puntos
      const pctCartas = maxCartas ? n.cant_cartas / maxCartas : 0;
      const pctValoraciones = maxValoraciones
        ? n.cant_valoraciones / maxValoraciones
        : 0;
      const pctPuntos = maxPuntos ? n.puntos_totales / maxPuntos : 0;

      const asistenciaNeta =
        (n.dias_asistencia || 0) * PUNTOS_ASISTENCIA +
        (n.dias_falta || 0) * PUNTOS_FALTA +
        (n.dias_retraso || 0) * PUNTOS_RETRASO +
        (n.dias_justificada || 0) * PUNTOS_JUSTIFICADA +
        (n.dias_enferma || 0) * PUNTOS_ENFERMA;
      const maxAsistenciaNeta = Math.max(
        ...nadadoras.map(
          (n) =>
            n.dias_asistencia -
            n.dias_falta * 1 -
            n.dias_retraso * 0.5 -
            n.dias_justificada * 0.25,
        ),
      );

      const pctAsistencia = maxAsistenciaNeta
        ? asistenciaNeta / maxAsistenciaNeta
        : 0;
      // Score ponderado final
      // const scoreFinal =
      //   0.4 * pctPuntos +
      //   0.3 * pctCartas +
      //   0.3 * pctValoraciones +
      //   scoreAsistencias;
      const scoreFinal =
        0.45 * pctAsistencia +
        0.3 * pctPuntos +
        0.1 * pctCartas +
        0.15 * pctValoraciones;

      return { ...n, scoreFinal };
    });

    // Ordenar descendente por score
    nadadorasConScore.sort((a, b) => b.scoreFinal - a.scoreFinal);
    // console.log("🚀 ~ nadadorasConScore:", nadadorasConScore);

    // Encontrar posición y percentil de la nadadora
    const total = nadadorasConScore.length;
    const posicion =
      nadadorasConScore.findIndex((n) => n.nadadora_id === nadadoraId) + 1;
    const pctRanking = ((total - posicion) / total) * 100;

    return {
      posicion,
      pctRanking,
      scoreFinal: nadadorasConScore[posicion - 1].scoreFinal,
    };
  };

  // Cargar datos de la nadadora
  useEffect(() => {
    const cargarDatos = async () => {
      const { data } = await supabase
        .from("nadadoras")
        .select("nombre, nivel, progreso, puntos")
        .eq("id", nadadoraId)
        .maybeSingle();

      if (data) {
        setNombre(data.nombre);
        setNivel(data.nivel || 1);
        setProgreso(data.progreso || 0);
        setPuntos(data.puntos || 0);
      }
    };
    cargarDatos();
  }, [nadadoraId]);

  // Racha últimas asistencias
  useEffect(() => {
    const calcularRacha = async () => {
      const { data: grupo } = await supabase
        .from("nadadora_grupos")
        .select("id")
        .eq("nadadora_id", nadadoraId)
        .order("fecha_asignacion", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!grupo) return;

      const { data: asistencias } = await supabase
        .from("asistencias")
        .select("fecha, asistencia")
        .eq("nadadora_grupo_id", grupo.id)
        .order("fecha", { ascending: false })
        .limit(30);

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

      // Emoji según racha
      if (r === 0) setEmojiRacha("💧");
      else if (r < 4) setEmojiRacha("🌊");
      else if (r < 7) setEmojiRacha("🐠");
      else if (r < 10) setEmojiRacha("🐬");
      else if (r < 15) setEmojiRacha("🏊‍♀️");
      else if (r < 30)
        setEmojiRacha("🌟"); // constancia destacada
      else if (r < 60)
        setEmojiRacha("🔥"); // racha épica
      else setEmojiRacha("🏆"); // leyenda
    };
    calcularRacha();
  }, [nadadoraId]);

  useEffect(() => {
    const cargarUltimaAsistencia = async () => {
      const { data: grupo } = await supabase
        .from("nadadora_grupos")
        .select("id")
        .eq("nadadora_id", nadadoraId)
        .order("fecha_asignacion", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!grupo) return;

      const { data: asistencia } = await supabase
        .from("asistencias")
        .select("fecha, asistencia")
        .eq("nadadora_grupo_id", grupo.id)
        .order("fecha", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (asistencia) setUltimaAsistencia(asistencia);
    };

    cargarUltimaAsistencia();
  }, [nadadoraId]);

  // Frase diaria
  useEffect(() => {
    const indice = new Date().getDate() % FRASES.length; // Cambia cada día
    setFraseDiaria(FRASES[indice]);
  }, []);

// --- Próximo entrenamiento considerando vacaciones ---
useEffect(() => {
  const cargarProximoEntrenamiento = async () => {
    const { data: grupo } = await supabase
      .from("nadadora_grupos")
      .select("grupo_id")
      .eq("nadadora_id", nadadoraId)
      .order("fecha_asignacion", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!grupo) return;

    const hoyStr = new Date().toISOString().split("T")[0];

    const { data: sesiones } = await supabase
      .from("sesiones_entrenamiento")
      .select("*")
      .gte("fecha", hoyStr)
      .order("fecha", { ascending: true });

    const { data: vacaciones } = await supabase
      .from("vacaciones")
      .select("*")
      .gte("fecha_fin", hoyStr)
      .order("fecha_inicio", { ascending: true });

    if (!sesiones) return;

    const vacArray: Vacacion[] = vacaciones || [];

    // Filtrar sesiones según grupo (ejemplo reglas existentes)
    const sesionesFiltradas = sesiones.filter((s: Entrenamiento) => {
      const diaSemana = new Date(s.fecha).getDay(); // 0 dom ... 6 sáb

      // Ejemplo: grupo 2 no entrena martes y jueves
      if (grupo.grupo_id === 2 && (diaSemana === 2 || diaSemana === 4)) {
        return false;
      }

      return true;
    });

    let proximo: typeof proximoEntrenamiento = null;

    for (const sesion of sesionesFiltradas) {
      const fechaSesion = new Date(sesion.fecha);

      const estaEnVacaciones = vacArray.some(
        (v) =>
          fechaSesion >= new Date(v.fecha_inicio) &&
          fechaSesion <= new Date(v.fecha_fin),
      );

      if (estaEnVacaciones) {
        const siguienteSesion = sesionesFiltradas.find(
          (next) =>
            new Date(next.fecha) > fechaSesion &&
            !vacArray.some(
              (v) =>
                new Date(next.fecha) >= new Date(v.fecha_inicio) &&
                new Date(next.fecha) <= new Date(v.fecha_fin),
            ),
        );

        proximo = {
          tipo: "vacaciones",
          info: vacArray.find(
            (v) =>
              fechaSesion >= new Date(v.fecha_inicio) &&
              fechaSesion <= new Date(v.fecha_fin),
          )!,
          siguiente: siguienteSesion,
        };

        break;
      }

      proximo = { tipo: "sesion", info: sesion };
      break;
    }

    setProximoEntrenamiento(proximo);
  };

  cargarProximoEntrenamiento();
}, [nadadoraId]);

  // Próximas competiciones
  useEffect(() => {
    const cargarCompeticiones = async () => {
      const hoyStr = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("competiciones")
        .select("*")
        .gte("fecha", hoyStr)
        .order("fecha", { ascending: true })
        .limit(1);

      if (data) setProximasCompeticiones(data);
    };
    cargarCompeticiones();
  }, []);

  // Mejores tiempos
  useEffect(() => {
    const cargarMejoresTiempos = async () => {
      const { data, error } = await supabase
        .from("tiempos")
        .select(" prueba, tiempo, fecha")
        .eq("nadadora_id", nadadoraId)
        .order("prueba", { ascending: true })
        .order("tiempo", { ascending: true });

      if (error) {
        console.error("Error cargando tiempos:", error);
        return;
      }

      if (data) {
        // Agrupar por prueba y quedarnos solo con el mejor tiempo de cada una
        const grouped: Record<string, { tiempo: number; fecha: string }> = {};
        data.forEach((t: any) => {
          if (!grouped[t.prueba] || t.tiempo < grouped[t.prueba].tiempo) {
            grouped[t.prueba] = { tiempo: t.tiempo, fecha: t.fecha };
          }
        });

        const tiemposArray = Object.entries(grouped).map(([prueba, info]) => ({
          prueba,
          tiempo: info.tiempo,
          fecha: info.fecha,
        }));
        setMejoresTiempos(tiemposArray);
      }
    };

    cargarMejoresTiempos();
  }, [nadadoraId]);

  //Historial de putnos
  useEffect(() => {
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

  //sumar punto al explotar la burbuja

  const sumarPunto = async () => {
    try {
      // 1️⃣ Actualizar puntos locales
      const nuevoPuntos = puntos + 1;
      setPuntos(nuevoPuntos);

      // 2️⃣ Actualizar en la base de datos
      const { error: updateError } = await supabase
        .from("nadadoras")
        .update({ puntos: nuevoPuntos })
        .eq("id", nadadoraId);
      if (updateError) throw updateError;

      // 3️⃣ Insertar historial
      const { data: historialData, error: historialError } = await supabase
        .from("historial_puntos")
        .insert({
          nadadora_id: nadadoraId,
          puntos: 1,
          motivo: "Burbuja diaria",
          detalle: "Burbuja diaria",
          origen: "Burbuja diaria",
        })
        .select()
        .single(); // <- obtenemos la fila insertada

      if (historialError) throw historialError;

      // 4️⃣ Actualizar el estado local del historial
      setHistorialPuntos((prev) => [historialData, ...prev]);
    } catch (err) {
      console.error("Error sumando punto o actualizando historial:", err);
    }
  };

  // Función para suavizar percentiles altos
  const suavizarRanking = (pct: number | null) => {
    if (pct === null) return null;
    if (pct <= 80) return pct; // mostrar tal cual
    // Comprimir de 80% a 100% en un rango 80% → 82%
    const pctMaxVisible = 82;
    return 80 + ((pct - 80) / 20) * (pctMaxVisible - 80);
  };

  const rankingPct = suavizarRanking(rankingPctPuro);
  return (
    <div className="InicioUser2-container">
      {/* HERO */}
      <div className="InicioUser2-hero">
        <h2>¡Hola, {nombre}!</h2>
        <p className="InicioUser2-racha">
          {emojiRacha} Racha: {racha} días
        </p>
        <div className="InicioUser2-barraProgreso">
          <div style={{ width: `${progreso}%` }} />
        </div>
        <p>
          Nivel {nivel} • {puntos} puntos
        </p>
      </div>
      {/* Ranking móvil */}
      <div className="InicioUser2-rankingMovil">
        <div className="InicioUser2-rankingBarMovil">
          <div
            className={`InicioUser2-rankingFillMovil ${
              rankingPct !== null && rankingPct >= 95 ? "top" : ""
            }`}
            style={{
              width: rankingPct !== null ? `${rankingPct}%` : "0%",
              background:
                rankingPct !== null
                  ? rankingPct <= 10
                    ? "#ff4c4c" // rojo intenso
                    : rankingPct <= 25
                      ? "#ff7b5a" // rojo-anaranjado
                      : rankingPct <= 40
                        ? "#ffb86b" // naranja
                        : rankingPct <= 55
                          ? "#ffd93d" // amarillo claro
                          : rankingPct <= 70
                            ? "#d0f24f" // verde-amarillo
                            : rankingPct <= 85
                              ? "#7cf251" // verde medio
                              : "#4ce751" // verde intenso
                  : "#ccc",
            }}
          />
        </div>
        <span className="InicioUser2-rankingTextMovil">
          {rankingPct !== null
            ? `Top ${Math.round(100 - rankingPct)}% del equipo`
            : "--"}
        </span>
      </div>
      {ultimaAsistenciaHoy && !registroValoracionHoy && rol !== "padre" && (
        <div
          className="InicioUser2-valoracionAlert"
          onClick={() => setSection("valoracion")}
        >
          <span className="InicioUser2-valoracionIcon">📝</span>
          <div className="InicioUser2-valoracionTextContainer">
            <span className="InicioUser2-valoracionText">
              No olvides registrar tu bienestar
            </span>
            <span className="InicioUser2-valoracionTap">Toca aquí ➤</span>
          </div>
        </div>
      )}

      {/* Frase motivadora */}
      <div className="InicioUser2-frase">{fraseDiaria}</div>
      {ultimaAsistencia && (
        <div
          className="InicioUser2-card"
          style={{
            borderLeft: `6px solid ${
              MAPEO_ASISTENCIAS[ultimaAsistencia.asistencia.toLowerCase()]
                ?.color || "#999"
            }`,
            borderRight: `6px solid ${
              MAPEO_ASISTENCIAS[ultimaAsistencia.asistencia.toLowerCase()]
                ?.color || "#999"
            }`,
          }}
        >
          <p>
            Última asistencia:{" "}
            {MAPEO_ASISTENCIAS[ultimaAsistencia.asistencia.toLowerCase()]
              ?.icono || "ℹ️"}{" "}
            {MAPEO_ASISTENCIAS[ultimaAsistencia.asistencia.toLowerCase()]
              ?.texto || ultimaAsistencia.asistencia}
          </p>
          <small>{new Date(ultimaAsistencia.fecha).toLocaleDateString()}</small>
        </div>
      )}
      {/* Próximo entrenamiento */}
      <div className="InicioUser2-seccion">
        <h3>Próximo entrenamiento</h3>
        {!proximoEntrenamiento && <p>No hay entrenamientos próximos</p>}
        {proximoEntrenamiento && proximoEntrenamiento.tipo === "sesion" && (
          <div
            className="InicioUser2-card siguiente-entrenamiento"
            onClick={() => setSection("entrenamientos")}
          >
            <p>
              🏊‍♀️{" "}
              <strong>
                {formatearDiaEntrenamiento(proximoEntrenamiento.info.fecha)}
              </strong>
            </p>


            <small>
              {proximoEntrenamiento.info.hora_inicio} •{" "}
              {proximoEntrenamiento.info.tipo_sesion}
            </small>
          </div>
        )}

        {proximoEntrenamiento && proximoEntrenamiento.tipo === "vacaciones" && (
          <>
            <div className="InicioUser2-card vacaciones">
              <p>
                🏖️ <strong>{proximoEntrenamiento.info.titulo}</strong>
              </p>

              <small>
                Desde{" "}
                <strong>
                  {new Date(
                    proximoEntrenamiento.info.fecha_inicio,
                  ).toLocaleDateString("es-ES")}
                </strong>{" "}
                hasta{" "}
                <strong>
                  {new Date(
                    proximoEntrenamiento.info.fecha_fin,
                  ).toLocaleDateString("es-ES")}
                </strong>
              </small>

              {proximoEntrenamiento.info.descripcion && (
                <p style={{ marginTop: "6px" }}>
                  {proximoEntrenamiento.info.descripcion}
                </p>
              )}
            </div>

            {proximoEntrenamiento.siguiente && (
              <div
                className="InicioUser2-card siguiente-entrenamiento"
                onClick={() => setSection("entrenamientos")}
              >
                <p>
                  🏊‍♀️ <strong>El siguiente día de entrenamiento es:</strong>
                </p>

                <small>
                  <strong>
                    {new Date(
                      proximoEntrenamiento.siguiente.fecha,
                    ).toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </strong>
                </small>



                <small style={{ display: "block", marginTop: "4px" }}>
  {proximoEntrenamiento.siguiente.hora_inicio.slice(0, 5)} •{" "}
  {proximoEntrenamiento.siguiente.tipo_sesion}
</small>
              </div>
            )}
          </>
        )}
      </div>

      {/* Próximas competiciones */}
      <div className="InicioUser2-seccion">
        <h3>Próximas competiciones</h3>
        {proximasCompeticiones.length === 0 && (
          <p>No hay competiciones próximas</p>
        )}
        {proximasCompeticiones.map((c) => (
          <div
            key={c.id}
            className="InicioUser2-card"
            onClick={() => setSection("competiciones")}
          >
            <p>{c.nombre}</p>
            <small>{new Date(c.fecha).toLocaleDateString("es-ES")}</small>
          </div>
        ))}
      </div>

      {/* Historial de puntos */}
      <div className="InicioUser2-seccion">
        <h3>Historial de puntos</h3>
        <div className="InicioUser2-card Historial-puntos-card">
          {historialPuntos.length ? (
            <div className="Historial-puntos-scroll">
              {historialPuntos.map((h) => {
                let detalleAMostrar = h.detalle;

                if (h.origen === "asistencia") {
                  if (h.detalle?.includes("→ Asistencia"))
                    detalleAMostrar = "Asistencia";
                  else if (h.detalle?.includes("→ Retraso"))
                    detalleAMostrar = "Retraso";
                }
                if (h.origen === "manual") detalleAMostrar = "Manual";

                return (
                  <div key={h.id} className="Historial-puntos-item">
                    <div
                      className="Historial-puntos-circle"
                      style={{
                        background:
                          h.origen === "logro"
                            ? "#FFD700"
                            : h.origen === "asistencia"
                              ? h.detalle?.includes("Asistencia")
                                ? "#4CE751"
                                : h.detalle?.includes("Retraso")
                                  ? "#f39c12"
                                  : "#1E90FF"
                              : h.origen === "manual"
                                ? "#a67df7"
                                : h.origen === "reto"
                                  ? "#4CAF50"
                                  : h.origen === "Mejora de tiempo"
                                    ? "#fd79a8"
                                    : h.origen === "Burbuja diaria"
                                      ? "#4CE7F1" // azul para la burbuja
                                      : "#999",
                      }}
                    >
                      {h.origen === "logro" ? (
                        "🏆"
                      ) : h.origen === "asistencia" ? (
                        h.detalle?.includes("Asistencia") ? (
                          "✅"
                        ) : h.detalle?.includes("Retraso") ? (
                          "⏱️"
                        ) : (
                          "💧"
                        )
                      ) : h.origen === "manual" ? (
                        "✏️"
                      ) : h.origen === "reto" ? (
                        "🎯"
                      ) : h.origen === "Mejora de tiempo" ? (
                        "⏱️"
                      ) : h.origen === "Burbuja diaria" ? (
                        <Droplet size={20} />
                      ) : (
                        "❔"
                      )}
                    </div>
                    <div className="Historial-puntos-detalle">
                      <strong>{detalleAMostrar || h.motivo}</strong>
                      <span className="Historial-puntos-fecha">
                        {new Date(h.fecha).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="Historial-puntos-number">
                      {h.puntos} pts
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>No hay historial de puntos</p>
          )}
        </div>
      </div>

      {/* Mejores tiempos */}
      <div className="InicioUser2-seccion">
        <h3>Mejores tiempos por prueba</h3>
        {mejoresTiempos.length === 0 && <p>Aún no tienes registros</p>}
        {mejoresTiempos.map((t) => (
          <div
            key={t.prueba}
            className="InicioUser2-card Tiempo-card"
            onClick={() => setSection("resultados")}
          >
            <div className="Tiempo-card-left">
              <p className="Tiempo-card-prueba">{formatearPrueba(t.prueba)}</p>
              <small>{new Date(t.fecha).toLocaleDateString("es-ES")}</small>
            </div>
            <div className="Tiempo-card-right">
              <p className="Tiempo-card-tiempo">{formatearTiempo(t.tiempo)}</p>
            </div>
          </div>
        ))}
      </div>

      <BurbujaDiaria onClick={() => sumarPunto()} />
    </div>
  );
}
