import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./CartaPersonalizada.css";
import AutocompleteSimple from "../../utils/AutocompleteSimple";

interface Espagats {
  izquierdo: number;
  chino: number;
  derecho: number;
}

interface FlexibilidadDetalles {
  tierra: Espagats;
  agua: Espagats;
  rodillasDobles: boolean;
  piesEnPunta: boolean;
}

interface ImpresionArtisticaDetalles {
  postura: number;
  fluidez: number;
  expresividad: number;
  coordinacion: number;
  dificultad: number;
}

interface CartaNadadoraPersonalizada {
  id?: number;
  nadadora_id: number;
  flexibilidad: number;
  fuerza: number;
  apnea: number;
  impresion_artistica: number;
  flexibilidadDetalles: FlexibilidadDetalles;
  fuerzaDetalles?: { tiempo50Libre: number; batidoraDistancia: number };
  apneaDetalles?: { distancia: number };
  impresionArtisticaDetalles?: ImpresionArtisticaDetalles;
}

export default function CartaPersonalizadaForm() {
  const [carta, setCarta] = useState<CartaNadadoraPersonalizada | null>(null);
  const [loading, setLoading] = useState(true);
  const [nadadoras, setNadadoras] = useState<
    { id: number; nombre: string; apellido: string }[]
  >([]);
  const [nadadoraId, setNadadoraId] = useState<number | null>(null);
  const [rareza, setRareza] = useState<
    "comun" | "rara" | "epica" | "legendaria" | "especial"
  >("comun");

  useEffect(() => {
    async function fetchNadadoras() {
      const { data, error } = await supabase
        .from("nadadoras")
        .select("id, nombre, apellido")
        .order("nombre", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }
      setNadadoras(data);
      if (data.length > 0) setNadadoraId(data[0].id); // selecciona la primera por defecto
    }
    fetchNadadoras();
  }, []);

  // --- Flexibilidad ---
  const [espagatsTierra, setEspagatsTierra] = useState<Espagats>({
    izquierdo: 0,
    chino: 0,
    derecho: 0,
  });
  const [espagatsAgua, setEspagatsAgua] = useState<Espagats>({
    izquierdo: 0,
    chino: 0,
    derecho: 0,
  });
  const [rodillasDobles, setRodillasDobles] = useState(false);
  const [piesEnPunta, setPiesEnPunta] = useState(false);

  // --- Fuerza ---
  const [tiempo50Libre, setTiempo50Libre] = useState(0);
  const [batidoraDistancia, setBatidoraDistancia] = useState(0);

  // --- Apnea ---
  const [distanciaApnea, setDistanciaApnea] = useState(0);

  // --- Impresión artística ---
  const [postura, setPostura] = useState(0);
  const [fluidez, setFluidez] = useState(0);
  const [expresividad, setExpresividad] = useState(0);
  const [coordinacion, setCoordinacion] = useState(0);
  const [dificultad, setDificultad] = useState(0);

  // Cargar carta existente
  useEffect(() => {
    async function fetchCarta() {
      if (!nadadoraId) return;

      const { data, error } = await supabase
        .from("cartas_nadadora")
        .select("*, carta:cartas(*)")
        .eq("nadadora_id", nadadoraId);

      if (error) {
        console.error(error);
        return;
      }

      // Filtramos en JS la carta que tenga tipo 'nadadora'
      const cartaNadadora =
        data?.find((c: any) => c.carta.tipo === "nadadora") ?? null;
      setCarta(cartaNadadora);

      if (cartaNadadora) {
        if (cartaNadadora.flexibilidadDetalles) {
          setEspagatsTierra(cartaNadadora.flexibilidadDetalles.tierra);
          setEspagatsAgua(cartaNadadora.flexibilidadDetalles.agua);
          setRodillasDobles(
            cartaNadadora.flexibilidadDetalles.rodillasDobles || false
          );
          setPiesEnPunta(
            cartaNadadora.flexibilidadDetalles.piesEnPunta || false
          );
        }
        if (cartaNadadora.fuerzaDetalles) {
          setTiempo50Libre(cartaNadadora.fuerzaDetalles.tiempo50Libre);
          setBatidoraDistancia(cartaNadadora.fuerzaDetalles.batidoraDistancia);
        }
        if (cartaNadadora.apneaDetalles)
          setDistanciaApnea(cartaNadadora.apneaDetalles.distancia);
        if (cartaNadadora.impresionArtisticaDetalles) {
          setPostura(cartaNadadora.impresionArtisticaDetalles.postura);
          setFluidez(cartaNadadora.impresionArtisticaDetalles.fluidez);
          setExpresividad(
            cartaNadadora.impresionArtisticaDetalles.expresividad
          );
          setCoordinacion(
            cartaNadadora.impresionArtisticaDetalles.coordinacion
          );
          setDificultad(cartaNadadora.impresionArtisticaDetalles.dificultad);
        }
      }

      setLoading(false);
    }

    fetchCarta();
  }, [nadadoraId]);

  // --- Cálculo de stats ---
  function calcularFlexibilidad() {
    const puntosEspagats =
      espagatsTierra.izquierdo +
      espagatsTierra.chino +
      espagatsTierra.derecho +
      espagatsAgua.izquierdo +
      espagatsAgua.chino +
      espagatsAgua.derecho;
    const maxPuntos = 6 * 3; // 6 valores, cada uno 0-2
    let base = (puntosEspagats / maxPuntos) * 100;
    if (rodillasDobles) base -= 5;
    if (!piesEnPunta) base -= 5;
    return Math.max(0, Math.min(100, Math.round(base)));
  }

  function calcularVelocidad50() {
    const t = tiempo50Libre;

    if (!t || t <= 0) return 0;

    if (t < 35) {
      return 50; // máximo
    }

    if (t < 40) {
      // Tramo 2: 35–40 → 45 → 50
      const progreso = (40 - t) / 5; // 0 a 1
      return 45 + progreso * 5; // 45–50
    }

    if (t < 50) {
      // Tramo 3: 40–50 → 25 → 45
      const progreso = (50 - t) / 10; // 0 a 1
      return 25 + progreso * 20; // 25–45
    }

    // Tramo 4: 50+ → 0 → 25
    const exceso = t - 50;
    const progreso = Math.max(0, 1 - exceso / 10); // de 1→0 como t aumenta
    return Math.max(0, 25 * progreso); // 0–25
  }

  function calcularFuerza() {
    const velocidad = calcularVelocidad50();

    let fuerzaResistencia = (batidoraDistancia / 25) * 50;
    fuerzaResistencia = Math.max(0, Math.min(50, fuerzaResistencia));

    return Math.round(velocidad + fuerzaResistencia);
  }

  function calcularApnea() {
    return Math.max(0, Math.min(100, Math.round((distanciaApnea / 25) * 100)));
  }

  function calcularImpresionArtistica() {
    const suma = postura + fluidez + expresividad + coordinacion + dificultad; // 0-10 cada uno
    return Math.round((suma / 50) * 100); // convertir a % sobre 50 puntos
  }

  async function guardarCarta() {
    const nadadoraSeleccionada = nadadoras.find((n) => n.id === nadadoraId);
    const nombreCompleto = nadadoraSeleccionada
      ? `${nadadoraSeleccionada.nombre} ${nadadoraSeleccionada.apellido}`
      : "Nadadora";

    if (carta?.id) {
      const { error } = await supabase
        .from("cartas_nadadora")
        .update({
          flexibilidad: calcularFlexibilidad(),
          fuerza: calcularFuerza(),
          apnea: calcularApnea(),
          impresion_artistica: calcularImpresionArtistica(),
        })
        .eq("id", carta.id);

      if (error) console.error(error);
    } else {
      // 1️⃣ Crear la carta base
      const { data: cartaBase, error: errorCarta } = await supabase
        .from("cartas")
        .insert({
          nombre: `Carta de ${nombreCompleto}`,
          descripcion: "Carta generada automáticamente",
          tipo: "nadadora",
          rareza_base: rareza,
          clase: "tecnica",
          imagen_url: "/carta-base.png", // puedes hacer preview o default
        })
        .select()
        .single();

      if (errorCarta) {
        console.error(errorCarta);
        return;
      }

      // 2️⃣ Asignar la carta a la nadadora
      const { error: errorCN } = await supabase.from("cartas_nadadora").insert({
        nadadora_id: nadadoraId,
        carta_id: cartaBase.id,
        nivel: 1,
        flexibilidad: calcularFlexibilidad(),
        fuerza: calcularFuerza(),
        apnea: calcularApnea(),
        impresion_artistica: calcularImpresionArtistica(),
        rareza_base: rareza,
      });

      if (errorCN) console.error(errorCN);
    }

    alert("Carta guardada ✅");
  }

  if (loading) return <p>Cargando...</p>;

  function EspagatSelector({
    label,
    value,
    onChange,
    opciones,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    opciones: string[];
  }) {
    return (
      <div>
        <strong>{label}</strong>
        <div className="espagatGroup">
          {opciones.map((op, index) => (
            <label key={index}>
              <input
                type="radio"
                checked={value === index}
                onChange={() => onChange(index)}
              />
              {op}
            </label>
          ))}
        </div>
      </div>
    );
  }
  const nadadoraSeleccionada = nadadoras.find((n) => n.id === nadadoraId);
  const nombreCompleto = nadadoraSeleccionada
    ? `${nadadoraSeleccionada.nombre} ${nadadoraSeleccionada.apellido}`
    : `Nadadora #${nadadoraId}`;

  return (
    <div
      className={`cartaPersonalizada-Admin-container ${
        carta ? "modificando" : "creando"
      }`}
    >
      <h2 className="cartaPersonalizada-Admin-title">
        {carta ? "Modificar Carta" : "Crear Carta"}
      </h2>
      <div className="cartaPersonalizada-Admin-selector">
        <label>Selecciona nadadora:</label>
        <AutocompleteSimple
          options={nadadoras.map((n) => ({
            id: n.id,
            label: `${n.nombre} ${n.apellido}`,
          }))}
          value={nadadoraId}
          onChange={(id) => setNadadoraId(id ?? null)}
          placeholder="Buscar nadadora..."
        />
      </div>
      <div className="cartaPersonalizada-Admin-selector">
        <label>Selecciona rareza:</label>
        <select
          value={rareza}
          onChange={(e) => setRareza(e.target.value as any)}
          className="cartaPersonalizada-Admin-input"
        >
          <option value="comun">Común</option>
          <option value="rara">Rara</option>
          <option value="epica">Épica</option>
          <option value="legendaria">Legendaria</option>
          <option value="especial">Especial</option>
        </select>
      </div>

      {/* --- FLEXIBILIDAD --- */}
      <fieldset className="cartaPersonalizada-Admin-fieldset">
        <legend className="cartaPersonalizada-Admin-legend">
          Flexibilidad
        </legend>

        <div className="cartaPersonalizada-Admin-inputGroup">
          <strong>Tierra:</strong>
          <EspagatSelector
            label="Espagat Izquierdo (tierra)"
            value={espagatsTierra.izquierdo}
            onChange={(v) =>
              setEspagatsTierra({ ...espagatsTierra, izquierdo: v })
            }
            opciones={[
              "Muy levantado",
              "Un poco levantado",
              "Casi plano",
              "Plano",
            ]}
          />

          <EspagatSelector
            label="Espagat Chino (tierra)"
            value={espagatsTierra.chino}
            onChange={(v) => setEspagatsTierra({ ...espagatsTierra, chino: v })}
            opciones={[
              "Muy levantado",
              "Un poco levantado",
              "Casi plano",
              "Plano",
            ]}
          />

          <EspagatSelector
            label="Espagat Derecho (tierra)"
            value={espagatsTierra.derecho}
            onChange={(v) =>
              setEspagatsTierra({ ...espagatsTierra, derecho: v })
            }
            opciones={[
              "Muy levantado",
              "Un poco levantado",
              "Casi plano",
              "Plano",
            ]}
          />
        </div>

        <div className="cartaPersonalizada-Admin-inputGroup">
          <strong>Agua:</strong>
          <EspagatSelector
            label="Espagat Izquierdo (agua)"
            value={espagatsAgua.izquierdo}
            onChange={(v) => setEspagatsAgua({ ...espagatsAgua, izquierdo: v })}
            opciones={["Muy cerrado", "Un poco cerrado", "Casi plano", "Plano"]}
          />

          <EspagatSelector
            label="Espagat Chino (agua)"
            value={espagatsAgua.chino}
            onChange={(v) => setEspagatsAgua({ ...espagatsAgua, chino: v })}
            opciones={["Muy cerrado", "Un poco cerrado", "Casi plano", "Plano"]}
          />

          <EspagatSelector
            label="Espagat Derecho (agua)"
            value={espagatsAgua.derecho}
            onChange={(v) => setEspagatsAgua({ ...espagatsAgua, derecho: v })}
            opciones={["Muy cerrado", "Un poco cerrado", "Casi plano", "Plano"]}
          />
        </div>

        <div className="cartaPersonalizada-Admin-checkboxGroup">
          <label>
            <input
              type="checkbox"
              checked={rodillasDobles}
              onChange={(e) => setRodillasDobles(e.target.checked)}
            />
            Rodillas dobladas
          </label>
          <label>
            <input
              type="checkbox"
              checked={piesEnPunta}
              onChange={(e) => setPiesEnPunta(e.target.checked)}
            />
            Pies en punta
          </label>
        </div>

        <p className="cartaPersonalizada-Admin-calculo">
          Flexibilidad calculada: {calcularFlexibilidad()}
        </p>
      </fieldset>

      {/* --- FUERZA --- */}
      <fieldset className="cartaPersonalizada-Admin-fieldset">
        <legend className="cartaPersonalizada-Admin-legend">Fuerza</legend>
        <label>Tiempo 50m libre (segundos)</label>
        <input
          className="cartaPersonalizada-Admin-input"
          type="number"
          min={0}
          value={tiempo50Libre}
          onChange={(e) => setTiempo50Libre(Number(e.target.value))}
        />
        <label>Distancia batidora (0-25m)</label>
        <input
          className="cartaPersonalizada-Admin-input"
          type="number"
          min={0}
          max={25}
          value={batidoraDistancia}
          onChange={(e) => {
            const v = Number(e.target.value);
            setBatidoraDistancia(Math.min(25, Math.max(0, v)));
          }}
        />
        <p className="cartaPersonalizada-Admin-calculo">
          Fuerza calculada: {calcularFuerza()}
        </p>
      </fieldset>

      {/* --- APNEA --- */}
      <fieldset className="cartaPersonalizada-Admin-fieldset">
        <legend className="cartaPersonalizada-Admin-legend">Apnea</legend>
        <label>Distancia recorrida bajo el agua (0-25m)</label>
        <input
          className="cartaPersonalizada-Admin-input"
          type="number"
          min={0}
          max={25}
          value={distanciaApnea}
          onChange={(e) => {
            const v = Number(e.target.value);
            setDistanciaApnea(Math.min(25, Math.max(0, v)));
          }}
        />
        <p className="cartaPersonalizada-Admin-calculo">
          Apnea calculada: {calcularApnea()}
        </p>
      </fieldset>

      {/* --- IMPRESIÓN ARTÍSTICA --- */}
      <fieldset className="cartaPersonalizada-Admin-fieldset">
        <legend className="cartaPersonalizada-Admin-legend">
          Impresión Artística (0-10 cada criterio)
        </legend>
        <label>Postura</label>
        <input
          className="cartaPersonalizada-Admin-input"
          type="number"
          min={0}
          max={10}
          value={postura}
          onChange={(e) => {
            const v = Number(e.target.value);
            setPostura(Math.min(10, Math.max(0, v)));
          }}
        />
        <label>Fluidez</label>
        <input
          className="cartaPersonalizada-Admin-input"
          type="number"
          min={0}
          max={10}
          value={fluidez}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFluidez(Math.min(10, Math.max(0, v)));
          }}
        />
        <label>Expresividad</label>
        <input
          className="cartaPersonalizada-Admin-input"
          type="number"
          min={0}
          max={10}
          value={expresividad}
          onChange={(e) => {
            const v = Number(e.target.value);
            setExpresividad(Math.min(10, Math.max(0, v)));
          }}
        />
        <label>Coordinación</label>
        <input
          className="cartaPersonalizada-Admin-input"
          type="number"
          min={0}
          max={10}
          value={coordinacion}
          onChange={(e) => {
            const v = Number(e.target.value);
            setCoordinacion(Math.min(10, Math.max(0, v)));
          }}
        />
        <label>Dificultad</label>
        <input
          className="cartaPersonalizada-Admin-input"
          type="number"
          min={0}
          max={10}
          value={dificultad}
          onChange={(e) => {
            const v = Number(e.target.value);
            setDificultad(Math.min(10, Math.max(0, v)));
          }}
        />
        <p className="cartaPersonalizada-Admin-calculo">
          Impresión artística calculada: {calcularImpresionArtistica()}
        </p>
      </fieldset>
      <div
        className={`cartaPersonalizada-Admin-previewCard cartaPersonalizada-Admin-${rareza}`}
      >
        <h3>Vista previa de la carta</h3>

        <div className="cartaPersonalizada-Admin-previewCard">
          <h4>{nombreCompleto}</h4>
          <div className="previewStat">
            <span>Rareza</span>
            <strong className={`cartaPersonalizada-Admin-${rareza}`}>
              {rareza.toUpperCase()}
            </strong>
          </div>
          <div className="previewStat">
            <span>Flexibilidad</span>
            <strong>{calcularFlexibilidad()} / 100</strong>
          </div>

          <div className="previewStat">
            <span>Fuerza</span>
            <strong>{calcularFuerza()} / 100</strong>
          </div>

          <div className="previewStat">
            <span>Apnea</span>
            <strong>{calcularApnea()} / 100</strong>
          </div>

          <div className="previewStat">
            <span>Impresión artística</span>
            <strong>{calcularImpresionArtistica()} / 100</strong>
          </div>
        </div>
      </div>

      <button
        className="cartaPersonalizada-Admin-btnGuardar"
        onClick={guardarCarta}
      >
        Guardar Carta
      </button>
    </div>
  );
}
