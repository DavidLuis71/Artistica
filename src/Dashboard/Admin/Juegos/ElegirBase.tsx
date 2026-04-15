import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Popup,
  useMapEvents,
} from "react-leaflet";
import { useState } from "react";
import L from "leaflet";
import type { Torre, TipoTorre } from "./torres";
import { TORRES_STATS } from "./torres";

const ICONOS_TORRE: Record<TipoTorre, L.DivIcon> = {
  basica: L.divIcon({
    html: "🟣",
    iconSize: [24, 24],
    className: "torre-icon",
  }),
  fuego: L.divIcon({ html: "🔥", iconSize: [24, 24], className: "torre-icon" }),
  electrica: L.divIcon({
    html: "⚡",
    iconSize: [24, 24],
    className: "torre-icon",
  }),
  hielo: L.divIcon({ html: "❄️", iconSize: [24, 24], className: "torre-icon" }),
};

const COLOR_TORRE: Record<TipoTorre, string> = {
  basica: "purple",
  fuego: "red",
  electrica: "yellow",
  hielo: "cyan",
};

interface ElegirBaseProps {
  onConfirm: (base: { lat: number; lng: number }, torres: Torre[]) => void;
}

export default function ElegirBase({ onConfirm }: ElegirBaseProps) {
  const [base, setBase] = useState<{ lat: number; lng: number } | null>(null);
  const [torres, setTorres] = useState<Torre[]>([]);
  const [modo, setModo] = useState<"base" | "torres">("base");
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoTorre>("basica");
  const [posTemp, setPosTemp] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const tiposDeTorre: TipoTorre[] = ["basica", "fuego", "electrica", "hielo"];

  useState(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.error("No se pudo obtener la ubicación:", err);
          setMapCenter({ lat: 0, lng: 0 }); // fallback
        }
      );
    } else {
      setMapCenter({ lat: 0, lng: 0 }); // fallback
    }
  });

  // Componente que maneja clics en el mapa
  function ClickMapa() {
    const map = useMapEvents({
      mousemove(e) {
        if (modo === "torres")
          setPosTemp({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
      click(e) {
        if (modo === "base") {
          setBase({ lat: e.latlng.lat, lng: e.latlng.lng });
          setModo("torres");
          map.setView([e.latlng.lat, e.latlng.lng]); // Centrar mapa en la base
          // alert(
          //   "Base colocada. Ahora coloca 2-4 torres haciendo clic en el mapa."
          // );
        } else if (modo === "torres" && base) {
          if (torres.length >= 4)
            return alert("Has colocado todas las torres iniciales");
          setTorres([
            ...torres,
            {
              id: Date.now(),
              lat: e.latlng.lat,
              lng: e.latlng.lng,
              tipo: tipoSeleccionado,
              nivel: 1,
            },
          ]);
        }
      },
    });
    return null;
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Selector de tipo de torre */}
      <select
        value={tipoSeleccionado}
        onChange={(e) => setTipoSeleccionado(e.target.value as TipoTorre)}
        style={{ marginBottom: "10px" }}
      >
        {tiposDeTorre.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      {mapCenter ? (
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={10}
          style={{ height: "80vh", width: "100%" }}
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

          <ClickMapa />

          {/* Base */}
          {/* Base draggable */}
          {base && (
            <Marker
              position={[base.lat, base.lng]}
              icon={L.divIcon({
                html: "🏠",
                iconSize: [24, 24],
                className: "torre-icon",
              })}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const latlng = e.target.getLatLng();
                  setBase({ lat: latlng.lat, lng: latlng.lng });
                },
              }}
            >
              <Popup>🏠 Base</Popup>
            </Marker>
          )}

          {/* Torres iniciales */}
          {torres.map((t) => (
            <Marker
              key={t.id}
              position={[t.lat, t.lng]}
              icon={ICONOS_TORRE[t.tipo]}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const latlng = e.target.getLatLng();
                  setTorres((prev) =>
                    prev.map((torre) =>
                      torre.id === t.id
                        ? { ...torre, lat: latlng.lat, lng: latlng.lng }
                        : torre
                    )
                  );
                },
              }}
            >
              <Popup>
                <div>
                  <label>Cambiar tipo:</label>
                  <select
                    value={t.tipo}
                    onChange={(e) => {
                      const tipo = e.target.value as TipoTorre;
                      setTorres((prev) =>
                        prev.map((torre) =>
                          torre.id === t.id ? { ...torre, tipo } : torre
                        )
                      );
                    }}
                  >
                    {tiposDeTorre.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>
              </Popup>

              {/* Área de efecto de la torre */}
              <Circle
                center={[t.lat, t.lng]}
                radius={TORRES_STATS[t.tipo].rango}
                pathOptions={{
                  color: COLOR_TORRE[t.tipo],
                  fillColor: COLOR_TORRE[t.tipo],
                  fillOpacity: 0.15,
                }}
              />
            </Marker>
          ))}

          {/* Círculo provisional para la torre que estás a punto de colocar */}
          {posTemp && modo === "torres" && (
            <Circle
              center={[posTemp.lat, posTemp.lng]}
              radius={TORRES_STATS[tipoSeleccionado].rango}
              pathOptions={{
                color: COLOR_TORRE[tipoSeleccionado],
                fillColor: COLOR_TORRE[tipoSeleccionado],
                fillOpacity: 0.2,
              }}
            />
          )}
        </MapContainer>
      ) : (
        <div>Cargando mapa...</div>
      )}

      {/* Botón de confirmar solo cuando se ha colocado la base */}
      {modo === "torres" && torres.length > 0 && (
        <button
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            padding: "10px 15px",
            borderRadius: "8px",
            backgroundColor: "green",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => {
            if (!base) return alert("Coloca la base primero");
            onConfirm(base, torres);
          }}
        >
          Confirmar base y torres
        </button>
      )}
      {/* Mensaje de instrucción */}
      {modo === "torres" && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 12px",
            borderRadius: "6px",
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            fontWeight: "bold",
            zIndex: 1000,
          }}
        >
          Puedes mover las torres y la base arrastrándolas 🖐️
        </div>
      )}
    </div>
  );
}
