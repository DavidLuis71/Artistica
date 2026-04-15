// CoreografiasUser.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import CoreografiaEsquemaDialogUser from "./CoreografiaEsquemaDialogUser";
import "./CoreografiasUser.css";

interface Coreografia {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  tipo: string;
  musica: string;
  rol: "Titular" | "Reserva";
  movimientos?: Movimiento[];
  coreografia_nadadora?: { nadadoras: { id: number; nombre: string } }[];
  archivo_audio?: string;
}

interface Movimiento {
  numeroDeOchos: number;
  tiempos: string;
  acciones: { movimiento: string; nadadoras: number[] | null }[];
  formacion?: { x: number; y: number; nadadoraId: number | null }[];
}

interface Props {
  userId: string;
}

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return "00:00";

  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);

  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function CoreografiasUser({ userId }: Props) {
  const [coreografias, setCoreografias] = useState<Coreografia[]>([]);
  const [nadadoraId, setNadadoraId] = useState<number>(0);
  const [dialogCoreografia, setDialogCoreografia] =
    useState<Coreografia | null>(null);
  useEffect(() => {
    async function fetchDatos() {
      const { data: nadadoraData } = await supabase
        .from("nadadoras")
        .select("id")
        .eq("user_id", userId)
        .single();
      if (!nadadoraData) return;
      const nadadoraId = nadadoraData.id;
      setNadadoraId(nadadoraData.id);

      const { data, error } = await supabase
        .from("coreografia_nadadora")
        .select(
          `
        rol,
        coreografias(id, nombre, descripcion, categoria, tipo, musica, movimientos, archivo_audio)
      `,
        )
        .eq("nadadora_id", nadadoraId);

      if (error || !data) return;

      const coreosMapeadas = data
        .map((r: any) => ({
          id: r.coreografias.id,
          nombre: r.coreografias.nombre,
          descripcion: r.coreografias.descripcion,
          categoria: r.coreografias.categoria,
          tipo: r.coreografias.tipo,
          musica: r.coreografias.musica,
          rol: r.rol,
          movimientos: r.coreografias.movimientos || [],
          coreografia_nadadora: r.coreografias.coreografia_nadadora || [],
          archivo_audio: r.coreografias.archivo_audio,
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

      setCoreografias(coreosMapeadas);
    }

    fetchDatos();
  }, [userId]);

  return (
    <div className="Coreografias-User-container">
      {coreografias.length === 0 && <p>No tienes coreografías asignadas.</p>}

      <div className="Coreografias-User-grid">
        {coreografias.map((c) => (
          <div
            key={c.id}
            className={`Coreografias-User-card ${
              c.rol === "Titular"
                ? "Coreografias-User-card-titular"
                : "Coreografias-User-card-reserva"
            }`}
          >
            <h3 className="Coreografias-User-NombreCoreografia">{c.nombre}</h3>
            <p>
              <strong>Rol:</strong> {c.rol}
            </p>
            <p>
              <strong>Categoría:</strong> {c.categoria} | <strong>Tipo:</strong>{" "}
              {c.tipo}
            </p>

            {c.musica && (
              <p>
                <strong>Música:</strong> {c.musica}
              </p>
            )}
            {/* {c.archivo_audio && (
              <div className="Coreografias-User-AudioPlayer">
                <audio controls src={`${c.archivo_audio}?v=${Date.now()}`}>
                  Tu navegador no soporta el reproductor de audio.
                </audio>
              </div>
            )} */}
            {c.archivo_audio && (
              <CustomAudioPlayer src={`${c.archivo_audio}?v=${Date.now()}`} />
            )}

            {c.descripcion && (
              <p>
                <strong>Descripción:</strong> {c.descripcion}
              </p>
            )}

            {c.movimientos && c.movimientos.length > 0 && (
              <button
                onClick={() => setDialogCoreografia(c)}
                className="Coreografias-User-botonEsquema"
              >
                Ver esquema
              </button>
            )}
          </div>
        ))}
      </div>

      {dialogCoreografia && (
        <CoreografiaEsquemaDialogUser
          coreografia={dialogCoreografia}
          open={!!dialogCoreografia}
          onClose={() => setDialogCoreografia(null)}
          nadadoraIdActual={nadadoraId}
        />
      )}
    </div>
  );
}

function CustomAudioPlayer({ src }: { src: string }) {
  const [audio] = useState<HTMLAudioElement>(new Audio(src));
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const updateProgress = () => setProgress(audio.currentTime);

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("timeupdate", updateProgress);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", updateProgress);
    };
  }, [audio]);

  const togglePlay = () => {
    if (playing) audio.pause();
    else audio.play();

    setPlaying(!playing);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    audio.currentTime = newTime;
    setProgress(newTime);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = src;
    link.download = "audio_coreografia.mp3";
    link.click();
    // setMenuOpen(false);
  };
  //los classname estan en coreografias.css en admin
  return (
    <div className="audio-wrapper">
      {/* Play / Pause */}
      <button className="play-btn" onClick={togglePlay}>
        {playing ? "⏸" : "▶️"}
      </button>

      {/* Slider */}
      <input
        className="audio-seek"
        type="range"
        min={0}
        max={duration || 1}
        value={progress}
        onChange={handleSeek}
      />

      {/* Time */}
      <span className="audio-time">
        {formatTime(progress)} / {formatTime(duration)}
      </span>

      {/* Three dots menu */}
      <div className="audio-menu-container">
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          ⋮
        </button>

        {menuOpen && (
          <div className="audio-menu">
            <button onClick={handleDownload}>⬇️ Descargar audio</button>
          </div>
        )}
      </div>
    </div>
  );
}
