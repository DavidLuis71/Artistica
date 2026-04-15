import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import AutocompleteSimple from "../../../utils/AutocompleteSimple";

interface Competicion {
  id: number;
  nombre: string;
  tipo: "rutinas" | "figuras" | "tiempos" | "niveles";
}

interface Nadadora {
  id: number;
  nombre: string;
}

interface PruebaNivel {
  id: number;
  nombre: string;
  categoria: string;
  tipo: "aprobado" | "tiempo" | "notas";
}

interface FormularioNivelesProps {
  competicion: Competicion;
  onClose: () => void;
}

export function FormularioNiveles({
  competicion,
  onClose,
}: FormularioNivelesProps) {
  const [nadadoras, setNadadoras] = useState<Nadadora[]>([]);
  const [pruebas, setPruebas] = useState<PruebaNivel[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);

  const [form, setForm] = useState({
    nadadora_id: null as number | null,
    prueba_id: "",
    aprobado: "pendiente",
    tiempo: "",
    notas: ["", "", "", "", ""],
    nota_final: "",
    nueva_prueba_nombre: "",
    nueva_prueba_tipo: "aprobado" as "aprobado" | "tiempo" | "notas",
    nueva_prueba_categoria: "",
  });

  // Cargar nadadoras y categorías existentes
  useEffect(() => {
    supabase
      .from("nadadoras")
      .select("id, nombre")
      .order("nombre")
      .then(({ data, error }) => {
        if (!error && data) setNadadoras(data);
      });

    // Cargar todas las categorías únicas desde nadadora_grupos
    supabase
      .from("nadadora_grupos")
      .select("categoria")
      .then(({ data, error }) => {
        if (!error && data) {
          const categoriasUnicas = Array.from(
            new Set(data.map((d: any) => d.categoria))
          );
          setCategorias(categoriasUnicas);
        }
      });
  }, []);

  // Actualizar categoría y pruebas al seleccionar nadadora
  useEffect(() => {
    if (!form.nadadora_id) {
      setPruebas([]);
      return;
    }

    supabase
      .from("nadadora_grupos")
      .select("categoria")
      .eq("nadadora_id", Number(form.nadadora_id))
      .order("fecha_asignacion", { ascending: false })
      .limit(1)
      .then(({ data, error }) => {
        if (!error && data?.length) {
          const cat = data[0].categoria;
          setForm((f) => ({ ...f, nueva_prueba_categoria: cat }));

          supabase
            .from("pruebas_niveles")
            .select("*")
            .eq("categoria", cat)
            .then(({ data, error }) => {
              if (!error && data) setPruebas(data);
            });
        } else {
          setPruebas([]);
        }
      });
  }, [form.nadadora_id]);

  // Guardar resultado
  const handleSave = async () => {
    const data: any = {
      competicion_id: competicion.id,
      nadadora_id: Number(form.nadadora_id),
      prueba_id: Number(form.prueba_id),
    };

    const pruebaSeleccionada = pruebas.find(
      (p) => p.id === Number(form.prueba_id)
    );
    if (!pruebaSeleccionada) return;

    switch (pruebaSeleccionada.tipo) {
      case "aprobado":
        data.aprobado = form.aprobado === "aprobado";
        break;
      case "tiempo": {
        // Convertir mm:ss:cc a segundos con decimales
        const match = form.tiempo.match(/^(\d+):(\d{2}):(\d{2})$/);
        if (match) {
          const minutos = Number(match[1]);
          const segundos = Number(match[2]);
          const centesimas = Number(match[3]);
          data.tiempo = minutos * 60 + segundos + centesimas / 100;
        } else {
          data.tiempo = Number(form.tiempo) || 0; // fallback por si no coincide
        }
        break;
      }

      case "notas":
        data.notas = form.notas.map((n) => Number(n));
        data.nota_final = Number(form.nota_final);
        break;
    }

    const { error } = await supabase.from("resultados_niveles").insert(data);

    if (!error) {
      // Reiniciar formulario excepto nadadora
      setForm({
        nadadora_id: form.nadadora_id, // mantener seleccionada
        prueba_id: "",
        aprobado: "pendiente",
        tiempo: "",
        notas: ["", "", "", "", ""],
        nota_final: "",
        nueva_prueba_nombre: "",
        nueva_prueba_tipo: "aprobado",
        nueva_prueba_categoria: form.nueva_prueba_categoria, // mantener categoría actual
      });
    } else {
      console.error(error);
    }
  };

  // Crear nueva prueba inline
  const handleCrearPrueba = async () => {
    if (!form.nueva_prueba_nombre || !form.nueva_prueba_categoria) return;

    const { data, error } = await supabase
      .from("pruebas_niveles")
      .insert({
        nombre: form.nueva_prueba_nombre,
        categoria: form.nueva_prueba_categoria,
        tipo: form.nueva_prueba_tipo,
      })
      .select()
      .single();

    if (!error && data) {
      setPruebas([...pruebas, data]);
      setForm((f) => ({
        ...f,
        prueba_id: String(data.id),
        nueva_prueba_nombre: "",
      }));
    }
  };

  const pruebaSeleccionada = pruebas.find(
    (p) => p.id === Number(form.prueba_id)
  );

  return (
    <form className="resultados-form">
      {/* Select Nadadora */}
      <AutocompleteSimple
        options={nadadoras.map((n) => ({ id: n.id, label: n.nombre }))}
        value={form.nadadora_id ?? undefined}
        onChange={(val) =>
          setForm({ ...form, nadadora_id: val ?? null, prueba_id: "" })
        }
        placeholder="Selecciona una nadadora"
      />

      {/* Crear prueba inline */}
      <input
        type="text"
        placeholder="Nombre de nueva prueba"
        value={form.nueva_prueba_nombre}
        onChange={(e) =>
          setForm({ ...form, nueva_prueba_nombre: e.target.value })
        }
        className="resultados-input"
      />
      <select
        value={form.nueva_prueba_categoria}
        onChange={(e) =>
          setForm({ ...form, nueva_prueba_categoria: e.target.value })
        }
        className="resultados-input"
      >
        <option value="">Selecciona una categoría</option>
        {categorias.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={form.nueva_prueba_tipo}
        onChange={(e) =>
          setForm({ ...form, nueva_prueba_tipo: e.target.value as any })
        }
        className="resultados-input"
      >
        <option value="aprobado">Aprobado/Suspenso</option>
        <option value="tiempo">Tiempo</option>
        <option value="notas">Notas</option>
      </select>
      <button
        type="button"
        className="competicion-btn-save"
        onClick={handleCrearPrueba}
      >
        Crear prueba
      </button>

      {/* Select Prueba */}
      <select
        value={form.prueba_id}
        onChange={(e) => setForm({ ...form, prueba_id: e.target.value })}
        className="resultados-input"
      >
        <option value="">Selecciona una prueba</option>
        {pruebas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>

      {/* Inputs según tipo */}
      {pruebaSeleccionada?.tipo === "aprobado" && (
        <select
          value={form.aprobado}
          onChange={(e) =>
            setForm({ ...form, aprobado: e.target.value as any })
          }
          className="resultados-input"
        >
          <option value="aprobado">Aprobado</option>
          <option value="suspenso">Suspenso</option>
        </select>
      )}
      {pruebaSeleccionada?.tipo === "tiempo" && (
        <input
          type="text"
          placeholder="mm:ss:cc"
          value={form.tiempo}
          onChange={(e) => {
            const val = e.target.value;
            // Permitir solo dígitos y separadores
            if (/^[0-9:]*$/.test(val)) {
              setForm({ ...form, tiempo: val });
            }
          }}
          className="resultados-input"
        />
      )}
      {pruebaSeleccionada?.tipo === "notas" && (
        <>
          {form.notas.map((nota, i) => (
            <input
              key={i}
              type="number"
              placeholder={`Nota ${i + 1}`}
              value={nota}
              onChange={(e) => {
                const newNotas = [...form.notas];
                newNotas[i] = e.target.value;
                setForm({ ...form, notas: newNotas });
              }}
              className="resultados-input"
            />
          ))}
          <input
            type="number"
            placeholder="Nota final"
            value={form.nota_final}
            onChange={(e) => setForm({ ...form, nota_final: e.target.value })}
            className="resultados-input"
          />
        </>
      )}

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
