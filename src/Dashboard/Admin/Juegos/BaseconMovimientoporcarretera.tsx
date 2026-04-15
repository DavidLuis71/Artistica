// src/pages/Juegos/Base.tsx
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Marker,
  Circle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import ElegirBase from "./ElegirBase";
import { TORRES_STATS } from "./torres";
import type { Torre, TipoTorre } from "./torres";

import L from "leaflet";

interface Enemigo {
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
interface Proyectil {
  id: number;
  torre: Torre;
  objetivo: Enemigo;
  progreso: number; // 0 a 1
  tipo: TipoTorre;
}

// Graph types for routing
type Node = { lat: number; lng: number };
type Adj = Record<number, { to: number; w: number }[]>;

export default function Base() {
  const [miUbicacion, setMiUbicacion] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [baseUbicacion, setBaseUbicacion] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [torresIniciales, setTorresIniciales] = useState<Torre[]>([]);
  const [enemigos, setEnemigos] = useState<Enemigo[]>([]);
  const [proyectiles, setProyectiles] = useState<Proyectil[]>([]);
  const [enemigosDerrotadosPorTipo, setEnemigosDerrotadosPorTipo] = useState<
    Record<string, number>
  >({
    normal: 0,
    blindado: 0,
    resistenteFuego: 0,
    vulnerableHielo: 0,
  });

  const [modoElegirBase, setModoElegirBase] = useState(true);
  const VIDA_BASE = 10;
  const [vidaBase, setVidaBase] = useState<number>(VIDA_BASE);
  const [torreSeleccionada, setTorreSeleccionada] = useState<Torre | null>(
    null
  );
  const [oleada, setOleada] = useState(1);
  const mapRef = useRef<any>(null);

  // carreteras y grafo generado desde Overpass
  const [carreteras, setCarreteras] = useState<any[] | null>(null);
  const [nodes, setNodes] = useState<Node[] | null>(null);
  const [adj, setAdj] = useState<Adj | null>(null);

  // Geolocalización solo para centrar el mapa
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setMiUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
  }, []);

  const centrarMapa = () => {
    if (miUbicacion && mapRef.current)
      mapRef.current.setView([miUbicacion.lat, miUbicacion.lng], 16);
  };

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

  // -----------------------------
  //  OVERPASS + BUILD GRAPH
  // -----------------------------
  async function hayCarreteraCerca(lat: number, lng: number, radio = 40) {
    // Radio en metros
    const query = `
      [out:json][timeout:25];
      way(around:${radio},${lat},${lng})["highway"];
      out geom;
    `;
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });
      const data = await res.json();
      return data.elements.length > 0 ? data.elements : null;
    } catch (err) {
      console.error("Error al consultar carreteras:", err);
      return null;
    }
  }

  // Build graph from Overpass ways (each way has geometry: array of {lat, lon})
  function buildGraphFromCarreteras(carreterasData: any[] | null) {
    if (!carreterasData || carreterasData.length === 0)
      return { nodes: null, adj: null };

    const nodeIndex = new Map<string, number>();
    const nodesArr: Node[] = [];
    const adjLocal: Adj = {};

    function key(lat: number, lng: number) {
      // round to avoid micro-floating diffs
      return `${lat.toFixed(6)},${lng.toFixed(6)}`;
    }

    function ensureNode(lat: number, lng: number) {
      const k = key(lat, lng);
      if (nodeIndex.has(k)) return nodeIndex.get(k)!;
      const idx = nodesArr.length;
      nodesArr.push({ lat, lng });
      nodeIndex.set(k, idx);
      adjLocal[idx] = [];
      return idx;
    }

    carreterasData.forEach((way) => {
      const geom = way.geometry || way.nodes;
      if (!geom || geom.length < 2) return;
      for (let i = 0; i < geom.length; i++) {
        const p = geom[i];
        const idx = ensureNode(p.lat, p.lon);
        if (i > 0) {
          const prev = geom[i - 1];
          const prevIdx = ensureNode(prev.lat, prev.lon);
          const w = distanciaEnMetros(prev.lat, prev.lon, p.lat, p.lon);
          // add both directions
          adjLocal[prevIdx].push({ to: idx, w });
          adjLocal[idx].push({ to: prevIdx, w });
        }
      }
    });

    return { nodes: nodesArr, adj: adjLocal };
  }

  // Encuentra nodo más cercano en el grafo a una coordenada
  function findNearestNode(nodesArr: Node[] | null, lat: number, lng: number) {
    if (!nodesArr || nodesArr.length === 0) return null;
    let bestIdx = 0;
    let bestD = Infinity;
    nodesArr.forEach((n, i) => {
      const d = distanciaEnMetros(lat, lng, n.lat, n.lng);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    });
    return { idx: bestIdx, dist: bestD };
  }

  // -----------------------------
  //  A* PATHFINDING
  // -----------------------------
  function heuristic(nodesArr: Node[], a: number, b: number) {
    const A = nodesArr[a];
    const B = nodesArr[b];
    return distanciaEnMetros(A.lat, A.lng, B.lat, B.lng);
  }

  function astar(nodesArr: Node[], adjLocal: Adj, start: number, goal: number) {
    // Basic A* with arrays / maps
    const openSet = new Set<number>([start]);
    const cameFrom = new Map<number, number>();
    const gScore = new Map<number, number>();
    const fScore = new Map<number, number>();

    gScore.set(start, 0);
    fScore.set(start, heuristic(nodesArr, start, goal));

    while (openSet.size > 0) {
      // pick node with lowest fScore
      let current = -1;
      let bestF = Infinity;
      openSet.forEach((n) => {
        const f = fScore.get(n) ?? Infinity;
        if (f < bestF) {
          bestF = f;
          current = n;
        }
      });

      if (current === goal) {
        // reconstruct path
        const path: number[] = [];
        let cur = current;
        while (cameFrom.has(cur)) {
          path.push(cur);
          cur = cameFrom.get(cur)!;
        }
        path.push(start);
        path.reverse();
        return path;
      }

      openSet.delete(current);
      const neighbors = adjLocal[current] || [];
      for (const { to, w } of neighbors) {
        const tentativeG = (gScore.get(current) ?? Infinity) + w;
        if (tentativeG < (gScore.get(to) ?? Infinity)) {
          cameFrom.set(to, current);
          gScore.set(to, tentativeG);
          fScore.set(to, tentativeG + heuristic(nodesArr, to, goal));
          if (!openSet.has(to)) openSet.add(to);
        }
      }
    }

    // no path
    return null;
  }

  // Convert path of node indices to coords
  function pathIndicesToCoords(nodesArr: Node[], pathIndices: number[]) {
    return pathIndices.map((i) => ({
      lat: nodesArr[i].lat,
      lng: nodesArr[i].lng,
    }));
  }

  // -----------------------------
  //  Generación de enemigos (spawn)
  // -----------------------------
  function crearEnemigoBase(
    lat: number,
    lng: number,
    oleada: number,
    tipo: Enemigo["tipo"] = "normal"
  ): Enemigo {
    const velocidadBase = 3 + oleada * 0.1;

    const resistencias = { basico: 1, fuego: 1, hielo: 1, electrica: 1 };

    switch (tipo) {
      case "blindado":
        resistencias.basico = 0.5; // reciben la mitad de daño físico
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
      vida: 50 + oleada * 20,
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

  function generarEnemigo(
    base: { lat: number; lng: number },
    oleada: number
  ): Enemigo {
    if (!carreteras || !nodes || !adj) {
      // fallback: spawn in ring
      const ang = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 100; // meters
      const offsetLat = (Math.cos(ang) * dist) / 111111;
      const offsetLng =
        (Math.sin(ang) * dist) /
        (111111 * Math.cos((base.lat * Math.PI) / 180));

      const rand = Math.random();
      let tipoRandom: Enemigo["tipo"];
      if (rand < 0.6) {
        tipoRandom = "normal"; // 60%
      } else if (rand < 0.75) {
        tipoRandom = "blindado"; // 15%
      } else if (rand < 0.9) {
        tipoRandom = "resistenteFuego"; // 15%
      } else {
        tipoRandom = "vulnerableHielo"; // 10%
      }
      return crearEnemigoBase(
        base.lat + offsetLat,
        base.lng + offsetLng,
        oleada,
        tipoRandom
      );
    }

    // spawn on a random road node
    const carretera = carreteras[Math.floor(Math.random() * carreteras.length)];
    const geom = carretera.geometry || carretera.nodes;
    const nodo = geom[Math.floor(Math.random() * geom.length)];
    const spawnLat = nodo.lat;
    const spawnLng = nodo.lon;

    // create enemy with route to nearest node to base and random type
    // lo reemplazamos por:
    const rand = Math.random();
    let tipoRandom: Enemigo["tipo"];
    if (rand < 0.6) {
      tipoRandom = "normal"; // 60%
    } else if (rand < 0.75) {
      tipoRandom = "blindado"; // 15%
    } else if (rand < 0.9) {
      tipoRandom = "resistenteFuego"; // 15%
    } else {
      tipoRandom = "vulnerableHielo"; // 10%
    }

    const enemy = crearEnemigoBase(spawnLat, spawnLng, oleada, tipoRandom);

    // compute path from spawn node -> nearest node to base
    const nearestToSpawn = findNearestNode(nodes, spawnLat, spawnLng);
    const nearestToBase = findNearestNode(nodes, base.lat, base.lng);

    if (
      nearestToSpawn &&
      nearestToBase &&
      nearestToSpawn.idx !== nearestToBase.idx
    ) {
      const indicesPath = astar(
        nodes,
        adj,
        nearestToSpawn.idx,
        nearestToBase.idx
      );
      if (indicesPath && indicesPath.length > 0) {
        enemy.path = pathIndicesToCoords(nodes, indicesPath);
        enemy.pathIndex = 0;
        enemy.progress = 0;
        // set initial position exactly at first node to avoid jump
        const first = enemy.path[0];
        enemy.lat = first.lat;
        enemy.lng = first.lng;
      }
    } else if (
      nearestToBase &&
      nearestToSpawn &&
      nearestToSpawn.idx === nearestToBase.idx
    ) {
      // same node: direct to base
      enemy.path = [{ lat: base.lat, lng: base.lng }];
      enemy.pathIndex = 0;
      enemy.progress = 0;
    }

    return enemy;
  }

  // -----------------------------
  //  MOVER ENEMIGOS: sigue path si existe; si no, movimiento recto
  // -----------------------------
  useEffect(() => {
    if (!baseUbicacion) return;
    const tickMs = 100;
    const interval = setInterval(() => {
      setEnemigos(
        (prev) =>
          prev
            .map((e) => {
              // if enemy has path (road), follow it segment-by-segment
              if (e.path && e.path.length && typeof e.pathIndex === "number") {
                let { pathIndex = 0, progress = 0 } = e;
                // if at last node -> move directly to base
                if (pathIndex >= e.path.length - 1) {
                  const target = {
                    lat: baseUbicacion.lat,
                    lng: baseUbicacion.lng,
                  };
                  const d = distanciaEnMetros(
                    e.lat,
                    e.lng,
                    target.lat,
                    target.lng
                  );
                  if (d < 5) {
                    setVidaBase((v) => v - 1);
                    return null;
                  }
                  const step = e.velocidad * (tickMs / 1000);
                  const ratio = Math.min(1, step / (d || 1));
                  return {
                    ...e,
                    lat: e.lat + (target.lat - e.lat) * ratio,
                    lng: e.lng + (target.lng - e.lng) * ratio,
                  };
                }

                // segment endpoints
                const a = e.path[pathIndex];
                const b = e.path[pathIndex + 1];
                const segLen = distanciaEnMetros(a.lat, a.lng, b.lat, b.lng);
                if (segLen === 0) {
                  // skip zero-length
                  pathIndex++;
                  progress = 0;
                  e.pathIndex = pathIndex;
                  e.progress = progress;
                  return { ...e };
                }
                const stepMeters = e.velocidad * (tickMs / 1000);
                const addProg = stepMeters / segLen;
                progress += addProg;

                if (progress >= 1) {
                  // move to next node and carry over extra progress
                  pathIndex++;
                  // if advanced beyond last node, clamp and next tick will go to base or finish
                  progress = Math.max(0, progress - 1);
                  const newPos = e.path[pathIndex] ?? e.path[e.path.length - 1];
                  return {
                    ...e,
                    lat: newPos.lat,
                    lng: newPos.lng,
                    pathIndex,
                    progress,
                  };
                } else {
                  // interpolate between a and b
                  const newLat = a.lat + (b.lat - a.lat) * progress;
                  const newLng = a.lng + (b.lng - a.lng) * progress;
                  return {
                    ...e,
                    lat: newLat,
                    lng: newLng,
                    pathIndex,
                    progress,
                  };
                }
              } else {
                // fallback: move straight to base
                const d = distanciaEnMetros(
                  e.lat,
                  e.lng,
                  baseUbicacion.lat,
                  baseUbicacion.lng
                );
                if (d < 5) {
                  setVidaBase((v) => v - 1);
                  return null;
                }
                const stepMeters = e.velocidad * (tickMs / 1000);
                const ratio = Math.min(1, stepMeters / (d || 1));
                return {
                  ...e,
                  lat: e.lat + (baseUbicacion.lat - e.lat) * ratio,
                  lng: e.lng + (baseUbicacion.lng - e.lng) * ratio,
                };
              }
            })
            .filter(Boolean) as Enemigo[]
      );
    }, tickMs);

    return () => clearInterval(interval);
  }, [baseUbicacion]);

  // -----------------------------
  //  Torres / proyectiles (dejé casi igual)
  // -----------------------------
  useEffect(() => {
    if (!torresIniciales.length) return;

    const interval = setInterval(() => {
      setProyectiles((prevProyectiles) => {
        const nuevosProyectiles: Proyectil[] = [...prevProyectiles];

        setEnemigos((enemigosActuales) => {
          torresIniciales.forEach((torre) => {
            const stats = TORRES_STATS[torre.tipo];
            if (!stats) return;

            const objetivos = enemigosActuales.filter((e) => {
              const d = distanciaEnMetros(e.lat, e.lng, torre.lat, torre.lng);
              return d <= stats.rango;
            });

            // simplificamos: cada torre dispara al objetivo más cercano (evita spam)
            if (objetivos.length > 0) {
              const objetivo = objetivos.sort(
                (a, b) =>
                  distanciaEnMetros(a.lat, a.lng, torre.lat, torre.lng) -
                  distanciaEnMetros(b.lat, b.lng, torre.lat, torre.lng)
              )[0];
              nuevosProyectiles.push({
                id: Date.now() + Math.random(),
                torre,
                objetivo,
                progreso: 0,
                tipo: torre.tipo,
              });
            }
          });
          return enemigosActuales;
        });

        return nuevosProyectiles;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [torresIniciales]);

  // Animar proyectiles (idéntico al tuyo)
  useEffect(() => {
    if (!proyectiles.length) return;
    const interval = setInterval(() => {
      setProyectiles((prev) =>
        prev
          .map((p) => ({ ...p, progreso: p.progreso + 0.1 }))
          .filter((p) => {
            if (p.progreso >= 1) {
              const stats = TORRES_STATS[p.torre.tipo];
              setEnemigos((prevEnemigos) =>
                prevEnemigos
                  .map((e) => {
                    if (e.id === p.objetivo.id) {
                      let dañoFinal = stats.daño;

                      switch (stats.tipoAtaque) {
                        case "single":
                        case "area":
                        case "dot":
                        case "slow":
                        case "chain": {
                          // aplicar resistencia según tipo de torre
                          const resistKey =
                            p.tipo as keyof typeof e.resistencias;
                          dañoFinal *= e.resistencias[resistKey] ?? 1;

                          e.vida -= dañoFinal;
                          // si torre es slow, aplicamos efecto como antes
                          if (stats.tipoAtaque === "slow") {
                            const maxStacks = 3;
                            const slowPerStack = 0.2;
                            if (e.slowStacks < maxStacks) {
                              e.slowStacks += 1;
                              const reduccion = Math.min(
                                0.6,
                                e.slowStacks * slowPerStack
                              );
                              e.velocidad =
                                e.velocidadOriginal * (1 - reduccion);
                            }
                          }
                          break;
                        }
                      }

                      return { ...e };
                    }
                    return e;
                  })
                  .filter((e) => {
                    if (e.vida <= 0) {
                      setEnemigosDerrotadosPorTipo((prev) => ({
                        ...prev,
                        [e.tipo]: (prev[e.tipo] ?? 0) + 1,
                      }));

                      return false; // elimina enemigo
                    }
                    return true;
                  })
              );
              return false; // eliminar proyectil que impactó
            }
            return true;
          })
      );
    }, 50);
    return () => clearInterval(interval);
  }, [proyectiles]);

  // Generar enemigos periódicamente y oleadas
  useEffect(() => {
    if (!baseUbicacion) return;
    const interval = setInterval(() => {
      setEnemigos((prev) => [...prev, generarEnemigo(baseUbicacion, oleada)]);
    }, 3000);

    const intervalOleadas = setInterval(() => {
      setOleada((o) => o + 1);
    }, 200000);

    return () => {
      clearInterval(interval);
      clearInterval(intervalOleadas);
    };
  }, [baseUbicacion, carreteras, nodes, adj, oleada]);

  // -----------------------------
  //  Overpass cuando se confirma la base: carga carreteras y contruye grafo
  // -----------------------------
  return (
    <div>
      <h2>Base y Torres</h2>
      <p>Vida de la base: {vidaBase}</p>
      <div>
        <ul>
          <li>Normal: {enemigosDerrotadosPorTipo.normal}</li>
          <li>Blindado: {enemigosDerrotadosPorTipo.blindado}</li>
          <li>
            Resistente al fuego: {enemigosDerrotadosPorTipo.resistenteFuego}
          </li>
          <li>
            Vulnerable al hielo: {enemigosDerrotadosPorTipo.vulnerableHielo}
          </li>
        </ul>
      </div>

      {modoElegirBase ? (
        <ElegirBase
          onConfirm={async (base, torres) => {
            setBaseUbicacion(base);
            setTorresIniciales(torres);
            setModoElegirBase(false);

            // consulta Overpass y contruye grafo
            const result = await hayCarreteraCerca(base.lat, base.lng, 80);
            setCarreteras(result);
            const g = buildGraphFromCarreteras(result);
            setNodes(g.nodes);
            setAdj(g.adj);
          }}
        />
      ) : miUbicacion ? (
        <MapContainer
          center={[
            baseUbicacion?.lat ?? miUbicacion.lat,
            baseUbicacion?.lng ?? miUbicacion.lng,
          ]}
          zoom={16}
          scrollWheelZoom
          className="leaflet-container"
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />

          {baseUbicacion && (
            <CircleMarker
              center={[baseUbicacion.lat, baseUbicacion.lng]}
              radius={12}
              color="green"
              fillColor="lime"
            >
              <Popup>🏠 Base</Popup>
            </CircleMarker>
          )}

          {/* show road nodes optionally for debug */}
          {/* {nodes &&
            nodes
              .slice(0, 500)
              .map((n, i) => (
                <CircleMarker
                  key={i}
                  center={[n.lat, n.lng]}
                  radius={1}
                  color="black"
                  opacity={0.4}
                />
              ))} */}

          {torresIniciales.map((t) => {
            return (
              <Marker
                key={t.id}
                position={[t.lat, t.lng]}
                icon={L.divIcon({
                  html:
                    t.tipo === "basica"
                      ? "🟣"
                      : t.tipo === "fuego"
                      ? "🔥"
                      : t.tipo === "electrica"
                      ? "⚡"
                      : "❄️",
                  iconSize: [24, 24],
                  className: "torre-icon",
                })}
                eventHandlers={{
                  click: () => setTorreSeleccionada(t),
                }}
              >
                <Popup>
                  Torre {t.tipo} (Nivel {t.nivel})
                </Popup>
              </Marker>
            );
          })}

          {torreSeleccionada && (
            <Circle
              center={[torreSeleccionada.lat, torreSeleccionada.lng]}
              radius={TORRES_STATS[torreSeleccionada.tipo].rango}
              pathOptions={{
                color: "blue",
                fillColor: "blue",
                fillOpacity: 0.2,
              }}
            />
          )}

          {enemigos
            .filter((e) => e.vida > 0)
            .map((e) => {
              let color = "red";
              let fillColor = "darkred";

              switch (e.tipo) {
                case "blindado":
                  color = "gray";
                  fillColor = "darkgray";
                  break;
                case "resistenteFuego":
                  color = "orange";
                  fillColor = "orangered";
                  break;
                case "vulnerableHielo":
                  color = "cyan";
                  fillColor = "deepskyblue";
                  break;
                case "normal":
                default:
                  color = "red";
                  fillColor = "darkred";
                  break;
              }

              return (
                <CircleMarker
                  key={e.id}
                  center={[e.lat, e.lng]}
                  radius={6}
                  color={color}
                  fillColor={fillColor}
                >
                  <Popup>
                    Vida: {e.vida} <br />
                    Tipo: {e.tipo}
                  </Popup>
                </CircleMarker>
              );
            })}

          {/* Dibujar proyectiles */}
          {proyectiles.map((p) => {
            const { torre, objetivo, progreso, tipo, id } = p;
            const lat = torre.lat + (objetivo.lat - torre.lat) * progreso;
            const lng = torre.lng + (objetivo.lng - torre.lng) * progreso;
            let color = "yellow";
            let radius = 2;
            if (tipo === "fuego") {
              color = "orange";
              radius = 6;
            }
            if (tipo === "electrica") color = "blue";
            if (tipo === "hielo") {
              color = "cyan";
              radius = 5;
            }

            return (
              <Circle
                key={id}
                center={[lat, lng]}
                radius={radius}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.6 }}
              />
            );
          })}

          {/* Debug: draw paths for enemies (optional) */}
          {/* {enemigos.map(
            (e) =>
              e.path &&
              e.path.length > 0 &&
              e.path.map((p, idx) => {
                // small markers for path
                return (
                  <Circle
                    key={`${e.id}-path-${idx}`}
                    center={[p.lat, p.lng]}
                    radius={1}
                    pathOptions={{
                      color: "orange",
                      fillColor: "orange",
                      fillOpacity: 0.6,
                    }}
                  />
                );
              })
          )} */}
        </MapContainer>
      ) : (
        <p>Cargando mapa...</p>
      )}

      {!modoElegirBase && (
        <button onClick={centrarMapa} style={{ marginTop: "10px" }}>
          Centrar mapa
        </button>
      )}
    </div>
  );
}
