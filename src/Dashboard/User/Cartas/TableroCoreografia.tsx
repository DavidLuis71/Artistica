import { useMemo, useState } from "react";
import { calcularTotal } from "./calcularCoreografia";
import "./TableroCoreografia.css";
import { TABLERO_BASE } from "./coreografiatablero";

interface CartaNadadora {
  id: number;
  carta_id: number;
  nombre: string;
  descripcion: string;
  imagen_url: string;
  nivel: number;
  flexibilidad: number;
  fuerza: number;
  apnea: number;
  impresion_artistica: number;
  rareza: "comun" | "rara" | "epica" | "legendaria" | "especial";
  rareza_base: "comun" | "rara" | "epica" | "legendaria" | "especial";
  tipo: "diaria" | "reto" | "entrenador" | "nadadora";
}
interface Props {
  cartasDisponibles: CartaNadadora[];
}

export default function TableroCoreografia({ cartasDisponibles }: Props) {
  const [cartasEnSlots, setCartasEnSlots] = useState<
    Partial<Record<string, CartaNadadora>>
  >({});
  const [cartaSeleccionada, setCartaSeleccionada] =
    useState<CartaNadadora | null>(null);
  const mano = cartasDisponibles.slice(0, 7);

  const resultado = useMemo(
    () => calcularTotal(TABLERO_BASE, cartasEnSlots),
    [cartasEnSlots],
  );

  function colocarCarta(slotId: string) {
    if (!cartaSeleccionada) return;

    setCartasEnSlots((prev) => ({
      ...prev,
      [slotId]: cartaSeleccionada,
    }));

    setCartaSeleccionada(null);
  }

  return (
    <div className="Tablero-Coreografia">
      <h2>Montar Coreografía</h2>

      <div className="Tablero-slots">
        {TABLERO_BASE.map((slot) => (
          <div
            key={slot.id}
            className={`Tablero-slot ${cartaSeleccionada ? "slot-activo" : ""}`}
            onClick={() => colocarCarta(slot.id)}
          >
            <h4>{slot.nombre}</h4>

            {cartasEnSlots[slot.id] ? (
              <img
                src={cartasEnSlots[slot.id]!.imagen_url}
                className="Carta-slot"
              />
            ) : (
              <div className="Hueco-vacio">+</div>
            )}
          </div>
        ))}
      </div>
      <div className="Mano-cartas">
        {mano.map((carta) => (
          <div
            key={carta.id}
            className={`Carta-mano ${
              cartaSeleccionada?.id === carta.id ? "seleccionada" : ""
            }`}
            onClick={() => setCartaSeleccionada(carta)}
          >
            <img src={carta.imagen_url} />
            <p>{carta.nombre}</p>
          </div>
        ))}
      </div>
      {cartaSeleccionada && (
        <div className="Panel-stats">
          <div className="Stat">
            💪 <span>{cartaSeleccionada.fuerza}</span>
          </div>
          <div className="Stat">
            🤸 <span>{cartaSeleccionada.flexibilidad}</span>
          </div>
          <div className="Stat">
            🌊 <span>{cartaSeleccionada.apnea}</span>
          </div>
          <div className="Stat">
            🎭 <span>{cartaSeleccionada.impresion_artistica}</span>
          </div>
        </div>
      )}

      <div className="Tablero-resultado">
        <h3>Puntuación total: {resultado.total}</h3>

        {Object.entries(resultado.detalle).map(([slot, puntos]) => (
          <div key={slot}>
            {slot}: {puntos}
          </div>
        ))}
      </div>
    </div>
  );
}
