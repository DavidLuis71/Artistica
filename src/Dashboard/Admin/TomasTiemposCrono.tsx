import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import AutocompleteMultiple from "../../utils/AutocompleteMultiple";
import "./TomasTiemposCronos.css";

interface Nadadora {
  id: number;
  nombre: string;
  apellido: string;
  grupo_id: number; // 🔹 nuevo
  categoria: "Alevin1" | "Alevin2" | "Infantil" | "Junior"; // 🔹 nueva
  tiempo?: string;
  parada: boolean;
}

export default function TomasTiemposCrono() {
  const [nadadorasDB, setNadadorasDB] = useState<Nadadora[]>([]);
  const [serie, setSerie] = useState<number[]>([]);
  const [nadadorasSerie, setNadadorasSerie] = useState<Nadadora[]>([]);
  const [cronometro, setCronometro] = useState<number>(0);
  const [corriendo, setCorriendo] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);
  const [selectedPrueba, setSelectedPrueba] = useState<string>("");
  const [mostrarConfirmReset, setMostrarConfirmReset] = useState(false);

  const pruebas = [
    { id: "50m_libre", nombre: "50 Crol" },
    { id: "100m_libre", nombre: "100 Crol" },
    { id: "50m_kick", nombre: "50 Kick-Pull" },
    { id: "100_kick", nombre: "100 Kick-Pull" },
    { id: "200_estilos", nombre: "200 Estilos" },
  ];

  const fetchNadadoras = async () => {
    const { data, error } = await supabase.from("nadadora_grupos").select(
      `
      id,
      nadadora:nadadora_id (id, nombre, apellido),
      grupo_id,
      categoria
    `
    );

    if (error) return console.error("Error al cargar nadadoras:", error);

    setNadadorasDB(
      data.map((n: any) => ({
        id: n.nadadora.id,
        nombre: n.nadadora.nombre,
        apellido: n.nadadora.apellido,
        grupo_id: n.grupo_id,
        categoria: n.categoria,
        parada: false,
      }))
    );
  };

  useEffect(() => {
    fetchNadadoras();
  }, []);

  useEffect(() => {
    const seleccionadas = nadadorasDB
      .filter((n) => serie.includes(n.id))
      .map((n) => ({ ...n, parada: false, tiempo: undefined }));
    setNadadorasSerie(seleccionadas);
  }, [serie, nadadorasDB]);

  const toggleCronometro = () => {
    if (corriendo) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setCorriendo(false);
    } else {
      intervalRef.current = window.setInterval(() => {
        setCronometro((prev) => prev + 10);
      }, 10);
      setCorriendo(true);
    }
  };

  const formatTime = (ms: number) => {
    const minutos = Math.floor(ms / 60000);
    const segundos = Math.floor((ms % 60000) / 1000);
    const centesimas = Math.floor((ms % 1000) / 10);
    return `${minutos.toString().padStart(2, "0")}:${segundos
      .toString()
      .padStart(2, "0")}:${centesimas.toString().padStart(2, "0")}`;
  };

  const pararTiempo = (id: number) => {
    setNadadorasSerie((prev) =>
      prev.map((n) =>
        n.id === id && !n.parada
          ? { ...n, tiempo: formatTime(cronometro), parada: true }
          : n
      )
    );
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setCorriendo(false);
    setCronometro(0);
    setNadadorasSerie((prev) =>
      prev.map((n) => ({ ...n, tiempo: undefined, parada: false }))
    );
  };

  // 🔹 Función para guardar todos los tiempos de la serie
  const guardarTiemposSerie = async () => {
    if (!selectedPrueba) {
      alert("Debes seleccionar una prueba antes de guardar.");
      return;
    }

    const tiemposAInsertar = nadadorasSerie
      .filter((n) => n.tiempo)
      .map((n) => {
        const partes = n.tiempo!.split(":");
        const minutos = Number(partes[0]);
        const segundos = Number(partes[1]);
        const centesimas = Number(partes[2]);
        const tiempoTotalSegundos = minutos * 60 + segundos + centesimas / 100;
        return {
          nadadora_id: n.id,
          grupo_id: n.grupo_id,
          categoria: n.categoria,
          prueba: selectedPrueba,
          tiempo: tiempoTotalSegundos,
          fecha: new Date().toISOString().split("T")[0],
        };
      });

    if (tiemposAInsertar.length === 0) {
      alert("No hay tiempos para guardar.");
      return;
    }

    const { error } = await supabase.from("tiempos").insert(tiemposAInsertar);

    if (error) {
      console.error("Error guardando tiempos:", error);
      alert("Ocurrió un error al guardar los tiempos.");
    } else {
      alert("Tiempos guardados correctamente ✅");
    }
  };

  return (
    <div className="TomasTiemposCronos-Admin-wrapper">
      <h2 className="TomasTiemposCronos-Admin-title">Cronómetro</h2>

      <div className="TomasTiemposCronos-Admin-autocomplete">
        <AutocompleteMultiple
          options={nadadorasDB.map((n) => ({
            id: n.id,
            label: `${n.nombre} ${n.apellido}`,
          }))}
          value={serie}
          onChange={setSerie}
          placeholder="Selecciona nadadoras para la serie..."
        />
      </div>

      <div className="TomasTiemposCronos-Admin-cronometro">
        <strong>Cronómetro:</strong> {formatTime(cronometro)}
      </div>
      <div className="TomasTiemposCronos-Admin-prueba">
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
      </div>

      <div className="TomasTiemposCronos-Admin-buttons">
        <button
          className="TomasTiemposCronos-Admin-button"
          onClick={toggleCronometro}
        >
          {corriendo ? "Pausar" : "Iniciar"}
        </button>
        <button
          className="TomasTiemposCronos-Admin-button TomasTiemposCronos-Admin-button-reset"
          onClick={() => setMostrarConfirmReset(true)}
        >
          Reset
        </button>
      </div>

      <h3 className="TomasTiemposCronos-Admin-subtitle">
        Nadadoras de la serie
      </h3>
      <ul className="TomasTiemposCronos-Admin-list">
        {nadadorasSerie.map((n) => (
          <li key={n.id} className="TomasTiemposCronos-Admin-list-item">
            <span>
              {n.nombre} {n.apellido}
            </span>

            {n.tiempo ? (
              <span className="TomasTiemposCronos-Admin-tiempo">
                {n.tiempo}
              </span>
            ) : (
              <button
                className="TomasTiemposCronos-Admin-button"
                onClick={() => pararTiempo(n.id)}
              >
                Parar tiempo
              </button>
            )}
          </li>
        ))}
      </ul>
      <button
        className="TomasTiemposCronos-Admin-button TomasTiemposCronos-Admin-button-guardar"
        onClick={guardarTiemposSerie}
      >
        Guardar Tiempos
      </button>
      {mostrarConfirmReset && (
        <div className="TomasTiemposCronos-modal-overlay">
          <div className="TomasTiemposCronos-modal">
            <h3>¿Seguro que quieres reiniciar?</h3>
            <p>Se perderán todos los tiempos actuales.</p>

            <div className="TomasTiemposCronos-modal-buttons">
              <button
                onClick={() => {
                  reset();
                  setMostrarConfirmReset(false);
                }}
              >
                Sí, reiniciar
              </button>

              <button onClick={() => setMostrarConfirmReset(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
