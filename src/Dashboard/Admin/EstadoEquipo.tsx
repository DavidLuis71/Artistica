import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./EstadoEquipo.css";
import { calcularAlertas14Dias } from "../../utils/Formatear";

export interface Nadadora {
  id: number;
  nombre: string;
  apellido: string;
}

export interface Tiempo {
  id: number;
  prueba: "50m_libre" | "100m_libre" | "50m_kick" | "100m_kick" | "200_estilos";
  tiempo: number; // en segundos
  nadadora_id: number;
  categoria: string;
  grupo_id: number;
  fecha: string; // YYYY-MM-DD
}

export interface Valoracion {
  nadadora_id: number;
  fecha: string;
  motivacion: number;
  cansancio_entrenamiento: number;
  cansancio_general: number;
  productividad: number;
  comentarios?: string;
}

interface HistorialSalud {
  nadadora_id: number;
  fecha: string;
  molestia: string;
  gravedad: string;
  zona_cuerpo: string;
  afecta_entreno: boolean;
}
export interface Alerta {
  tipo: string;
  valor: number;
  mensaje: string;
  gravedad: "moderada" | "grave";
}
const asistenciaPeso: Record<string, number> = {
  Asistencia: 1, // completa
  Falta: 0, // no estuvo
  Retraso: 0.75, // llegó tarde
  Enferma: 0.5, // no pudo entrenar por enfermedad
  FaltaJustificada: 0, // avisados
  NoLeTocabaEntrenar: 1, // no estaba previsto entrenar
};
// ✅ Conversión de pruebas
const MAPEO_PRUEBAS: Record<string, string> = {
  "50m_libre": "50 libres",
  "100m_libre": "100 libres",
  "50m_kick": "50 kick-pull",
  "100_kick": "100 kick-pull",
  "200_estilos": "200 estilos",
};

export default function EstadoEquipo() {
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [historialSalud, setHistorialSalud] = useState<HistorialSalud[]>([]);
  const [nadadoras, setNadadoras] = useState<Nadadora[]>([]);
  const [teamHealth, setTeamHealth] = useState<number>(0);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [tiempos, setTiempos] = useState<Tiempo[]>([]);
  const [alertasVisibles, setAlertasVisibles] = useState<number | null>(null);
  const [resumenPruebas, setResumenPruebas] = useState<
    {
      prueba: string;
      tendencia: string;
      deltaSegundos: string;
      porcentaje: string;
      muestras: number;
    }[]
  >([]);
  const [ponderacion, setPonderacion] = useState<
    { nombre: string; valor: number; peso: number }[]
  >([]);
  const [modalVisible, setModalVisible] = useState(false);
  const daysAgo = 14;
  const fourteenDaysAgo = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]; // "YYYY-MM-DD"

  useEffect(() => {
    async function loadData() {
      const { data: valData } = await supabase
        .from("valoracion_entrenamiento")
        .select("*")
        .gte("fecha", fourteenDaysAgo);

      const { data: nadData } = await supabase.from("nadadoras").select("*");
      const { data: saludData } = await supabase
        .from("historial_salud")
        .select("*")
        .gte("fecha", fourteenDaysAgo);

      const { data: asistenciasData } = await supabase
        .from("asistencias")
        .select("*")
        .gte("fecha", fourteenDaysAgo);
      setAsistencias(asistenciasData || []);

      setValoraciones(valData || []);
      setNadadoras(nadData || []);
      setHistorialSalud(saludData || []);
    }

    loadData();
  }, [fourteenDaysAgo]);

  useEffect(() => {
    async function loadTiempos() {
      const { data } = await supabase
        .from("tiempos")
        .select("*")
        .order("fecha", { ascending: true }); // ordenamos de antiguo a reciente
      setTiempos(data || []);
    }
    loadTiempos();
  }, []);

  function calcularRendimiento(tiempos: Tiempo[]): {
    rendimientoEscalado: number;
    resumenPruebas: {
      prueba: string;
      tendencia: string;
      deltaSegundos: string;
      porcentaje: string;
      muestras: number;
    }[];
  } {
    if (tiempos.length === 0)
      return { rendimientoEscalado: 0, resumenPruebas: [] };

    // Tiempo de referencia aproximado por prueba (segundos)
    const tiempoReferencia: Record<string, number> = {
      "50m_libre": 30,
      "100m_libre": 100,
      "50m_kick": 35,
      "100m_kick": 130,
      "200_estilos": 220,
    };

    const grouped: Record<string, Tiempo[]> = {};
    tiempos.forEach((t) => {
      const key = `${t.nadadora_id}_${t.prueba}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });

    const deltaPorNadadora: Record<number, number[]> = {};
    const deltaPorPrueba: Record<string, number[]> = {};
    const resumenPorPrueba: Record<
      string,
      {
        deltaMedio: number;
        porcentajeMedio: number;
        muestras: number;
      }
    > = {};

    Object.values(grouped).forEach((arr) => {
      if (arr.length < 2) return;

      // Ordenamos por fecha
      const sorted = arr.sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      );

      // Calculamos deltas consecutivos y promedio
      const prueba = arr[0].prueba;

      let totalDelta = 0;
      let totalPorcentaje = 0;
      let conteo = 0;

      for (let i = 1; i < sorted.length; i++) {
        const delta = sorted[i - 1].tiempo - sorted[i].tiempo;
        const referencia = tiempoReferencia[prueba] || sorted[i].tiempo;

        totalDelta += delta;
        totalPorcentaje += delta / referencia;
        conteo++;
      }

      if (conteo > 0) {
        if (!resumenPorPrueba[prueba]) {
          resumenPorPrueba[prueba] = {
            deltaMedio: 0,
            porcentajeMedio: 0,
            muestras: 0,
          };
        }

        resumenPorPrueba[prueba].deltaMedio += totalDelta / conteo;
        resumenPorPrueba[prueba].porcentajeMedio += totalPorcentaje / conteo;
        resumenPorPrueba[prueba].muestras += conteo;
      }
    });

    // Tendencia grupal: promedio por prueba
    const tendenciasGrupo: number[] = [];
    Object.entries(deltaPorPrueba).forEach(([prueba, deltas]) => {
      console.log("🚀 ~ prueba:", prueba);
      const promedio = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      tendenciasGrupo.push(promedio);
    });

    // Ajuste por cambios extremos individuales (>5% relativo)
    const ajusteIndividual: number[] = [];
    Object.values(deltaPorNadadora).forEach((deltas) => {
      deltas.forEach((d) => {
        if (Math.abs(d) >= 0.05) ajusteIndividual.push(d > 0 ? 0.5 : -0.5);
      });
    });

    // Promedio global
    const promedioGrupo =
      tendenciasGrupo.reduce((a, b) => a + b, 0) /
      (tendenciasGrupo.length || 1);
    const promedioAjuste =
      ajusteIndividual.reduce((a, b) => a + b, 0) /
      (ajusteIndividual.length || 1);

    const rendimientoGlobal = promedioGrupo + promedioAjuste;
    const rendimientoEscalado = Math.max(
      Math.min((rendimientoGlobal + 0.1) * 5, 10),
      0,
    );
    Object.keys(resumenPorPrueba).forEach((prueba) => {
      const datos = resumenPorPrueba[prueba];

      // Dividimos por número de muestras reales acumuladas
      datos.deltaMedio = datos.deltaMedio / datos.muestras;
      datos.porcentajeMedio = datos.porcentajeMedio / datos.muestras;
    });
    // Convertir resumenPruebas a array para usar en React
    const resumenArray = Object.entries(resumenPorPrueba).map(
      ([prueba, datos]) => {
        const delta = datos.deltaMedio;
        const porcentaje = datos.porcentajeMedio * 100;
        // console.log("PRUEBA:", prueba);
        // console.log("Delta medio:", delta);
        // console.log("Porcentaje medio:", porcentaje);
        // console.log("-------------------");
        let umbral = 0.5; // default
        if (prueba === "50m_libre") umbral = 0.1;
        if (prueba === "100m_libre") umbral = 0.3;
        if (prueba === "200_estilos") umbral = 1; // cambios menores a 1s se consideran estables
        let tendencia = "Estable →";
        if (delta > umbral) tendencia = "Mejora ↑";
        if (delta < -umbral) tendencia = "Empeora ↓";

        return {
          prueba,
          tendencia,
          deltaSegundos: `${delta > 0 ? "-" : "+"}${Math.abs(delta).toFixed(2)}s`,
          porcentaje: `${porcentaje > 0 ? "+" : ""}${porcentaje.toFixed(2)}%`,
          muestras: datos.muestras,
        };
      },
    );

    return { rendimientoEscalado, resumenPruebas: resumenArray };
  }

  useEffect(() => {
    if (
      valoraciones.length === 0 &&
      asistencias.length === 0 &&
      tiempos.length === 0
    )
      return;

    const nValoraciones = valoraciones.length;

    // ==============================
    // 1️⃣ BLOQUE PSICOLÓGICO / CARGA
    // ==============================

    let mediaMotivacion = 0;
    let mediaCansancioTotal = 0;
    let mediaProductividad = 0;

    if (nValoraciones > 0) {
      mediaMotivacion =
        valoraciones.reduce((acc, v) => acc + v.motivacion, 0) / nValoraciones;

      const mediaCansancio =
        valoraciones.reduce((acc, v) => acc + v.cansancio_general, 0) /
        nValoraciones;

      const mediaCansancioEntreno =
        valoraciones.reduce((acc, v) => acc + v.cansancio_entrenamiento, 0) /
        nValoraciones;

      mediaProductividad =
        valoraciones.reduce((acc, v) => acc + v.productividad, 0) /
        nValoraciones;

      mediaCansancioTotal = (mediaCansancio + mediaCansancioEntreno) / 2;
    }

    // ==============================
    // 2️⃣ BLOQUE ASISTENCIA (ROBUSTO)
    // ==============================

    const asistenciasValidas = asistencias.filter(
      (a) => a.asistencia !== "NoLeTocabaEntrenar",
    );

    let mediaAsistencia = 0;

    if (asistenciasValidas.length > 0) {
      mediaAsistencia =
        asistenciasValidas.reduce(
          (acc, a) => acc + (asistenciaPeso[a.asistencia] || 0),
          0,
        ) / asistenciasValidas.length;
    }

    // Penalización si hay pocas asistencias registradas
    const factorVolumenAsistencia = asistenciasValidas.length < 10 ? 0.9 : 1;

    // ==============================
    // 3️⃣ BLOQUE RENDIMIENTO
    // ==============================

    const { rendimientoEscalado, resumenPruebas: resumen } =
      calcularRendimiento(tiempos);

    // Penalizar si hay muy pocas muestras de tiempo
    const factorVolumenRendimiento = tiempos.length < 5 ? 0.85 : 1;

    // ==============================
    // 4️⃣ NUEVA PONDERACIÓN INTELIGENTE
    // ==============================

    const scoreBase =
      0.3 * (mediaAsistencia * 10) + // disciplina
      0.2 * mediaMotivacion + // estado mental
      0.15 * mediaProductividad + // percepción rendimiento
      0.15 * (10 - mediaCansancioTotal) + // carga
      0.2 * rendimientoEscalado; // rendimiento real

    const scoreFinal =
      scoreBase * factorVolumenAsistencia * factorVolumenRendimiento;

    setResumenPruebas(resumen);
    setTeamHealth(Math.round(scoreFinal * 10));
    const ponderacionDetalle = [
      {
        nombre: "Disciplina (Asistencia)",
        valor: mediaAsistencia * 10,
        peso: 0.3,
      },
      {
        nombre: "Estado mental (Motivación)",
        valor: mediaMotivacion,
        peso: 0.2,
      },
      {
        nombre: "Percepción rendimiento (Productividad)",
        valor: mediaProductividad,
        peso: 0.15,
      },
      {
        nombre: "Carga / Cansancio",
        valor: 10 - mediaCansancioTotal,
        peso: 0.15,
      },
      {
        nombre: "Rendimiento real",
        valor: rendimientoEscalado,
        peso: 0.2,
      },
    ];

    // Guardamos para mostrar debajo
    setPonderacion(ponderacionDetalle);
  }, [asistencias, tiempos, valoraciones]);

  // Datos para gráfica de tendencias (media por día)
  const tendenciasData = Object.values(
    valoraciones.reduce((acc: Record<string, any>, v) => {
      if (!acc[v.fecha]) {
        acc[v.fecha] = {
          fecha: v.fecha,
          motivacion: 0,
          cansancio: 0,
          productividad: 0,
          count: 0,
        };
      }
      acc[v.fecha].motivacion += v.motivacion;
      acc[v.fecha].cansancio += v.cansancio_general;
      acc[v.fecha].productividad += v.productividad;
      acc[v.fecha].count += 1;
      return acc;
    }, {}),
  ).map((d) => ({
    fecha: d.fecha,
    motivacion: +(d.motivacion / d.count).toFixed(2),
    cansancio: +(d.cansancio / d.count).toFixed(2),
    productividad: +(d.productividad / d.count).toFixed(2),
  }));

  return (
    <div className="estado-equipo-container">
      {/* TEAM HEALTH SCORE */}
      <section className="EstadoEquipo-Admin-TeamHealth">
        <h3>🏊‍♀️ Team Health Score</h3>
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: `conic-gradient(${
              teamHealth > 90
                ? "#2ecc71" // Excelente verde
                : teamHealth > 75
                  ? "#4ce751" // Verde bueno
                  : teamHealth > 60
                    ? "#f3c172" // Amarillo suave
                    : teamHealth > 45
                      ? "#f39c12" // Naranja
                      : "#ff6150" // Rojo
            } ${teamHealth * 3.6}deg, #e0e0e0 0deg)`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "24px",
            fontWeight: "bold",
            transition: "background 0.5s ease",
          }}
          onClick={() => setModalVisible(true)}
        >
          {teamHealth}
        </div>
      </section>
      {/* Modal */}
      {modalVisible && (
        <div
          className="estado-equipo-modal-overlay"
          onClick={() => setModalVisible(false)} // cerrar al clicar fuera
        >
          <div
            className="estado-equipo-modal-content"
            onClick={(e) => e.stopPropagation()} // evitar cerrar al clicar dentro
          >
            <h3>Detalle de Ponderación</h3>
            <ul>
              {ponderacion.map((p) => (
                <li key={p.nombre}>
                  <strong>{p.nombre}:</strong> {(p.valor * p.peso).toFixed(1)}{" "}
                  pts ({(p.peso * 100).toFixed(0)}%)
                </li>
              ))}
            </ul>
            <button
              className="estado-equipo-modal-close"
              onClick={() => setModalVisible(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MOTIVACION / CANSANCIO */}
      <section className="EstadoEquipo-Admin-Tendencias">
        <h3>📈 Tendencias últimos 14 días</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={tendenciasData}
            margin={{ left: -30, right: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="fecha"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
            />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ fontSize: "0.85rem", fontWeight: 500 }}
            />
            <Line type="monotone" dataKey="motivacion" stroke="#4ce751" />
            <Line type="monotone" dataKey="cansancio" stroke="#f39c12" />
            <Line type="monotone" dataKey="productividad" stroke="#4a90e2" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* ESTADO FISICO */}
      <section className="EstadoEquipo-Admin-EstadoFisico">
        <h3>⚠️ Estado físico / molestias recientes</h3>
        {historialSalud.length === 0 && <p>No hay incidencias registradas.</p>}
        {historialSalud.map((e) => {
          const nad = nadadoras.find((n) => n.id === e.nadadora_id);
          return (
            <div key={e.nadadora_id + e.fecha}>
              <strong>
                {nad?.nombre || "Desconocida"} {nad?.apellido || ""}
              </strong>{" "}
              - {e.molestia} (Gravedad: {e.gravedad})
              {e.afecta_entreno && <span> ⚠️ Afecta entrenamiento</span>}
            </div>
          );
        })}
      </section>
      {/* Resumen pruebas */}
      <section className="EstadoEquipo-Admin-ResumenPruebas">
        <h3>📌 Resumen por prueba</h3>
        {resumenPruebas.length === 0 && (
          <p>No hay suficientes registros para calcular tendencias.</p>
        )}
        {resumenPruebas.map((r) => (
          <div key={r.prueba} style={{ marginBottom: "8px" }}>
            <strong>{MAPEO_PRUEBAS[r.prueba] || r.prueba}</strong>
            <div
              className={`resumen-linea ${
                r.tendencia.includes("Mejora")
                  ? "tendencia-mejora"
                  : r.tendencia.includes("Empeora")
                    ? "tendencia-empeora"
                    : "tendencia-estable"
              }`}
            >
              <span className="flecha">{r.tendencia}</span>
              <span>{r.deltaSegundos}</span>
              <span>{r.porcentaje}</span>
            </div>
            <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
              Registros analizados: {r.muestras}
            </div>
          </div>
        ))}
      </section>

      {/* ALERTAS SIMPLES */}
      <section className="EstadoEquipo-Admin-Alertas">
        <h3>🚨 Alertas últimas 2 semanas</h3>
        {nadadoras.map((nad) => {
          const alertas = calcularAlertas14Dias(valoraciones, nad);
          if (!alertas.length) return null;

          const grave = alertas.find((a) => a.gravedad === "grave");
          const moderada = alertas.find((a) => a.gravedad === "moderada");
          const alertaPrincipal = grave || moderada;

          const isVisible = alertasVisibles === nad.id;

          return (
            <div
              key={nad.id}
              className={`alerta-linea alerta-${alertaPrincipal?.gravedad}`}
            >
              <strong>
                {nad.nombre} {nad.apellido}
              </strong>{" "}
              - {alertaPrincipal?.mensaje}
              {alertas.length > 1 && (
                <button
                  onClick={() => setAlertasVisibles(isVisible ? null : nad.id)}
                  style={{ marginLeft: "8px" }}
                >
                  {isVisible ? "Ocultar" : `Ver todas (${alertas.length})`}
                </button>
              )}
              {/* Mostrar todas las alertas si está expandida */}
              {isVisible && (
                <ul style={{ marginTop: "4px", paddingLeft: "20px" }}>
                  {alertas.map((a, idx) => (
                    <li key={idx}>
                      {a.mensaje} ({a.gravedad})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>
      <section className="EstadoEquipo-Admin-Alertas">
        <h3>🚨 Alertas rápidas</h3>
        {valoraciones
          .filter((v) => v.motivacion <= 4 || v.cansancio_general >= 8)
          .map((v) => {
            const nad = nadadoras.find((n) => n.id === v.nadadora_id);
            const alertas: string[] = [];

            if (v.motivacion <= 4) alertas.push("Motivación baja ⚠️");
            if (v.cansancio_general >= 8) alertas.push("Cansancio alto ⚠️");
            if (v.productividad <= 4) alertas.push("Productividad baja ⚠️"); // opcional

            return (
              <div
                key={v.nadadora_id + v.fecha}
                className={`alerta-linea ${
                  v.cansancio_general >= 9 ? "alerta-grave" : "alerta-moderada"
                }`}
              >
                <strong>
                  {nad?.nombre || "Desconocida"} {nad?.apellido || ""}
                </strong>{" "}
                - {alertas.join(" | ")}
                {v.comentarios && (
                  <div className="alerta-comentario">💬 {v.comentarios}</div>
                )}
              </div>
            );
          })}
      </section>
    </div>
  );
}
