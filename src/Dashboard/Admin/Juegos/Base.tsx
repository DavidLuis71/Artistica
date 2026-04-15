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
import { crearEnemigoBase, distanciaEnMetros, type Enemigo } from "./funciones";

interface Proyectil {
  id: number;
  torre: Torre;
  objetivo: Enemigo;
  progreso: number; // 0 a 1
  tipo: TipoTorre;
}

// ----- Graph types -----
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
  const [puntosTorre, setPuntosTorre] = useState<Record<TipoTorre, number>>({
    basica: 0,
    fuego: 0,
    electrica: 0,
    hielo: 0,
  });

  const [modoElegirBase, setModoElegirBase] = useState(true);
  const VIDA_BASE = 10;
  const [vidaBase, setVidaBase] = useState<number>(VIDA_BASE);
  const [torreSeleccionada, setTorreSeleccionada] = useState<Torre | null>(
    null
  );
  const [torresColocadas] = useState<Torre[]>([]);
  const [oleada, setOleada] = useState(1);
  const mapRef = useRef<any>(null);
  const oleadaRef = useRef(oleada);

  // carreteras (raw) y grafo
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

  // -----------------------------
  //  OVERPASS (solo 1 petición al confirmar base)
  // -----------------------------
  async function hayCarreteraCerca(lat: number, lng: number, radio = 400) {
    // radio en metros (por defecto 400m, ajústalo según necesidades)
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
      return data.elements && data.elements.length > 0 ? data.elements : null;
    } catch (err) {
      console.error("Error al consultar carreteras:", err);
      return null;
    }
  }

  // -----------------------------
  //  Build graph from Overpass "ways"
  //  nodes[] = array of {lat,lng}
  //  adj  = adjacency list with distance weights
  // -----------------------------
  function buildGraphFromCarreteras(carreterasData: any[] | null) {
    if (!carreterasData || carreterasData.length === 0)
      return { nodes: null, adj: null };

    const nodeIndex = new Map<string, number>();
    const nodesArr: Node[] = [];
    const adjLocal: Adj = {};

    const key = (lat: number, lng: number) =>
      `${lat.toFixed(6)},${lng.toFixed(6)}`;

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
      // Overpass may provide geometry: [{lat, lon}, ...]
      const geom = way.geometry ?? way.nodes;
      if (!geom || geom.length < 2) return;
      for (let i = 0; i < geom.length; i++) {
        const p = geom[i];
        // geometry items might be {lat, lon} or {lat, lon} depending on Overpass version
        const lat = p.lat ?? p[1] ?? null;
        const lon = p.lon ?? p.lon ?? p[0] ?? null;
        if (lat == null || lon == null) continue;
        const idx = ensureNode(lat, lon);
        if (i > 0) {
          const prev = geom[i - 1];
          const plat = prev.lat ?? prev[1];
          const plon = prev.lon ?? prev[0];
          if (plat == null || plon == null) continue;
          const prevIdx = ensureNode(plat, plon);
          const w = distanciaEnMetros(plat, plon, lat, lon);
          // add both directions (undirected)
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

  // Heurística Euclidiana (metros) para A*
  function heuristic(nodesArr: Node[], a: number, b: number) {
    const A = nodesArr[a];
    const B = nodesArr[b];
    return distanciaEnMetros(A.lat, A.lng, B.lat, B.lng);
  }

  // A* usando arrays/maps (suficiente para grafo pequeño/mediano)
  function astar(nodesArr: Node[], adjLocal: Adj, start: number, goal: number) {
    if (!nodesArr || !adjLocal) return null;
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
        // reconstruct path indices
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

    return null;
  }

  function pathIndicesToCoords(nodesArr: Node[], pathIndices: number[]) {
    return pathIndices.map((i) => ({
      lat: nodesArr[i].lat,
      lng: nodesArr[i].lng,
    }));
  }

  // -----------------------------
  //  Generación de enemigos (offline, sin OSRM)
  //  -> el enemigo spawnea en una geometry point de las ways,
  //     calcula path por grafo hasta el nodo más cercano a la base
  //  -> último tramo: recto desde último nodo a la base (opción 2)
  // -----------------------------
  function elegirTipoEnemigo(): Enemigo["tipo"] {
    const r = Math.random();
    if (r < 0.6) return "normal";
    if (r < 0.75) return "blindado";
    if (r < 0.9) return "resistenteFuego";
    return "vulnerableHielo";
  }

  async function generarEnemigoOffline(
    base: { lat: number; lng: number },
    oleada: number
  ): Promise<Enemigo> {
    const tipo = elegirTipoEnemigo();

    // Si no hay carreteras: fallback circular
    if (!carreteras || carreteras.length === 0 || !nodes || !adj) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 150 + Math.random() * 100;
      const offsetLat = (Math.cos(ang) * dist) / 111111;
      const offsetLng =
        (Math.sin(ang) * dist) /
        (111111 * Math.cos((base.lat * Math.PI) / 180));
      return crearEnemigoBase(
        base.lat + offsetLat,
        base.lng + offsetLng,
        oleada,
        tipo
      );
    }

    // elegir un punto (coord) de alguna way
    const carretera = carreteras[Math.floor(Math.random() * carreteras.length)];
    const geom = carretera.geometry ?? carretera.nodes;
    if (!geom || geom.length === 0) {
      // fallback circular
      const ang = Math.random() * Math.PI * 2;
      const dist = 150 + Math.random() * 100;
      const offsetLat = (Math.cos(ang) * dist) / 111111;
      const offsetLng =
        (Math.sin(ang) * dist) /
        (111111 * Math.cos((base.lat * Math.PI) / 180));
      return crearEnemigoBase(
        base.lat + offsetLat,
        base.lng + offsetLng,
        oleada,
        tipo
      );
    }

    // escoger punto spawn de la geometry, asegurando distancia mínima
    const MIN_DIST = 50;
    let spawnPoint: any = null;
    // loop defensivo (no infinite)
    for (let attempts = 0; attempts < 10; attempts++) {
      const candidate = geom[Math.floor(Math.random() * geom.length)];
      const lat = candidate.lat ?? candidate.y ?? candidate[1];
      const lon = candidate.lon ?? candidate.x ?? candidate[0];
      if (lat == null || lon == null) continue;
      if (distanciaEnMetros(lat, lon, base.lat, base.lng) >= MIN_DIST) {
        spawnPoint = { lat, lon };
        break;
      }
    }
    // si no encuentra, usa el primer punto
    if (!spawnPoint) {
      const candidate = geom[0];
      spawnPoint = {
        lat: candidate.lat ?? candidate[1],
        lon: candidate.lon ?? candidate[0],
      };
    }

    const enemy = crearEnemigoBase(
      spawnPoint.lat,
      spawnPoint.lon,
      oleada,
      tipo
    );

    // buscar nodo de grafo más cercano al spawn y al base
    const nearestToSpawn = findNearestNode(
      nodes,
      spawnPoint.lat,
      spawnPoint.lon
    );
    const nearestToBase = findNearestNode(nodes, base.lat, base.lng);

    if (nearestToSpawn && nearestToBase) {
      if (nearestToSpawn.idx !== nearestToBase.idx) {
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
          // colocar en el primer nodo para evitar saltos
          const first = enemy.path[0];
          enemy.lat = first.lat;
          enemy.lng = first.lng;
        } else {
          // no hay path por grafo (desconexión), fallback: spawn y caminar recto al base
          // enemy.path stays undefined -> movement system will go straight to base
        }
      } else {
        // spawn y base están en el mismo nodo: no path necesario
        enemy.path = [{ lat: base.lat, lng: base.lng }];
        enemy.pathIndex = 0;
        enemy.progress = 0;
        enemy.lat = enemy.path[0].lat;
        enemy.lng = enemy.path[0].lng;
      }
    }

    return enemy;
  }

  // -----------------------------
  //  Movimiento: sigue path si existe; si no, movimiento recto
  // -----------------------------
  useEffect(() => {
    if (!baseUbicacion) return;
    const tickMs = 100;
    const interval = window.setInterval(() => {
      setEnemigos(
        (prev) =>
          prev
            .map((e) => {
              if (e.path && e.path.length && typeof e.pathIndex === "number") {
                let { pathIndex = 0, progress = 0 } = e;
                // si en el último nodo -> ir recto a la base
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

                // endpoints segment
                const a = e.path[pathIndex];
                const b = e.path[pathIndex + 1];
                const segLen = distanciaEnMetros(a.lat, a.lng, b.lat, b.lng);
                if (segLen === 0) {
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
                  pathIndex++;
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
                // fallback: recto hacia la base
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
  //  Aumentar de oleada
  // -----------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      setOleada((prev) => prev + 1);
    }, 120000); // cada 120 segundos sube de oleada

    return () => clearInterval(interval);
  }, []);

  // -----------------------------
  //  Torres / proyectiles (igual que antes)
  // -----------------------------
  useEffect(() => {
    if (!torresIniciales.length) return;
    const interval = window.setInterval(() => {
      setProyectiles((prevProyectiles) => {
        const nuevosProyectiles: Proyectil[] = [...prevProyectiles];
        setEnemigos((enemigosActuales) => {
          [...torresIniciales, ...torresColocadas].forEach((torre) => {
            const stats = TORRES_STATS[torre.tipo];
            if (!stats) return;
            const objetivos = enemigosActuales.filter((e) => {
              const d = distanciaEnMetros(e.lat, e.lng, torre.lat, torre.lng);
              return d <= stats.rango + 7;
            });
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
  }, [torresColocadas, torresIniciales]);

  useEffect(() => {
    if (!proyectiles.length) return;
    const interval = window.setInterval(() => {
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
                      const resistKey = p.tipo as keyof typeof e.resistencias;
                      dañoFinal *= e.resistencias[resistKey] ?? 1;
                      e.vida -= dañoFinal;
                      if (stats.tipoAtaque === "slow") {
                        const maxStacks = 3;
                        const slowPerStack = 0.2;
                        if (e.slowStacks < maxStacks) {
                          e.slowStacks += 1;
                          const reduccion = Math.min(
                            0.6,
                            e.slowStacks * slowPerStack
                          );
                          e.velocidad = e.velocidadOriginal * (1 - reduccion);
                        }
                      }
                      return { ...e };
                    }
                    return e;
                  })
                  .filter((e) => {
                    if (e.vida <= 0) {
                      const tipoTorre =
                        e.tipo === "normal"
                          ? "basica"
                          : e.tipo === "resistenteFuego"
                          ? "fuego"
                          : e.tipo === "vulnerableHielo"
                          ? "hielo"
                          : "electrica";
                      setPuntosTorre((prev) => ({
                        ...prev,
                        [tipoTorre]: (prev[tipoTorre] ?? 0) + 1,
                      }));
                      setEnemigosDerrotadosPorTipo((prev) => ({
                        ...prev,
                        [e.tipo]: (prev[e.tipo] ?? 0) + 1,
                      }));
                      return false;
                    }
                    return true;
                  })
              );
              return false;
            }
            return true;
          })
      );
    }, 50);
    return () => clearInterval(interval);
  }, [proyectiles]);

  // -----------------------------
  //  Generación de enemigos periódica (ahora usa generarEnemigoOffline)
  //  NOTA: el grafo se construye sólo una vez cuando confirmas la base (ver ElegirBase.onConfirm)
  // -----------------------------
  useEffect(() => {
    if (!baseUbicacion) return;

    // función que genera enemigo (una llamada)
    const generarEnemigo = async () => {
      const nuevo = await generarEnemigoOffline(baseUbicacion, oleada);
      setEnemigos((prev) => [...prev, nuevo]);
    };

    // generar uno inmediato
    generarEnemigo();

    // interval periódicamente
    const interval = window.setInterval(() => {
      generarEnemigo();
    }, 3000);

    return () => clearInterval(interval);
  }, [baseUbicacion, carreteras, nodes, adj, oleada]);

  // -----------------------------
  //  Resto UI / lógica de torres etc.
  // -----------------------------
  const [torreExtraDisponible, setTorreExtraDisponible] = useState(false);
  const [modoColocarTorreExtra, setModoColocarTorreExtra] = useState(false);
  const [tipoTorreExtra, setTipoTorreExtra] = useState<TipoTorre>("basica");
  //   const [posTempTorreExtra, setPosTempTorreExtra] = useState<{
  //     lat: number;
  //     lng: number;
  //   } | null>(null);

  useEffect(() => {
    oleadaRef.current = oleada;
  }, [oleada]);

  useEffect(() => {
    const totalDerrotados =
      enemigosDerrotadosPorTipo.normal +
      enemigosDerrotadosPorTipo.blindado +
      enemigosDerrotadosPorTipo.resistenteFuego +
      enemigosDerrotadosPorTipo.vulnerableHielo;
    if (totalDerrotados >= 5 && !torreExtraDisponible)
      setTorreExtraDisponible(true);
  }, [enemigosDerrotadosPorTipo, torreExtraDisponible]);

  //   function ClickParaTorreExtra() {
  //     useMapEvents({
  //       mousemove(e) {
  //         if (modoColocarTorreExtra) {
  //           setPosTempTorreExtra({ lat: e.latlng.lat, lng: e.latlng.lng });
  //         }
  //       },
  //       click(e) {
  //         if (!modoColocarTorreExtra) return;
  //         const coste = costeTorre(tipoTorreExtra);
  //         if ((puntosTorre[tipoTorreExtra] ?? 0) < coste) {
  //           alert(
  //             `No tienes suficientes puntos para colocar esta torre. Necesitas ${coste}.`
  //           );
  //           return;
  //         }
  //         const nuevaTorre: Torre = {
  //           id: Date.now(),
  //           lat: e.latlng.lat,
  //           lng: e.latlng.lng,
  //           tipo: tipoTorreExtra,
  //           nivel: 1,
  //         };
  //         setPuntosTorre((prev) => ({
  //           ...prev,
  //           [tipoTorreExtra]: prev[tipoTorreExtra] - coste,
  //         }));
  //         setTorresColocadas((prev) => [...prev, nuevaTorre]);
  //         setModoColocarTorreExtra(false);
  //         setPosTempTorreExtra(null);
  //       },
  //     });
  //     return null;
  //   }
  function costeTorre(tipo: TipoTorre) {
    const yaGastadas = torresColocadas.filter((t) => t.tipo === tipo).length;
    return Math.ceil(5 * Math.pow(1.5, yaGastadas));
  }

  return (
    <div>
      <h2>Base y Torres</h2>
      <p>Vida de la base: {vidaBase}</p>
      <p>oleada: {oleada}</p>

      {modoElegirBase ? (
        <ElegirBase
          onConfirm={async (base, torres) => {
            setBaseUbicacion(base);
            setTorresIniciales(torres);
            setModoElegirBase(false);

            // UNA SOLA petición a Overpass para obtener carreteras
            const result = await hayCarreteraCerca(base.lat, base.lng, 800); // 800m por defecto
            setCarreteras(result);

            // construir grafo localmente y guardarlo
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
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; ESRI"
          />

          {/* overlay carreteras ligero */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
            opacity={0.45}
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

          {[...torresIniciales, ...torresColocadas].map((t) => (
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
              eventHandlers={{ click: () => setTorreSeleccionada(t) }}
            >
              <Popup>
                Torre {t.tipo} (Nivel {t.nivel})
              </Popup>
            </Marker>
          ))}

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
              const porcentajeVida = Math.max(
                0,
                e.vida / (50 + oleadaRef.current * 11)
              );
              const iconHtml = `
                <div style="position: relative; transform: translate(-50%, -50%);">
                  <div style="position:absolute; top:-10px; left:-5px; width:30px; height:5px; background:red; border:1px solid black;">
                    <div style="width:${
                      porcentajeVida * 100
                    }%; height:100%; background:lime;"></div>
                  </div>
                  <div style="width:20px; height:20px; border-radius:50%; background:${
                    e.tipo === "blindado"
                      ? "gray"
                      : e.tipo === "resistenteFuego"
                      ? "orange"
                      : e.tipo === "vulnerableHielo"
                      ? "cyan"
                      : "red"
                  }; border:2px solid black;"></div>
                </div>
              `;
              const icon = L.divIcon({
                html: iconHtml,
                className: "enemy-icon",
                iconSize: [30, 30],
                iconAnchor: [15, 15],
              });
              return (
                <Marker key={e.id} position={[e.lat, e.lng]} icon={icon} />
              );
            })}

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
        </MapContainer>
      ) : (
        <p>Cargando mapa...</p>
      )}

      {torreExtraDisponible && !modoColocarTorreExtra && (
        <div style={{ marginBottom: "10px" }}>
          <label>Tipo de torre extra: </label>
          <select
            value={tipoTorreExtra}
            onChange={(e) => setTipoTorreExtra(e.target.value as TipoTorre)}
          >
            <option value="basica">🟣 Basica</option>
            <option value="fuego">🔥 Fuego</option>
            <option value="electrica">⚡ Electrica</option>
            <option value="hielo">❄️ Hielo</option>
          </select>
          <button
            onClick={() => {
              const coste = costeTorre(tipoTorreExtra);
              if ((puntosTorre[tipoTorreExtra] ?? 0) < coste) {
                alert(
                  `No tienes suficientes puntos para colocar esta torre. Necesitas ${coste}.`
                );
                return;
              }
              setModoColocarTorreExtra(true);
            }}
          >
            Colocar torre extra
          </button>
        </div>
      )}

      {!modoElegirBase && (
        <button onClick={centrarMapa} style={{ marginTop: "10px" }}>
          Centrar mapa
        </button>
      )}
    </div>
  );
}
