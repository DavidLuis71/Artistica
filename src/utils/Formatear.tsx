import type {
  Alerta,
  Nadadora,
  Valoracion,
} from "../Dashboard/Admin/EstadoEquipo";

export const formatearTiempo = (tiempo: number) => {
  const minutos = Math.floor(tiempo / 60);
  const segundos = Math.floor(tiempo % 60);
  const centesimas = Math.floor((tiempo - Math.floor(tiempo)) * 100);

  const segundosStr = segundos.toString().padStart(2, "0");
  const centesimasStr = centesimas.toString().padStart(2, "0");

  return `${minutos}:${segundosStr}.${centesimasStr}`;
};

export const formatearPrueba = (prueba: string) => {
  const [distancia, tipo] = prueba.split("_");
  const tipoCapitalizado =
    tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/_/g, " ");
  return `${distancia}  ${tipoCapitalizado}`;
};

// Devuelve "Hoy", "Mañana" o nombre del día
export const formatearDiaEntrenamiento = (fechaStr: string) => {
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diffMs = fecha.getTime() - hoy.getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias === 0) return "Hoy";
  if (diffDias === 1) return "Mañana";

  return fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

export function calcularAlertas14Dias(
  valoraciones: Valoracion[],
  nad: Nadadora,
): Alerta[] {
  const valores = valoraciones.filter((v) => v.nadadora_id === nad.id);
  if (!valores.length) return [];

  const alertas: Alerta[] = [];

  // Extraemos series de datos
  const cansancioGeneral = valores.map((v) => v.cansancio_general);
  const cansancioEntreno = valores.map((v) => v.cansancio_entrenamiento);
  const cansancioTotal = valores.map(
    (v) => v.cansancio_general + v.cansancio_entrenamiento,
  );
  const motivacion = valores.map((v) => v.motivacion);
  const productividad = valores.map((v) => v.productividad);

  // Función auxiliar para analizar tendencia
  const analizarTendencia = (
    arr: number[],
  ): "subiendo" | "bajando" | "estable" => {
    if (arr.length < 2) return "estable";
    let deltas = 0;
    for (let i = 1; i < arr.length; i++) {
      deltas += arr[i] - arr[i - 1];
    }
    const promedioDelta = deltas / (arr.length - 1);
    if (promedioDelta >= 0.3) return "subiendo";
    if (promedioDelta <= -0.3) return "bajando";
    return "estable";
  };

  // --------------------------
  // CANSANCIO TOTAL
  const mediaTotal =
    cansancioTotal.reduce((a, b) => a + b, 0) / cansancioTotal.length;
  const maxTotal = Math.max(...cansancioTotal);
  const tendenciaTotal = analizarTendencia(cansancioTotal);

  if (mediaTotal >= 7.5) {
    let mensaje = `Cansancio total medio alto (${mediaTotal.toFixed(1)})`;
    if (tendenciaTotal === "subiendo") mensaje += ", tendencia a acumularse ⚠️";
    if (tendenciaTotal === "bajando")
      mensaje += ", aunque está disminuyendo ligeramente ✅";
    alertas.push({
      tipo: "cansancio_total",
      valor: mediaTotal,
      mensaje,
      gravedad: "moderada",
    });
  }
  if (maxTotal >= 9) {
    alertas.push({
      tipo: "cansancio_total",
      valor: maxTotal,
      mensaje: `Pico de cansancio total (${maxTotal.toFixed(1)}), posible sobrecarga ⚠️`,
      gravedad: "grave",
    });
  }

  // --------------------------
  // CANSANCIO ENTRENAMIENTO
  const mediaEntreno =
    cansancioEntreno.reduce((a, b) => a + b, 0) / cansancioEntreno.length;
  const maxEntreno = Math.max(...cansancioEntreno);
  const tendenciaEntreno = analizarTendencia(cansancioEntreno);

  if (mediaEntreno >= 7.5) {
    let mensaje = `Cansancio de entrenamiento medio alto (${mediaEntreno.toFixed(1)})`;
    if (tendenciaEntreno === "subiendo") mensaje += ", acumulando fatiga ⚠️";
    if (tendenciaEntreno === "bajando") mensaje += ", pero en descenso leve ✅";
    alertas.push({
      tipo: "cansancio_entreno",
      valor: mediaEntreno,
      mensaje,
      gravedad: "moderada",
    });
  }
  if (maxEntreno >= 9) {
    alertas.push({
      tipo: "cansancio_entreno",
      valor: maxEntreno,
      mensaje: `Pico de cansancio de entrenamiento (${maxEntreno.toFixed(1)}), riesgo de sobrecarga ⚠️`,
      gravedad: "grave",
    });
  }

  // --------------------------
  // CANSANCIO GENERAL
  const mediaGeneral =
    cansancioGeneral.reduce((a, b) => a + b, 0) / cansancioGeneral.length;
  const maxGeneral = Math.max(...cansancioGeneral);
  const tendenciaGeneral = analizarTendencia(cansancioGeneral);

  if (mediaGeneral >= 7.5) {
    let mensaje = `Cansancio general medio alto (${mediaGeneral.toFixed(1)})`;
    if (tendenciaGeneral === "subiendo") mensaje += ", sigue aumentando ⚠️";
    if (tendenciaGeneral === "bajando")
      mensaje += ", aunque empieza a bajar ✅";
    alertas.push({
      tipo: "cansancio_general",
      valor: mediaGeneral,
      mensaje,
      gravedad: "moderada",
    });
  }
  if (maxGeneral >= 9) {
    alertas.push({
      tipo: "cansancio_general",
      valor: maxGeneral,
      mensaje: `Pico de cansancio general (${maxGeneral.toFixed(1)}), cuidado ⚠️`,
      gravedad: "grave",
    });
  }

  // --------------------------
  // MOTIVACIÓN
  const mediaMotivacion =
    motivacion.reduce((a, b) => a + b, 0) / motivacion.length;
  const tendenciaMotivacion = analizarTendencia(motivacion);

  if (mediaMotivacion <= 4) {
    let mensaje = `Motivación media baja (${mediaMotivacion.toFixed(1)})`;
    if (tendenciaMotivacion === "bajando") mensaje += ", tendencia a decaer ⚠️";
    if (tendenciaMotivacion === "subiendo")
      mensaje += ", aunque empieza a recuperarse ✅";
    alertas.push({
      tipo: "motivacion",
      valor: mediaMotivacion,
      mensaje,
      gravedad: "moderada",
    });
  }
  if (Math.min(...motivacion) <= 2) {
    alertas.push({
      tipo: "motivacion",
      valor: Math.min(...motivacion),
      mensaje: `Bajada puntual de motivación (${Math.min(...motivacion)}), posible intervención ⚠️`,
      gravedad: "grave",
    });
  }

  // --------------------------
  // PRODUCTIVIDAD
  const mediaProductividad =
    productividad.reduce((a, b) => a + b, 0) / productividad.length;
  const tendenciaProductividad = analizarTendencia(productividad);

  if (mediaProductividad <= 4) {
    let mensaje = `Productividad media baja (${mediaProductividad.toFixed(1)})`;
    if (tendenciaProductividad === "bajando")
      mensaje += ", sigue descendiendo ⚠️";
    if (tendenciaProductividad === "subiendo")
      mensaje += ", aunque empieza a mejorar ✅";
    alertas.push({
      tipo: "productividad",
      valor: mediaProductividad,
      mensaje,
      gravedad: "moderada",
    });
  }
  if (Math.min(...productividad) <= 2) {
    alertas.push({
      tipo: "productividad",
      valor: Math.min(...productividad),
      mensaje: `Pico de baja productividad (${Math.min(...productividad)}), posible intervención ⚠️`,
      gravedad: "grave",
    });
  }

  return alertas;
}
