import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./HistorialTiemposUser.css";

interface Tiempo {
  id: number;
  prueba: string;
  tiempo: number;
  categoria: string;
  fecha: string;
}

interface Props {
  nadadoraId: number;
}

interface Prueba {
  id: string;
  nombre: string;
}

const pruebas: Prueba[] = [
  { id: "50m_libre", nombre: "50 Crol" },
  { id: "100m_libre", nombre: "100 Crol" },
  { id: "50m_kick", nombre: "50 Kick-Pull" },
  { id: "100_kick", nombre: "100 Kick-Pull" },
  { id: "200_estilos", nombre: "200 Estilos" },
];

function formatearTiempo(num: number) {
  const segundos = Math.floor(num);
  const decimas = Math.round((num - segundos) * 100);
  const minutos = Math.floor(segundos / 60);
  const segRestantes = segundos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segRestantes).padStart(
    2,
    "0",
  )}.${String(decimas).padStart(2, "0")}`;
}

function obtenerNombrePrueba(id: string) {
  const prueba = pruebas.find((p) => p.id === id);
  return prueba ? prueba.nombre : id;
}

export default function HistorialTiemposUser({ nadadoraId }: Props) {
  const [tiempos, setTiempos] = useState<Tiempo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroPrueba, setFiltroPrueba] = useState<string | null>(null);
  useEffect(() => {
    const cargarTiempos = async () => {
      setCargando(true);

      const { data, error } = await supabase
        .from("tiempos")
        .select("id, prueba, tiempo, categoria, fecha")
        .eq("nadadora_id", nadadoraId)
        .order("fecha", { ascending: true });

      if (!error && data) setTiempos(data);

      setCargando(false);
    };

    cargarTiempos();
  }, [nadadoraId]);

  // Filtrado dinámico
  const tiemposFiltrados = useMemo(() => {
    return tiempos.filter((t) => {
      return !filtroPrueba || t.prueba === filtroPrueba;
    });
  }, [tiempos, filtroPrueba]);

  // Cálculo récord personal
  const recordPersonal = useMemo(() => {
    if (tiemposFiltrados.length === 0) return null;
    return Math.min(...tiemposFiltrados.map((t) => t.tiempo));
  }, [tiemposFiltrados]);
  // cálculo de récords por prueba
  const recordsPorPrueba = useMemo(() => {
    const map: Record<string, number> = {};
    tiempos.forEach((t) => {
      if (!map[t.prueba] || t.tiempo < map[t.prueba]) {
        map[t.prueba] = t.tiempo;
      }
    });
    return map;
  }, [tiempos]);

  return (
    <div className="historialTiempos-container">
      {cargando && (
        <div className="historialTiempos-loader">
          <div className="spinner"></div>
        </div>
      )}

      {!cargando && tiempos.length > 0 && (
        <>
          {/* filtros */}
          <div className="historialTiempos-filtros">
            <select
              value={filtroPrueba || ""}
              onChange={(e) => setFiltroPrueba(e.target.value || null)}
            >
              <option value="">Todas las pruebas</option>
              {pruebas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* gráfica */}
          <div className="historialTiempos-grafica">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tiemposFiltrados}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={(f) => new Date(f).toLocaleDateString("es-ES")}
                />
                <YAxis
                  domain={[
                    (dataMin: number) => dataMin * 0.95,
                    (dataMax: number) => dataMax * 1.05,
                  ]}
                  tickFormatter={(value) => formatearTiempo(value)}
                />

                <Tooltip
                  formatter={(value: number) => formatearTiempo(value)}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("es-ES")
                  }
                />
                <Line
                  type="monotone"
                  dataKey="tiempo"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.tiempo === recordPersonal) {
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill="#fbc02d"
                          stroke="#ffc107"
                          strokeWidth={2}
                        />
                      );
                    }
                    return <circle cx={cx} cy={cy} r={4} fill="#0288d1" />;
                  }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* lista */}
          <div className="historialTiempos-lista">
            {tiemposFiltrados.map((t, i) => {
              // buscar el anterior de la misma prueba
              const prev = [...tiemposFiltrados]
                .slice(0, i)
                .reverse()
                .find((p) => p.prueba === t.prueba);

              const mejora =
                prev && t.tiempo < prev.tiempo
                  ? "mejora"
                  : prev && t.tiempo > prev.tiempo
                    ? "peor"
                    : null;

              const esRecord = t.tiempo === recordsPorPrueba[t.prueba];

              return (
                <div key={t.id} className="historialTiempos-card">
                  <div className="historialTiempos-card-header">
                    <span className="historialTiempos-prueba">
                      {obtenerNombrePrueba(t.prueba)}
                    </span>

                    <span
                      className={`historialTiempos-tiempo ${
                        mejora === "mejora"
                          ? "verde"
                          : mejora === "peor"
                            ? "rojo"
                            : ""
                      }`}
                    >
                      {formatearTiempo(t.tiempo)}
                      {esRecord && " 🏅"}
                    </span>
                  </div>

                  <div className="historialTiempos-detalles">
                    <span className="historialTiempos-fecha">
                      {new Date(t.fecha).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!cargando && tiempos.length === 0 && (
        <p className="historialTiempos-vacio">
          No hay tiempos registrados todavía.
        </p>
      )}
    </div>
  );
}
