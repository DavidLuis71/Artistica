import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./AsistenciasUser.css";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type PieLabelRenderProps,
} from "recharts";

interface Asistencia {
  id: number;
  fecha: string;
  asistencia: string;
}

interface Props {
  userId: string;
}

const asistenciaColor: { [key: string]: string } = {
  Asistencia: "#4ce751ff",
  Falta: "#ff6150ff",
  Retraso: "#f39c12",
  Enferma: "#c873e9ff",
  FaltaJustificada: "#35aeffff",
  NoLeTocabaEntrenar: "#888888ff",
};
const asistenciaLabel: { [key: string]: string } = {
  Asistencia: "Asistencia",
  Falta: "Falta",
  Retraso: "Retraso",
  Enferma: "Enferma",
  FaltaJustificada: "Falta Justificada",
  NoLeTocabaEntrenar: "No había entrenamiento",
};
export default function AsistenciasUser({ userId }: Props) {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoAusencia, setTipoAusencia] = useState("fecha_unica");
  const [idNadadora, setIdNadadora] = useState<number | undefined>(undefined);
  const [ausencias, setAusencias] = useState<any[]>([]);
  const [nombreNadadora, setNombreNadadora] = useState("");
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([]);
  const [selectedAusencia, setSelectedAusencia] = useState<any | null>(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);

  useEffect(() => {
    const fetchAsistencias = async () => {
      // Obtener la nadadora
      const { data: nadadoraData } = await supabase
        .from("nadadoras")
        .select("id, nombre")
        .eq("user_id", userId)
        .single();

      if (!nadadoraData) return;
      setIdNadadora(nadadoraData.id);
      setNombreNadadora(nadadoraData.nombre);

      // Obtener grupo de la nadadora
      const { data: grupoData } = await supabase
        .from("nadadora_grupos")
        .select("id")
        .eq("nadadora_id", nadadoraData.id)
        .single();

      if (!grupoData) return;

      // Obtener asistencias
      const { data: asistenciasData } = await supabase
        .from("asistencias")
        .select("*")
        .eq("nadadora_grupo_id", grupoData.id);

      setAsistencias(asistenciasData || []);
    };

    fetchAsistencias();
  }, [userId]);
  // 🔹 Cargar ausencias de la nadadora
  useEffect(() => {
    if (!idNadadora) return;
    const fetchAusencias = async () => {
      const { data } = await supabase
        .from("ausencias_recurrentes")
        .select("*")
        .eq("nadadora_id", idNadadora);
      setAusencias(data || []);
    };
    fetchAusencias();
  }, [idNadadora]);
  const estaAusenteEnFecha = (fecha: Date) => {
    const fechaStr = fecha.toLocaleDateString("sv-SE");
    return ausencias.filter((a) => {
      if (a.tipo_recurrencia === "fecha_unica") {
        return a.fecha_inicio === fechaStr;
      }
      if (a.tipo_recurrencia === "rango") {
        const fechaInicio = new Date(a.fecha_inicio);
        const fechaFin = a.fecha_fin ? new Date(a.fecha_fin) : fechaInicio;
        return fecha >= fechaInicio && fecha <= fechaFin;
      }
      if (a.tipo_recurrencia === "semanal" && Array.isArray(a.dias_semana)) {
        const dia = fecha.getDay() === 0 ? 6 : fecha.getDay() - 1; // Convertimos JS (0=domingo) a formato lunes=0, domingo=6

        return a.dias_semana.includes(dia);
      }
      return false;
    });
  };

  const iconosAusencia: { [key: string]: string } = {
    fecha_unica: "⚠️",
    rango: "🗓️",
    semanal: "🔁",
  };

  // Contar cantidad de días por tipo de asistencia en el mes visible
  const countAsistenciasMes = (month: number, year: number) => {
    const counts: { [key: string]: number } = {};
    Object.keys(asistenciaColor).forEach((key) => (counts[key] = 0));
    asistencias.forEach((a) => {
      const fecha = new Date(a.fecha);
      if (fecha.getMonth() === month && fecha.getFullYear() === year) {
        if (counts[a.asistencia] !== undefined) {
          counts[a.asistencia] += 1;
        }
      }
    });
    return counts;
  };
  const asistenciasMap = useMemo(() => {
    const map = new Map<string, Asistencia>();
    asistencias.forEach((a) => map.set(a.fecha, a));
    return map;
  }, [asistencias]);
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const fechaStr = date.toLocaleDateString("sv-SE");

    const asistencia = asistenciasMap.get(fechaStr);

    const ausenciasHoy = estaAusenteEnFecha(date);

    const isToday = date.toDateString() === new Date().toDateString();

    return (
      <div
        className={`AsistenciasUsuarios-tile ${
          isToday ? "AsistenciasUsuarios-today" : ""
        }`}
        style={{ position: "relative" }} // 🔹 necesario para los iconos absolutos
      >
        {/* Número del día */}
        <div
          className="AsistenciasUsuarios-tile-dia"
          style={{
            backgroundColor: asistencia
              ? asistenciaColor[asistencia.asistencia]
              : undefined,
            color: asistencia ? "white" : "black", // que se vea sobre el fondo
          }}
          title={asistencia ? asistencia.asistencia : ""}
        >
          {date.getDate()}
        </div>

        {/* Iconos de ausencia */}
        {ausenciasHoy.map((a) => (
          <span
            key={a.id}
            style={{
              fontSize: "0.8em",
              position: "absolute",
              top: 27, // apila iconos si hay varios
              right: 6,
              lineHeight: 1,
            }}
            title={a.motivo}
          >
            {iconosAusencia[a.tipo_recurrencia]}
          </span>
        ))}
      </div>
    );
  };

  const counts = countAsistenciasMes(
    selectedDate.getMonth(),
    selectedDate.getFullYear(),
  );
  const totalEntrenos = Object.values(counts).reduce((a, b) => a + b, 0);
  const asistenciasTotales = counts.Asistencia || 0;

  const porcentajeAsistencia = totalEntrenos
    ? Math.round((asistenciasTotales / totalEntrenos) * 100)
    : 0;

  const getKpiBackground = (percent: number) => {
    // 0% → azul oscuro (como ahora)
    // 100% → verde elegante suave

    const hueStart = 220; // azul oscuro
    const hueEnd = 145; // verde elegante

    const hue = hueStart + (hueEnd - hueStart) * (percent / 100);

    // Oscuro al inicio, un poco más luminoso al subir
    const lightness = 18 + (percent / 100) * 12;

    return `linear-gradient(135deg, hsl(${hue}, 45%, ${lightness}%), hsl(${hue}, 50%, ${lightness + 6}%))`;
  };
  const getShadow = (percent: number) => {
    const intensity = 0.15 + (percent / 100) * 0.25;
    return `0 15px 40px rgba(0, 0, 0, ${intensity})`;
  };

  const rachaActual = useMemo(() => {
    const ordenadas = [...asistencias].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );

    let racha = 0;

    for (const a of ordenadas) {
      if (a.asistencia === "Asistencia") {
        racha++;
      } else {
        break;
      }
    }

    return racha;
  }, [asistencias]);

  const countsMesAnterior = countAsistenciasMes(
    selectedDate.getMonth() === 0 ? 11 : selectedDate.getMonth() - 1,
    selectedDate.getMonth() === 0
      ? selectedDate.getFullYear() - 1
      : selectedDate.getFullYear(),
  );

  const totalAnterior = Object.values(countsMesAnterior).reduce(
    (a, b) => a + b,
    0,
  );

  const porcentajeAnterior = totalAnterior
    ? Math.round((countsMesAnterior.Asistencia / totalAnterior) * 100)
    : 0;

  const diferenciaMensual = porcentajeAsistencia - porcentajeAnterior;

  const mensajeMotivador = useMemo(() => {
    // 🔥 Caso élite total
    if (porcentajeAsistencia >= 95 && rachaActual >= 7) {
      return `🏆 ${nombreNadadora}, tu constancia y disciplina son ejemplares este mes.Nivel élite `;
    }

    // 🌟 Muy alto rendimiento
    if (porcentajeAsistencia >= 90) {
      if (diferenciaMensual > 0) {
        return `📈 ${nombreNadadora}, Excelente mejora respecto al mes anterior. Sigue así.`;
      }
      return `🌟 ${nombreNadadora}, gran constancia. Sigue marcando el ritmo.`;
    }

    // 💪 Buen nivel pero mejorable
    if (porcentajeAsistencia >= 80) {
      if (rachaActual >= 5) {
        return `🔥 ${nombreNadadora},Buena racha activa. La consistencia es la clave.`;
      }
      return `💪 ${nombreNadadora}, buen trabajo. Podemos dar un pequeño salto más.`;
    }

    // ⚡ Zona media
    if (porcentajeAsistencia >= 65) {
      if (diferenciaMensual > 0) {
        return `⚡ ${nombreNadadora}, Se nota la mejora. Mantén esta progresión.`;
      }
      return `🎯 ${nombreNadadora}, vamos en buena dirección. La regularidad marcará la diferencia.`;
    }

    // 📉 Bajo rendimiento pero con mejora
    if (porcentajeAsistencia >= 50) {
      if (diferenciaMensual > 0) {
        return "📊 Aunque el porcentaje es bajo, estás mejorando. No pares.";
      }
      return `🔄 ${nombreNadadora}, cada entrenamiento cuenta. Vamos a mejorar este mes.`;
    }

    // 🚨 Nivel crítico
    if (totalEntrenos > 0) {
      return "🚨 La asistencia es clave para progresar. Vamos a recuperar el compromiso.";
    }

    return "📅 Aún no hay datos suficientes este mes.";
  }, [
    porcentajeAsistencia,
    rachaActual,
    totalEntrenos,
    nombreNadadora,
    diferenciaMensual,
  ]);

  const dataPie = Object.keys(counts).map((key) => ({
    name: asistenciaLabel[key],
    value: counts[key],
  }));

  const handleAddAusencia = async () => {
    const motivo = (document.getElementById("motivo") as HTMLInputElement)
      .value;
    const tipo = (document.getElementById("tipo") as HTMLSelectElement).value;
    const motivoInput = (
      document.getElementById("motivo") as HTMLInputElement
    ).value.trim();

    if (!motivoInput) {
      alert("Debes rellenar el motivo de la ausencia.");
      return;
    }
    const diasSelect = tipo === "semanal" ? diasSeleccionados : null;

    const fechaInicio =
      (document.getElementById("fechaInicio") as HTMLInputElement)?.value ||
      null;
    const fechaFin =
      (document.getElementById("fechaFin") as HTMLInputElement)?.value || null;

    await supabase.from("ausencias_recurrentes").insert({
      nadadora_id: idNadadora, // pasar el id de la nadadora
      motivo,
      tipo_recurrencia: tipo,
      dias_semana: diasSelect,
      fecha_inicio: fechaInicio,
      fecha_fin: tipo === "rango" ? fechaFin : null,
    });

    // 🔹 Refrescar ausencias desde la base de datos
    if (idNadadora) {
      const { data } = await supabase
        .from("ausencias_recurrentes")
        .select("*")
        .eq("nadadora_id", idNadadora);
      setAusencias(data || []);
    }

    // 🔹 Limpiar modal
    setDiasSeleccionados([]);
    (document.getElementById("motivo") as HTMLInputElement).value = "";
    setModalOpen(false);
  };

  return (
    <div className="AsistenciasUsuarios-container">
      <div className="AsistenciasUsuarios-dashboard">
        {/* KPI GRANDE */}
        <div
          className="dashboard-kpi"
          style={{
            background: getKpiBackground(porcentajeAsistencia),
            boxShadow: getShadow(porcentajeAsistencia),
          }}
        >
          <div className="kpi-porcentaje">{porcentajeAsistencia}%</div>
          <div className="kpi-texto">
            Asistencia del mes
            <span>
              {asistenciasTotales} de {totalEntrenos} entrenamientos
            </span>
          </div>
        </div>

        {/* MÉTRICAS */}
        <div className="dashboard-metricas">
          <MetricCard
            title="🔥 Racha actual"
            value={`${rachaActual} sesiones`}
          />
          <MetricCard
            title="📉 Comparativa mensual"
            value={
              diferenciaMensual > 0
                ? `+${diferenciaMensual}%`
                : `${diferenciaMensual}%`
            }
          />
        </div>

        {/* MENSAJE */}
        <div className="dashboard-mensaje">{mensajeMotivador}</div>
      </div>

      <div style={{ marginBottom: "10px", width: "100%", textAlign: "center" }}>
        <button
          className="dashboard-cta-button"
          onClick={() => setModalOpen(true)}
        >
          ➕ Añadir ausencia
        </button>
      </div>

      <Calendar
        className="AsistenciasUsuarios-Calendario"
        onChange={(value) => {
          if (value instanceof Date) setSelectedDate(value);
        }}
        onActiveStartDateChange={({ activeStartDate }) => {
          if (activeStartDate) {
            setSelectedDate(activeStartDate);
          }
        }}
        value={selectedDate}
        tileContent={tileContent}
        onClickDay={(date: Date) => {
          const ausenciasHoy = estaAusenteEnFecha(date);
          if (ausenciasHoy.length > 0) {
            setSelectedAusencia(ausenciasHoy[0]); // mostrar la primera ausencia si hay varias
          } else {
            setSelectedAusencia(null);
          }
          setModalDetalleOpen(true);
        }}
      />

      {/* Gráfico de estadísticas del mes */}
      <div style={{ width: "100%", height: 250, marginBottom: "20px" }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={dataPie}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label={(props: PieLabelRenderProps) => {
                const { name } = props;
                const percent = props.percent as number; // 🔹 casteo a number
                return `${name?.[0] ?? ""} (${(percent * 100).toFixed(0)}%)`;
              }}
            >
              {dataPie.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={asistenciaColor[Object.keys(counts)[index]]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda */}
      <div className="AsistenciasUsuarios-leyenda">
        {Object.entries(asistenciaColor).map(([key, color]) => (
          <LegendItem
            key={key}
            color={color}
            label={asistenciaLabel[key]}
            count={counts[key]}
          />
        ))}
      </div>

      {modalOpen && (
        <div
          className="modalAsisteciasJustificar-backdrop"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="modalAsisteciasJustificar-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Añadir ausencia</h3>

            <label className="modalAsisteciasJustificar-label">
              Motivo:
              <input
                type="text"
                id="motivo"
                className="modalAsisteciasJustificar-input"
              />
            </label>

            <label className="modalAsisteciasJustificar-label">
              Tipo de ausencia:
              <select
                id="tipo"
                value={tipoAusencia}
                onChange={(e) => setTipoAusencia(e.target.value)}
                className="modalAsisteciasJustificar-select"
              >
                <option value="semanal">Recurrente semanal</option>
                <option value="fecha_unica">Fecha única</option>
                <option value="rango">Rango de fechas</option>
              </select>
            </label>

            {tipoAusencia === "fecha_unica" && (
              <label className="modalAsisteciasJustificar-label">
                Fecha:
                <input
                  type="date"
                  id="fechaInicio"
                  className="modalAsisteciasJustificar-input"
                />
              </label>
            )}

            {tipoAusencia === "rango" && (
              <div className="modalAsisteciasJustificar-rango">
                <label className="modalAsisteciasJustificar-label">
                  Fecha inicio:
                  <input
                    type="date"
                    id="fechaInicio"
                    className="modalAsisteciasJustificar-input"
                  />
                </label>
                <label className="modalAsisteciasJustificar-label">
                  Fecha fin:
                  <input
                    type="date"
                    id="fechaFin"
                    className="modalAsisteciasJustificar-input"
                  />
                </label>
              </div>
            )}

            {/* {tipoAusencia === "semanal" && (
              <label className="modalAsisteciasJustificar-label">
                Días de la semana:
                <select
                  id="diasSemana"
                  multiple
                  className="modalAsisteciasJustificar-select"
                >
                  <option value="0">Lunes</option>
                  <option value="1">Martes</option>
                  <option value="2">Miércoles</option>
                  <option value="3">Jueves</option>
                  <option value="4">Viernes</option>
                  <option value="5">Sábado</option>
                  <option value="6">Domingo</option>
                </select>
              </label>
            )} */}
            {tipoAusencia === "semanal" && (
              <div className="modalAsisteciasJustificar-label">
                Días de la semana:
                <div className="dias-semana-container">
                  {[
                    "Lunes",
                    "Martes",
                    "Miércoles",
                    "Jueves",
                    "Viernes",
                    "Sábado",
                    "Domingo",
                  ].map((dia, idx) => (
                    <label key={idx} className="dias-semana-item">
                      <input
                        type="checkbox"
                        value={idx}
                        checked={diasSeleccionados.includes(idx)}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (e.target.checked) {
                            setDiasSeleccionados([...diasSeleccionados, val]);
                          } else {
                            setDiasSeleccionados(
                              diasSeleccionados.filter((d) => d !== val),
                            );
                          }
                        }}
                      />
                      {dia}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="modalAsisteciasJustificar-buttons">
              <button
                onClick={() => setModalOpen(false)}
                className="modalAsisteciasJustificar-button modalAsisteciasJustificar-button-cancel"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddAusencia}
                className="modalAsisteciasJustificar-button modalAsisteciasJustificar-button-save"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      {modalDetalleOpen && (
        <div
          className="modalAsisteciasJustificar-backdrop"
          onClick={() => setModalDetalleOpen(false)}
        >
          <div
            className="modalAsisteciasJustificar-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Detalle del día</h3>
            {selectedAusencia ? (
              <div>
                <p>
                  <strong>Motivo:</strong> {selectedAusencia.motivo}
                </p>
                <p>
                  <strong>Tipo:</strong> {selectedAusencia.tipo_recurrencia}
                </p>
                {selectedAusencia.tipo_recurrencia === "rango" && (
                  <p>
                    <strong>Desde:</strong> {selectedAusencia.fecha_inicio}{" "}
                    <strong>Hasta:</strong> {selectedAusencia.fecha_fin}
                  </p>
                )}
              </div>
            ) : (
              <p>No hay ausencia registrada para este día.</p>
            )}
            <div className="modalAsisteciasJustificar-buttons">
              <button
                onClick={() => setModalDetalleOpen(false)}
                className="modalAsisteciasJustificar-button modalAsisteciasJustificar-button-cancel"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div className="AsistenciasUsuarios-legendItem">
      <div
        className="AsistenciasUsuarios-legendColor"
        style={{ backgroundColor: color }}
      >
        {count}
      </div>
      <span className="AsistenciasUsuarios-legendLabel">{label}</span>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="metric-card">
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}
