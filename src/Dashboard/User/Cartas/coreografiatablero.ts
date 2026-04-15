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

export type SlotId = "entrada" | "impacto" | "transicion" | "tecnica" | "final";

export interface SlotConfig {
  id: SlotId;
  nombre: string;
  pesos: {
    fuerza: number;
    flexibilidad: number;
    apnea: number;
    impresion_artistica: number;
  };
  penalizacion?: (carta: CartaNadadora) => number;
  bonus?: (carta: CartaNadadora) => number;
}

export const TABLERO_BASE: SlotConfig[] = [
  {
    id: "entrada",
    nombre: "Entrada",
    pesos: {
      fuerza: 0.5,
      flexibilidad: 1,
      apnea: 1,
      impresion_artistica: 2,
    },
    penalizacion: (c) => (c.impresion_artistica < 30 ? -15 : 0),
  },
  {
    id: "impacto",
    nombre: "Figura de Impacto",
    pesos: {
      fuerza: 2,
      flexibilidad: 1,
      apnea: 1,
      impresion_artistica: 0.5,
    },
    penalizacion: (c) => (c.fuerza < 30 ? -20 : 0),
  },
  {
    id: "transicion",
    nombre: "Transición",
    pesos: {
      fuerza: 0.5,
      flexibilidad: 2,
      apnea: 1,
      impresion_artistica: 1,
    },
    penalizacion: (c) => (c.flexibilidad < 25 ? -15 : 0),
  },
  {
    id: "tecnica",
    nombre: "Figura Técnica",
    pesos: {
      fuerza: 1.5,
      flexibilidad: 1.5,
      apnea: 1,
      impresion_artistica: 0.5,
    },
    bonus: (c) =>
      c.fuerza >= 30 &&
      c.flexibilidad >= 30 &&
      c.apnea >= 30 &&
      c.impresion_artistica >= 30
        ? 20
        : 0,
  },
  {
    id: "final",
    nombre: "Final",
    pesos: {
      fuerza: 1,
      flexibilidad: 1,
      apnea: 1,
      impresion_artistica: 2,
    },
    bonus: (c) => (c.impresion_artistica > 70 ? 25 : 0),
  },
];
