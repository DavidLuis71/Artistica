export interface Enemigo {
  id: number;
  lat: number;
  lng: number;
  vida: number;
  velocidad: number;
  velocidadOriginal: number; // velocidad base para no multiplicar infinitamente
  slowStacks: number;
  quemaduras: { daño: number; duracion: number; inicio: number }[];
  // Para rutas sobre carreteras:
  path?: { lat: number; lng: number }[]; // lista de nodos de ruta
  pathIndex?: number; // indice del nodo actual objetivo
  progress?: number; // progreso 0..1 entre path[pathIndex] -> path[pathIndex+1]
  tipo: "normal" | "blindado" | "resistenteFuego" | "vulnerableHielo";
  resistencias: {
    fuego?: number; // 0 = normal, 0.5 = 50% de daño, 2 = 200% daño
    hielo?: number;
    electrica?: number;
    basico?: number;
  };
}

export function distanciaEnMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function crearEnemigoBase(
  lat: number,
  lng: number,
  oleada: number,
  tipo: Enemigo["tipo"] = "normal"
): Enemigo {
  const velocidadBase = 3 + oleada * 0.35;

  const resistencias = { basica: 1, fuego: 1, hielo: 1, electrica: 1 };

  switch (tipo) {
    case "blindado":
      resistencias.basica = 0.5; // reciben la mitad de daño físico
      break;
    case "resistenteFuego":
      resistencias.fuego = 0.3; // solo 30% del daño de fuego
      resistencias.hielo = 1.5; // hielo hace más daño
      break;
    case "vulnerableHielo":
      resistencias.hielo = 2; // recibe doble daño hielo
      break;
  }

  return {
    id: Date.now() + Math.random(),
    lat,
    lng,
    vida: 50 + oleada * 15,
    velocidad: velocidadBase,
    velocidadOriginal: velocidadBase,
    slowStacks: 0,
    quemaduras: [],
    path: undefined,
    pathIndex: undefined,
    progress: undefined,
    tipo,
    resistencias,
  };
}
