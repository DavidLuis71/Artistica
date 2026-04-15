// src/pages/Juegos/Mapa.tsx
import { MapContainer, TileLayer, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import "./Mapa.css";

interface Punto {
  id: number;
  lat: number;
  lng: number;
  nombre: string;
  color?: string;
  tipo: "madera" | "piedra" | "oro" | "cristal";
}

interface Node {
  id: string;
  lat: number;
  lng: number;
}

interface Recurso {
  tipo: "madera" | "piedra" | "oro" | "cristal";
  color: string;
  puntos: number;
}

const RECURSOS: Recurso[] = [
  { tipo: "madera", color: "#8B4513", puntos: 1 },
  { tipo: "piedra", color: "#808080", puntos: 2 },
  { tipo: "oro", color: "#FFD700", puntos: 5 },
  { tipo: "cristal", color: "#1E90FF", puntos: 8 },
];

interface MapaProps {
  onRecolectar?: (puntos: Punto[]) => void;
}

export default function Mapa({ onRecolectar }: MapaProps) {
  // Coordenadas de fallback (pueden ser tu ciudad favorita)
  // Coordenadas de fallback (Santander)
  const POS_FALLBACK = { lat: 43.4623, lng: -3.809 };

  const [miUbicacion, setMiUbicacion] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [coleccionables, setColeccionables] = useState<Punto[]>([]);
  const [eventoEspecial, setEventoEspecial] = useState<Punto | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [cantidadColecionables] = useState(14);
  const [materiales, setMateriales] = useState<{
    madera: number;
    piedra: number;
    oro: number;
    cristal: number;
  }>(() => ({
    madera: Number(localStorage.getItem("madera") || 0),
    piedra: Number(localStorage.getItem("piedra") || 0),
    oro: Number(localStorage.getItem("oro") || 0),
    cristal: Number(localStorage.getItem("cristal") || 0),
  }));

  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const ubicacion = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setMiUbicacion(ubicacion);

        // ✅ Función async interna para pedir nodos
        const fetchNodes = async () => {
          if (nodes.length === 0) {
            const overpassQuery = `
            [out:json][timeout:25];
            way["highway"](around:1000,${ubicacion.lat},${ubicacion.lng});
            out geom;
          `;

            try {
              const resp = await fetch(
                "https://overpass-api.de/api/interpreter",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  body: "data=" + encodeURIComponent(overpassQuery),
                }
              );
              const data = await resp.json();

              const newNodes: Node[] = [];
              data.elements.forEach((el: any) => {
                if (el.type === "way" && el.geometry) {
                  el.geometry.forEach((p: any) =>
                    newNodes.push({
                      id: `${p.lat}_${p.lon}`,
                      lat: p.lat,
                      lng: p.lon,
                    })
                  );
                }
              });
              setNodes(newNodes);
            } catch (err) {
              console.error("Error cargando nodos de Overpass:", err);
            }
          }
        };

        fetchNodes(); // 👈 llamar la función async aquí
        if (coleccionables.length === 0)
          setColeccionables(generarColeccionablesCalles(cantidadColecionables));
        if (!eventoEspecial) {
          const evento = generarEventoEspecialCalles();
          if (evento) {
            setEventoEspecial(evento);
            setMostrarModal(true);
          }
        }
      },
      (err) => {
        console.error("Error geolocalización:", err);
        // fallback a Madrid solo si falla
        setMiUbicacion(POS_FALLBACK);
      },
      { enableHighAccuracy: false, maximumAge: 1000, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [coleccionables, eventoEspecial]);

  const centrarMapa = () => {
    if (miUbicacion && mapRef.current)
      mapRef.current.setView([miUbicacion.lat, miUbicacion.lng], 16);
  };

  useEffect(() => {
    if (!miUbicacion) return;
    const DISTANCIA_RECOGER = 20;

    const restantes = coleccionables.filter((p) => {
      const d = distanciaEnMetros(
        miUbicacion.lat,
        miUbicacion.lng,
        p.lat,
        p.lng
      );
      if (d < DISTANCIA_RECOGER) {
        // Actualizamos cantidad de ese tipo
        setMateriales((prev) => {
          const nuevo = { ...prev, [p.tipo]: prev[p.tipo] + 1 };
          localStorage.setItem(p.tipo, String(nuevo[p.tipo]));
          return nuevo;
        });
        return false; // se ha recogido
      }
      return true; // sigue en el mapa
    });

    if (eventoEspecial) {
      const d = distanciaEnMetros(
        miUbicacion.lat,
        miUbicacion.lng,
        eventoEspecial.lat,
        eventoEspecial.lng
      );
      if (d < DISTANCIA_RECOGER) {
        // Por ejemplo, el evento podría dar 5 de cada material
        setMateriales((prev) => {
          const nuevo = {
            madera: prev.madera + 5,
            piedra: prev.piedra + 5,
            oro: prev.oro + 5,
            cristal: prev.cristal + 5,
          };
          Object.entries(nuevo).forEach(([key, value]) =>
            localStorage.setItem(key, String(value))
          );
          return nuevo;
        });
        setEventoEspecial(null);
        setTiempoRestante(null);
      }
    }

    const recogidos = coleccionables.length - restantes.length;
    if (recogidos > 0) {
      const nuevos = generarColeccionablesCalles(recogidos);
      setColeccionables([...restantes, ...nuevos]);
    } else if (restantes.length !== coleccionables.length) {
      setColeccionables(restantes);
    }

    if (recogidos > 0 && onRecolectar) onRecolectar(restantes);
  }, [miUbicacion, coleccionables, eventoEspecial, onRecolectar]);

  useEffect(() => {
    if (tiempoRestante === null) return;
    if (tiempoRestante <= 0) {
      setEventoEspecial(null);
      setTiempoRestante(null);
      return;
    }
    const t = setTimeout(() => setTiempoRestante(tiempoRestante - 1), 1000);
    return () => clearTimeout(t);
  }, [tiempoRestante]);

  function distanciaEnMetros(
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

  function generarColeccionablesCalles(cantidad: number): Punto[] {
    if (!miUbicacion) return [];
    const coleccionables: Punto[] = [];

    for (let i = 0; i < cantidad; i++) {
      if (nodes && nodes.length > 0) {
        // Filtramos nodos a menos de 200m del jugador
        const nodosCercanos = nodes.filter(
          (n) =>
            distanciaEnMetros(miUbicacion.lat, miUbicacion.lng, n.lat, n.lng) <
            5000
        );

        if (nodosCercanos.length > 0) {
          const tipos: Punto["tipo"][] = ["madera", "piedra", "oro", "cristal"];
          const nodo =
            nodosCercanos[Math.floor(Math.random() * nodosCercanos.length)];
          coleccionables.push({
            id: Date.now() + i,
            lat: nodo.lat,
            lng: nodo.lng,
            nombre: `Coleccionable ${i + 1}`,
            tipo: tipos[Math.floor(Math.random() * tipos.length)],
          });
          continue;
        }
      }
      const recurso = RECURSOS[Math.floor(Math.random() * RECURSOS.length)];
      // Fallback: si no hay nodos cercanos, generamos aleatorio dentro de ±0.002° (~200m)
      coleccionables.push({
        id: Date.now() + i,
        lat: miUbicacion.lat + (Math.random() - 0.5) * 0.008,
        lng: miUbicacion.lng + (Math.random() - 0.5) * 0.008,
        nombre: `~${recurso.tipo} ${i + 1}`,
        color: recurso.color,
        tipo: recurso.tipo,
      });
    }

    return coleccionables;
  }

  function generarEventoEspecialCalles(): Punto | null {
    if (!miUbicacion) return null;

    if (nodes && nodes.length > 0) {
      const nodosCercanos = nodes.filter(
        (n) =>
          distanciaEnMetros(miUbicacion.lat, miUbicacion.lng, n.lat, n.lng) <
          1200
      );

      if (nodosCercanos.length > 0) {
        const nodo =
          nodosCercanos[Math.floor(Math.random() * nodosCercanos.length)];
        return {
          id: 999,
          lat: nodo.lat,
          lng: nodo.lng,
          nombre: "Evento Especial",
          tipo: "oro",
        };
      }
    }

    // Fallback: generar aleatorio dentro de ±0.004° (~200m)
    return {
      id: 999,
      lat: miUbicacion.lat + (Math.random() - 0.5) * 0.0004,
      lng: miUbicacion.lng + (Math.random() - 0.5) * 0.0004,
      nombre: "Evento Especial",
      tipo: "oro",
    };
  }

  return (
    <div>
      <h2>Mapa de Recolección</h2>
      <p>Madera: {materiales.madera}</p>
      <p>Piedra: {materiales.piedra}</p>
      <p>Oro: {materiales.oro}</p>
      <p>Cristal: {materiales.cristal}</p>

      {miUbicacion ? (
        <div>
          <MapContainer
            center={[miUbicacion.lat, miUbicacion.lng]}
            zoom={16}
            scrollWheelZoom
            className="leaflet-container"
            ref={mapRef}
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; ESRI"
            />

            {/* Overlay de carreteras */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
              opacity={0.45} // semi-transparente para no tapar el satélite
            />
            <CircleMarker
              center={[miUbicacion.lat, miUbicacion.lng]}
              radius={10}
              color="blue"
              fillColor="cyan"
              fillOpacity={0.5}
            >
              <Popup>¡Aquí estás!</Popup>
            </CircleMarker>

            {coleccionables.map((p) => {
              const distancia = miUbicacion
                ? Math.round(
                    distanciaEnMetros(
                      miUbicacion.lat,
                      miUbicacion.lng,
                      p.lat,
                      p.lng
                    )
                  )
                : null;
              return (
                <CircleMarker
                  key={p.id}
                  center={[p.lat, p.lng]}
                  radius={8}
                  color={p.color}
                  fillColor={p.color}
                  fillOpacity={0.7}
                >
                  <Popup>
                    {p.nombre}
                    {distancia !== null && <p>Distancia: {distancia} m</p>}
                  </Popup>
                </CircleMarker>
              );
            })}

            {eventoEspecial && (
              <CircleMarker
                center={[eventoEspecial.lat, eventoEspecial.lng]}
                radius={10}
                color="red"
                fillColor="pink"
                fillOpacity={0.8}
              >
                <Popup>
                  {eventoEspecial.nombre}
                  {tiempoRestante !== null && <p>⏳ {tiempoRestante}s</p>}
                </Popup>
              </CircleMarker>
            )}
          </MapContainer>
          <button onClick={centrarMapa} style={{ marginTop: "10px" }}>
            Centrarme
          </button>
        </div>
      ) : (
        <p>Cargando mapa...</p>
      )}

      {mostrarModal && (
        <div className="Mapa-Juego-modal">
          <div className="Mapa-Juego-modal-contenido">
            <p>¡Se ha detectado un Evento Especial! ¿Quieres verlo?</p>
            <button
              onClick={() => {
                setMostrarModal(false);
                setTiempoRestante(120);
              }}
            >
              Sí
            </button>
            <button
              onClick={() => {
                setMostrarModal(false);
                setEventoEspecial(null);
              }}
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
