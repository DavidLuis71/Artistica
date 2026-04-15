// src/pages/TomasTiempos.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./TomasTiempos.css";
import AutocompleteSimple from "../../utils/AutocompleteSimple";

interface NadadoraGrupo {
  id: number;
  nadadora_id: number;
  grupo_id: number;
  categoria: "Alevin1" | "Alevin2" | "Infantil" | "Junior";
  nadadora: string;
  apellido: string;
  grupo: string;
}

interface Tiempo {
  id: number;
  nadadora_id: number;
  grupo_id: number;
  categoria: string;
  prueba: string;
  tiempo: number;
  nadadora: string;
  apellido: string;

  grupo: string;
  fecha: string;
}

interface Prueba {
  id: string;
  nombre: string;
}

const pruebas: Prueba[] = [
  { id: "50m_libre", nombre: "50 Crol" },
  { id: "100m_libre", nombre: "100 Crol" },
  { id: "50m_kick", nombre: "50 Kick-Pull" },
  { id: "100_kick", nombre: "100 Kick-Pull" },
  { id: "200_estilos", nombre: "200 Estilos" },
];
const formatearFecha = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export default function TomasTiempos() {
  const [nadadoraGrupos, setNadadoraGrupos] = useState<NadadoraGrupo[]>([]);
  const [selectedNadadoraGrupo, setSelectedNadadoraGrupo] = useState<
    number | ""
  >("");
  const [selectedPrueba, setSelectedPrueba] = useState<string>("");
  const [minutos, setMinutos] = useState<number>(0);
  const [segundos, setSegundos] = useState<number>(0);
  const [centesimas, setCentesimas] = useState<number>(0);

  const [resultados, setResultados] = useState<Tiempo[]>([]);
  const [filtroPrueba, setFiltroPrueba] = useState<string>("");
  const [filtroNadadora, setFiltroNadadora] = useState<number | "">("");
  const [fecha, setFecha] = useState<string>(
    new Date().toISOString().split("T")[0] // hoy por defecto
  );

  const [rankingAbierto, setRankingAbierto] = useState(false);
  const [rankingPrueba, setRankingPrueba] = useState<string | null>(null);

  const generarRanking = (prueba: string) => {
    const tiemposPrueba = resultados.filter((r) => r.prueba === prueba);

    const nadadorasMap: Record<
      number,
      { id: number; nombre: string; tiempos: Tiempo[] }
    > = {};

    tiemposPrueba.forEach((t) => {
      const nombre = `${t.nadadora} ${t.apellido?.slice(0, 3) ?? ""}`;
      if (!nadadorasMap[t.nadadora_id])
        nadadorasMap[t.nadadora_id] = {
          id: t.nadadora_id,
          nombre,
          tiempos: [],
        };
      nadadorasMap[t.nadadora_id].tiempos.push(t); // guardamos el objeto completo
    });

    return Object.values(nadadorasMap)
      .map((n) => {
        const tiempos = n.tiempos;

        const tiemposOrdenados = [...tiempos].sort(
          (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        );

        const nTomas = tiemposOrdenados.length;

        // Mejor tiempo histórico
        const mejor = Math.min(...tiemposOrdenados.map((t) => t.tiempo));

        // Último y anterior
        const ultimo = tiemposOrdenados[nTomas - 1].tiempo;
        const anterior =
          nTomas > 1 ? tiemposOrdenados[nTomas - 2].tiempo : null;

        // Tendencia REAL
        let tendencia = "➖";
        if (anterior !== null) {
          if (ultimo < anterior) tendencia = "📉 mejora";
          else if (ultimo > anterior) tendencia = "📈 peor";
          else tendencia = "➖ igual";
        }

        return { nombre: n.nombre, mejor, ultimo, nTomas, tendencia };
      })
      .sort((a, b) => a.mejor - b.mejor);
  };

  // 🔹 Cargar nadadoras y tiempos
  useEffect(() => {
    const fetchNadadoras = async () => {
      const { data, error } = await supabase.from("nadadora_grupos").select(`
        id,
        nadadora_id,
        grupo_id,
        categoria,
        nadadora:nadadora_id (id, nombre,apellido),
        grupo:grupo_id (id, nombre)
      `);
      if (error) console.error(error);
      else if (data) {
        const formatted = (data as any).map((ng: any) => ({
          id: ng.id,
          nadadora_id: ng.nadadora_id,
          grupo_id: ng.grupo_id,
          categoria: ng.categoria,
          nadadora: ng.nadadora.nombre, // 🔹 extraemos el primer objeto del array
          apellido: ng.nadadora.apellido,
          grupo: ng.grupo.nombre, // 🔹 idem
        }));

        setNadadoraGrupos(formatted);
      }
    };
    const fetchResultados = async () => {
      const { data, error } = await supabase.from("tiempos").select(`
        id,
        nadadora_id,
        grupo_id,
        categoria,
        prueba,
        tiempo,
        fecha,
        nadadora:nadadora_id(id, nombre, apellido),
        grupo:grupo_id(id, nombre)
      `);
      if (error) console.error(error);
      else if (data) {
        const formatted = (data as any).map((t: any) => ({
          ...t,
          nadadora: t.nadadora.nombre, // 🔹 extraemos el primer objeto del array
          apellido: t.nadadora.apellido,
          grupo: t.grupo.nombre, // 🔹 idem
        }));

        setResultados(formatted);
      }
    };

    fetchNadadoras();
    fetchResultados();
  }, []);

  const guardarTiempo = async () => {
    console.log(selectedNadadoraGrupo);
    if (
      selectedNadadoraGrupo === "" ||
      !selectedPrueba ||
      (minutos === 0 && segundos === 0 && centesimas === 0)
    ) {
      alert("Debes completar todos los campos y un tiempo válido.");
      return;
    }

    const tiempoTotal = minutos * 60 + segundos + centesimas / 100;
    const nadadoraGrupo = nadadoraGrupos.find(
      (ng) => ng.id === selectedNadadoraGrupo
    );
    if (!nadadoraGrupo) return;

    // 1️⃣ Insertar el tiempo
    const { error: insertError } = await supabase.from("tiempos").insert({
      nadadora_id: nadadoraGrupo.nadadora_id,
      grupo_id: nadadoraGrupo.grupo_id,
      categoria: nadadoraGrupo.categoria,
      prueba: selectedPrueba,
      tiempo: tiempoTotal,
      fecha: fecha,
    });

    if (insertError) {
      console.error(insertError);
      alert("Error guardando el tiempo.");
      return;
    }

    // 2️⃣ Llamar a la función PL/pgSQL para registrar logro si aplica
    const { error: logroError } = await supabase.rpc(
      "registrar_mejora_tiempo",
      {
        p_nadadora_id: nadadoraGrupo.nadadora_id,
        p_prueba: selectedPrueba,
        p_tiempo: tiempoTotal,
        p_fecha: fecha,
      }
    );

    if (logroError) {
      console.error(logroError);
      alert("Error al registrar logro.");
    } else {
      alert("Tiempo guardado correctamente ✅");
    }

    // 3️⃣ Limpiar formulario
    setSelectedNadadoraGrupo("");
    setSelectedPrueba("");
    setMinutos(0);
    setSegundos(0);
    setCentesimas(0);

    // 4️⃣ Recargar resultados
    const { data: tiemposData, error: tiemposError } = await supabase.from(
      "tiempos"
    ).select(`
      id,
      nadadora_id,
      grupo_id,
      categoria,
      prueba,
      tiempo,
      fecha,
      nadadora:nadadora_id(id, nombre),
      grupo:grupo_id(id, nombre)
    `);

    if (tiemposError) console.error(tiemposError);
    if (tiemposData) {
      const formatted = (tiemposData as any).map((t: any) => ({
        ...t,
        nadadora: t.nadadora.nombre,
        grupo: t.grupo.nombre,
      }));
      setResultados(formatted);
    }
  };

  // 🔹 Filtrar y ordenar resultados por tiempo ascendente
  const resultadosFiltrados = resultados
    .filter(
      (r) =>
        (!filtroPrueba || r.prueba === filtroPrueba) &&
        (!filtroNadadora || r.nadadora_id === filtroNadadora)
    )
    .sort((a, b) => a.tiempo - b.tiempo);
  const formatearTiempo = (tiempo: number) => {
    const minutos = Math.floor(tiempo / 60);
    const segundos = Math.floor(tiempo % 60);
    const centesimas = Math.floor((tiempo - Math.floor(tiempo)) * 100);

    const segundosStr = segundos.toString().padStart(2, "0");
    const centesimasStr = centesimas.toString().padStart(2, "0");

    return `${minutos}:${segundosStr}.${centesimasStr}`;
  };

  const resultadosPorPrueba = resultadosFiltrados.reduce((acc, r) => {
    if (!acc[r.prueba]) acc[r.prueba] = [];
    acc[r.prueba].push(r);
    return acc;
  }, {} as Record<string, Tiempo[]>);

  return (
    <div className="TomasTiempos-container">
      <h2>Registrar Tiempo</h2>

      <div className="TomasTiempos-form">
        <label>Nadadora:</label>
        <AutocompleteSimple
          options={nadadoraGrupos.map((ng) => ({
            id: ng.id, // ✅ ESTE es el que necesitas para guardar el tiempo
            label: `${ng.nadadora} ${ng.apellido}(${ng.grupo} - ${ng.categoria})`,
          }))}
          value={selectedNadadoraGrupo === "" ? null : selectedNadadoraGrupo}
          onChange={(id) => setSelectedNadadoraGrupo(id ?? "")}
          placeholder="Selecciona una nadadora"
        />

        <label>Fecha:</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />

        <label>Prueba:</label>
        <select
          value={selectedPrueba}
          onChange={(e) => setSelectedPrueba(e.target.value)}
        >
          <option value="">--Selecciona--</option>
          {pruebas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>

        <label>Tiempo:</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="number"
            className="tiempo-input-minutos"
            value={minutos}
            onChange={(e) => setMinutos(Number(e.target.value))}
            min={0}
            placeholder="min"
          />
          <input
            type="number"
            className="tiempo-input"
            value={segundos}
            onChange={(e) => setSegundos(Number(e.target.value))}
            min={0}
            max={59}
            placeholder="seg"
          />
          <input
            type="number"
            className="tiempo-input"
            value={centesimas}
            onChange={(e) => setCentesimas(Number(e.target.value))}
            min={0}
            max={99}
            placeholder="cs"
          />
        </div>

        <button className="TomasTiempos-btnGuardar" onClick={guardarTiempo}>
          Guardar Tiempo
        </button>
      </div>

      <h2>Resultados</h2>
      <div className="TomasTiempos-filtros">
        <label>Prueba:</label>
        <select
          value={filtroPrueba}
          onChange={(e) => setFiltroPrueba(e.target.value)}
        >
          <option value="">--Todas--</option>
          {pruebas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>

        <label>Nadadora:</label>
        <select
          value={filtroNadadora}
          onChange={(e) => setFiltroNadadora(Number(e.target.value))}
        >
          <option value="">--Todas--</option>
          {nadadoraGrupos.map((ng) => (
            <option key={ng.id} value={ng.nadadora_id}>
              {ng.nadadora}
            </option>
          ))}
        </select>
      </div>

      <div className="TomasTiempos-acordeon">
        {Object.entries(resultadosPorPrueba).map(([pruebaId, tiempos]) => {
          const pruebaNombre =
            pruebas.find((p) => p.id === pruebaId)?.nombre ?? pruebaId;

          return (
            <AcordeonItem
              key={pruebaId}
              titulo={pruebaNombre}
              contenidos={tiempos}
              formatearTiempo={formatearTiempo}
              formatearFecha={formatearFecha}
              abrirRanking={() => {
                setRankingPrueba(pruebaId);
                setRankingAbierto(true);
              }}
            />
          );
        })}
      </div>
      {rankingAbierto && rankingPrueba && (
        <div className="ranking-modal">
          <div className="ranking-content">
            <h3>Ranking: {rankingPrueba}</h3>
            <button
              className="close-btn"
              onClick={() => setRankingAbierto(false)}
            >
              ✖
            </button>
            <div className="ranking-table-container">
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>Nadadora</th>
                    <th>Mejor tiempo</th>
                    <th>Último tiempo</th>
                    <th>Nº tomas</th>
                    <th>Tendencia</th>
                  </tr>
                </thead>
                <tbody>
                  {generarRanking(rankingPrueba).map((r, i) => (
                    <tr key={i}>
                      <td>{r.nombre}</td>
                      <td>{formatearTiempo(r.mejor)}</td>
                      <td>{formatearTiempo(r.ultimo)}</td>
                      <td>{r.nTomas}</td>
                      <td>{r.tendencia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function AcordeonItem({
  titulo,
  contenidos,
  formatearTiempo,
  formatearFecha,
  abrirRanking,
}: {
  titulo: string;
  contenidos: Tiempo[];
  formatearTiempo: (t: number) => string;
  formatearFecha: (iso: string) => string;
  abrirRanking: () => void;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className={`acordeon-item ${abierto ? "open" : ""}`}>
      <div className="acordeon-header" onClick={() => setAbierto(!abierto)}>
        <span className="acordeon-title">{titulo}</span>
        <button
          className="btn-ranking"
          onClick={(e) => {
            e.stopPropagation();
            abrirRanking();
          }}
        >
          Ranking
        </button>
        <span className="acordeon-icon">{abierto ? "▲" : "▼"}</span>
      </div>

      <div className={`acordeon-body ${abierto ? "open" : ""}`}>
        {contenidos.map((c) => (
          <div className="acordeon-row" key={c.id}>
            <strong>
              {c.nadadora} {c.apellido?.slice(0, 3) ?? ""}
            </strong>
            <span>{formatearTiempo(c.tiempo)}</span>
            <span>{formatearFecha(c.fecha)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
