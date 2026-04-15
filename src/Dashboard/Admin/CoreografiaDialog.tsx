"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Coreografia } from "./Coreografias";

interface Nadadora {
  id: number;
  nombre: string;
  apellido: string;
}

interface NadadoraAsignada extends Nadadora {
  rol: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  coreografia?: Coreografia | null;
}

export default function CoreografiaDialog({
  open,
  onClose,
  onSave,
  coreografia,
}: Props) {
  const [formData, setFormData] = useState<Partial<Coreografia>>({
    nombre: "",
    descripcion: "",
    categoria: "",
    tipo: "",
    musica: "",
  });

  const [nadadoras, setNadadoras] = useState<Nadadora[]>([]);
  const [asignadas, setAsignadas] = useState<NadadoraAsignada[]>([]);
  const [busqueda, setBusqueda] = useState("");

  function mostrarNombreCompleto(n: Nadadora) {
    return `${n.nombre} ${n.apellido}`;
  }

  useEffect(() => {
    fetchNadadoras();
  }, []);

  useEffect(() => {
    if (coreografia) {
      setFormData(coreografia);
      fetchAsignadas(coreografia.id);
    } else {
      setFormData({
        nombre: "",
        descripcion: "",
        categoria: "",
        tipo: "",
        musica: "",
      });
      setAsignadas([]);
    }
  }, [coreografia]);

  async function fetchNadadoras() {
    const { data, error } = await supabase.from("nadadoras").select("*");
    if (error) console.error(error);
    else setNadadoras(data || []);
  }

  async function fetchAsignadas(coreografiaId: number) {
    const { data, error } = await supabase
      .from("coreografia_nadadora")
      .select("nadadora_id, rol, nadadora: nadadora_id (nombre)")
      .eq("coreografia_id", coreografiaId);
    console.log("🚀 ~ data:", data);
    if (error) console.error(error);
    else {
      const list: NadadoraAsignada[] = (data || []).map((d: any) => ({
        id: d.nadadora_id,
        nombre: d.nadadora?.nombre || "", // <--- aquí
        apellido: d.nadadora?.apellido || "",
        rol: d.rol,
      }));
      setAsignadas(list);
    }
  }

  function handleAsignar(nadadoraId: number, rol: string) {
    if (!rol) return;
    const idx = asignadas.findIndex((a) => a.id === nadadoraId);
    if (idx >= 0) {
      const nueva = [...asignadas];
      nueva[idx].rol = rol;
      setAsignadas(nueva);
    } else {
      const nad = nadadoras.find((n) => n.id === nadadoraId);
      if (nad) setAsignadas([...asignadas, { ...nad, rol }]);
    }
  }

  function handleDesasignar(nadadoraId: number) {
    setAsignadas(asignadas.filter((a) => a.id !== nadadoraId));
  }

  async function handleSave() {
    if (!formData.nombre) return alert("El nombre es obligatorio.");

    let coreografiaId = coreografia?.id;
    const coreografiaData = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      categoria: formData.categoria,
      tipo: formData.tipo,
      musica: formData.musica,
    };
    if (coreografiaId) {
      const { error } = await supabase
        .from("coreografias")
        .update(coreografiaData)
        .eq("id", coreografiaId);
      if (error) return alert("Error al actualizar la coreografía");
    } else {
      const { data, error } = await supabase
        .from("coreografias")
        .insert(formData)
        .select()
        .single();
      if (error) return alert("Error al crear la coreografía");
      coreografiaId = data.id;
    }

    // Actualizar coreografia_nadadora
    // Primero borramos las previas
    await supabase
      .from("coreografia_nadadora")
      .delete()
      .eq("coreografia_id", coreografiaId)
      .in(
        "nadadora_id",
        asignadas.map((a) => a.id)
      );
    // Insertamos las nuevas
    if (asignadas.length > 0) {
      const payload = asignadas.map((a) => ({
        coreografia_id: coreografiaId,
        nadadora_id: a.id,
        rol: a.rol,
      }));
      const { error } = await supabase
        .from("coreografia_nadadora")
        .insert(payload);
      if (error) console.error(error);
    }

    onClose();
    onSave();
  }

  if (!open) return null;

  return (
    <div className="coreografias-dialog-overlay" onClick={onClose}>
      <div className="coreografias-dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="coreografias-dialog-title">
          {coreografia ? "Editar" : "Nueva"} Coreografía
        </h2>

        <div className="coreografias-dialog-form">
          <input
            type="text"
            placeholder="Nombre"
            value={formData.nombre || ""}
            onChange={(e) =>
              setFormData({ ...formData, nombre: e.target.value })
            }
            className="coreografias-dialog-input"
          />

          <input
            type="text"
            placeholder="Categoría"
            value={formData.categoria || ""}
            onChange={(e) =>
              setFormData({ ...formData, categoria: e.target.value })
            }
            className="coreografias-dialog-input"
          />

          <input
            type="text"
            placeholder="Tipo"
            value={formData.tipo || ""}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            className="coreografias-dialog-input"
          />

          <input
            type="text"
            placeholder="Música"
            value={formData.musica || ""}
            onChange={(e) =>
              setFormData({ ...formData, musica: e.target.value })
            }
            className="coreografias-dialog-input"
          />

          <textarea
            placeholder="Descripción"
            value={formData.descripcion || ""}
            onChange={(e) =>
              setFormData({ ...formData, descripcion: e.target.value })
            }
            className="coreografias-dialog-textarea"
          />

          {/* LISTA DE NADADORAS */}
          <div className="coreografias-dialog-nadadoras">
            <h3 className="coreografias-dialog-subtitle">Asignar Nadadoras</h3>

            {/* INPUT DE BÚSQUEDA */}
            <input
              type="text"
              placeholder="Buscar nadadora..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="coreografias-dialog-input"
            />

            {/* RESULTADOS DEL AUTOCOMPLETE */}
            {busqueda.length > 0 && (
              <div className="coreografias-autocomplete-results">
                {nadadoras
                  .filter(
                    (n) =>
                      !asignadas.some((a) => a.id === n.id) &&
                      ((n.nombre ?? "")
                        .toLowerCase()
                        .includes(busqueda.toLowerCase()) ||
                        (n.apellido ?? "")
                          .toLowerCase()
                          .includes(busqueda.toLowerCase()))
                  )
                  .map((n) => (
                    <div
                      key={n.id}
                      className="coreografias-autocomplete-item"
                      onClick={() => {
                        setAsignadas([
                          ...asignadas,
                          { ...n, rol: "" }, // rol se asigna luego
                        ]);
                        setBusqueda(""); // limpiar buscador
                      }}
                    >
                      {mostrarNombreCompleto(n)}
                    </div>
                  ))}
              </div>
            )}

            {/* CHIPS DE NADADORAS SELECCIONADAS */}
            <div className="coreografias-chips-container">
              {asignadas.map((a) => (
                <div key={a.id} className="coreografias-chip">
                  <span>{mostrarNombreCompleto(a)}</span>

                  {/* Selector de rol */}
                  <select
                    value={a.rol}
                    onChange={(e) => handleAsignar(a.id, e.target.value)}
                    className="coreografias-chip-select"
                  >
                    <option value="">Rol</option>
                    <option value="Titular">Titular</option>
                    <option value="Reserva">Reserva</option>
                  </select>

                  <button
                    className="coreografias-chip-remove"
                    onClick={() => handleDesasignar(a.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTONES */}
        <div className="coreografias-dialog-actions">
          <button onClick={onClose} className="coreografias-btn-gray">
            Cancelar
          </button>
          <button onClick={handleSave} className="coreografias-btn-primary">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
