import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import "./ValoracionEntrenamientoAdmin.css";

interface Valoracion {
  nadadora_id: number;
  fecha: string;
  cansancio_entrenamiento: number;
  cansancio_general: number;
  motivacion: number;
  productividad: number;
  nadadora?: {
    nombre: string;
    apellido: string;
  };
}

interface Resumen {
  media: {
    cansancio_entrenamiento: number;
    cansancio_general: number;
    motivacion: number;
    productividad: number;
  };
  extremos: {
    cansancio_entrenamiento: Valoracion;
    cansancio_general: Valoracion;
    motivacion: Valoracion;
    productividad: Valoracion;
  };
  alertas: string[];
  desviaciones?: {
    [nadadora_id: number]: {
      cansancio_entrenamiento?: number;
      cansancio_general?: number;
      motivacion?: number;
      productividad?: number;
    };
  };
}

export default function ResumenEntrenamientoAdmin() {
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mostrarSemana, setMostrarSemana] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [nombres, setNombres] = useState<Record<number, string>>({});

  const dialogRef = useRef<HTMLDialogElement>(null);

  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    cargarValoraciones();
  }, []);

  const cargarValoraciones = async () => {
    const { data } = await supabase
      .from("valoracion_entrenamiento")
      .select(
        `
    *,
    nadadora:nadadora_id ( nombre, apellido )
  `,
      )
      .order("fecha", { ascending: true });
    if (data) {
      setValoraciones(data as Valoracion[]);

      // Crear diccionario ID → Nombre Completo
      const map: Record<number, string> = {};
      data.forEach((v: any) => {
        map[v.nadadora_id] = `${v.nadadora?.nombre} ${v.nadadora?.apellido}`;
      });
      setNombres(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!valoraciones.length) return;
    calcularResumen();
  }, [valoraciones, selectedDate, mostrarSemana]);

  const calcularResumen = () => {
    let datosFiltrados = valoraciones;

    if (!mostrarSemana && selectedDate) {
      const dia = formatLocalDate(selectedDate);
      datosFiltrados = valoraciones.filter((v) => v.fecha === dia);
    }

    if (!datosFiltrados.length) return setResumen(null);

    // Separamos cada propiedad en su propio array
    const cansancioEntreno = datosFiltrados.map(
      (v) => v.cansancio_entrenamiento,
    );
    const cansancioGeneral = datosFiltrados.map((v) => v.cansancio_general);
    const motivacion = datosFiltrados.map((v) => v.motivacion);
    const productividad = datosFiltrados.map((v) => v.productividad);

    // Calculamos medias
    const media = {
      cansancio_entrenamiento:
        cansancioEntreno.reduce((a, b) => a + b, 0) / cansancioEntreno.length,
      cansancio_general:
        cansancioGeneral.reduce((a, b) => a + b, 0) / cansancioGeneral.length,
      motivacion: motivacion.reduce((a, b) => a + b, 0) / motivacion.length,
      productividad:
        productividad.reduce((a, b) => a + b, 0) / productividad.length,
    };

    // Encontramos valores extremos solo sobre los datos filtrados (día o semana)
    const extremos = {
      cansancio_entrenamiento: datosFiltrados.reduce((prev, curr) =>
        curr.cansancio_entrenamiento > prev.cansancio_entrenamiento
          ? curr
          : prev,
      ),
      cansancio_general: datosFiltrados.reduce((prev, curr) =>
        curr.cansancio_general > prev.cansancio_general ? curr : prev,
      ),
      motivacion: datosFiltrados.reduce((prev, curr) =>
        curr.motivacion < prev.motivacion ? curr : prev,
      ),
      productividad: datosFiltrados.reduce((prev, curr) =>
        curr.productividad < prev.productividad ? curr : prev,
      ),
    };

    // Calculamos desviaciones
    const desviaciones: Resumen["desviaciones"] = {};
    datosFiltrados.forEach((v) => {
      desviaciones[v.nadadora_id] = {
        cansancio_entrenamiento:
          v.cansancio_entrenamiento - media.cansancio_entrenamiento,
        cansancio_general: v.cansancio_general - media.cansancio_general,
        motivacion: v.motivacion - media.motivacion,
        productividad: v.productividad - media.productividad,
      };
    });

    // Alertas
    const alertas: string[] = [];
    if (media.cansancio_entrenamiento > 7 || media.cansancio_general > 7)
      alertas.push("⚠️ Cansancio elevado en este período");
    if (media.motivacion < 4)
      alertas.push("⚠️ Motivación baja en este período");
    if (media.productividad < 4)
      alertas.push("⚠️ Productividad baja en este período");

    Object.entries(desviaciones).forEach(([id, d]) => {
      if (Math.abs(d.cansancio_entrenamiento!) > 3)
        alertas.push(
          `⚠️ ${nombreNadadora(id)} tiene cansancio de entreno fuera de rango`,
        );
      if (Math.abs(d.cansancio_general!) > 3)
        alertas.push(
          `⚠️ ${nombreNadadora(id)}  tiene cansancio general fuera de rango`,
        );
      if (Math.abs(d.motivacion!) > 3)
        alertas.push(
          `⚠️ ${nombreNadadora(id)}  tiene motivación fuera de rango`,
        );
      if (Math.abs(d.productividad!) > 3)
        alertas.push(
          `⚠️ ${nombreNadadora(id)}  tiene productividad fuera de rango`,
        );
    });

    setResumen({ media, alertas, desviaciones, extremos });
  };

  useEffect(() => {
    if (isCalendarOpen) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [isCalendarOpen]);

  if (loading)
    return <p className="Valoracion-Admin-loading">Cargando resumen...</p>;

  const nombreNadadora = (id: number | string) =>
    nombres[Number(id)] ?? `Nadadora ${id}`;

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const formatted = formatLocalDate(date);
    const count = valoraciones.filter((v) => v.fecha === formatted).length;

    return (
      <div className="Valoracion-Admin-tile-container">
        <span className="Valoracion-Admin-tile-number">{date.getDate()}</span>
        {count > 0 && (
          <span className="Valoracion-Admin-tile-count">{count}</span>
        )}
      </div>
    );
  };
  const mostrarValor = (v: Valoracion, key: keyof Valoracion) => {
    if (key === "nadadora")
      return v.nadadora ? `${v.nadadora.nombre} ${v.nadadora.apellido}` : "N/A";
    const val = v[key];
    return typeof val === "number" ? val.toFixed(1) : (val ?? "N/A");
  };

  return (
    <div className="Valoracion-Admin-container">
      <h2 className="Valoracion-Admin-title">Resumen Entrenamientos</h2>

      <div className="Valoracion-Admin-buttons">
        <button onClick={() => setMostrarSemana(true)}>Resumen semanal</button>
        <button onClick={() => setIsCalendarOpen(true)}>Escoger día</button>
      </div>

      {/* Modal calendario */}
      <dialog ref={dialogRef} className="Valoracion-Admin-modal">
        <h3>Selecciona un día</h3>
        <Calendar
          className="Valoracion-Admin-Calendar"
          onClickDay={(date) => {
            setSelectedDate(date);
            setMostrarSemana(false);
            setIsCalendarOpen(false);
          }}
          value={selectedDate ?? undefined}
          maxDate={new Date()}
          tileClassName={({ date, view }) => {
            if (view === "month") {
              const formatted = formatLocalDate(date);
              const tieneDatos = valoraciones.some(
                (v) => v.fecha === formatted,
              );
              return tieneDatos ? "dia-con-datos" : null;
            }
          }}
          tileContent={tileContent}
        />
        <button
          className="Valoracion-Admin-btn"
          onClick={() => setIsCalendarOpen(false)}
        >
          Cerrar
        </button>
      </dialog>

      {/* Resumen */}
      {/* Resumen */}
      {resumen ? (
        <div>
          <h3 className="Valoracion-Admin-card-title">
            {mostrarSemana
              ? "Resumen Semanal"
              : `Día ${selectedDate ? formatLocalDate(selectedDate) : ""}`}
          </h3>

          {/* NUEVO GRID DE TARJETAS KPI */}
          <div className="Valoracion-Admin-summary-grid">
            {[
              {
                key: "cansancio_entrenamiento",
                label: "Cansancio Entreno",
                icon: "💪",
                tipo: "max",
              },
              {
                key: "cansancio_general",
                label: "Cansancio General",
                icon: "🛌",
                tipo: "max",
              },
              {
                key: "motivacion",
                label: "Motivación",
                icon: "🔥",
                tipo: "min",
              },
              {
                key: "productividad",
                label: "Productividad",
                icon: "⚡",
                tipo: "min",
              },
            ].map(({ key, label, icon, tipo }) => {
              const valor = resumen.media[key as keyof Resumen["media"]];
              const extremo =
                resumen.extremos[key as keyof Resumen["extremos"]];
              let colorClass = "Valoracion-Admin-card-green";
              let interpretacion = "Normal";

              if (
                (tipo === "max" && valor > 7) ||
                (tipo === "min" && valor < 4)
              ) {
                colorClass = "Valoracion-Admin-card-red";
                interpretacion = tipo === "max" ? "Alto" : "Bajo";
              } else if (
                (tipo === "max" && valor > 5) ||
                (tipo === "min" && valor < 6)
              ) {
                colorClass = "Valoracion-Admin-card-yellow";
                interpretacion = tipo === "max" ? "Medio" : "Medio";
              }

              // Nadadoras con desviación significativa
              const desviacionesSignificativas = Object.entries(
                resumen.desviaciones ?? {},
              )
                .filter(([idStr, desviacion]) => {
                  const _ = idStr;
                  console.log("🚀 ~ _:", _);
                  return (
                    Math.abs(desviacion[key as keyof typeof desviacion] ?? 0) >
                    2
                  );
                })

                .map(([idStr, desviacion]) => {
                  const val = desviacion[key as keyof typeof desviacion]!;
                  const arrow =
                    (tipo === "max" && val > 0) || (tipo === "min" && val < 0)
                      ? "↑"
                      : "↓";
                  return `${nombreNadadora(idStr)} ${arrow} (${val.toFixed(1)})`;
                });

              const k = key as keyof Valoracion;
              return (
                <div
                  key={key}
                  className={`Valoracion-Admin-card ${colorClass}`}
                >
                  <div className="Valoracion-Admin-card-icon">{icon}</div>
                  <h4 className="Valoracion-Admin-card-title">{label}</h4>
                  <div className="Valoracion-Admin-card-value">
                    {valor.toFixed(1)}
                  </div>
                  <div className="Valoracion-Admin-card-interpretation">
                    {interpretacion}
                  </div>
                  <div className="Valoracion-Admin-card-extremo">
                    {tipo === "max" ? "Máx: " : "Mín: "}{" "}
                    {nombreNadadora(extremo.nadadora_id)} (
                    {mostrarValor(extremo, k)})
                  </div>
                  {desviacionesSignificativas.length > 0 && (
                    <div className="Valoracion-Admin-card-desviaciones">
                      <strong>Desviaciones:</strong>
                      <ul>
                        {desviacionesSignificativas.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="Valoracion-Admin-no-data">
          No hay datos para este período
        </p>
      )}
    </div>
  );
}
