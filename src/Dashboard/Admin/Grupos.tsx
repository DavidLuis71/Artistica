import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./Grupos.css";

interface Nadadora {
  id: number;
  nombre: string;
  apellido: string;
}

interface Grupo {
  id: number;
  nombre: string;
}

interface Temporada {
  id: number;
  nombre: string;
}

interface NadadoraGrupo {
  id: number;
  nadadora_id: number;
  grupo_id: number;
  temporada_id: number;
  fecha_asignacion: string;
  categoria: "Alevin1" | "Alevin2" | "Infantil" | "Junior";
  nadadora: Nadadora;
  grupo: Grupo;
  temporada: Temporada;
}

const grupoColors: Record<string, string> = {
  avanzado: "#bff8ffff",
  precompeticion: "#efb9ffff",
};

const categorias: NadadoraGrupo["categoria"][] = [
  "Alevin1",
  "Alevin2",
  "Infantil",
  "Junior",
];
const categoriaColors: Record<NadadoraGrupo["categoria"], string> = {
  Alevin1: "#fd8080ff", // rojo más fuerte
  Alevin2: "#fcdd80ff", // amarillo más vivo
  Infantil: "#8fc7ffff", // azul más intenso
  Junior: "#92fd92ff", // verde más brillante
};
export default function Grupos() {
  const [nadadoras, setNadadoras] = useState<Nadadora[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [nadadoraGrupos, setNadadoraGrupos] = useState<NadadoraGrupo[]>([]);
  const [selectedTemporada, setSelectedTemporada] = useState<number | null>(
    null
  );

  const formatNadadoraGrupos = (data: any[]): NadadoraGrupo[] =>
    data.map((ng) => ({
      id: ng.id,
      nadadora_id: ng.nadadora_id,
      grupo_id: ng.grupo_id,
      temporada_id: ng.temporada_id,
      fecha_asignacion: ng.fecha_asignacion,
      categoria: ng.categoria,
      nadadora: ng.nadadora || { id: 0, nombre: "Desconocida", apellido: "" },

      grupo: ng.grupo || { id: 0, nombre: "Desconocido" },
      temporada: ng.temporada || { id: 0, nombre: "Desconocida" },
    }));

  useEffect(() => {
    supabase
      .from("nadadoras")
      .select("*")
      .then(({ data }) => data && setNadadoras(data));
    supabase
      .from("grupos")
      .select("*")
      .then(({ data }) => data && setGrupos(data));
    supabase
      .from("temporadas")
      .select("*")
      .then(({ data }) => data && setTemporadas(data));
  }, []);

  useEffect(() => {
    if (!selectedTemporada) return;

    supabase
      .from("nadadora_grupos")
      .select(
        `
        id,
        nadadora_id,
        grupo_id,
        temporada_id,
        fecha_asignacion,
        categoria,
        nadadora: nadadora_id (id, nombre, apellido),
        grupo: grupo_id (id, nombre),
        temporada: temporada_id (id, nombre)
      `
      )
      .eq("temporada_id", selectedTemporada)
      .then(({ data }) => {
        if (data) setNadadoraGrupos(formatNadadoraGrupos(data));
      });
  }, [selectedTemporada]);

  const handleAsignacionChange = async (
    nadadoraId: number,
    grupoId: number,
    categoria?: NadadoraGrupo["categoria"]
  ) => {
    const existente = nadadoraGrupos.find(
      (ng) => ng.nadadora_id === nadadoraId
    );

    if (existente) {
      await supabase
        .from("nadadora_grupos")
        .update({
          grupo_id: grupoId,
          categoria,
          fecha_asignacion: new Date().toISOString(),
        })
        .eq("id", existente.id);
    } else {
      await supabase.from("nadadora_grupos").insert({
        nadadora_id: nadadoraId,
        grupo_id: grupoId,
        temporada_id: selectedTemporada,
        categoria,
      });
    }

    const { data } = await supabase
      .from("nadadora_grupos")
      .select(
        `
        id,
        nadadora_id,
        grupo_id,
        temporada_id,
        fecha_asignacion,
        categoria,
        nadadora: nadadora_id (id, nombre,apellido),
        grupo: grupo_id (id, nombre),
        temporada: temporada_id (id, nombre)
      `
      )
      .eq("temporada_id", selectedTemporada);

    if (data) setNadadoraGrupos(formatNadadoraGrupos(data));
  };

  return (
    <div className="GruposAdmin-container">
      <h2 className="GruposAdmin-title">Grupos</h2>

      <div className="GruposAdmin-campo">
        <label>Temporada:</label>
        <select
          className="GruposAdmin-input-select"
          value={selectedTemporada || ""}
          onChange={(e) => setSelectedTemporada(Number(e.target.value))}
        >
          <option value="">Selecciona temporada</option>
          {temporadas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </div>

      {selectedTemporada && (
        <div className="GruposAdmin-tabla-container">
          <table className="GruposAdmin-tabla">
            <thead>
              <tr>
                <th>Nadadora</th>
                <th>Grupo</th>
                <th>Categoría</th>
              </tr>
            </thead>
            <tbody>
              {nadadoras.map((n) => {
                const asignacionExistente = nadadoraGrupos.find(
                  (ng) => ng.nadadora_id === n.id
                );
                return (
                  <tr key={n.id}>
                    <td>
                      {n.apellido
                        ? `${n.nombre} ${n.apellido.charAt(
                            0
                          )}${n.apellido.charAt(1)}${n.apellido.charAt(2)}.`
                        : n.nombre}
                    </td>

                    <td
                      style={{
                        backgroundColor: asignacionExistente
                          ? grupoColors[asignacionExistente.grupo.nombre] ||
                            "transparent"
                          : "transparent",
                      }}
                    >
                      <select
                        className="GruposAdmin-input-select"
                        value={asignacionExistente?.grupo_id || ""}
                        onChange={async (e) => {
                          const grupoId = Number(e.target.value);
                          const categoria = asignacionExistente?.categoria;
                          await handleAsignacionChange(
                            n.id,
                            grupoId,
                            categoria
                          );
                        }}
                      >
                        <option value="">Sin grupo</option>
                        {grupos.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td
                      style={{
                        backgroundColor: asignacionExistente?.categoria
                          ? categoriaColors[asignacionExistente.categoria]
                          : "transparent",
                      }}
                    >
                      <select
                        className="GruposAdmin-input-select"
                        value={asignacionExistente?.categoria || ""}
                        onChange={async (e) => {
                          const categoria = e.target
                            .value as NadadoraGrupo["categoria"];
                          const grupoId = asignacionExistente?.grupo_id || null;
                          if (grupoId) {
                            await handleAsignacionChange(
                              n.id,
                              grupoId,
                              categoria
                            );
                          }
                        }}
                      >
                        <option value="">Sin categoría</option>
                        {categorias.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
