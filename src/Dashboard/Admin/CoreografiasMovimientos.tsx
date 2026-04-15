// src/pages/Coreografias.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./CoreografiasMovimientos.css";
import AutocompleteMultiple from "../../utils/AutocompleteMultiple";
import FormacionEditor from "./FormacionEditor";

interface Accion {
  movimiento: string;
  nadadoras: number[] | null;
}

interface Bloque {
  numeroDeOchos: number;
  tiempos: string;
  acciones: Accion[];
  formacion?: { x: number; y: number; nadadoraId: number | null }[];
}

interface Coreografia {
  id: number;
  nombre: string;
  descripcion: string;
  movimientos: Bloque[];
}

export default function CoreografiasMovimientos() {
  const [coreografias, setCoreografias] = useState<Coreografia[]>([]);
  const [seleccionada, setSeleccionada] = useState<Coreografia | null>(null);
  const [bloqueEdit, setBloqueEdit] = useState<Bloque | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [nadadorasCoreo, setNadadorasCoreo] = useState<
    { id: number; nombre: string }[]
  >([]);
  console.log("🚀 ~ nadadorasCoreo:", nadadorasCoreo);

  useEffect(() => {
    if (!seleccionada) return;

    const fetchNadadoras = async () => {
      const { data, error } = await supabase
        .from("coreografia_nadadora")
        .select("nadadora_id, nadadoras!inner(nombre)") // '!inner' fuerza el join
        .eq("coreografia_id", seleccionada.id);

      if (error) return console.error(error);

      // Mapear a formato {id, nombre}
      const nadadorasMap = (data as any[]).map((d) => ({
        id: d.nadadora_id,
        nombre: d.nadadoras?.nombre || `ID ${d.nadadora_id}`,
      }));

      setNadadorasCoreo(nadadorasMap);
    };

    fetchNadadoras();
  }, [seleccionada]);

  // Cargar coreografías
  useEffect(() => {
    const fetchCoreografias = async () => {
      const { data, error } = await supabase.from("coreografias").select("*");
      if (error) return console.error(error);
      setCoreografias(data as Coreografia[]);
    };
    fetchCoreografias();
  }, []);

  // Crear un bloque vacío
  const nuevoBloque = () => {
    setBloqueEdit({
      numeroDeOchos: 0,
      tiempos: "",
      acciones: [{ movimiento: "", nadadoras: null }],
    });
    setEditIndex(null);
  };

  // Guardar bloque en la coreografía localmente
  const guardarBloqueEnEsquema = () => {
    if (!seleccionada || !bloqueEdit) return;

    const movimientos = Array.isArray(seleccionada.movimientos)
      ? [...seleccionada.movimientos]
      : [];

    if (editIndex !== null) {
      // Editar bloque existente
      movimientos[editIndex] = bloqueEdit;
    } else {
      // Añadir nuevo bloque
      movimientos.push({
        ...bloqueEdit,
        numeroDeOchos: movimientos.length + 1,
      });
    }

    setSeleccionada({ ...seleccionada, movimientos });
    setBloqueEdit(null);
    setEditIndex(null);
  };

  const editarBloque = (index: number) => {
    if (!seleccionada) return;
    setBloqueEdit({ ...seleccionada.movimientos[index] });
    setEditIndex(index);
  };

  const eliminarBloque = (index: number) => {
    if (!seleccionada) return;
    const nuevosMovimientos = [...(seleccionada.movimientos || [])];
    nuevosMovimientos.splice(index, 1);
    nuevosMovimientos.forEach((b, i) => (b.numeroDeOchos = i + 1));
    setSeleccionada({ ...seleccionada, movimientos: nuevosMovimientos });

    if (editIndex === index) {
      setBloqueEdit(null);
      setEditIndex(null);
    }
  };

  // Añadir acción en el formulario
  const agregarAccion = () => {
    if (!bloqueEdit) {
      // Inicializar bloque si no existe
      setBloqueEdit({
        numeroDeOchos: 0,
        tiempos: "",
        acciones: [{ movimiento: "", nadadoras: null }],
      });
      return;
    }

    const nuevasAcciones = [...bloqueEdit.acciones];
    nuevasAcciones.push({ movimiento: "", nadadoras: null });
    setBloqueEdit({ ...bloqueEdit, acciones: nuevasAcciones });
  };

  // Guardar en la base de datos
  const guardarMovimientosDB = async () => {
    if (!seleccionada) return;
    try {
      const { error } = await supabase
        .from("coreografias")
        .update({ movimientos: seleccionada.movimientos })
        .eq("id", seleccionada.id);
      if (error) return console.error(error);
      alert("Movimientos guardados en DB ✅");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="CoreografiasMovimientos-Container">
      <h2 className="CoreografiasMovimientos-Titulo">Coreografías</h2>

      <select
        className="CoreografiasMovimientos-Select"
        value={seleccionada?.id || ""}
        onChange={(e) => {
          const c = coreografias.find((c) => c.id === Number(e.target.value));
          setSeleccionada(c || null);
          setBloqueEdit(null);
          setEditIndex(null);
        }}
      >
        <option value="">-- Selecciona una coreografía --</option>
        {coreografias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>

      {seleccionada && (
        <div className="CoreografiasMovimientos-Seleccionada">
          <h3 className="CoreografiasMovimientos-Nombre">
            {seleccionada.nombre}
          </h3>

          <button
            className="CoreografiasMovimientos-Crear-NuevoBloque"
            onClick={nuevoBloque}
          >
            ➕ Nuevo bloque
          </button>

          {bloqueEdit && (
            <div className="CoreografiasMovimientos-Crear-Formulario">
              <h4 className="CoreografiasMovimientos-Crear-Titulo">
                {editIndex !== null ? "Editar bloque" : "Nuevo bloque"}
              </h4>
              <label className="CoreografiasMovimientos-Crear-Label">
                Tiempos:
                <input
                  className="CoreografiasMovimientos-Crear-Input"
                  type="text"
                  value={bloqueEdit.tiempos}
                  onChange={(e) =>
                    setBloqueEdit({ ...bloqueEdit, tiempos: e.target.value })
                  }
                />
              </label>

              <div className="CoreografiasMovimientos-Crear-Acciones">
                <h4>Acciones:</h4>
                {bloqueEdit.acciones.map((accion, j) => (
                  <div
                    key={j}
                    className="CoreografiasMovimientos-Crear-AccionItem"
                  >
                    <div className="CoreografiasMovimientos-Crear-AccionVertical">
                      <textarea
                        className="CoreografiasMovimientos-Crear-Textarea"
                        placeholder="Movimiento"
                        value={accion.movimiento}
                        onChange={(e) => {
                          const nuevasAcciones = [...bloqueEdit.acciones];
                          nuevasAcciones[j].movimiento = e.target.value;
                          setBloqueEdit({
                            ...bloqueEdit,
                            acciones: nuevasAcciones,
                          });
                        }}
                      />
                      <label>
                        Nadadoras:
                        <AutocompleteMultiple
                          options={nadadorasCoreo.map((n) => ({
                            id: n.id,
                            label: n.nombre,
                          }))}
                          value={accion.nadadoras || []}
                          onChange={(selected) => {
                            const nuevasAcciones = [...bloqueEdit!.acciones];
                            nuevasAcciones[j].nadadoras =
                              selected.length > 0 ? selected : null;
                            setBloqueEdit({
                              ...bloqueEdit!,
                              acciones: nuevasAcciones,
                            });
                          }}
                          placeholder="Selecciona nadadoras..."
                        />
                      </label>
                    </div>
                    <button
                      className="CoreografiasMovimientos-Crear-BtnEliminar"
                      onClick={() => {
                        const nuevasAcciones = [...bloqueEdit.acciones];
                        nuevasAcciones.splice(j, 1);
                        setBloqueEdit({
                          ...bloqueEdit,
                          acciones: nuevasAcciones,
                        });
                      }}
                    >
                      ❌
                    </button>
                  </div>
                ))}

                <button
                  className="CoreografiasMovimientos-Crear-BtnAccion"
                  onClick={agregarAccion}
                >
                  ➕ Añadir acción
                </button>
              </div>
              <h4>Formación</h4>
              <FormacionEditor
                formacion={bloqueEdit.formacion || []}
                onChange={(f) =>
                  setBloqueEdit({ ...bloqueEdit!, formacion: f })
                }
                nadadoras={nadadorasCoreo}
              />

              <button
                className="CoreografiasMovimientos-Crear-BtnGuardar"
                onClick={guardarBloqueEnEsquema}
              >
                {editIndex !== null ? "Guardar cambios" : "Añadir bloque"}
              </button>
            </div>
          )}

          <h4 className="CoreografiasMovimientos-EsquemaTitulo">
            Esquema actual:
          </h4>
          <div className="CoreografiasMovimientos-EsquemaScroll">
            {(Array.isArray(seleccionada.movimientos)
              ? seleccionada.movimientos.slice().reverse()
              : []
            ).map((bloque, iReverso) => {
              const indexReal = seleccionada.movimientos.length - 1 - iReverso;

              return (
                <div
                  key={bloque.numeroDeOchos}
                  className="CoreografiasMovimientos-EsquemaBloque"
                >
                  <strong>Bloque #{bloque.numeroDeOchos}</strong>

                  <button
                    className="CoreografiasMovimientos-EsquemaBtnEditar"
                    onClick={() => editarBloque(indexReal)}
                  >
                    ✏️ Editar
                  </button>

                  <button
                    className="CoreografiasMovimientos-EsquemaBtnEliminar"
                    onClick={() => eliminarBloque(indexReal)}
                  >
                    ❌
                  </button>

                  <div>Tiempos: {bloque.tiempos}</div>
                  {bloque.formacion && bloque.formacion.length > 0 && (
                    <div>Formación: {bloque.formacion.length} puntos</div>
                  )}
                  <div>
                    Acciones:
                    {bloque.acciones.map((a, j) => (
                      <span key={j}>
                        {a.movimiento} [{a.nadadoras?.join(",")}]{" "}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="CoreografiasMovimientos-GuardarDB">
            <button onClick={guardarMovimientosDB}>
              Guardar esquema en DB
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
