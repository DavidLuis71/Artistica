import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./ValoracionEntrenamiento.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface Valoracion {
  id?: number;
  nadadora_id: number;
  fecha: string;
  cansancio_entrenamiento: number;
  cansancio_general: number;
  motivacion: number;
  productividad: number;
}

interface Props {
  userId: string;
  rol: "padre" | "nadadora";
}
const descripciones: Record<string, string> = {
  cansancio_entrenamiento:
    "Cuánto te ha cansado el entrenamiento (0 = nada, 10 = muchísimo).",
  cansancio_general:
    "Lo cansada que has llegado hoy por tu día (0 = nada, 10 = agotada).",
  motivacion:
    "Qué tan motivada te has sentido durante el entreno (0 = nada, 10 = súper motivada).",
  productividad:
    "Qué tan bien te ha salido el entreno (0 = nada, 10 = muy productivo).",
};

// iconos por campo
const iconos: Record<string, string> = {
  cansancio_entrenamiento: "💪",
  cansancio_general: "😴",
  motivacion: "🔥",
  productividad: "🎯",
};

const coloresCansancio = [
  "#4caf50",
  "#7ecb67",
  "#c8e36b",
  "#ffeb3b",
  "#ffd54f",
  "#ffb74d",
  "#ff9800",
  "#ff7043",
  "#f4511e",
  "#d32f2f",
];

const coloresMotivacion = [
  "#d32f2f",
  "#f44336",
  "#f4511e",
  "#ff9800",
  "#ffb74d",
  "#ffeb3b",
  "#cbe86b",
  "#8bc34a",
  "#66bb6a",
  "#4caf50",
];

const getSliderColor = (field: string, value: number) => {
  const index = value - 1;

  if (field.includes("cansancio")) {
    return coloresCansancio[index];
  } else {
    return coloresMotivacion[index];
  }
};
const formatearFecha = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export default function ValoracionEntrenamiento({ userId, rol }: Props) {
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [nadadoraId, setNadadoraId] = useState<number | null>(null);
  const [form, setForm] = useState({
    cansancio_entrenamiento: 5,
    cansancio_general: 5,
    motivacion: 5,
    productividad: 5,
  });
  const [loading, setLoading] = useState(false);

  const hoy = new Date().toISOString().split("T")[0];
  const hoyDate = new Date();
  const esFinDeSemana = hoyDate.getDay() === 0 || hoyDate.getDay() === 6;
  // 0 = domingo, 6 = sábado

  useEffect(() => {
    const fetchNadadora = async () => {
      const { data: nadadoraData, error } = await supabase
        .from("nadadoras")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!nadadoraData) return;
      if (error) {
        console.error("Error obteniendo nadadora:", error);
        return;
      }

      setNadadoraId(nadadoraData.id);
    };

    fetchNadadora();
  }, [userId]);

  const cargarValoraciones = async () => {
    const { data } = await supabase
      .from("valoracion_entrenamiento")
      .select("*")
      .eq("nadadora_id", nadadoraId)
      .order("fecha", { ascending: true });
    if (data) setValoraciones(data);
  };

  useEffect(() => {
    if (!nadadoraId) return;
    cargarValoraciones();
  }, [nadadoraId]);

  const handleSubmit = async (e: React.FormEvent) => {
    if (esFinDeSemana) {
      alert("Los fines de semana no se registran valoraciones 😊");
      return;
    }
    e.preventDefault();
    setLoading(true);

    await supabase.from("valoracion_entrenamiento").insert({
      nadadora_id: nadadoraId,
      ...form,
    });

    setForm({
      cansancio_entrenamiento: 5,
      cansancio_general: 5,
      motivacion: 5,
      productividad: 5,
    });

    await cargarValoraciones();
    setLoading(false);
  };

  const registroHoy = valoraciones.some((v) => v.fecha === hoy);

  // Tomamos los últimos 5 días
  const ultimos5 = valoraciones.slice(-5);

  const datasets = {
    cansancio_entrenamiento: ultimos5.map((v) => ({
      fecha: v.fecha,
      value: v.cansancio_entrenamiento,
    })),
    cansancio_general: ultimos5.map((v) => ({
      fecha: v.fecha,
      value: v.cansancio_general,
    })),
    motivacion: ultimos5.map((v) => ({
      fecha: v.fecha,
      value: v.motivacion,
    })),
    productividad: ultimos5.map((v) => ({
      fecha: v.fecha,
      value: v.productividad,
    })),
  };

  const detectarAlertas = (
    data: { fecha: string; value: number }[],
    tipo: "alto" | "bajo",
  ) => {
    if (data.length < 3) return [];

    const values = data.map((d) => d.value);
    const media = values.reduce((s, v) => s + v, 0) / values.length;

    // Umbral recomendado
    const umbral = 2;

    return data
      .filter((d) =>
        tipo === "alto" ? d.value >= media + umbral : d.value <= media - umbral,
      )
      .map((d) => d.fecha);
  };
  const alertas = {
    cansancio_entrenamiento: detectarAlertas(
      datasets.cansancio_entrenamiento,
      "alto",
    ),
    cansancio_general: detectarAlertas(datasets.cansancio_general, "alto"),
    motivacion: detectarAlertas(datasets.motivacion, "bajo"),
    productividad: detectarAlertas(datasets.productividad, "bajo"),
  };

  // Función para contextualizar tendencia según otras propiedades
  const resumenTendencia = (prop: keyof typeof datasets) => {
    const data = datasets[prop];
    if (!data.length) return "Sin datos suficientes.";

    const values = data.map((d) => d.value);
    const ultimo = values[values.length - 1];
    const primero = values[0];
    const promedio =
      values.reduce((sum, v) => sum + v, 0) / (values.length || 1);
    const cambioAbs = ultimo - primero;
    const cambioPct = ((cambioAbs / (primero || 1)) * 100).toFixed(0);
    const desviacion = (() => {
      const mean = promedio;
      const variance =
        values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) /
        (values.length || 1);
      return Math.sqrt(variance);
    })();

    const tendencia =
      values.length < 2
        ? "Sin tendencia clara"
        : ultimo > primero
          ? "Creciendo"
          : ultimo < primero
            ? "Bajando"
            : "Estable";

    const encabezado = `Último: ${ultimo} — Promedio: ${promedio.toFixed(
      1,
    )} — Cambió ${cambioAbs >= 0 ? "+" : ""}${cambioAbs} (${cambioPct}%)
Desv: ${desviacion.toFixed(2)} — ${tendencia}.`;

    // ----------- CONSEJOS ADAPTADOS PARA NIÑAS 10–16 AÑOS -----------

    switch (prop) {
      /* --------------------------------------
       * 1. CANSANCIO ENTRENAMIENTO
       * -------------------------------------- */
      case "cansancio_entrenamiento": {
        let consejo = "";

        if (ultimo >= 8) {
          consejo =
            "Hoy has acabado muy cansada. Es completamente normal algunos días. Intenta descansar bien esta noche, moverte suave si te apetece y hablar con el entrenador si mañana sigues igual, para que lo tenga en cuenta.";
        } else if (ultimo >= 6) {
          consejo =
            "Has notado bastante cansancio. Recuerda estirar un poco en casa, beber agua y descansar lo que puedas. Eso ayudará a que mañana te sientas mejor.";
        } else if (ultimo <= 3) {
          consejo =
            "Te has sentido bastante bien físicamente. Buen momento para seguir trabajando con buena actitud en los próximos entrenamientos.";
        } else {
          consejo =
            "Un cansancio normal. Sigue escuchando tu cuerpo y descansa bien cuando termines el día.";
        }

        const variabilidad =
          desviacion > 1.2
            ? "Tus niveles cambian bastante entre días. No pasa nada, es normal. Intenta fijarte si hay algo que te hace sentir más cansada ciertos días."
            : "Estás bastante estable estos días.";

        return `${encabezado}\n\nInterpretación: ${variabilidad}\n\nConsejo: ${consejo}`;
      }

      /* --------------------------------------
       * 2. CANSANCIO GENERAL
       * -------------------------------------- */
      case "cansancio_general": {
        let consejo = "";

        if (ultimo >= 8) {
          consejo =
            "Hoy has llegado al entreno muy cansada. Intenta descansar un poquito más, organizar tu día con calma y tomarte momentos tranquilos cuando puedas. Si se repite varios días, coméntalo a tus entrenadores.";
        } else if (ultimo >= 6) {
          consejo =
            "Has llegado algo cansada. A veces pasa por el cole, tareas o actividades. Intenta desconectar un poco antes de venir y respirar hondo.";
        } else if (ultimo <= 3) {
          consejo =
            "Has llegado con energía. ¡Genial! Aprovecha para mantener esta buena rutina.";
        } else {
          consejo =
            "Un cansancio normal del día. Trata de no sobrecargarte con demasiadas actividades y busca pequeños momentos de descanso.";
        }

        const alertaEstrés =
          ultimo >= 7 && desviacion > 1.2
            ? "Algunos días te sientes mucho más cansada que otros. Si notas que se repite, habla con tus entrenadores para que sepan cómo te encuentras."
            : "";

        return `${encabezado}\n\nInterpretación: ${alertaEstrés}\n\nConsejo: ${consejo}`;
      }

      /* --------------------------------------
       * 3. MOTIVACIÓN
       * -------------------------------------- */
      case "motivacion": {
        let consejo = "";

        if (ultimo <= 3) {
          consejo =
            "No pasa nada por tener días con pocas ganas. Puede ayudar pensar en una cosa concreta que quieras mejorar hoy, como un elemento, un impulso o una vuelta. También puedes hablar con tus compañeras o entrenadores para animarte.";
        } else if (ultimo <= 6) {
          consejo =
            "Motivación normal. Si quieres subirla un poquito, ponte un mini objetivo para el siguiente entreno (algo pequeño que te haga ilusión mejorar).";
        } else {
          consejo =
            "Estás muy motivada. Sigue así, pero recuerda escuchar tu cuerpo y descansar para mantener estas buenas sensaciones.";
        }

        const cansancioUlt =
          datasets.cansancio_entrenamiento.slice(-1)[0]?.value || 5;

        const nota =
          ultimo <= 3 && cansancioUlt <= 4
            ? "Poca motivación sin mucho cansancio físico. Quizá solo necesitas cambiar el enfoque del día o celebrar pequeños avances."
            : "";

        return `${encabezado}\n\nInterpretación: ${nota}\n\nConsejo: ${consejo}`;
      }

      /* --------------------------------------
       * 4. PRODUCTIVIDAD
       * -------------------------------------- */
      case "productividad": {
        let consejo = "";

        if (ultimo <= 3) {
          consejo =
            "Hoy no te ha salido todo como querías. Es normal. Piensa en UNA sola cosa que sí te haya salido bien. Mañana puedes intentar mejorar un detalle concreto, paso a paso.";
        } else if (ultimo <= 6) {
          consejo =
            "Un entrenamiento normal. Busca algún detalle pequeño que te gustaría mejorar mañana, como una entrada, un giro o una coordinación.";
        } else {
          consejo =
            "Te ha salido muy bien hoy. Recuerda qué te ha ayudado a sentirte así para repetirlo en próximos entrenamientos.";
        }

        const cansGen = datasets.cansancio_general.slice(-1)[0]?.value || 5;

        const warning =
          ultimo <= 4 && cansGen > 7
            ? "Si te cuesta rendir y llegas muy cansada, intenta descansar un poco más y comentarlo a los entrenadores para que lo sepan."
            : "";

        return `${encabezado}\n\nInterpretación: ${warning}\n\nConsejo: ${consejo}`;
      }

      default:
        return `${encabezado}\n\nInterpretación general: seguimiento de la variable.`;
    }
  };

  const renderChart = (
    title: string,
    data: { fecha: string; value: number }[],
    color: string,
    prop: keyof typeof datasets,
  ) => (
    <div className="ValoracionEntreno-User-chart-block" key={prop}>
      <h4>{title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          barCategoryGap="20%"
          barGap={0}
          margin={{ left: -25, right: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="fecha" />
          <YAxis domain={[0, 10]} />
          <Tooltip />
          <Bar dataKey="value" fill={color} />
        </BarChart>
      </ResponsiveContainer>
      <p
        className="ValoracionEntreno-User-explanation"
        style={{ borderLeft: `5px solid ${color}` }}
      >
        {resumenTendencia(prop)}
      </p>
    </div>
  );

  return (
    <div className="ValoracionEntreno-User-container">
      {/* <h2>Registro de bienestar</h2> */}

      {rol === "nadadora" && !registroHoy && !esFinDeSemana && (
        <form onSubmit={handleSubmit} className="ValoracionEntreno-User-form">
          <p className="ValoracionEntreno-User-mensaje">
            ✨ Respira, piensa en cómo te has sentido hoy y escribe la verdad.
            No hay respuestas buenas o malas.
          </p>

          {(
            [
              "cansancio_entrenamiento",
              "cansancio_general",
              "motivacion",
              "productividad",
            ] as const
          ).map((field) => (
            <div key={field} className="ValoracionEntreno-User-field">
              <label>
                {iconos[field]} {field.replace(/_/g, " ")}
              </label>

              <small className="ValoracionEntreno-User-desc">
                {descripciones[field]}
              </small>

              <input
                type="range"
                min={1}
                max={10}
                value={form[field]}
                style={{ accentColor: getSliderColor(field, form[field]) }}
                onChange={(e) =>
                  setForm({ ...form, [field]: Number(e.target.value) })
                }
              />

              <span className="ValoracionEntreno-User-value">
                {form[field]}
              </span>
            </div>
          ))}

          <button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Registrar"}
          </button>
        </form>
      )}

      {rol === "nadadora" && registroHoy && (
        <div className="ValoracionEntreno-User-card">
          <h4>✅ Valoración guardada</h4>
          {/* <p>¡Gracias por registrar tu bienestar hoy!</p> */}
          <p>¡Gracias 💙 Esto ayuda a ajustar mejor tu entreno de mañana.!</p>
        </div>
      )}
      {rol === "nadadora" && esFinDeSemana && (
        <div className="ValoracionEntreno-User-card ValoracionEntreno-User-card--weekend">
          <h4>🏖️ Fin de semana</h4>
          <p>
            Los fines de semana no es necesario registrar la valoración.
            Disfruta del descanso y vuelve con energía 💙
          </p>
        </div>
      )}

      <h3>Últimos 5 días</h3>
      <div className="ValoracionEntreno-User-charts">
        {renderChart(
          "Cansancio Entreno",
          datasets.cansancio_entrenamiento,
          "#ff5722",
          "cansancio_entrenamiento",
        )}
        {renderChart(
          "Cansancio General",
          datasets.cansancio_general,
          "#9c27b0",
          "cansancio_general",
        )}
        {renderChart(
          "Motivación",
          datasets.motivacion,
          "#4caf50",
          "motivacion",
        )}
        {renderChart(
          "Productividad",
          datasets.productividad,
          "#00bcd4",
          "productividad",
        )}
      </div>
      <div className="ValoracionEntreno-User-aviso-global">
        <h3>Avisos de los últimos días</h3>

        {Object.entries(alertas).every(([, fechas]) => fechas.length === 0) && (
          <p>✅ Todo estable, sin picos extraños.</p>
        )}

        {alertas.cansancio_entrenamiento.map((f) => (
          <p key={`ce-${f}`} className="alerta alerta-alta">
            ⚠️ El *cansancio del entrenamiento* subió mucho el día{" "}
            {formatearFecha(f)}.
          </p>
        ))}

        {alertas.cansancio_general.map((f) => (
          <p key={`cg-${f}`} className="alerta alerta-alta">
            ⚠️ El *cansancio general* fue muy alto el día {formatearFecha(f)}.
            Quizá tuviste un día duro fuera del agua.
          </p>
        ))}

        {alertas.motivacion.map((f) => (
          <p key={`m-${f}`} className="alerta alerta-baja">
            ⚠️ La *motivación* bajó especialmente el día {formatearFecha(f)}. Es
            totalmente normal, pero coméntalo si se repite.
          </p>
        ))}

        {alertas.productividad.map((f) => (
          <p key={`p-${f}`} className="alerta alerta-baja">
            ⚠️ La *productividad* fue más baja de lo habitual el día{" "}
            {formatearFecha(f)}. A veces el cuerpo o la mente necesitan un
            respiro.
          </p>
        ))}
      </div>
    </div>
  );
}
