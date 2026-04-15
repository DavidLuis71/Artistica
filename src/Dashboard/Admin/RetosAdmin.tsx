// src/pages/RetosAdmin.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./RetosAdmin.css";

interface Reto {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  auto: boolean;
  dificultad: string;
  puntos: number;
  condicion_json: {
    prueba?: string;
    max_tiempo?: number;
    validacion?: boolean;
  };
}

export default function RetosAdmin({
  setSection,
}: {
  setSection: (s: string) => void;
}) {
  const [retos, setRetos] = useState<Reto[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingReto, setEditingReto] = useState<Reto | null>(null);
  const [form, setForm] = useState<Omit<Reto, "id">>({
    nombre: "",
    descripcion: "",
    tipo: "personalizado",
    auto: true,
    dificultad: "medio",
    puntos: 10,
    condicion_json: {},
  });
  const [pruebasNatacion, setPruebasNatacion] = useState<string[]>([]);

  useEffect(() => {
    const fetchEnums = async () => {
      const { data, error } = await supabase.rpc("get_enum_values", {
        enum_name: "tipo_prueba_natacion",
      });
      if (error) console.error("Error fetching enum:", error);
      else setPruebasNatacion(data as string[]);
    };

    fetchEnums();
  }, []);

  const fetchRetos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("retos")
      .select("*")
      .order("id");
    if (error) console.error(error);
    else setRetos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRetos();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const target = e.target;
    const name = target.name;

    let value: any;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      value = target.checked;
    } else {
      value = target.value;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...form };

    if (editingReto) {
      const { error } = await supabase
        .from("retos")
        .update(payload)
        .eq("id", editingReto.id);
      if (error) console.error(error);
    } else {
      const { error } = await supabase.from("retos").insert(payload);
      if (error) console.error(error);
    }

    setEditingReto(null);
    setForm({
      nombre: "",
      descripcion: "",
      tipo: "personalizado",
      auto: true,
      dificultad: "medio",
      puntos: 10,
      condicion_json: {},
    });
    fetchRetos();
  };

  const handleEdit = (reto: Reto) => {
    setEditingReto(reto);
    setForm({ ...reto });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar este reto?")) return;
    const { error } = await supabase.from("retos").delete().eq("id", id);
    if (error) console.error(error);
    else fetchRetos();
  };

  return (
    <div className="RetosAdmin-container">
      <h2 className="RetosAdmin-title">Gestión de Retos</h2>
      <button
        className="RetosAdmin-assignButton"
        onClick={() => setSection("asignar_retos")}
      >
        Asignar retos a nadadoras
      </button>

      <form className="RetosAdmin-form" onSubmit={handleSubmit}>
        <input
          className="RetosAdmin-input"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Nombre"
          required
        />
        <textarea
          className="RetosAdmin-textarea"
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Objetivo"
        />
        <select
          className="RetosAdmin-select"
          name="tipo"
          value={form.tipo}
          onChange={handleChange}
        >
          <option value="personalizado">Personalizado</option>
          <option value="tiempo">Tiempo</option>
          <option value="coreografia">Coreografía</option>
        </select>
        {/* Asignación: personalizado o automática solo para personalizado y tiempo */}
        {(form.tipo === "personalizado" || form.tipo === "tiempo") && (
          <div className="RetosAdmin-radioGroup">
            <label>
              <input
                type="radio"
                name="auto"
                value="true"
                checked={form.auto === true}
                onChange={() => setForm((prev) => ({ ...prev, auto: true }))}
              />
              Automático
            </label>
            <span className="RetosAdmin-radioDesc">
              El sistema calcula automáticamente si el reto se completa según
              las condiciones.
            </span>

            <label>
              <input
                type="radio"
                name="auto"
                value="false"
                checked={form.auto === false}
                onChange={() => setForm((prev) => ({ ...prev, auto: false }))}
              />
              Manual
            </label>
            <span className="RetosAdmin-radioDesc">
              La asignación de puntos se realiza manualmente por el entrenador.
            </span>
          </div>
        )}

        <select
          className="RetosAdmin-select"
          name="dificultad"
          value={form.dificultad}
          onChange={handleChange}
        >
          <option value="facil">Fácil</option>
          <option value="medio">Medio</option>
          <option value="dificil">Difícil</option>
          <option value="muy_dificil">Muy difícil</option>
        </select>
        <input
          className="RetosAdmin-input"
          name="puntos"
          type="number"
          value={form.puntos}
          onChange={handleChange}
          placeholder="Puntos"
        />

        {/* Condiciones dinámicas */}
        {form.tipo === "tiempo" && (
          <div className="RetosAdmin-condicion">
            <label>Prueba:</label>
            <select
              value={form.condicion_json.prueba || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  condicion_json: {
                    ...prev.condicion_json,
                    prueba: e.target.value,
                  },
                }))
              }
            >
              <option value="">Selecciona prueba</option>
              {pruebasNatacion.map((p) => (
                <option key={p} value={p}>
                  {p.replace("_", " ")}
                </option>
              ))}
            </select>

            <label>Tiempo a conseguir (segundos):</label>
            <input
              type="number"
              value={form.condicion_json.max_tiempo || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  condicion_json: {
                    ...prev.condicion_json,
                    max_tiempo: Number(e.target.value),
                  },
                }))
              }
            />
            {/* Solo si es automático, mostramos explicación extra */}
            {form.auto && (
              <small>
                El sistema calculará automáticamente si el reto se ha completado
                dentro del tiempo indicado.
              </small>
            )}
          </div>
        )}

        {/* Resumen del reto */}
        <div className="RetosAdmin-resumen">
          <h3>Resumen del reto</h3>
          <p>
            <strong>Nombre:</strong> {form.nombre || "-"}
          </p>
          <p>
            <strong>Objetivo:</strong> {form.descripcion || "-"}
          </p>
          <p>
            <strong>Tipo:</strong> {form.tipo}
          </p>
          <p>
            <strong>Asignación:</strong> {form.auto ? "Automático" : "Manual"}
          </p>
          <p>
            <strong>Puntos:</strong> {form.puntos}
          </p>

          {form.tipo === "tiempo" && form.condicion_json.prueba && (
            <div className="RetosAdmin-resumen-tiempo">
              <p>
                <strong>Prueba:</strong>{" "}
                {form.condicion_json.prueba.replace("_", " ")} |
                <strong> Tiempo a conseguir:</strong>{" "}
                {form.condicion_json.max_tiempo || "-"} seg
              </p>
            </div>
          )}

          {form.tipo === "coreografia" && (
            <div className="RetosAdmin-resumen-coreografia">
              <p>
                <strong>Reto:</strong> Finalización de la coreografía
              </p>
            </div>
          )}
        </div>

        <button className="RetosAdmin-submit" type="submit">
          {editingReto ? "Actualizar" : "Crear"} reto
        </button>
      </form>

      {loading ? (
        <p className="RetosAdmin-loading">Cargando retos...</p>
      ) : (
        <div className="RetosAdmin-table-container">
          <table className="RetosAdmin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Dificultad</th>
                <th>Puntos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {retos.map((reto) => (
                <tr key={reto.id}>
                  <td>{reto.nombre}</td>
                  <td>{reto.tipo}</td>
                  <td>{reto.dificultad}</td>
                  <td>{reto.puntos}</td>
                  <td>
                    <button
                      className="RetosAdmin-editButton"
                      onClick={() => handleEdit(reto)}
                    >
                      Editar
                    </button>
                    <button
                      className="RetosAdmin-deleteButton"
                      onClick={() => handleDelete(reto.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
