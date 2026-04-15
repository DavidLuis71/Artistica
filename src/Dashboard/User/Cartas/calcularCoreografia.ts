import type { SlotConfig } from "./coreografiatablero";

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

export function calcularSlot(carta: CartaNadadora, slot: SlotConfig): number {
  const base =
    carta.fuerza * slot.pesos.fuerza +
    carta.flexibilidad * slot.pesos.flexibilidad +
    carta.apnea * slot.pesos.apnea +
    carta.impresion_artistica * slot.pesos.impresion_artistica;

  const penalizacion = slot.penalizacion?.(carta) ?? 0;
  const bonus = slot.bonus?.(carta) ?? 0;

  return Math.round(base + bonus + penalizacion);
}

export function calcularTotal(
  slots: SlotConfig[],
  cartas: Partial<Record<string, CartaNadadora>>,
) {
  let total = 0;
  const detalle: Record<string, number> = {};

  slots.forEach((slot) => {
    const carta = cartas[slot.id];
    if (!carta) return;

    const puntos = calcularSlot(carta, slot);
    detalle[slot.id] = puntos;
    total += puntos;
  });

  return { total, detalle };
}
