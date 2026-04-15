import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

import "./Inicio.css";

interface CompeticionResumen {
  id: number;
  nombre: string;
  fecha: string;
  tipo: string;
}
interface NadadoraResumen {
  nadadora_id: number;
  nombre: string;
  rol: string;
}

interface CoreografiaResumen {
  id: number;
  nombre: string;
  categoria: string;
  tipo: string;
  nadadoras: NadadoraResumen[];
}
interface KpiCircleProps {
  label: string;
  value: number;
  total: number;
  color: string; // ✅ añadimos color
  icon?: string; // ✅ opcional: icono
}
// Colores (ponlos justo después de los imports)
const asistenciaColor: Record<string, string> = {
  Asistencia: "#4ce751ff", // verde
  Falta: "#ff6150ff", // rojo
  Retraso: "#f39c12", // naranja
  Enferma: "#c873e9ff", // morado
  FaltaJustificada: "#35aeffff", // azul
  NoLeTocabaEntrenar: "#afafafff", // gris
};

export default function Inicio() {
  const [stats, setStats] = useState<{
    asistenciasHoy: number;
    faltasHoy: number;
    faltasJustificadasHoy: number;
    retrasosHoy: number;
    enfermasHoy: number;
    totalHoy: number;
    totalNoVinieron: number;
    proximasCompeticiones: CompeticionResumen[];
    coreografiasActivas: CoreografiaResumen[];
    asistenciasMes: number;
    faltasMes: number;
    faltasJustificadasMes: number;
    retrasosMes: number;
    enfermasMes: number;
    totalMes: number;
  }>({
    asistenciasHoy: 0,
    faltasHoy: 0,
    enfermasHoy: 0,
    faltasJustificadasHoy: 0,
    retrasosHoy: 0,
    totalHoy: 0,
    totalNoVinieron: 0,
    proximasCompeticiones: [],
    coreografiasActivas: [],
    asistenciasMes: 0,
    faltasMes: 0,
    faltasJustificadasMes: 0,
    retrasosMes: 0,
    enfermasMes: 0,
    totalMes: 0,
  });

  const [open, setOpen] = useState<string | null>(null);
  const toggle = (section: string) =>
    setOpen(open === section ? null : section);
  const [nadadoras, setNadadoras] = useState<
    { id: number; nombre: string; apellido: string }[]
  >([]);
  const [selectedNadadoraId, setSelectedNadadoraId] = useState<number | null>(
    null,
  );
  const [mensajeSemana, setMensajeSemana] = useState<string | null>(null);

  useEffect(() => {
    const fetchNadadoras = async () => {
      const { data, error } = await supabase
        .from("nadadoras")
        .select("id, nombre,apellido");
      if (error) {
        console.error("Error cargando nadadoras:", error);
      } else {
        setNadadoras(data || []);
      }
    };
    fetchNadadoras();
  }, []);

  useEffect(() => {
    async function loadData() {
      function getTodayLocal() {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split("T")[0];
      }
      const todayStr = getTodayLocal();
      const firstOfMonth = todayStr.slice(0, 8) + "01";

      // =========================
      // ASISTENCIAS DE HOY
      // =========================
      const { data: asistenciasHoyData, error } = await supabase
        .from("asistencias")
        .select("*")
        .eq("fecha", todayStr);

      if (error) {
        console.error("Error cargando asistencias:", error);
        return;
      }

      // =========================
      // ASISTENCIAS DEL MES
      // =========================
      const { data: asistenciasMesData, error: errorMes } = await supabase
        .from("asistencias")
        .select("*")
        .gte("fecha", firstOfMonth)
        .lte("fecha", todayStr);

      if (errorMes) {
        console.error("Error cargando asistencias mes:", errorMes);
        return;
      }

      // Función para contar tipos
      const countTypes = (data: any[]) => {
        const asistencias = data.filter(
          (a) => a.asistencia === "Asistencia",
        ).length;
        const faltasJustificadas = data.filter(
          (a) => a.asistencia === "FaltaJustificada",
        ).length;
        const faltas = data.filter((a) => a.asistencia === "Falta").length;
        const retrasos = data.filter((a) => a.asistencia === "Retraso").length;
        const enfermas = data.filter((a) => a.asistencia === "Enferma").length;
        const noLeTocaba = data.filter(
          (a) => a.asistencia === "NoLeTocabaEntrenar",
        ).length;
        const total = data.length - noLeTocaba;
        const totalNoVinieron = faltas + faltasJustificadas + enfermas;
        return {
          asistencias,
          faltas,
          faltasJustificadas,
          retrasos,
          enfermas,
          total,
          totalNoVinieron,
        };
      };

      const mes = countTypes(asistenciasMesData);

      // Contadores
      const asistenciasHoy = asistenciasHoyData.filter(
        (a) => a.asistencia === "Asistencia",
      ).length;
      const faltasJustificadasHoy = asistenciasHoyData.filter(
        (a) => a.asistencia === "FaltaJustificada",
      ).length;
      const faltasHoy = asistenciasHoyData.filter(
        (a) => a.asistencia === "Falta",
      ).length;
      const retrasosHoy = asistenciasHoyData.filter(
        (a) => a.asistencia === "Retraso",
      ).length;
      const noLeTocabaHoy = asistenciasHoyData.filter(
        (a) => a.asistencia === "NoLeTocabaEntrenar",
      ).length;
      const enfermasHoy = asistenciasHoyData.filter(
        (a) => a.asistencia === "Enferma",
      ).length;

      const totalHoy = asistenciasHoyData.length - noLeTocabaHoy;
      const totalNoVinieron = faltasHoy + faltasJustificadasHoy + enfermasHoy;

      // Guardamos en el estado
      setStats((prev) => ({
        ...prev,
        asistenciasHoy,
        faltasHoy,
        faltasJustificadasHoy,
        retrasosHoy,
        enfermasHoy,
        totalHoy,
        totalNoVinieron,
        asistenciasMes: mes.asistencias,
        faltasMes: mes.faltas,
        faltasJustificadasMes: mes.faltasJustificadas,
        retrasosMes: mes.retrasos,
        enfermasMes: mes.enfermas,
        totalMes: mes.total,
      }));

      // =========================
      // PRÓXIMAS COMPETICIONES
      // =========================
      const { data: competicionesData, error: competicionesError } =
        await supabase
          .from("competiciones")
          .select("*")
          .gte("fecha", todayStr)
          .order("fecha", { ascending: true })
          .limit(3);

      if (competicionesError) {
        console.error("Error cargando competiciones:", competicionesError);
      }

      // Actualizamos el estado
      setStats((prev) => ({
        ...prev,
        proximasCompeticiones: competicionesData || [],
      }));
      // =========================
      // COREOGRAFÍAS DETALLADAS
      // =========================
      const { data: coreografiasData } = await supabase.from("coreografias")
        .select(`
          id,
          nombre,
          categoria,
          tipo,
          coreografia_nadadora (
            rol,
            nadadora_id,
            nadadora: nadadora_id ( nombre )
          )
        `);

      const coreografias: CoreografiaResumen[] = (coreografiasData || []).map(
        (c: any) => ({
          id: c.id,
          nombre: c.nombre,
          categoria: c.categoria,
          tipo: c.tipo,
          nadadoras: (c.coreografia_nadadora || []).map((cn: any) => ({
            nadadora_id: cn.nadadora_id,
            nombre: cn.nadadora?.nombre || "Sin nombre",
            rol: cn.rol,
          })),
        }),
      );

      setStats((prev) => ({
        ...prev,
        coreografiasActivas: coreografias,
      }));

      // =========================
      // COMPROBAR ENTRENAMIENTOS DE LA PRÓXIMA SEMANA
      // =========================
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado

      // Mostramos aviso solo a partir del jueves (día 4)
      if (dayOfWeek >= 4) {
        const nextMonday = new Date(today);
        // Calculamos lunes siguiente
        nextMonday.setDate(today.getDate() + ((8 - dayOfWeek) % 7));
        const nextMondayStr = nextMonday.toISOString().split("T")[0];

        const nextSunday = new Date(nextMonday);
        nextSunday.setDate(nextMonday.getDate() + 6);
        const nextSundayStr = nextSunday.toISOString().split("T")[0];

        // Consulta de entrenamientos (asistencias) para la semana siguiente
        const { data: entrenamientosProxSemana } = await supabase
          .from("sesiones_entrenamiento")
          .select("*")
          .gte("fecha", nextMondayStr)
          .lte("fecha", nextSundayStr);

        if (
          !entrenamientosProxSemana ||
          entrenamientosProxSemana.length === 0
        ) {
          setMensajeSemana(
            "⚠️No se han programado entrenamientos para la próxima semana. Por favor, genere la planificación semanal para garantizar la continuidad de los entrenamientos.",
          );
        } else {
          setMensajeSemana(null);
        }
      }
    }

    loadData();
  }, []);

  const KpiCircle: React.FC<KpiCircleProps> = ({
    label,
    value,
    total,
    color,
    icon,
  }) => {
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
    const radius = 45;
    const circumference = 2 * Math.PI * radius;

    const [offset, setOffset] = useState(circumference); // empieza vacío

    useEffect(() => {
      // Actualizamos offset al montar para activar la transición
      const newOffset = circumference - (percent / 100) * circumference;
      // retraso corto para que la transición funcione
      setTimeout(() => setOffset(newOffset), 50);
    }, [circumference, percent]);

    return (
      <div className="kpi-item">
        <svg width="120" height="120">
          <circle
            r={radius}
            cx={60}
            cy={60}
            fill="transparent"
            stroke="#e0e0e0"
            strokeWidth="10"
          />
          <circle
            r={radius}
            cx={60}
            cy={60}
            fill="transparent"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
          <text
            x="60"
            y="60"
            textAnchor="middle"
            dy="-5"
            fontSize="18"
            fill="#333"
            fontWeight="bold"
          >
            {Math.round(percent)}%
          </text>
          {icon && (
            <text
              x="60"
              y="80"
              textAnchor="middle"
              fontSize="16"
              fill={color}
              fontWeight="bold"
            >
              {icon}
            </text>
          )}
        </svg>

        <p style={{ textAlign: "center" }}>{label}</p>
      </div>
    );
  };

  return (
    <div className="inicio-container">
      {/* ASISTENCIAS */}

      {/* ASISTENCIAS - KPI */}
      <section className="inicio-panel">
        <div
          className="inicio-panel-header"
          onClick={() => toggle("asistenciasKpi")}
        >
          <strong>🟢 Asistencias (KPI)</strong>
          <span>{open === "asistenciasKpi" ? "▲" : "▼"}</span>
        </div>

        {open === "asistenciasKpi" && (
          <div className="panel-content kpi-container">
            {/* ✅ Asistencias HOY */}
            <KpiCircle
              label="Asistencias Hoy"
              value={stats.asistenciasHoy + stats.retrasosHoy}
              total={stats.totalHoy}
              color={asistenciaColor.Asistencia}
              icon="✅"
            />

            {/* ✅ Retrasos HOY */}
            <KpiCircle
              label="Retrasos Hoy"
              value={stats.retrasosHoy}
              total={stats.asistenciasHoy + stats.retrasosHoy}
              color={asistenciaColor.Retraso}
              icon="⏱️"
            />

            {/* ❌ Faltas HOY */}
            <KpiCircle
              label="Faltas Hoy"
              value={stats.totalNoVinieron}
              total={stats.totalHoy}
              color={asistenciaColor.Falta}
              icon="❌"
            />

            {/* ✅ Asistencias MES */}
            <KpiCircle
              label="Asistencias Mes"
              value={stats.asistenciasMes + stats.retrasosMes}
              total={stats.totalMes}
              color={asistenciaColor.Asistencia}
              icon="📆"
            />

            {/* 🟠 Retrasos MES */}
            <KpiCircle
              label="Retrasos Mes"
              value={stats.retrasosMes}
              total={stats.asistenciasMes + stats.retrasosMes}
              color={asistenciaColor.Retraso}
              icon="⏳"
            />

            {/* ❌ Faltas MES */}
            <KpiCircle
              label="Faltas Mes"
              value={
                stats.faltasMes +
                stats.faltasJustificadasMes +
                stats.enfermasMes
              }
              total={stats.totalMes}
              color={asistenciaColor.Falta}
              icon="🚫"
            />
          </div>
        )}
      </section>

      {/* COMPETICIONES */}
      <section className="inicio-panel">
        <div
          className="inicio-panel-header"
          onClick={() => toggle("competiciones")}
        >
          <strong>📅 Próximas competiciones</strong>
          <span>{open === "competiciones" ? "▲" : "▼"}</span>
        </div>
        {open === "competiciones" && (
          <div style={{ marginTop: "10px" }}>
            {stats.proximasCompeticiones.length === 0 && (
              <p>No hay competiciones próximamente.</p>
            )}
            {stats.proximasCompeticiones.map((c) => (
              <div key={c.id} className={`competicion-item ${c.tipo}`}>
                <strong style={{ textTransform: "uppercase" }}>
                  {c.nombre}
                </strong>
                <span>{new Date(c.fecha).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* COREOGRAFÍAS / CALENDARIO ASISTENCIAS */}
      <section className="inicio-panel">
        <div
          className="inicio-panel-header"
          onClick={() => toggle("coreografias")}
        >
          <strong> ⏱️ Asistencias</strong>
          <span>{open === "coreografias" ? "▲" : "▼"}</span>
        </div>
        {open === "coreografias" && (
          <div className="coreografias-container">
            {stats.coreografiasActivas.length === 0 && (
              <p>No hay coreografías activas.</p>
            )}

            {/* Selector de nadadora */}
            <div className="inicio-selectorNadadora-Asistencias">
              <AutocompleteSimple
                options={nadadoras.map((n) => ({
                  id: n.id,
                  label: `${n.nombre} ${n.apellido}`,
                }))}
                value={selectedNadadoraId}
                onChange={(id) => setSelectedNadadoraId(id ?? null)}
                placeholder="Selecciona una nadadora"
              />
              {/* Calendario */}
              {selectedNadadoraId && (
                <AsistenciasCalendario nadadoraId={selectedNadadoraId} />
              )}
            </div>
          </div>
        )}
      </section>

      {mensajeSemana && (
        <div
          style={{
            backgroundColor: "#fff4e5", // fondo suave naranja
            border: "1px solid #ffa500", // borde naranja profesional
            color: "#333",
            fontWeight: "500",
            padding: "12px 15px",
            borderRadius: "8px",
            marginTop: "15px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.95rem",
          }}
        >
          <span style={{ fontSize: "18px", color: "#ffa500" }}>ℹ️</span>
          {mensajeSemana}
        </div>
      )}
    </div>
  );
}

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import AutocompleteSimple from "../../utils/AutocompleteSimple";

interface Asistencia {
  id: number;
  fecha: string;
  asistencia: string;
}

interface Props {
  nadadoraId: number;
}

function AsistenciasCalendario({ nadadoraId }: Props) {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchAsistencias = async () => {
      const { data: grupoData } = await supabase
        .from("nadadora_grupos")
        .select("id")
        .eq("nadadora_id", nadadoraId)
        .single();

      if (!grupoData) return;

      // Obtener asistencias
      const { data: asistenciasData } = await supabase
        .from("asistencias")
        .select("*")
        .eq("nadadora_grupo_id", grupoData.id);

      setAsistencias(asistenciasData || []);
    };

    if (nadadoraId) fetchAsistencias();
  }, [nadadoraId]);

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const fechaStr = date.toLocaleDateString("sv-SE");
      const asistencia = asistencias.find((a) => a.fecha === fechaStr);

      const isToday = date.toDateString() === new Date().toDateString();
      if (asistencia) {
        return (
          <div
            className={`AsistenciasUsuarios-tile ${
              isToday ? "AsistenciasUsuarios-today" : ""
            }`}
          >
            {asistencia ? (
              <div
                className="AsistenciasUsuarios-tile-dia"
                style={{
                  backgroundColor: asistenciaColor[asistencia.asistencia],
                }}
                title={asistencia.asistencia}
              >
                {date.getDate()}
              </div>
            ) : (
              <span>{date.getDate()}</span>
            )}
          </div>
        );
      }
      return <div>{date.getDate()}</div>;
    }
  };

  return (
    <Calendar
      className="AsistenciasUsuarios-Calendario"
      onChange={(value) => value instanceof Date && setSelectedDate(value)}
      onActiveStartDateChange={({ activeStartDate }) =>
        activeStartDate && setSelectedDate(activeStartDate)
      }
      value={selectedDate}
      tileContent={tileContent}
    />
  );
}
