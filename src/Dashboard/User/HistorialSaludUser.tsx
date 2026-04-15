import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./HistorialSaludUser.css";

interface HistorialSaludForm {
  tipo_general: string;
  causa: string;
  zona_cuerpo: string;
  gravedad: string;
  descripcion: string;
  fecha: string;
}

interface Enums {
  tipo_general: string[];
  causa: string[];
  zona_cuerpo: string[];
  gravedad: string[];
}

const gravedadColors: Record<string, string> = {
  leve: "#4caf50", // verde
  molesta: "#cddc39", // verde amarillento
  moderada: "#ff9800", // naranja
  moderada_intensa: "#ff5722", // naranja fuerte
  grave: "#f44336", // rojo
};

const formatEnum = (value: string) => {
  return value
    .replace(/_/g, " ") // Reemplaza guiones bajos por espacios
    .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitaliza la primera letra de cada palabra
};

export default function HistorialSaludUser({
  nadadoraId,
}: {
  nadadoraId: number;
}) {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enums, setEnums] = useState<Enums>({
    tipo_general: [],
    causa: [],
    zona_cuerpo: [],
    gravedad: [],
  });

  const [form, setForm] = useState<HistorialSaludForm>({
    tipo_general: "",
    causa: "",
    zona_cuerpo: "",
    gravedad: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0], // ← default hoy
  });

  const cargarEnums = async () => {
    const fetchEnum = async (name: string) => {
      const { data } = await supabase.rpc("get_enum_values", {
        enum_name: name,
      });
      return data || [];
    };

    const [tipo_general, causa, zona_cuerpo, gravedad] = await Promise.all([
      fetchEnum("tipo_general_enum"),
      fetchEnum("causa_enum"),
      fetchEnum("zona_cuerpo_enum"),
      fetchEnum("gravedad_enum"),
    ]);

    setEnums({ tipo_general, causa, zona_cuerpo, gravedad });
  };

  const cargarHistorial = async () => {
    const { data, error } = await supabase
      .from("historial_salud")
      .select("*")
      .eq("nadadora_id", nadadoraId)
      .order("fecha", { ascending: false });

    if (!error) setRegistros(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarEnums();
    cargarHistorial();
  }, [nadadoraId]);

  const guardarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("historial_salud").insert({
      nadadora_id: nadadoraId,
      ...form,
      causa: form.causa || null,
      zona_cuerpo: form.zona_cuerpo || null,
      gravedad: form.gravedad || null,
    });

    if (!error) {
      setForm({
        tipo_general: "",
        causa: "",
        zona_cuerpo: "",
        gravedad: "",
        descripcion: "",
        fecha: new Date().toISOString().split("T")[0],
      });
      cargarHistorial();
    }
  };

  return (
    <div className="historialSalud-container">
      {/* <h2>Historial de Salud</h2> */}

      <form className="historialSalud-form" onSubmit={guardarRegistro}>
        <label>Fecha</label>
        <input
          type="date"
          value={form.fecha}
          onChange={(e) => setForm({ ...form, fecha: e.target.value })}
        />

        <label>Tipo general</label>
        <select
          value={form.tipo_general}
          onChange={(e) => setForm({ ...form, tipo_general: e.target.value })}
          required
        >
          <option value="">Seleccionar...</option>
          {enums.tipo_general.map((op) => (
            <option key={op} value={op}>
              {formatEnum(op)}
            </option>
          ))}
        </select>

        {(form.tipo_general === "dolor" ||
          form.tipo_general === "lesion" ||
          form.tipo_general === "molestia") && (
          <>
            <label>Causa</label>
            <select
              value={form.causa}
              onChange={(e) => setForm({ ...form, causa: e.target.value })}
            >
              <option value="">Ninguna / no aplica</option>
              {enums.causa.map((op) => (
                <option key={op} value={op}>
                  {formatEnum(op)}
                </option>
              ))}
            </select>
          </>
        )}

        <label>Zona del cuerpo</label>
        <select
          value={form.zona_cuerpo}
          onChange={(e) => setForm({ ...form, zona_cuerpo: e.target.value })}
        >
          <option value="">Seleccionar...</option>
          {enums.zona_cuerpo.map((op) => (
            <option key={op} value={op}>
              {formatEnum(op)}
            </option>
          ))}
        </select>

        <label>Gravedad</label>
        <select
          value={form.gravedad}
          onChange={(e) => setForm({ ...form, gravedad: e.target.value })}
        >
          <option value="">Seleccionar...</option>
          {enums.gravedad.map((op) => (
            <option key={op} value={op}>
              {formatEnum(op)}
            </option>
          ))}
        </select>

        <label>Descripción</label>
        <textarea
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />

        <button type="submit">Guardar</button>
      </form>

      <h3>Historial</h3>

      {loading ? (
        <p>Cargando...</p>
      ) : registros.length === 0 ? (
        <p>No hay registros.</p>
      ) : (
        <ul className="historialSalud-lista">
          {registros.map((r) => (
            <li
              key={r.id}
              style={{
                borderLeft: `5px solid ${
                  r.gravedad
                    ? gravedadColors[r.gravedad]
                    : "var(--color-header)"
                }`,
                backgroundColor: r.gravedad
                  ? gravedadColors[r.gravedad] + "20"
                  : "#f5f7ff",
              }}
            >
              <strong>{formatEnum(r.tipo_general)}</strong> — {r.fecha}
              <br />
              {r.zona_cuerpo && <span>Zona: {formatEnum(r.zona_cuerpo)}</span>}
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
