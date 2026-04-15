import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  iconBase,
  iconosRecurso,
  iconosVehiculo,
  iconTorre,
  recursos as recursosDB,
  vehiculosIniciales,
  type Coordenadas,
  type TorreVision,
  type Vehiculo,
} from "./recursos";
import "./GeoRecoleccion.css";
import {
  Anvil,
  Coins,
  Drumstick,
  Fuel,
  Mountain,
  TreePine,
} from "lucide-react";

const DefaultIcon = L.Icon.Default as any;
delete DefaultIcon.prototype._getIconUrl;
DefaultIcon.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Iconos personalizados
// const iconHamburgesa = new L.Icon({
//   iconUrl: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png", // ejemplo icono de base
//   iconSize: [32, 32],
//   iconAnchor: [16, 32],
//   popupAnchor: [0, -32],
// });

type TipoRecurso = "mina" | "bosque" | "cantera" | "granja" | "gasolinera";

interface PuntoRecurso {
  id: number;
  pos: Coordenadas;
  tipo: TipoRecurso;
}

interface Enemigo {
  id: number;
  pos: Coordenadas;
  velocidad: number;
  enViaje: boolean;
  recursoActual: number; // índice del recurso actual
}

const iconEnemigo = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Haversine para distancia en metros
const distanciaM = (a: Coordenadas, b: Coordenadas) => {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const hav =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(hav));
};

const interp = (a: Coordenadas, b: Coordenadas, t: number): Coordenadas => ({
  lat: a.lat + (b.lat - a.lat) * t,
  lng: a.lng + (b.lng - a.lng) * t,
});

export default function GeoRecoleccion() {
  const [base, setBase] = useState<Coordenadas | null>(null);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<
    number | null
  >(null);
  const MetrosVision = 1000; // Radio de visión base y torres
  const gastoPorMetro = 0.005; // Combustible por metro
  const [puntos] = useState<PuntoRecurso[]>(recursosDB);
  const [inventario, setInventario] = useState({
    hierro: 10,
    madera: 10,
    piedra: 10,
    comida: 10,
    oro: 10,
    gasolina: 100,
  });

  const [mostrarSelectorVehiculo, setMostrarSelectorVehiculo] = useState(false);

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>(
    vehiculosIniciales.map((v, i) => ({
      ...v,
      desbloqueado: i < 2, // solo los dos primeros desbloqueados
    }))
  );
  const [mostrarTiendaVehiculos, setMostrarTiendaVehiculos] = useState(false);
  const [mostrarVenta, setMostrarVenta] = useState(false);
  const [materialSeleccionado, setMaterialSeleccionado] =
    useState<keyof typeof inventario>("hierro");
  const [cantidadVenta, setCantidadVenta] = useState(0);
  const [precios, setPrecios] = useState({
    hierro: 5,
    madera: 3,
    piedra: 4,
    comida: 2,
    gasolina: 10,
    oro: 1,
  });
  const [torres, setTorres] = useState<TorreVision[]>([]);
  const [mostrarInventario, setMostrarInventario] = useState(false);
  const recursosPrincipales: (keyof typeof inventario)[] = [
    "hierro",
    "madera",
    "piedra",
    "gasolina",
    "comida",
    "oro",
  ];

  const [torrePendiente, setTorrePendiente] = useState<Coordenadas | null>(
    null
  );
  const [mostrarConfirmacionTorre, setMostrarConfirmacionTorre] =
    useState(false);
  const [viajeLibrePendiente, setViajeLibrePendiente] =
    useState<Coordenadas | null>(null);
  const [mostrarConfirmacionViajeLibre, setMostrarConfirmacionViajeLibre] =
    useState(false);

  const preciosVehiculos: Record<string, number> = {
    "Camión Ligero": 50,
    "Camión Pesado": 150,
    "Camión Todoterreno": 120,
    "Camión Monstruo": 300,
    "Camión Rápido": 100,
    "Camión Blindado": 200,
    "Camión Recolector": 180,
    "Camión Fantasma": 160,
  };

  const [enemigos, setEnemigos] = useState<Enemigo[]>([]);

  useEffect(() => {
    if (!base) return;

    setEnemigos([
      {
        id: 0,
        pos: { lat: 43.4647, lng: -3.8044 },
        velocidad: 3,
        enViaje: false,
        recursoActual: 0,
      },
      {
        id: 1,
        pos: { lat: 43.4647, lng: -3.8044 },
        velocidad: 3,
        enViaje: false,
        recursoActual: 1,
      },
    ]);
  }, [base]);

  const enviarEnemigo = async (enemigoId: number) => {
    const enemigo = enemigos.find((e) => e.id === enemigoId);
    if (!enemigo || enemigo.enViaje || !base) return;

    const recursoDestino = puntos[enemigo.recursoActual];
    if (!recursoDestino) return;

    setEnemigos((prev) =>
      prev.map((e) => (e.id === enemigoId ? { ...e, enViaje: true } : e))
    );

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${enemigo.pos.lng},${enemigo.pos.lat};${recursoDestino.pos.lng},${recursoDestino.pos.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (!data.routes || data.routes.length === 0) throw new Error("No ruta");

      const ruta: Coordenadas[] = data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => ({ lat, lng })
      );

      const actualizarPos = (pos: Coordenadas) => {
        setEnemigos((prev) =>
          prev.map((e) => (e.id === enemigoId ? { ...e, pos } : e))
        );
      };

      const animarRuta = async (ruta: Coordenadas[]) =>
        new Promise<void>((resolve) => {
          let index = 0;
          let origen = ruta[0];
          let destinoP = ruta[1];
          const interval = setInterval(() => {
            const d = distanciaM(origen, destinoP);
            const t = enemigo.velocidad / d;
            if (t >= 1) {
              index++;
              if (index >= ruta.length - 1) {
                actualizarPos(destinoP);
                clearInterval(interval);
                resolve();
                return;
              }
              origen = ruta[index];
              destinoP = ruta[index + 1];
            } else {
              const nuevaPos = interp(origen, destinoP, t);
              actualizarPos(nuevaPos);
              origen = nuevaPos;
            }
          }, 50);
        });

      // Ir al recurso y volver al "base" (o punto inicial)
      await animarRuta(ruta);
      await animarRuta([...ruta].reverse());

      // Actualizar índice del recurso siguiente
      setEnemigos((prev) =>
        prev.map((e) =>
          e.id === enemigoId
            ? {
                ...e,
                enViaje: false,
                recursoActual: Math.floor(Math.random() * puntos.length), // elige un recurso aleatorio
              }
            : e
        )
      );
    } catch (error) {
      console.error(error);
      setEnemigos((prev) =>
        prev.map((e) => (e.id === enemigoId ? { ...e, enViaje: false } : e))
      );
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      enemigos.forEach((e) => {
        if (!e.enViaje) enviarEnemigo(e.id);
      });
    }, 3000); // cada 3 segundos revisa si puede moverse
    return () => clearInterval(interval);
  }, [enemigos]);

  useEffect(() => {
    const interval = setInterval(actualizarPrecios, 30000); // cada 30s
    return () => clearInterval(interval);
  }, []);

  const actualizarPrecios = () => {
    setPrecios((prev) => ({
      hierro: Math.max(
        1,
        Math.round(prev.hierro * (0.8 + Math.random() * 0.4))
      ),
      madera: Math.max(
        1,
        Math.round(prev.madera * (0.8 + Math.random() * 0.4))
      ),
      piedra: Math.max(
        1,
        Math.round(prev.piedra * (0.8 + Math.random() * 0.4))
      ),
      comida: Math.max(
        1,
        Math.round(prev.comida * (0.8 + Math.random() * 0.4))
      ),
      gasolina: Math.max(
        1,
        Math.round(prev.gasolina * (0.8 + Math.random() * 0.4))
      ),
      oro: Math.max(1, Math.round(prev.oro * (0.8 + Math.random() * 0.4))),
    }));
  };

  const comprarVehiculo = (id: number) => {
    const vehiculo = vehiculos.find((v) => v.id === id);
    if (!vehiculo || vehiculo.desbloqueado) return;

    const precio = preciosVehiculos[vehiculo.nombre];
    if (inventario.oro < precio) {
      alert("No tienes suficiente oro para comprar este vehículo");
      return;
    }

    setInventario((prev) => ({
      ...prev,
      oro: prev.oro - precio,
    }));

    setVehiculos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, desbloqueado: true } : v))
    );

    alert(`¡Has comprado ${vehiculo.nombre}!`);
    setMostrarTiendaVehiculos(false);
  };

  const venderMaterial = () => {
    setInventario((prev) => {
      const cantidad = Math.min(cantidadVenta, prev[materialSeleccionado]);
      return {
        ...prev,
        [materialSeleccionado]: prev[materialSeleccionado] - cantidad,
        oro: prev.oro + cantidad * precios[materialSeleccionado],
      };
    });
    setMostrarVenta(false);
  };
  const comprarMaterial = () => {
    setInventario((prev) => {
      const precio = precios[materialSeleccionado];
      const cantidadMax = Math.floor(prev.oro / precio); // máximo que puedes comprar con el oro disponible
      const cantidad = Math.min(cantidadVenta, cantidadMax);
      if (cantidad <= 0) {
        alert("No tienes suficiente oro");
        return prev;
      }
      return {
        ...prev,
        [materialSeleccionado]: prev[materialSeleccionado] + cantidad,
        oro: prev.oro - cantidad * precio,
      };
    });
    setMostrarVenta(false);
  };

  const ClickHandler = () => {
    useMapEvents({
      click(e) {
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng };

        if (!base) {
          setBase(coords); // Primer clic → base
          return;
        }

        // Verificar si el clic es sobre un recurso
        const recurso = recursosVisibles.find(
          (r) => distanciaM(r.pos, coords) < 10
        );

        if (recurso) {
          if (vehiculoSeleccionado !== null) {
            enviarVehiculo(vehiculoSeleccionado, recurso.pos);
            setVehiculoSeleccionado(null);
          }
        } else {
          // Clic en espacio libre → preparar viaje libre
          if (vehiculoSeleccionado !== null) {
            setViajeLibrePendiente(coords);
            setMostrarConfirmacionViajeLibre(true);
          } else {
            setTorrePendiente(coords);
            setMostrarConfirmacionTorre(true);
          }
        }
      },
    });
    return null;
  };

  const confirmarViajeLibre = () => {
    if (!viajeLibrePendiente || vehiculoSeleccionado === null) return;

    enviarVehiculoLibre(vehiculoSeleccionado, viajeLibrePendiente);
    setMostrarConfirmacionViajeLibre(false);
    setViajeLibrePendiente(null);
    setVehiculoSeleccionado(null);
  };

  const confirmarTorre = () => {
    if (!torrePendiente) return;

    if (inventario.madera < 5 || inventario.hierro < 3) {
      alert("No tienes suficientes materiales para construir la torre");
    } else {
      setInventario((prev) => ({
        ...prev,
        madera: prev.madera - 5,
        hierro: prev.hierro - 3,
      }));

      setTorres((prev) => [
        ...prev,
        {
          id: Date.now(),
          pos: torrePendiente,
          vision: MetrosVision,
          durabilidad: 100,
        },
      ]);
    }

    setMostrarConfirmacionTorre(false);
    setTorrePendiente(null);
  };

  // Filtrar recursos visibles según base y torres activas
  const recursosSiempreVisibles = puntos.slice(0, 3); // primeros 3 recursos

  const recursosVisibles = puntos.filter(
    (p) =>
      recursosSiempreVisibles.includes(p) || // siempre visibles
      (base && distanciaM(base, p.pos) <= MetrosVision) ||
      torres.some(
        (t) => t.durabilidad > 0 && distanciaM(t.pos, p.pos) <= t.vision
      )
  );

  const enviarVehiculo = async (vehiculoId: number, destino: Coordenadas) => {
    if (!base) return;
    const vehiculo = vehiculos.find((v) => v.id === vehiculoId);
    if (!vehiculo || vehiculo.enViaje) return;
    const distanciaViaje = distanciaM(base, destino) * 2; // ida y vuelta

    if (vehiculo.combustible < distanciaViaje * gastoPorMetro) {
      alert("No hay suficiente combustible, visita una gasolinera primero");
      return;
    }
    if (vehiculo.durabilidad <= 0) {
      alert("Este vehículo necesita reparación antes de viajar");
      return;
    }

    setVehiculos((prev) =>
      prev.map((v) =>
        v.id === vehiculoId
          ? {
              ...v,
              enViaje: true,
              pos: base,
              recolectando: false,
              progreso: 0,
            }
          : v
      )
    );

    try {
      // 1️⃣ Pedir ruta a OSRM
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${base.lng},${base.lat};${destino.lng},${destino.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (!data.routes || data.routes.length === 0)
        throw new Error("No se encontró ruta");

      const ruta: Coordenadas[] = data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => ({ lat, lng })
      );

      const actualizarPos = (
        pos: Coordenadas,
        recolectando = false,
        progreso = 0
      ) => {
        setVehiculos((prev) =>
          prev.map((v) =>
            v.id === vehiculoId ? { ...v, pos, recolectando, progreso } : v
          )
        );
      };

      // Animación suave (igual que antes)
      const animarRuta = async (ruta: Coordenadas[]) =>
        new Promise<void>((resolve) => {
          let index = 0;
          let origen = ruta[0];
          let destinoP = ruta[1];
          const interval = setInterval(() => {
            const d = distanciaM(origen, destinoP);
            const t = vehiculo.velocidad / d;
            if (t >= 1) {
              index++;
              if (index >= ruta.length - 1) {
                actualizarPos(destinoP);
                clearInterval(interval);
                resolve();
                return;
              }
              origen = ruta[index];
              destinoP = ruta[index + 1];
            } else {
              const nuevaPos = interp(origen, destinoP, t);
              actualizarPos(nuevaPos);
              origen = nuevaPos;
            }
          }, 50);
        });

      const animar = async () => {
        await animarRuta(ruta); // ir a recurso

        // Recolectando
        const duracion = vehiculo.tiempoRecoleccion;
        const start = Date.now();
        const recolectarAnim = setInterval(() => {
          const elapsed = Date.now() - start;
          const prog = Math.min(100, (elapsed / duracion) * 100);
          actualizarPos(ruta[ruta.length - 1], true, prog);
          if (elapsed >= duracion) clearInterval(recolectarAnim);
        }, 50);
        await new Promise((res) => setTimeout(res, duracion));

        // Recompensas
        const punto = puntos.find(
          (p) => p.pos.lat === destino.lat && p.pos.lng === destino.lng
        );
        if (punto) {
          const materialRecolectado: Partial<typeof inventario> = (() => {
            const porcentaje = 0.5 + Math.random() * 0.5; // 50-100%
            const cantidadRecolectada = Math.floor(
              vehiculo.capacidad * porcentaje
            );
            switch (punto.tipo) {
              case "mina":
                return { hierro: cantidadRecolectada };
              case "bosque":
                return { madera: cantidadRecolectada };
              case "cantera":
                return { piedra: cantidadRecolectada };
              case "granja":
                return { comida: cantidadRecolectada };
              case "gasolinera": {
                const minimo = Math.floor(vehiculo.combustibleMax / 2);
                const cantidad =
                  Math.floor(
                    Math.random() * (vehiculo.combustibleMax - minimo)
                  ) + minimo;
                return { gasolina: cantidad };
              }
            }
          })();

          const recompensaOro = Math.floor(Math.random() * 5) + 1; // 1-5 oro
          setInventario((prev) => {
            const material = Object.keys(
              materialRecolectado
            )[0] as keyof typeof inventario;
            const cantidad = materialRecolectado[material]!;
            return {
              ...prev,
              [material]: prev[material] + cantidad,
              oro: prev.oro + recompensaOro,
            };
          });

          const material = Object.keys(materialRecolectado)[0];
          const cantidad =
            materialRecolectado[material as keyof typeof materialRecolectado];

          // Volver
          await animarRuta([...ruta].reverse());
          alert(`¡ ${vehiculo.nombre} volvió con ${cantidad} de ${material}!`);
        }

        const distanciaRecorrida = distanciaM(base, destino) * 2;
        const combustibleConsumido = distanciaRecorrida * gastoPorMetro;
        setInventario((prev) => ({
          ...prev,
          gasolina: Math.max(prev.gasolina - combustibleConsumido, 0),
        }));
        const desgasteBase = 5; // por viaje normal
        const desgastePorDistancia = distanciaRecorrida / 1000; // 1% cada km, ajustable
        setVehiculos((prev) =>
          prev.map((v) =>
            v.id === vehiculoId
              ? {
                  ...v,
                  enViaje: false,
                  pos: base,
                  recolectando: false,
                  progreso: 0,
                  combustible: Math.min(
                    v.combustibleMax,
                    v.combustible + combustibleConsumido
                  ),
                  durabilidad: Math.max(
                    v.durabilidad - (desgasteBase + desgastePorDistancia),
                    0
                  ),
                }
              : v
          )
        );
      };

      animar();
    } catch (error) {
      console.error(error);
      alert("Error calculando ruta con OSRM");
      setVehiculos((prev) =>
        prev.map((v) =>
          v.id === vehiculoId ? { ...v, enViaje: false, pos: base } : v
        )
      );
    }
  };

  const enviarVehiculoLibre = async (
    vehiculoId: number,
    destino: Coordenadas
  ) => {
    if (!base) return;
    const vehiculo = vehiculos.find((v) => v.id === vehiculoId);
    if (!vehiculo || vehiculo.enViaje) return;

    const distanciaViaje = distanciaM(base, destino) * 2;
    if (vehiculo.combustible < distanciaViaje * gastoPorMetro) {
      alert("No hay suficiente combustible para este viaje");
      return;
    }

    setVehiculos((prev) =>
      prev.map((v) =>
        v.id === vehiculoId
          ? { ...v, enViaje: true, pos: base, recolectando: false, progreso: 0 }
          : v
      )
    );

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${base.lng},${base.lat};${destino.lng},${destino.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (!data.routes || data.routes.length === 0)
        throw new Error("No se encontró ruta");

      const ruta: Coordenadas[] = data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => ({ lat, lng })
      );

      const animarRuta = async (ruta: Coordenadas[]) =>
        new Promise<void>((resolve) => {
          let index = 0;
          let origen = ruta[0];
          let destinoP = ruta[1];
          const interval = setInterval(() => {
            const d = distanciaM(origen, destinoP);
            const t = vehiculo.velocidad / d;
            if (t >= 1) {
              index++;
              if (index >= ruta.length - 1) {
                actualizarPos(destinoP);
                clearInterval(interval);
                resolve();
                return;
              }
              origen = ruta[index];
              destinoP = ruta[index + 1];
            } else {
              const nuevaPos = interp(origen, destinoP, t);
              actualizarPos(nuevaPos);
              origen = nuevaPos;
            }
          }, 50);
        });

      const actualizarPos = (pos: Coordenadas) => {
        setVehiculos((prev) =>
          prev.map((v) => (v.id === vehiculoId ? { ...v, pos } : v))
        );
      };

      await animarRuta(ruta);
      await animarRuta([...ruta].reverse()); // volver

      const combustibleConsumido =
        distanciaM(base, destino) * 2 * gastoPorMetro;
      setInventario((prev) => ({
        ...prev,
        gasolina: Math.max(prev.gasolina - combustibleConsumido, 0),
      }));

      setVehiculos((prev) =>
        prev.map((v) =>
          v.id === vehiculoId ? { ...v, enViaje: false, pos: base } : v
        )
      );

      alert(`${vehiculo.nombre} completó un viaje libre`);
    } catch (error) {
      console.error(error);
      alert("Error calculando ruta");
      setVehiculos((prev) =>
        prev.map((v) =>
          v.id === vehiculoId ? { ...v, enViaje: false, pos: base } : v
        )
      );
    }
  };

  const costeReparacion = (v: Vehiculo) =>
    Math.ceil((100 - v.durabilidad) / 10);

  const repararVehiculo = (vehiculoId: number, costeOro: number) => {
    const vehiculo = vehiculos.find((v) => v.id === vehiculoId);
    if (!vehiculo) return;

    if (inventario.oro < costeOro) {
      alert("No tienes suficiente oro para reparar");
      return;
    }

    setInventario((prev) => ({ ...prev, oro: prev.oro - costeOro }));
    setVehiculos((prev) =>
      prev.map((v) =>
        v.id === vehiculoId
          ? { ...v, durabilidad: 100 } // reparar al 100%
          : v
      )
    );

    alert(`${vehiculo.nombre} ha sido reparado`);
  };

  const capacidadMaxima = Math.max(...vehiculos.map((v) => v.capacidad));
  return (
    <div className="geo-container">
      <div className="geo-inventario-top">
        {recursosPrincipales.map((key) => (
          <div className="inv-item" key={key}>
            {key === "hierro" && <Anvil size={20} />}
            {key === "madera" && <TreePine size={20} />}
            {key === "piedra" && <Mountain size={20} />}
            {key === "comida" && <Drumstick size={20} />}
            {key === "gasolina" && <Fuel size={20} />}
            {key === "oro" && <Coins size={20} />}
            <span>
              {key === "gasolina"
                ? inventario[key].toFixed(2)
                : inventario[key]}
            </span>
          </div>
        ))}

        <button className="inv-mas" onClick={() => setMostrarInventario(true)}>
          +
        </button>
      </div>

      {mostrarInventario && (
        <div className="geo-inventario-popup">
          {Object.entries(inventario).map(([key, val]) => (
            <div className="inv-item" key={key}>
              {key}: {key === "gasolina" ? val.toFixed(2) : val}
            </div>
          ))}
          <button onClick={() => setMostrarInventario(false)}>Cerrar</button>
        </div>
      )}

      <MapContainer
        className="geo-map-container"
        center={[43.4623, -3.809]}
        zoom={16}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OSM &copy; CARTO"
        />
        {/* Overlay semitransparente de relieve */}
        <TileLayer
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenTopoMap"
          opacity={0.3}
        />
        <ClickHandler />
        {base && (
          <Marker position={base} icon={iconBase}>
            <Popup>Tu base</Popup>
          </Marker>
        )}
        {/* {puntos.map((p) => (
          <Marker
            key={p.id}
            position={p.pos}
            icon={iconosRecurso[p.tipo]}
            eventHandlers={{
              click: () => {
                if (vehiculoSeleccionado !== null) {
                  enviarVehiculo(vehiculoSeleccionado, p.pos);
                  setVehiculoSeleccionado(null); // deseleccionar después de enviar
                }
              },
            }} */}
        {enemigos.map((e) => (
          <Marker key={e.id} position={e.pos} icon={iconEnemigo}>
            <Popup>Enemigo #{e.id}</Popup>
          </Marker>
        ))}

        {recursosVisibles.map((p) => (
          <Marker
            key={p.id}
            position={p.pos}
            icon={iconosRecurso[p.tipo]}
            eventHandlers={{
              click: () => {
                if (vehiculoSeleccionado !== null) {
                  enviarVehiculo(vehiculoSeleccionado, p.pos);
                  setVehiculoSeleccionado(null); // deseleccionar después de enviar
                }
              },
            }}
          >
            <Popup>{p.tipo.toUpperCase()}</Popup>
          </Marker>
        ))}
        {vehiculos.map(
          (v) =>
            v.enViaje && (
              <Marker
                key={v.id}
                position={v.pos}
                icon={
                  iconosVehiculo[v.nombre] || iconosVehiculo["Camión Ligero"]
                }
                // fallback a icono genérico
              >
                <Popup>{v.nombre}</Popup>

                {v.recolectando && (
                  <Tooltip direction="top" offset={[0, -20]} permanent>
                    Recolectando: {Math.round(v.progreso)}%
                  </Tooltip>
                )}
              </Marker>
            )
        )}

        {torres.map((t) => (
          <Marker position={t.pos} icon={iconTorre}>
            <Popup>Torre de visión - ❤️ {Math.round(t.durabilidad)}%</Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="geo-vehiculos">
        <div className="geo-barra-inferior">
          <button
            className="geo-btn-hud"
            onClick={() => setMostrarSelectorVehiculo(true)}
          >
            {vehiculoSeleccionado !== null ? (
              <>
                <img
                  src={
                    iconosVehiculo[
                      vehiculos.find((v) => v.id === vehiculoSeleccionado)!
                        .nombre
                    ].options.iconUrl
                  }
                  alt=""
                  style={{ width: 28, height: 28 }}
                />
                <span>
                  {vehiculos.find((v) => v.id === vehiculoSeleccionado)!.nombre}
                </span>
              </>
            ) : (
              "Viajar"
            )}
          </button>

          <button className="geo-btn-hud" onClick={() => setMostrarVenta(true)}>
            Vender
          </button>

          <button
            className="geo-btn-hud"
            onClick={() => setMostrarTiendaVehiculos(true)}
          >
            Vehículos
          </button>
          {/* Botón de reparar si hay vehículo seleccionado y necesita reparación */}
          {vehiculoSeleccionado !== null &&
            vehiculos.find((v) => v.id === vehiculoSeleccionado)!.durabilidad <
              100 && (
              <button
                className="geo-btn-hud"
                onClick={() =>
                  repararVehiculo(
                    vehiculoSeleccionado,
                    costeReparacion(
                      vehiculos.find((v) => v.id === vehiculoSeleccionado)!
                    )
                  )
                }
              >
                Reparar (
                {costeReparacion(
                  vehiculos.find((v) => v.id === vehiculoSeleccionado)!
                )}{" "}
                oro)
              </button>
            )}
        </div>

        {mostrarTiendaVehiculos && (
          <div className="geo-dialog">
            <h3>Tienda de Vehículos</h3>
            {vehiculos
              .filter((v) => !v.desbloqueado)
              .map((v) => (
                <button
                  key={v.id}
                  className="vehiculo-btn"
                  onClick={() => comprarVehiculo(v.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                  }}
                >
                  <img
                    src={iconosVehiculo[v.nombre].options.iconUrl}
                    alt={v.nombre}
                    style={{ width: 50, height: 50 }}
                  />
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <strong>{v.nombre}</strong>
                    <p>Precio: {preciosVehiculos[v.nombre]} oro</p>
                  </div>
                </button>
              ))}

            <button onClick={() => setMostrarTiendaVehiculos(false)}>
              Cerrar
            </button>
          </div>
        )}

        {mostrarConfirmacionTorre && torrePendiente && (
          <div className="geo-dialog">
            <h3>Construir Torre</h3>
            <p>¿Deseas construir una torre en este lugar?</p>
            <p>Coste: 5 madera, 3 hierro</p>
            <button onClick={confirmarTorre}>Sí, construir</button>
            <button
              onClick={() => {
                setMostrarConfirmacionTorre(false);
                setTorrePendiente(null);
              }}
            >
              Cancelar
            </button>
          </div>
        )}
        {mostrarConfirmacionViajeLibre && viajeLibrePendiente && (
          <div className="geo-dialog">
            <h3>Enviar Vehículo</h3>
            <p>
              ¿Deseas enviar a{" "}
              {vehiculos.find((v) => v.id === vehiculoSeleccionado)?.nombre} a
              este punto?
            </p>
            <button onClick={confirmarViajeLibre}>Sí, enviar</button>
            <button
              onClick={() => {
                setMostrarConfirmacionViajeLibre(false);
                setViajeLibrePendiente(null);
              }}
            >
              Cancelar
            </button>
          </div>
        )}

        {mostrarSelectorVehiculo && (
          <div className="geo-dialog">
            <h3>Elige un Vehículo</h3>
            <div className="vehiculos-lista">
              {vehiculos
                .filter((v) => v.desbloqueado)
                .map((v) => (
                  <button
                    key={v.id}
                    className={`vehiculo-btn ${v.enViaje ? "viaje" : ""}`}
                    disabled={v.enViaje}
                    onClick={() => {
                      setVehiculoSeleccionado(v.id);
                      setMostrarSelectorVehiculo(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px",
                      flexDirection: "row",
                      width: "100%",
                    }}
                  >
                    {/* Icono del vehículo */}
                    <img
                      src={iconosVehiculo[v.nombre].options.iconUrl}
                      alt={v.nombre}
                      style={{ width: 50, height: 50 }}
                    />

                    {/* Info del vehículo */}
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <strong style={{ fontSize: "16px" }}>{v.nombre}</strong>
                      <span>
                        {v.nombre} ❤️ {Math.round(v.durabilidad)}%
                      </span>
                      <div
                        style={{
                          marginTop: "6px",
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span title="Velocidad">⚡ {v.velocidad} m/tick</span>
                        <span title="Daño">🪓 {v.danio}</span>
                        <span title="Recolección">
                          ⏱ {v.tiempoRecoleccion / 1000}s
                        </span>
                      </div>

                      {/* Barra de capacidad */}
                      <div style={{ marginTop: "6px" }}>
                        <label style={{ fontSize: "12px" }}>📦 Capacidad</label>
                        <div
                          style={{
                            background: "#ccc",
                            borderRadius: 4,
                            overflow: "hidden",
                            height: 6,
                          }}
                        >
                          <div
                            style={{
                              width: `${
                                (v.capacidad / capacidadMaxima) * 100
                              }%`, // 50 es el máximo genérico
                              background: "#27ae60",
                              height: "100%",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>

            <button
              className="geo-btn-cerrar"
              onClick={() => setMostrarSelectorVehiculo(false)}
            >
              Cancelar
            </button>
          </div>
        )}

        {mostrarVenta && (
          <div className="geo-dialog">
            <h3>Vender / Comprar Material</h3>

            <label>
              Material:
              <select
                value={materialSeleccionado}
                onChange={(e) =>
                  setMaterialSeleccionado(
                    e.target.value as keyof typeof inventario
                  )
                }
              >
                {Object.keys(precios).map((mat) => (
                  <option key={mat} value={mat}>
                    {mat.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ marginTop: "10px" }}>
              <p>
                Precio venta: {precios[materialSeleccionado]} oro por unidad
                <br />
                Precio compra: {precios[materialSeleccionado]} oro por unidad
              </p>

              <label>
                Cantidad:
                <input
                  type="number"
                  value={cantidadVenta}
                  onChange={(e) => setCantidadVenta(Number(e.target.value))}
                  min={0}
                  max={Math.max(
                    inventario[materialSeleccionado], // para vender
                    Math.floor(inventario.oro / precios[materialSeleccionado]) // para comprar
                  )}
                />
              </label>
            </div>

            <div style={{ marginTop: "10px" }}>
              <button onClick={venderMaterial}>
                Vender {cantidadVenta} {materialSeleccionado.toUpperCase()}
              </button>
              <button onClick={comprarMaterial}>
                Comprar {cantidadVenta} {materialSeleccionado.toUpperCase()}
              </button>
              <button onClick={() => setMostrarVenta(false)}>Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
