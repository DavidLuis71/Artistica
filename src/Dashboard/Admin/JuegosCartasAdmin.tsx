// src/pages/JuegosCartasAdmin.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./JuegosCartasAdmin.css";

interface JuegosCartasAdminProps {
  setSection: (section: string) => void;
}
interface CartaJuego {
  id: number;
  nadadora_id: number;
  nadadora_nombre: string;
  nadadora_apellido: string;
  carta_id: number;
  carta_nombre: string;
  flexibilidad: number;
  fuerza: number;
  apnea: number;
  impresion_artistica: number;
  nivel: number;
  rareza: string;
}

export default function JuegosCartasAdmin({
  setSection,
}: JuegosCartasAdminProps) {
  const [juegoHoy, setJuegoHoy] = useState<any>(null);
  const [cartasHoy, setCartasHoy] = useState<CartaJuego[]>([]);
  const [loading, setLoading] = useState(false);

  const hoyStr = new Date().toISOString().slice(0, 10);

  const [cartasNadadoras, setCartasNadadoras] = useState<CartaJuego[]>([]);
  console.log("🚀 ~ cartasNadadoras:", cartasNadadoras);
  const [selectedCarta, setSelectedCarta] = useState<CartaJuego | null>(null);

  const handleCartaClick = (carta: CartaJuego) => {
    setSelectedCarta(carta);
  };

  const fetchCartasNadadoras = async () => {
    const { data, error } = await supabase.from("cartas_nadadora").select(`
      id,
      nadadora_id,
      nadadora: nadadora_id ( nombre , apellido),
      carta_id,
      cartas(nombre),
      nivel,
      rareza,
      flexibilidad,
      fuerza,
      apnea,
      impresion_artistica
    `);

    if (error) {
      console.error(error);
      return;
    }

    const cartasFormatted: CartaJuego[] = (data as any[]).map((c) => ({
      id: c.id,
      nadadora_id: c.nadadora_id,
      nadadora_nombre: c.nadadora?.nombre || "Sin nombre",
      nadadora_apellido: c.nadadora?.apellido || "",
      carta_id: c.carta_id,
      carta_nombre: c.cartas?.nombre || `Carta ${c.carta_id}`,
      flexibilidad: c.flexibilidad,
      fuerza: c.fuerza,
      apnea: c.apnea,
      impresion_artistica: c.impresion_artistica,
      nivel: c.nivel,
      rareza: c.rareza,
    }));

    setCartasNadadoras(cartasFormatted);
  };

  // Buscar o crear juego diario
  const fetchJuegoHoy = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("juegos")
      .select("*")
      .eq("juego_fecha", hoyStr)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error(error);
    } else {
      setJuegoHoy(data || null);
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchCartasNadadoras();
  }, []);

  // Traer cartas del juego
  const fetchCartasHoy = async (juegoId: number) => {
    const { data, error } = await supabase
      .from("cartas_juego")
      .select(
        `
    id,
    nadadora_id,
    nadadoras(nombre),
    carta_id,
    cartas_nadadora(
      id,
      nivel,
      rareza,
      cartas(nombre)
    ),
    flexibilidad,
    fuerza,
    apnea,
    impresion_artistica
  `
      )
      .eq("juego_id", juegoId);

    if (error) {
      console.error(error);
      return;
    }

    const cartasFormatted: CartaJuego[] = (data as any[]).map((c) => ({
      id: c.id,
      nadadora_id: c.nadadora_id,
      nadadora_nombre: c.nadadoras.nombre,
      nadadora_apellido: c.nadadoras.apellido,
      carta_id: c.carta_id,
      carta_nombre: c.cartas_nadadora?.cartas?.nombre || `Carta ${c.carta_id}`,
      flexibilidad: c.flexibilidad,
      fuerza: c.fuerza,
      apnea: c.apnea,
      impresion_artistica: c.impresion_artistica,
      nivel: c.cartas_nadadora?.nivel || 1,
      rareza: c.cartas_nadadora?.rareza || "comun",
    }));

    setCartasHoy(cartasFormatted);
  };

  useEffect(() => {
    fetchJuegoHoy();
  }, []);

  useEffect(() => {
    if (juegoHoy) fetchCartasHoy(juegoHoy.id);
  }, [juegoHoy]);

  // Crear juego diario
  const crearJuego = async () => {
    if (juegoHoy) {
      alert("El juego de hoy ya existe");
      return;
    }

    const { data, error } = await supabase
      .from("juegos")
      .insert([{ juego_fecha: hoyStr, juzgado: false }])
      .select()
      .single();

    if (error) console.error(error);
    else {
      setJuegoHoy(data);
      alert("Juego diario creado ✅");
    }
  };

  // Juzgar juego
  const juzgarJuego = async () => {
    if (!juegoHoy || juegoHoy.juzgado) {
      alert("No hay juego pendiente o ya fue juzgado");
      return;
    }

    if (!cartasHoy.length) {
      alert("No hay cartas enviadas hoy");
      return;
    }

    // 1. Calcular totales reales del equipo
    const totales = {
      flexibilidad: 0,
      fuerza: 0,
      apnea: 0,
      impresion_artistica: 0,
    };

    cartasHoy.forEach((c) => {
      totales.flexibilidad += c.flexibilidad;
      totales.fuerza += c.fuerza;
      totales.apnea += c.apnea;
      totales.impresion_artistica += c.impresion_artistica;
    });

    // 2️⃣ Función para generar mínimo aleatorio dentro de ±20% del total
    const minAleatorio = (total: number, margen = 0.2) => {
      const min = Math.floor(total * (1 - margen));
      const max = Math.ceil(total * (1 + margen));
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // 3️⃣ Calcular mínimos realistas y aleatorios
    const minimos = {
      flexibilidad: minAleatorio(totales.flexibilidad),
      fuerza: minAleatorio(totales.fuerza),
      apnea: minAleatorio(totales.apnea),
      impresion_artistica: minAleatorio(totales.impresion_artistica),
    };

    // 4️⃣ Comprobar si la coreografía aprueba
    const coreografiaAprobada =
      totales.flexibilidad >= minimos.flexibilidad &&
      totales.fuerza >= minimos.fuerza &&
      totales.apnea >= minimos.apnea &&
      totales.impresion_artistica >= minimos.impresion_artistica;

    // 4. Crear resumen final
    const resumen = {
      totales_equipo: totales,
      minimos_requeridos: minimos,
      coreografia_aprobada: coreografiaAprobada,
      participantes: cartasHoy.map((c) => c.nadadora_id),
    };

    // Actualizar juego con resumen y juzgado = true
    const { error } = await supabase
      .from("juegos")
      .update({ juzgado: true, resumen })
      .eq("id", juegoHoy.id);

    if (error) {
      console.error(error);
      return;
    }

    // Limpiar tabla cartas_juego
    const { error: delError } = await supabase
      .from("cartas_juego")
      .delete()
      .eq("juego_id", juegoHoy.id);

    if (delError) console.error(delError);

    setJuegoHoy({ ...juegoHoy, juzgado: true, resumen });
    setCartasHoy([]);
    alert(
      coreografiaAprobada
        ? "Coreografía aprobada 🎉"
        : "Coreografía NO aprobada ❌"
    );
  };

  const cartasPorNadadora = cartasNadadoras.reduce((acc, c) => {
    const nombreCompleto = `${c.nadadora_nombre} ${c.nadadora_apellido}`;
    if (!acc[nombreCompleto]) acc[nombreCompleto] = [];
    acc[nombreCompleto].push(c);
    return acc;
  }, {} as Record<string, CartaJuego[]>);

  return (
    <div className="juegosCartas-Admin-container">
      <h2 className="juegosCartas-Admin-title">Juego de Cartas</h2>

      <div className="juegosCartas-Admin-btns">
        <button
          className="juegosCartas-Admin-btn"
          onClick={crearJuego}
          disabled={loading || !!juegoHoy}
        >
          Crear Juego Diario
        </button>
        <button
          className="juegosCartas-Admin-btn"
          onClick={juzgarJuego}
          disabled={loading || !juegoHoy || juegoHoy.juzgado}
        >
          Juzgar Juego
        </button>
      </div>

      {juegoHoy?.juzgado && (
        <div className="juegosCartas-Admin-resumen">
          <h3 className="juegosCartas-Admin-subtitle">Resultado del día:</h3>
          <p className="juegosCartas-Admin-text">
            Estado:{" "}
            {juegoHoy.resumen.coreografia_aprobada
              ? "✅ Aprobada"
              : "❌ No aprobada"}
          </p>

          <h4 className="juegosCartas-Admin-subtitle">Mínimos requeridos:</h4>
          <pre className="juegosCartas-Admin-pre">
            {JSON.stringify(juegoHoy.resumen.minimos_requeridos, null, 2)}
          </pre>

          <h4 className="juegosCartas-Admin-subtitle">
            Totales reales del equipo:
          </h4>
          <pre className="juegosCartas-Admin-pre">
            {JSON.stringify(juegoHoy.resumen.totales_equipo, null, 2)}
          </pre>
        </div>
      )}
      {juegoHoy && (
        <div className="juegosCartas-Admin-cartas-list">
          <h3 className="juegosCartas-Admin-subtitle">Cartas enviadas hoy:</h3>
          {cartasHoy.length ? (
            cartasHoy.map((c) => (
              <div key={c.id} className="juegosCartas-Admin-carta">
                {c.nadadora_nombre} {c.nadadora_apellido} - {c.carta_nombre}|
                Flex: {c.flexibilidad} | Fuerza: {c.fuerza} | Apnea: {c.apnea} |
                Arte: {c.impresion_artistica} | Nivel: {c.nivel}
              </div>
            ))
          ) : (
            <p className="juegosCartas-Admin-text">
              No hay cartas enviadas hoy
            </p>
          )}
        </div>
      )}
      <section className="juegosCartas-Admin-cartas-nadadoras">
        <button
          onClick={() => setSection("cartapersonalizada")}
          style={{ marginLeft: "10px" }}
        >
          Abrir carta personalizada
        </button>
        <h3 className="juegosCartas-Admin-subtitle">Cartas de las nadadoras</h3>
        {Object.entries(cartasPorNadadora).map(([nombre, cartas]) => (
          <div key={nombre} className="juegosCartas-Admin-nadadora-carta-group">
            <span className="juegosCartas-Admin-nadadora-nombre">
              {nombre}{" "}
            </span>
            <div className="juegosCartas-Admin-nadadora-cartas">
              {cartas.map((c) => (
                <span
                  key={c.id}
                  className={`juegosCartas-Admin-carta-chip ${c.rareza}`}
                  onClick={() => handleCartaClick(c)}
                >
                  {c.carta_nombre} {c.nivel > 1 ? `Lv.${c.nivel}` : ""}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {selectedCarta && (
        <div
          className={`juegosCartas-Admin-carta-detalle ${selectedCarta.rareza}`}
        >
          <button
            className="juegosCartas-Admin-close-btn"
            onClick={() => setSelectedCarta(null)}
          >
            ✖
          </button>
          <h4 className="juegosCartas-Admin-subtitle">
            {selectedCarta.carta_nombre}{" "}
            {selectedCarta.nivel > 1 ? `Lv.${selectedCarta.nivel}` : ""}
          </h4>
          <p className="juegosCartas-Admin-text">
            <strong>Nadadora:</strong> {selectedCarta.nadadora_nombre}
          </p>
          <p className="juegosCartas-Admin-text">
            <strong>Rareza:</strong> {selectedCarta.rareza}
          </p>
          <p className="juegosCartas-Admin-text">
            <strong>Flexibilidad:</strong> {selectedCarta.flexibilidad}
          </p>
          <p className="juegosCartas-Admin-text">
            <strong>Fuerza:</strong> {selectedCarta.fuerza}
          </p>
          <p className="juegosCartas-Admin-text">
            <strong>Apnea:</strong> {selectedCarta.apnea}
          </p>
          <p className="juegosCartas-Admin-text">
            <strong>Arte:</strong> {selectedCarta.impresion_artistica}
          </p>
        </div>
      )}
    </div>
  );
}
