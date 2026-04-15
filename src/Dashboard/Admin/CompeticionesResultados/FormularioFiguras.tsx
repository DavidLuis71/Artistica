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

interface FormularioFigurasProps {
  onClose: () => void;
  competicion: Competicion;
}

export function FormularioFiguras({
  onClose,
  competicion,
}: FormularioFigurasProps) {
  const [nadadoras, setNadadoras] = useState<Nadadora[]>([]);

  const [form, setForm] = useState({
    nadadora_id: "",
    figura_nombre: "",
    nota1: "",
    nota2: "",
    nota3: "",
    nota4: "",
    nota5: "",
    nota_final: "",
  });

  // ✅ Cargar nadadoras desde Supabase
  useEffect(() => {
    async function fetchNadadoras() {
      const { data, error } = await supabase
        .from("nadadoras") // 👈 tu tabla
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
      figura_nombre: form.figura_nombre,
      nota1: Number(form.nota1),
      nota2: Number(form.nota2),
      nota3: Number(form.nota3),
      nota4: Number(form.nota4),
      nota5: Number(form.nota5),
      nota_final: form.nota_final || null,
    };

    await supabase.from("resultados_figuras").insert(data);
    onClose();
  }

  return (
    <form className="resultados-form">
      {/* ✅ Select de Nadadora */}
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

      {/* ✅ Nombre de la figura */}
      <input
        type="text"
        placeholder="Nombre de la figura"
        value={form.figura_nombre}
        onChange={(e) => setForm({ ...form, figura_nombre: e.target.value })}
        className="resultados-input"
      />

      {/* ✅ Notas */}
      <input
        type="number"
        placeholder="Nota 1"
        value={form.nota1}
        onChange={(e) => setForm({ ...form, nota1: e.target.value })}
        className="resultados-input"
      />
      <input
        type="number"
        placeholder="Nota 2"
        value={form.nota2}
        onChange={(e) => setForm({ ...form, nota2: e.target.value })}
        className="resultados-input"
      />
      <input
        type="number"
        placeholder="Nota 3"
        value={form.nota3}
        onChange={(e) => setForm({ ...form, nota3: e.target.value })}
        className="resultados-input"
      />
      <input
        type="number"
        placeholder="Nota 4"
        value={form.nota4}
        onChange={(e) => setForm({ ...form, nota4: e.target.value })}
        className="resultados-input"
      />
      <input
        type="number"
        placeholder="Nota 5"
        value={form.nota5}
        onChange={(e) => setForm({ ...form, nota5: e.target.value })}
        className="resultados-input"
      />

      {/* ✅ Nota final (manual o calculada) */}
      <input
        type="number"
        placeholder="Nota final"
        value={form.nota_final}
        onChange={(e) => setForm({ ...form, nota_final: e.target.value })}
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
