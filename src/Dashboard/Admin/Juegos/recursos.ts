import L from "leaflet";
import vehiculoImg from "./vehiculo.png";
import camionPesadoImg from "./camionPesado.png";
import baseImg from "./edificio.png";
import minaImg from "./mina.png";
import bosqueImg from "./bosque.png";
import canteraImg from "./cantera.png";
import granjaImg from "./granja.png";
import gasolineraImg from "./gasolinera.png";
import enemigoImg from "./enemigo.png";

export type TipoRecurso =
  | "mina"
  | "bosque"
  | "cantera"
  | "granja"
  | "gasolinera";

export interface PuntoRecurso {
  id: number;
  pos: { lat: number; lng: number };
  tipo: TipoRecurso;
}
export interface TorreVision {
  id: number;
  pos: Coordenadas;
  vision: number;
  durabilidad: number;
}

export interface Coordenadas {
  lat: number;
  lng: number;
}
export interface Vehiculo {
  id: number;
  nombre: string;
  pos: Coordenadas;
  enViaje: boolean;
  recolectando: boolean;
  progreso: number;
  capacidad: number; // Máximo de recursos que puede transportar
  velocidad: number; // metros por tick
  tiempoRecoleccion: number; // ms que tarda en recolectar
  danio: number; // para futuro combate
  combustible: number;
  combustibleMax: number;
  ruta?: Coordenadas[];
  desbloqueado?: boolean;
  durabilidad: number; // 0-100%
}
// Lista de recursos predefinidos
export const recursos: PuntoRecurso[] = [
  // tus existentes...
  { id: 0, pos: { lat: 43.4625, lng: -3.808 }, tipo: "mina" },
  { id: 1, pos: { lat: 43.4725, lng: -3.8181 }, tipo: "gasolinera" },
  { id: 2, pos: { lat: 43.463, lng: -3.809 }, tipo: "bosque" },

  { id: 3, pos: { lat: 43.462, lng: -3.81 }, tipo: "cantera" },
  { id: 4, pos: { lat: 43.4615, lng: -3.807 }, tipo: "granja" },

  // nuevos para Santander / Cantabria
  { id: 5, pos: { lat: 43.4722475, lng: -3.8199358 }, tipo: "bosque" },
  { id: 6, pos: { lat: 43.4763, lng: -3.79339 }, tipo: "granja" },
  { id: 7, pos: { lat: 43.46295, lng: -3.78701 }, tipo: "cantera" },
  { id: 8, pos: { lat: 43.45865, lng: -3.81123 }, tipo: "bosque" },
  { id: 9, pos: { lat: 43.4647, lng: -3.8044 }, tipo: "mina" },
];

export const iconosVehiculo: Record<string, L.Icon> = {
  "Camión Ligero": new L.Icon({
    iconUrl: vehiculoImg,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
  "Camión Pesado": new L.Icon({
    iconUrl: camionPesadoImg,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
  "Camión Todoterreno": new L.Icon({
    iconUrl: "ruta/a/todoterreno.png", // <--- icono del nuevo camión
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
  "Camión Monstruo": new L.Icon({
    iconUrl: "ruta/a/monstruo.png", // <--- icono del nuevo camión
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
  "Camión Rápido": new L.Icon({
    iconUrl: "ruta/a/rapido.png",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
  "Camión Blindado": new L.Icon({
    iconUrl: "ruta/a/blindado.png",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
  "Camión Recolector": new L.Icon({
    iconUrl: "ruta/a/recolector.png",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
  "Camión Fantasma": new L.Icon({
    iconUrl: "ruta/a/fantasma.png",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
  "Enemigo a": new L.Icon({
    iconUrl: enemigoImg,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
};
export const iconTorre = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export const vehiculosIniciales: Vehiculo[] = [
  {
    id: 0,
    nombre: "Camión Ligero",
    pos: { lat: 0, lng: 0 },
    enViaje: false,
    recolectando: false,
    progreso: 0,
    capacidad: 20,
    velocidad: 5,
    tiempoRecoleccion: 6500,
    danio: 5,
    combustible: 50,
    combustibleMax: 50,
    durabilidad: 100,
  },
  {
    id: 1,
    nombre: "Camión Pesado",
    pos: { lat: 0, lng: 0 },
    enViaje: false,
    recolectando: false,
    progreso: 0,
    capacidad: 50,
    velocidad: 3,
    tiempoRecoleccion: 10000,
    danio: 10,
    combustible: 100,
    combustibleMax: 100,
    durabilidad: 100,
  },
  {
    id: 2,
    nombre: "Camión Todoterreno",
    pos: { lat: 0, lng: 0 },
    enViaje: false,
    recolectando: false,
    progreso: 0,
    capacidad: 35,
    velocidad: 4,
    tiempoRecoleccion: 7000,
    danio: 8,
    combustible: 70,
    combustibleMax: 70,
    durabilidad: 100,
  },
  {
    id: 3,
    nombre: "Camión Monstruo",
    pos: { lat: 0, lng: 0 },
    enViaje: false,
    recolectando: false,
    progreso: 0,
    capacidad: 100,
    velocidad: 2,
    tiempoRecoleccion: 14000,
    danio: 15,
    combustible: 150,
    combustibleMax: 150,
    durabilidad: 100,
  },
  {
    id: 4,
    nombre: "Camión Rápido",
    pos: { lat: 0, lng: 0 },
    enViaje: false,
    recolectando: false,
    progreso: 0,
    capacidad: 15,
    velocidad: 7, // súper rápido
    tiempoRecoleccion: 5000,
    danio: 3,
    combustible: 40,
    combustibleMax: 40,
    durabilidad: 100,
  },
  {
    id: 5,
    nombre: "Camión Blindado",
    pos: { lat: 0, lng: 0 },
    enViaje: false,
    recolectando: false,
    progreso: 0,
    capacidad: 40,
    velocidad: 3,
    tiempoRecoleccion: 13000,
    danio: 12,
    combustible: 80,
    combustibleMax: 80,
    durabilidad: 100,
  },
  {
    id: 6,
    nombre: "Camión Recolector",
    pos: { lat: 0, lng: 0 },
    enViaje: false,
    recolectando: false,
    progreso: 0,
    capacidad: 60, // capacidad muy alta
    velocidad: 3,
    tiempoRecoleccion: 11000,
    danio: 5,
    combustible: 100,
    combustibleMax: 100,
    durabilidad: 100,
  },
  {
    id: 7,
    nombre: "Camión Fantasma",
    pos: { lat: 0, lng: 0 },
    enViaje: false,
    recolectando: false,
    progreso: 0,
    capacidad: 25,
    velocidad: 6,
    tiempoRecoleccion: 6000,
    danio: 7,
    combustible: 60,
    combustibleMax: 60,
    durabilidad: 100,
  },
];
export const iconBase = new L.Icon({
  iconUrl: baseImg,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export const iconosRecurso: Record<TipoRecurso, L.Icon> = {
  mina: new L.Icon({
    iconUrl: minaImg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }),
  bosque: new L.Icon({
    iconUrl: bosqueImg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }),
  cantera: new L.Icon({
    iconUrl: canteraImg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }),
  granja: new L.Icon({
    iconUrl: granjaImg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }),
  gasolinera: new L.Icon({
    iconUrl: gasolineraImg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }),
};
