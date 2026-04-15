import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

// hacer que cuando añada un resultado, no se vaya al iniciio
interface Competicion {
  id: number;
  nombre: string;
  tipo: "rutinas" | "figuras" | "tiempos" | "niveles";
  fecha: string;
  lugar: string | null;
  latitud?: number | null;
  longitud?: number | null;
  descripcion: string | null;
  hora_comienzo: string | null;
  hora_llegada: string | null;
  material_necesario: string | null;
  estado: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  competicion?: Competicion | null;
}

const lugaresHabituales = [
  {
    nombre: "Marisma",
    latitud: 43.47405409327398,
    longitud: -3.7916130576723504,
  },

  {
    nombre: "Piscina Municipal",
    latitud: 43.46059274735019,
    longitud: -3.8524226029505,
  },

  {
    nombre: "Piscina de Cross",
    latitud: 43.42189301267634,
    longitud: -3.8394878938155004,
  },
];

export default function CompeticionDialog({
  open,
  onClose,
  onSave,
  competicion,
}: Props) {
  const [formData, setFormData] = useState<Competicion>({
    id: 0,
    nombre: "",
    tipo: "rutinas",
    fecha: "",
    lugar: "",
    latitud: null,
    longitud: null,
    descripcion: "",
    hora_comienzo: "",
    hora_llegada: "",
    material_necesario: "",
    estado: "programada",
  });
  const [mostrarAutocomplete, setMostrarAutocomplete] = useState(false);

  useEffect(() => {
    if (competicion) setFormData(competicion);
    else
      setFormData({
        id: 0,
        nombre: "",
        tipo: "rutinas",
        fecha: "",
        lugar: "",
        latitud: null,
        longitud: null,
        descripcion: "",
        hora_comienzo: "",
        hora_llegada: "",
        material_necesario: "",
        estado: "programada",
      });
  }, [competicion]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.nombre || !formData.tipo || !formData.fecha) {
      alert("Por favor completa los campos obligatorios");
      return;
    }

    const payload = {
      nombre: formData.nombre,
      tipo: formData.tipo,
      fecha: formData.fecha,
      lugar: formData.lugar || null,
      latitud: formData.latitud || null,
      longitud: formData.longitud || null,
      descripcion: formData.descripcion || null,
      hora_comienzo: formData.hora_comienzo || null,
      hora_llegada: formData.hora_llegada || null,
      material_necesario: formData.material_necesario || null,
      estado: formData.estado || "programada",
    };

    if (competicion?.id) {
      const { error } = await supabase
        .from("competiciones")
        .update(payload)
        .eq("id", competicion.id);
      if (error) {
        alert("Error al actualizar la competición: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("competiciones").insert(payload);
      if (error) {
        alert("Error al crear la competición: " + error.message);
        return;
      }
    }

    onSave();
    onClose();
  }

  return (
    <div className="competicion-modalDialog">
      <div className={`competicion-modalDialog-panel modal-${formData.tipo}`}>
        <h2 className="competicion-modalDialog-title">
          {competicion ? "Editar competición" : "Nueva competición"}
        </h2>
        <span className={`competicion-tipo ${formData.tipo}`}>
          {formData.tipo}
        </span>
        <form onSubmit={handleSubmit} className="competicion-modalDialog-form">
          <div className="competicion-modalDialog-group">
            <label>Nombre</label>
            <input
              className="competicion-modalDialog-input"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
            />
          </div>

          <div className="competicion-modalDialog-group">
            <label>Tipo</label>
            <select
              className="competicion-modalDialog-input"
              value={formData.tipo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tipo: e.target.value as Competicion["tipo"],
                })
              }
            >
              <option value="rutinas">Rutinas</option>
              <option value="figuras">Figuras</option>
              <option value="tiempos">Tiempos</option>
              <option value="niveles">Niveles</option>
            </select>
          </div>

          <div className="competicion-modalDialog-group">
            <label>Fecha</label>
            <input
              type="date"
              className="competicion-modalDialog-input"
              value={formData.fecha}
              onChange={(e) =>
                setFormData({ ...formData, fecha: e.target.value })
              }
            />
          </div>

          <div className="competicion-modalDialog-grid">
            <div className="competicion-modalDialog-group">
              <label>Hora de llegada</label>
              <input
                type="time"
                className="competicion-modalDialog-input"
                value={formData.hora_llegada || ""}
                onChange={(e) =>
                  setFormData({ ...formData, hora_llegada: e.target.value })
                }
              />
            </div>

            <div className="competicion-modalDialog-group">
              <label>Hora de comienzo</label>
              <input
                type="time"
                className="competicion-modalDialog-input"
                value={formData.hora_comienzo || ""}
                onChange={(e) =>
                  setFormData({ ...formData, hora_comienzo: e.target.value })
                }
              />
            </div>
          </div>

          <div className="competicion-modalDialog-group competicion-modalDialog-lugar">
            <label>Lugar</label>
            <select
              value={formData.lugar || ""}
              onChange={(e) => {
                if (e.target.value === "otro") {
                  setMostrarAutocomplete(true);
                  setFormData({
                    ...formData,
                    lugar: "",
                    latitud: null,
                    longitud: null,
                  });
                } else {
                  const lugarSeleccionado = lugaresHabituales.find(
                    (l) => l.nombre === e.target.value
                  );
                  if (lugarSeleccionado) {
                    setFormData({
                      ...formData,
                      lugar: lugarSeleccionado.nombre,
                      latitud: lugarSeleccionado.latitud,
                      longitud: lugarSeleccionado.longitud,
                    });
                    setMostrarAutocomplete(false);
                  }
                }
              }}
            >
              <option value="">Selecciona un lugar</option>
              {lugaresHabituales.map((l) => (
                <option key={l.nombre} value={l.nombre}>
                  {l.nombre}
                </option>
              ))}
              <option value="otro">Otro...</option>
            </select>

            {mostrarAutocomplete && (
              <div className="inputs-coordenadas">
                <input
                  type="text"
                  placeholder="Nombre del lugar"
                  value={formData.lugar || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lugar: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Latitud"
                  value={formData.latitud || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      latitud: parseFloat(e.target.value),
                    })
                  }
                />
                <input
                  type="number"
                  placeholder="Longitud"
                  value={formData.longitud || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      longitud: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            )}

            {formData.lugar && formData.latitud && formData.longitud && (
              <a
                href={`https://www.google.com/maps?q=${formData.latitud},${formData.longitud}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver en Mapa
              </a>
            )}
          </div>

          <div className="competicion-modalDialog-group">
            <label>Descripción</label>
            <textarea
              className="competicion-modalDialog-input"
              value={formData.descripcion || ""}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
            />
          </div>

          <div className="competicion-modalDialog-group">
            <label>Material necesario</label>
            <textarea
              className="competicion-modalDialog-input"
              value={formData.material_necesario || ""}
              onChange={(e) =>
                setFormData({ ...formData, material_necesario: e.target.value })
              }
            />
          </div>

          <div className="competicion-modalDialog-group">
            <label>Estado</label>
            <select
              className="competicion-modalDialog-input"
              value={formData.estado || "programada"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estado: e.target.value as Competicion["estado"],
                })
              }
            >
              <option value="programada">Programada</option>
              <option value="curso">En curso</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>

          <div className="competicion-modalDialog-buttons">
            <button
              type="button"
              className="competicion-btn-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`competicion-btn-save btn-save-${formData.tipo}`}
            >
              {competicion ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
