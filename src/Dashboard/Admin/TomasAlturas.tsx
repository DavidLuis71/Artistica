import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./TomasAlturas.css";
import AutocompleteSimple from "../../utils/AutocompleteSimple";

interface Nadadora {
  id: number;
  nombre: string;
}

interface AlturaOficial {
  id: number;
  nombre_altura: string;
  valor_numerico: number;
  descripcion?: string;
}

interface TomaAltura {
  id: number;
  nadadora_id: number | null;
  fecha: string;
  altura_id: number;
  tiempo_segundos: number;
  tipo_prueba: "Barracuda" | "Vertical" | "BoostBatidora";
  observaciones?: string;
  nadadora?: Nadadora;
  altura?: AlturaOficial;
}

const tiposPrueba = ["Barracuda", "Vertical", "BoostBatidora"] as const;

export default function TomasAlturas() {
  const [nadadoras, setNadadoras] = useState<Nadadora[]>([]);
  const [alturas, setAlturas] = useState<AlturaOficial[]>([]);
  const [tomas, setTomas] = useState<TomaAltura[]>([]);

  const [form, setForm] = useState<Partial<TomaAltura>>({
    fecha: new Date().toISOString().slice(0, 10),
    tipo_prueba: "Barracuda",
  });
  const [filtroNadadora, setFiltroNadadora] = useState<
    number | null | undefined
  >(null);
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [filtroAltura, setFiltroAltura] = useState<number | null>(null);

  const tomasFiltradas = tomas.filter((t) => {
    if (filtroNadadora && t.nadadora_id !== filtroNadadora) return false;
    if (filtroTipo && t.tipo_prueba !== filtroTipo) return false;
    if (filtroAltura && t.altura_id !== filtroAltura) return false;

    return true;
  });

  // 🔹 Cargar nadadoras y alturas oficiales
  useEffect(() => {
    supabase
      .from("nadadoras")
      .select("*")
      .then(({ data }) => data && setNadadoras(data));
    supabase
      .from("alturas_oficiales")
      .select("*")
      .then(({ data }) => data && setAlturas(data));
  }, []);

  // 🔹 Cargar tomas de alturas
  const fetchTomas = async () => {
    const { data, error } = await supabase
      .from("toma_alturas")
      .select(
        `
        *,
        nadadora: nadadora_id(id, nombre),
        altura: altura_id(id, nombre_altura, valor_numerico)
      `
      )
      .order("fecha", { ascending: false });

    if (error) console.error(error);
    else setTomas(data || []);
  };

  useEffect(() => {
    fetchTomas();
  }, []);

  // 🔹 Guardar toma de altura
  const handleGuardar = async () => {
    if (
      !form.nadadora_id ||
      !form.altura_id ||
      !form.fecha ||
      form.tiempo_segundos === undefined ||
      !form.tipo_prueba
    ) {
      return alert("Rellena todos los campos obligatorios");
    }

    const { error } = await supabase.from("toma_alturas").insert([form]);
    if (error) {
      alert("Error al guardar toma de altura");
      console.error(error);
    } else {
      setForm({
        fecha: new Date().toISOString().slice(0, 10),
        tipo_prueba: "Barracuda",
      });
      fetchTomas();
    }
  };

  return (
    <div className="tomaAlturas-container">
      <h2 className="tomaAlturas-titulo">Tomas de Alturas</h2>

      {/* Formulario */}
      <div className="tomaAlturas-form">
        <AutocompleteSimple
          options={nadadoras.map((n) => ({ id: n.id, label: n.nombre }))}
          value={form.nadadora_id || null}
          onChange={(id) => setForm({ ...form, nadadora_id: id })}
          placeholder="Selecciona Nadadora"
        />

        <input
          type="date"
          value={form.fecha}
          onChange={(e) => setForm({ ...form, fecha: e.target.value })}
          className="tomaAlturas-input"
        />

        <select
          value={form.tipo_prueba}
          onChange={(e) =>
            setForm({ ...form, tipo_prueba: e.target.value as any })
          }
          className="tomaAlturas-input"
        >
          {tiposPrueba.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={form.altura_id || ""}
          onChange={(e) =>
            setForm({ ...form, altura_id: Number(e.target.value) })
          }
          className="tomaAlturas-input"
        >
          <option value="">Selecciona Altura</option>
          {alturas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre_altura} ({a.valor_numerico} cm)
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Tiempo en segundos"
          value={form.tiempo_segundos || ""}
          onChange={(e) =>
            setForm({ ...form, tiempo_segundos: Number(e.target.value) })
          }
          className="tomaAlturas-input"
        />

        <input
          type="text"
          placeholder="Observaciones"
          value={form.observaciones || ""}
          onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
          className="tomaAlturas-input"
        />

        <button className="tomaAlturas-btn-primary" onClick={handleGuardar}>
          Guardar Toma
        </button>
      </div>
      {/* filtros */}
      <div className="tomaAlturas-filtros">
        <AutocompleteSimple
          options={nadadoras.map((n) => ({ id: n.id, label: n.nombre }))}
          value={filtroNadadora}
          onChange={(id) => setFiltroNadadora(id)}
          placeholder="Filtrar por nadadora"
        />

        <select
          value={filtroTipo || ""}
          onChange={(e) => setFiltroTipo(e.target.value || null)}
          className="tomaAlturas-input"
        >
          <option value="">Tipo de Prueba</option>
          {tiposPrueba.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={filtroAltura || ""}
          onChange={(e) =>
            setFiltroAltura(e.target.value ? Number(e.target.value) : null)
          }
          className="tomaAlturas-input"
        >
          <option value="">Altura</option>
          {alturas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre_altura}
            </option>
          ))}
        </select>

        <button
          className="tomaAlturas-btn-secondary"
          onClick={() => {
            setFiltroNadadora(null);
            setFiltroTipo(null);
            setFiltroAltura(null);
          }}
        >
          Limpiar Filtros
        </button>
      </div>

      {/* Tabla */}
      <div className="tomaAlturas-tabla-container">
        <table className="tomaAlturas-tabla">
          <thead>
            <tr>
              <th>Nadadora</th>
              <th>Altura</th>
              <th>Fecha</th>
              <th>Tiempo</th>
              <th>Tipo</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {tomasFiltradas.map((t) => (
              <tr key={t.id}>
                <td>{t.nadadora?.nombre}</td>
                <td>
                  {t.altura?.nombre_altura} ({t.altura?.valor_numerico} cm)
                </td>
                <td>{new Date(t.fecha).toLocaleDateString()}</td>
                <td>{t.tiempo_segundos}</td>
                <td>{t.tipo_prueba}</td>
                <td>{t.observaciones}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
