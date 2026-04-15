import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./AsignarRetosAdmin.css";
import AutocompleteSimple from "../../utils/AutocompleteSimple";

interface Nadadora {
  id: number;
  nombre: string;
  apellido: string;
}

interface Reto {
  id: number;
  nombre: string;
  descripcion: string;
  dificultad: string;
  puntos: number;
}

export default function AsignarRetosAdmin() {
  const [nadadoras, setNadadoras] = useState<Nadadora[]>([]);
  const [retos, setRetos] = useState<Reto[]>([]);
  const [nadadoraSeleccionada, setNadadoraSeleccionada] = useState<
    number | null
  >(null);
  const [retoSeleccionado, setRetoSeleccionado] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [retosAsignados, setRetosAsignados] = useState<number[]>([]);

  useEffect(() => {
    cargarNadadoras();
    cargarRetos();
  }, []);

  useEffect(() => {
    if (nadadoraSeleccionada) cargarRetosAsignados(nadadoraSeleccionada);
    else setRetosAsignados([]);
  }, [nadadoraSeleccionada]);

  async function cargarRetosAsignados(nadadoraId: number) {
    const { data } = await supabase
      .from("nadadoras_retos")
      .select("reto_id")
      .eq("nadadora_id", nadadoraId)
      .eq("cumplido", true); // solo los completados

    setRetosAsignados(data?.map((r: any) => Number(r.reto_id)) || []);
  }

  useEffect(() => {
    cargarNadadoras();
    cargarRetos();
  }, []);

  async function cargarNadadoras() {
    const { data } = await supabase
      .from("nadadoras")
      .select("id, nombre, apellido")
      .order("nombre", { ascending: true });
    setNadadoras(data || []);
  }

  async function cargarRetos() {
    const { data } = await supabase
      .from("retos")
      .select("*")
      .order("dificultad", { ascending: true });

    setRetos(data || []);
  }

  async function asignarReto() {
    if (!nadadoraSeleccionada || !retoSeleccionado) {
      setMensaje("Selecciona una nadadora y un reto.");
      return;
    }

    setCargando(true);
    setMensaje(null);
    // 🔎 Primero obtenemos los puntos del reto seleccionado
    const reto = retos.find((r) => r.id === retoSeleccionado);
    const puntos = reto ? reto.puntos : 0;

    const { error } = await supabase.from("nadadoras_retos").insert({
      nadadora_id: nadadoraSeleccionada,
      reto_id: retoSeleccionado,
      cumplido: true, // ✅ Lo marcamos como completado directamente
      fecha_cumplido: new Date().toISOString(),
      puntos_otorgados: puntos,
    });

    setCargando(false);

    if (error) {
      console.error(error);
      setMensaje("Hubo un error al asignar el reto.");
    } else {
      setMensaje("✅ Reto asignado correctamente.");
      setRetoSeleccionado(null);
    }
  }

  return (
    <div className="AsignarRetosAdmin-container">
      <h2 className="AsignarRetosAdmin-title">Asignar retos a nadadoras</h2>

      <div className="AsignarRetosAdmin-form">
        <div className="AsignarRetosAdmin-selectGroup">
          <label>Nadadora:</label>
          <AutocompleteSimple
            options={nadadoras.map((ng) => ({
              id: ng.id, // ✅ ESTE es el que necesitas para guardar el tiempo
              label: `${ng.nombre} ${ng.apellido} `,
            }))}
            value={nadadoraSeleccionada}
            onChange={(value) => setNadadoraSeleccionada(value ?? null)}
            placeholder="Buscar nadadora..."
          />
        </div>

        <div className="AsignarRetosAdmin-selectGroup">
          <label>Reto:</label>

          <div className="AsignarRetosAdmin-retosGrid">
            {retos.map((r) => {
              const selected = r.id === retoSeleccionado;
              const asignado = retosAsignados.includes(r.id);

              return (
                <div
                  key={r.id}
                  className={`AsignarRetosAdmin-retoCard ${
                    selected ? "selected" : ""
                  } ${asignado ? "asignado" : ""}`}
                  onClick={() => !asignado && setRetoSeleccionado(r.id)}
                >
                  {asignado && (
                    <div className="AsignarRetosAdmin-completado">
                      COMPLETADO
                    </div>
                  )}
                  <h4 className="AsignarRetosAdmin-retoNombre">{r.nombre}</h4>
                  <p className="AsignarRetosAdmin-retoDesc">{r.descripcion}</p>

                  <div className="AsignarRetosAdmin-retoFooter">
                    <span
                      className={`AsignarRetosAdmin-dificultad dif-${r.dificultad}`}
                    >
                      {r.dificultad}
                    </span>
                    <span className="AsignarRetosAdmin-puntos">
                      {r.puntos} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          className="AsignarRetosAdmin-button"
          onClick={asignarReto}
          disabled={cargando}
        >
          {cargando ? "Asignando..." : "Asignar reto"}
        </button>

        {mensaje && <p className="AsignarRetosAdmin-mensaje">{mensaje}</p>}
      </div>
    </div>
  );
}
