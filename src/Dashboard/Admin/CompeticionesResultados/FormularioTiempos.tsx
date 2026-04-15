import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Competicion {
  id: number;
  nombre: string;
  tipo: "rutinas" | "figuras" | "tiempos" | "niveles";
  fecha: string;
  lugar: string | null;
  descripcion: string | null;
  hora_comienzo: string | null;
  hora_llegada: string | null;
  material_necesario: string | null;
  estado: string | null;
}

interface Nadadora {
  id: number;
  nombre: string;
}

interface FormularioTiemposProps {
  onClose: () => void;
  competicion: Competicion;
}

export function FormularioTiempos({
  onClose,
  competicion,
}: FormularioTiemposProps) {
  const [nadadoras, setNadadoras] = useState<Nadadora[]>([]);

  const [form, setForm] = useState({
    nadadora_id: "",
    prueba_nombre: "",
    tiempo: "",
  });

  // ✅ Cargar nadadoras
  useEffect(() => {
    async function fetchNadadoras() {
      const { data, error } = await supabase
        .from("nadadoras")
        .select("id, nombre")
        .order("nombre", { ascending: true });

      if (!error && data) setNadadoras(data);
    }
    fetchNadadoras();
  }, []);

  async function handleSave() {
    const data = {
      competicion_id: competicion.id,
      nadadora_id: Number(form.nadadora_id),
      prueba_nombre: form.prueba_nombre,
      tiempo: form.tiempo,
    };

    await supabase.from("resultados_tiempos").insert(data);
    onClose();
  }

  return (
    <form className="resultados-form">
      {/* ✅ Select Nadadora */}
      <select
        value={form.nadadora_id}
        onChange={(e) => setForm({ ...form, nadadora_id: e.target.value })}
        className="resultados-input"
      >
        <option value="">Selecciona una nadadora</option>
        {nadadoras.map((n) => (
          <option key={n.id} value={n.id}>
            {n.nombre}
          </option>
        ))}
      </select>

      {/* ✅ Nombre de la prueba */}
      <input
        type="text"
        placeholder="Nombre de la prueba"
        value={form.prueba_nombre}
        onChange={(e) => setForm({ ...form, prueba_nombre: e.target.value })}
        className="resultados-input"
      />

      {/* ✅ Tiempo */}
      <input
        type="text"
        placeholder="Tiempo (ej: 1:32.45)"
        value={form.tiempo}
        onChange={(e) => setForm({ ...form, tiempo: e.target.value })}
        className="resultados-input"
      />

      <div className="resultados-form-buttons">
        <button className="competicion-btn-cancel" onClick={onClose}>
          Cancelar
        </button>
        <button className="competicion-btn-save" onClick={handleSave}>
          Guardar
        </button>
      </div>
    </form>
  );
}
