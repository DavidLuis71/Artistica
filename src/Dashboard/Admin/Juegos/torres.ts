export type TipoAtaque =
  | "single" // disparamos a un solo enemigo
  | "area" // daño en área por segundo
  | "dot" // daño continuo a los que están dentro
  | "slow" // reduce velocidad
  | "chain"; // electricidad que rebota

export type TipoTorre = keyof typeof TORRES_STATS; // "basica" | "fuego" | "electrica" | "hielo"

export interface Torre {
  id: number;
  lat: number;
  lng: number;
  tipo: TipoTorre;
  nivel: number;
  lastShot?: number; // timestamp en ms
}

export interface TorreStats {
  nombre: string;
  daño: number;
  rango: number; // metros reales
  velocidad: number; // ms entre ataques
  tipoAtaque: TipoAtaque;
  area?: number; // área en metros (solo para torres de fuego, etc)
  slow?: number; // porcentaje de ralentización
  chainMaxSaltos?: number;
  velocidadProyectil?: number; // m/s
}

export const TORRES_STATS: Record<string, TorreStats> = {
  basica: {
    nombre: "Torre Básica",
    daño: 10,
    rango: 25,
    velocidad: 1000,
    tipoAtaque: "single",
    velocidadProyectil: 15, // 15 m/s
  },

  fuego: {
    nombre: "Torre de Fuego",
    daño: 5,
    rango: 20,
    velocidad: 5000,
    tipoAtaque: "area",
    area: 10, // daño a todos dentro del área
    velocidadProyectil: 8, // más lenta
  },

  electrica: {
    nombre: "Torre Eléctrica",
    daño: 15,
    rango: 30,
    velocidad: 2200,
    tipoAtaque: "chain",
    chainMaxSaltos: 3,
    velocidadProyectil: 20, // rápida
  },

  hielo: {
    nombre: "Torre de Hielo",
    daño: 6,
    rango: 30,
    velocidad: 3000,
    tipoAtaque: "slow",
    slow: 0.15, // 10% reducción
    velocidadProyectil: 10,
  },
};
