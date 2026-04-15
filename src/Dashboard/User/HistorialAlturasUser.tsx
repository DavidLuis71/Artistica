// HistorialAlturasUser.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./HistorialAlturasUser.css";

interface RegistroAltura {
  id: number;
  fecha: string;
  tiempo_segundos: number;
  tipo_prueba: "Barracuda" | "BoostBatidora" | "Vertical";
  altura_id: number;
  observaciones: string | null;
  nombre_altura: string;
  valor_numerico: number;
}

interface Props {
  userId: string;
}
const tiposPrueba: (RegistroAltura["tipo_prueba"] | "Todos")[] = [
  "Todos",
  "Barracuda",
  "BoostBatidora",
  "Vertical",
];

export default function HistorialAlturasUser({ userId }: Props) {
  const [registros, setRegistros] = useState<RegistroAltura[]>([]);
  const [filtro, setFiltro] = useState<RegistroAltura["tipo_prueba"] | "Todos">(
    "Todos"
  );

  useEffect(() => {
    async function fetchDatos() {
      // 1️⃣ Obtenemos la nadadora asociada al usuario
      const { data: nadadoraData } = await supabase
        .from("nadadoras")
        .select("id")
        .eq("user_id", userId)
        .single();
      if (!nadadoraData) return;

      const nadadoraId = nadadoraData.id;

      // 2️⃣ Obtenemos registros de altura, haciendo join con alturas_oficiales
      const { data } = await supabase
        .from("toma_alturas")
        .select(
          `
          id,
          fecha,
          tiempo_segundos,
          tipo_prueba,
          observaciones,
          altura_id,
          alturas_oficiales!inner(nombre_altura, valor_numerico)
        `
        )
        .eq("nadadora_id", nadadoraId)
        .order("fecha", { ascending: false });

      if (!data) return;

      // mapeamos para tener las propiedades directamente
      const registrosMapeados = data.map((r: any) => ({
        id: r.id,
        fecha: r.fecha,
        tiempo_segundos: r.tiempo_segundos,
        tipo_prueba: r.tipo_prueba,
        altura_id: r.altura_id,
        observaciones: r.observaciones,
        nombre_altura: r.alturas_oficiales.nombre_altura,
        valor_numerico: r.alturas_oficiales.valor_numerico,
      }));

      setRegistros(registrosMapeados);
    }

    fetchDatos();
  }, [userId]);
  const registrosFiltrados =
    filtro === "Todos"
      ? registros
      : registros.filter((r) => r.tipo_prueba === filtro);

  return (
    <div className="HistorialAlturas-User-container">
      {/* <h2 className="HistorialAlturas-User-title">Historial de alturas</h2> */}

      <div className="HistorialAlturas-User-filtros">
        <select
          className="HistorialAlturas-User-select"
          value={filtro}
          onChange={(e) =>
            setFiltro(e.target.value as RegistroAltura["tipo_prueba"] | "Todos")
          }
        >
          {tiposPrueba.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
      </div>

      {registrosFiltrados.length === 0 && <p>No hay registros disponibles.</p>}

      <div className="HistorialAlturas-User-grid">
        {registrosFiltrados.map((r) => (
          <div
            key={r.id}
            className={`HistorialAlturas-User-card ${r.tipo_prueba} ${
              r.id === registrosFiltrados[0]?.id ? "nuevo" : ""
            }`}
          >
            <div className="HistorialAlturas-User-card-info">
              <p className="HistorialAlturas-User-fecha">
                {new Date(r.fecha).toLocaleDateString()}
              </p>
              <p>
                <strong>Prueba:</strong> {r.tipo_prueba}{" "}
              </p>
              <p>
                <strong>Altura:</strong> {r.nombre_altura}
              </p>
              <p>
                <strong>Tiempo:</strong> {r.tiempo_segundos} seg
              </p>
              {r.observaciones && (
                <p className="HistorialAlturas-User-observaciones">
                  <strong>Observaciones:</strong> {r.observaciones}
                </p>
              )}
            </div>

            {/* Barra vertical a la derecha */}
            <div className="HistorialAlturas-User-alturaBarra-vertical-container">
              <div className="HistorialAlturas-User-alturaBarra-vertical">
                <div
                  className="HistorialAlturas-User-alturaBarra-vertical-fill"
                  style={{
                    height: `${((r.valor_numerico - 1) / (13 - 1)) * 100}%`,
                  }}
                  title={`${r.valor_numerico} cm`}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
