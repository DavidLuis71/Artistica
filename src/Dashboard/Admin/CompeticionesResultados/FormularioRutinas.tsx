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

interface FormularioRutinasProps {
  onClose: () => void;
  competicion: Competicion;
}

export function FormularioRutinas({
  onClose,
  competicion,
}: FormularioRutinasProps) {
  const [nadadoras, setNadadoras] = useState<Nadadora[]>([]);
  const [form, setForm] = useState({
    nadadora_id: "",
    ejecucion: "",
    impresion_artistica: "",
    dificultad: "",
    nota: "",
  });

  // ✅ Cargar nadadoras desde Supabase
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
      ejecucion: Number(form.ejecucion),
      impresion_artistica: Number(form.impresion_artistica),
      dificultad: Number(form.dificultad),
      nota: form.nota,
    };

    await supabase.from("resultados_rutinas").insert(data);
    onClose();
  }

  return (
    <form className="resultados-form">
      <select
        className="resultados-input"
        value={form.nadadora_id}
        onChange={(e) => setForm({ ...form, nadadora_id: e.target.value })}
      >
        <option value="">Selecciona una nadadora</option>
        {nadadoras.map((n) => (
          <option key={n.id} value={n.id}>
            {n.nombre}
          </option>
        ))}
      </select>

      <label>Ejecución</label>
      <input
        type="number"
        className="resultados-input"
        value={form.ejecucion}
        onChange={(e) => setForm({ ...form, ejecucion: e.target.value })}
      />

      <label>Impresión artística</label>
      <input
        type="number"
        className="resultados-input"
        value={form.impresion_artistica}
        onChange={(e) =>
          setForm({ ...form, impresion_artistica: e.target.value })
        }
      />

      <label>Dificultad</label>
      <input
        type="number"
        className="resultados-input"
        value={form.dificultad}
        onChange={(e) => setForm({ ...form, dificultad: e.target.value })}
      />

      <label>Nota final</label>
      <input
        type="number"
        className="resultados-input"
        value={form.nota}
        onChange={(e) => setForm({ ...form, nota: e.target.value })}
      />

      <div className="resultados-form-buttons">
        <button
          type="button"
          className="competicion-btn-cancel"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="competicion-btn-save"
          onClick={handleSave}
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
