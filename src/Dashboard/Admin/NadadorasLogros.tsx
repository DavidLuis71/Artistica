// src/components/NadadorasLogros.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./NadadorasLogros.css";
import AutocompleteSimple from "../../utils/AutocompleteSimple";

interface Logro {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  puntos_extra: number;
  fecha: string;
}

interface HistorialPuntos {
  id: number;
  puntos: number;
  motivo: string;
  detalle: string;
  origen: string;
  fecha: string;
}

interface Nadadora {
  id: number;
  nombre: string;
  apellido: string;
  puntos: number;
  nivel: number;
  logros: Logro[];
  historial: HistorialPuntos[];
}

const getNivelColor = (nivel: number) => {
  if (nivel >= 10) return "#e3b341"; // dorado
  if (nivel >= 7) return "#b47bff"; // morado
  if (nivel >= 4) return "#4a90e2"; // azul
  return "#4caf50"; // verde
};

export default function NadadorasLogros() {
  const [nadadoras, setNadadoras] = useState<Nadadora[]>([]);
  const [puntosExtra, setPuntosExtra] = useState<{ [key: number]: number }>({});
  const [expandedNadadoraId, setExpandedNadadoraId] = useState<number | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const nadadorasOptions = nadadoras.map((n) => ({
    id: n.id,
    label: `${n.nombre} ${n.apellido}`,
  }));

  const filteredNadadoras = searchTerm
    ? nadadoras.filter((n) =>
        `${n.nombre} ${n.apellido}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      )
    : nadadoras;

  const fetchNadadoras = async () => {
    const { data, error } = await supabase.from("nadadoras").select(`
        id,
        nombre,
        apellido,
        puntos,
        nivel,
        nadadoras_logros(
          id,
          logro_id,
          fecha,
          vigente,
          logros(
            id,
            nombre,
            descripcion,
            tipo,
            puntos_extra
          )
        ),
        historial_puntos(
  id,
  puntos,
  motivo,
  detalle,
  origen,
  fecha
)

      `);
    if (!error && data) {
      const nads: Nadadora[] = data.map((n: any) => ({
        id: n.id,
        nombre: n.nombre,
        apellido: n.apellido,
        puntos: n.puntos,
        nivel: n.nivel,
        logros: n.nadadoras_logros.map((nl: any) => ({
          id: nl.logro_id,
          nombre: nl.logros.nombre,
          descripcion: nl.logros.descripcion,
          tipo: nl.logros.tipo,
          puntos_extra: nl.logros.puntos_extra,
          fecha: nl.fecha,
        })),
        historial: n.historial_puntos.map((h: any) => ({
          id: h.id,
          puntos: h.puntos,
          motivo: h.motivo,
          detalle: h.detalle,
          origen: h.origen,
          fecha: h.fecha,
        })),
      }));
      // 🔤 ORDENAR ALFABÉTICAMENTE
      nads.sort((a, b) => {
        const nomA = a.nombre.toLowerCase();
        const nomB = b.nombre.toLowerCase();
        if (nomA < nomB) return -1;
        if (nomA > nomB) return 1;

        return 0;
      });

      setNadadoras(nads);
    } else {
      console.error(error);
    }
  };

  const handlePuntosExtraChange = (nadadoraId: number, valor: number) => {
    setPuntosExtra((prev) => ({ ...prev, [nadadoraId]: valor }));
  };

  const asignarPuntosExtra = async (nadadoraId: number) => {
    const puntos = puntosExtra[nadadoraId];
    if (!puntos) return alert("Ingresa puntos a asignar");

    // 1️⃣ Insertar registro en puntos_extra
    const { error: insertError } = await supabase.from("puntos_extra").insert({
      nadadora_id: nadadoraId,
      puntos,
      motivo: "Asignación manual desde admin",
    });

    if (insertError) {
      console.error(insertError);
      return alert("Error al guardar puntos extra");
    }
    await supabase.from("historial_puntos").insert({
      nadadora_id: nadadoraId,
      puntos,
      motivo: "Asignación manual",
      detalle: "Puntos extra asignados desde el panel de admin",
      origen: "manual",
    });

    // 2️⃣ Llamar al RPC para actualizar puntos totales
    const { error: rpcError } = await supabase.rpc(
      "actualizar_puntos_nadadora",
      {
        p_nadadora_id: nadadoraId,
        p_puntos: puntos,
      },
    );

    if (rpcError) {
      console.error(rpcError);
      return alert("Error al incrementar puntos");
    }

    alert("Puntos extra asignados ✅");

    // 3️⃣ Refrescar la lista de nadadoras
    fetchNadadoras();
  };

  useEffect(() => {
    fetchNadadoras();
  }, []);

  return (
    <div className="NadadorasLogros-Admin-container">
      <AutocompleteSimple
        options={nadadorasOptions}
        value={null} // no necesitamos seleccionar uno, solo buscar
        onChange={(id) => {
          const selected = nadadoras.find((n) => n.id === id);
          setSearchTerm(
            selected ? `${selected.nombre} ${selected.apellido}` : "",
          );
        }}
        placeholder="Buscar nadadora..."
      />

      <div className="NadadorasLogros-Admin-cards-wrapper">
        {filteredNadadoras.map((n) => (
          <div
            key={n.id}
            className={`NadadorasLogros-Admin-card ${
              expandedNadadoraId === n.id ? "expanded" : ""
            }`}
            onClick={() =>
              setExpandedNadadoraId(expandedNadadoraId === n.id ? null : n.id)
            }
          >
            <div className="NadadorasLogros-Admin-header">
              <h3 className="NadadorasLogros-Admin-nombre">
                {n.nombre}{" "}
                {(n.apellido || "").length > 10
                  ? (n.apellido || "").slice(0, 9) + "…"
                  : n.apellido || ""}
              </h3>
              <span
                className={`NadadorasLogros-Admin-toggle-icon ${
                  expandedNadadoraId === n.id ? "rotated" : ""
                }`}
              >
                ▼
              </span>
            </div>

            <div className="NadadorasLogros-Admin-subheader">
              <span
                className="NadadorasLogros-Admin-nivel-badge"
                style={{ backgroundColor: getNivelColor(n.nivel) }}
              >
                Nivel {n.nivel} - {n.puntos} pts
              </span>
            </div>

            <div
              className="NadadorasLogros-Admin-footer"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="number"
                placeholder="Puntos extra"
                value={puntosExtra[n.id] || ""}
                onChange={(e) =>
                  handlePuntosExtraChange(n.id, parseInt(e.target.value))
                }
                className="NadadorasLogros-Admin-extra-input"
              />
              <button
                onClick={() => asignarPuntosExtra(n.id)}
                className="NadadorasLogros-Admin-extra-button"
              >
                Asignar puntos extra
              </button>
            </div>

            {expandedNadadoraId === n.id && (
              <div className="NadadorasLogros-Admin-expanded">
                <h4>Logros:</h4>
                <ul className="NadadorasLogros-Admin-logros">
                  {n.logros.length === 0 ? (
                    <li className="NadadorasLogros-Admin-no-logros">
                      No tiene logros aún
                    </li>
                  ) : (
                    n.logros.map((l) => (
                      <li
                        key={l.id}
                        className="NadadorasLogros-Admin-logro-item"
                      >
                        {l.nombre} ({l.tipo}) - Fecha:{" "}
                        {new Date(l.fecha).toLocaleDateString()}
                      </li>
                    ))
                  )}
                </ul>

                <h4>Historial de puntos:</h4>
                <ul className="NadadorasLogros-Admin-historial">
                  {n.historial.length === 0 ? (
                    <li className="NadadorasLogros-Admin-no-historial">
                      No tiene historial de puntos
                    </li>
                  ) : (
                    n.historial
                      .filter((h) => h.puntos !== 0)
                      .map((h) => (
                        <li
                          key={h.id}
                          className="NadadorasLogros-Admin-historial-item"
                        >
                          +{h.puntos} pts - {h.motivo} ({h.detalle})
                          <span className="NadadorasLogros-Admin-fecha">
                            {new Date(h.fecha).toLocaleDateString()}
                          </span>
                        </li>
                      ))
                  )}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
