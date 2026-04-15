import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./HistorialSaludAdmin.css";
import AutocompleteSimple from "../../utils/AutocompleteSimple";

interface RegistroSalud {
  id: number;
  nadadora_id: number;
  nombre_nadadora?: string;
  tipo_general: string;
  causa?: string;
  zona_cuerpo?: string;
  gravedad?: string;
  descripcion?: string;
  fecha: string;
}
interface Enums {
  tipo_general: string[];
  gravedad: string[];
}

const gravedadColors: Record<string, string> = {
  leve: "#4caf50",
  molesta: "#cddc39",
  moderada: "#ff9800",
  moderada_intensa: "#ff5722",
  grave: "#f44336",
};

const formatEnum = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function HistorialSaludAdmin() {
  const [registros, setRegistros] = useState<RegistroSalud[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [filtroNadadora, setFiltroNadadora] = useState<
    number | null | undefined
  >(null);
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [filtroGravedad, setFiltroGravedad] = useState<string>("");
  const [enums, setEnums] = useState<Enums>({
    tipo_general: [],
    gravedad: [],
  });
  useEffect(() => {
    cargarEnums();
    cargarRegistros();
  }, []);
  const cargarEnums = async () => {
    const fetchEnum = async (name: string) => {
      const { data } = await supabase.rpc("get_enum_values", {
        enum_name: name,
      });
      return data || [];
    };

    const [tipo_general, gravedad] = await Promise.all([
      fetchEnum("tipo_general_enum"),
      fetchEnum("gravedad_enum"),
    ]);

    setEnums({ tipo_general, gravedad });
  };

  const cargarRegistros = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("historial_salud")
      .select(`*, nadadoras(id, nombre, apellido)`)
      .order("fecha", { ascending: false });

    if (!error) {
      const registrosFormateados = data.map((r: any) => ({
        ...r,
        nombre_nadadora: r.nadadoras?.nombre || "Sin nombre",
        nadadora_id: r.nadadoras?.id || null,
      }));
      setRegistros(registrosFormateados);
    } else {
      console.error(error);
    }
    setLoading(false);
  };

  // Aplicar filtros
  const registrosFiltrados = registros.filter((r) => {
    return (
      (!filtroNadadora || r.nadadora_id === filtroNadadora) &&
      (!filtroTipo || r.tipo_general === filtroTipo) &&
      (!filtroGravedad || r.gravedad === filtroGravedad)
    );
  });

  const listaNadadoras = Array.from(
    new Map(
      registros.map((r) => [r.nadadora_id, r.nombre_nadadora ?? "Sin nombre"])
    ).entries()
  ).map(([id, nombre]) => ({
    id: id,
    label: nombre || "Sin nombre", // ✅ siempre string
  }));

  return (
    <div className="historialSaludAdmin-container">
      <h2>Historial de Salud</h2>

      <div className="historialSaludAdmin-filtros">
        <AutocompleteSimple
          options={listaNadadoras}
          value={filtroNadadora}
          onChange={(value) => setFiltroNadadora(value)}
          placeholder="Buscar nadadora..."
        />

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          {enums.tipo_general.map((tipo) => (
            <option key={tipo} value={tipo}>
              {formatEnum(tipo)}
            </option>
          ))}
        </select>
        <select
          value={filtroGravedad}
          onChange={(e) => setFiltroGravedad(e.target.value)}
        >
          <option value="">Todas las gravedades</option>
          {enums.gravedad.map((g) => (
            <option key={g} value={g}>
              {formatEnum(g)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : registrosFiltrados.length === 0 ? (
        <p>No hay registros que coincidan con los filtros.</p>
      ) : (
        <ul className="historialSaludAdmin-lista">
          {registrosFiltrados.map((r) => (
            <li
              key={r.id}
              style={{
                borderLeftColor: r.gravedad
                  ? gravedadColors[r.gravedad] || "#1e59a8"
                  : "#1e59a8",
                borderLeftWidth: "5px",
                borderLeftStyle: "solid",
              }}
            >
              <strong>{r.nombre_nadadora}</strong> — {r.fecha}
              <br />
              <strong>{formatEnum(r.tipo_general)}</strong>
              {r.zona_cuerpo && (
                <span> | Zona: {formatEnum(r.zona_cuerpo)}</span>
              )}
              {r.causa && <span> | Causa: {formatEnum(r.causa)}</span>}
              {r.gravedad && <span> | Gravedad: {formatEnum(r.gravedad)}</span>}
              <br />
              <small>{r.descripcion}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
