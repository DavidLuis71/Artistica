"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import CoreografiaDialog from "./CoreografiaDialog";
import "./Coreografias.css";
import CoreografiaEsquemaDialog from "./CoreografiaEsquemaDialog";

interface NadadoraInfo {
  id: number;
  nombre: string;
  apellido: string;
}

interface CoreografiaNadadora {
  rol: "Titular" | "Reserva";
  nadadoras: NadadoraInfo;
}
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
export interface Coreografia {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  tipo: string | null;
  musica: string | null;
  coreografia_nadadora?: CoreografiaNadadora[];
  movimientos?: Bloque[];
  archivo_audio?: string;
}
// function formatTime(seconds: number) {
//   if (!seconds || isNaN(seconds)) return "00:00";

//   const m = Math.floor(seconds / 60);
//   const s = Math.floor(seconds % 60);

//   return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
// }

export default function Coreografias() {
  const [coreografias, setCoreografias] = useState<Coreografia[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEsquemaOpen, setDialogEsquemaOpen] = useState(false);
  const [editando, setEditando] = useState<Coreografia | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCoreografias();
  }, []);

  async function fetchCoreografias() {
    setLoading(true);
    const { data, error } = await supabase
      .from("coreografias")
      .select(
        `
        *,
        coreografia_nadadora (
          rol,
          nadadoras (
            id,
            nombre,
            apellido
          )
        )
      `,
      )
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error al cargar coreografías:", error);
    } else {
      setCoreografias(
        (data || []).map((c) => ({
          ...c,
          movimientos: Array.isArray(c.movimientos) ? c.movimientos : [],
        })),
      );
    }
    setLoading(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Seguro que deseas eliminar esta coreografía?")) return;

    const { error: relError } = await supabase
      .from("coreografia_nadadora")
      .delete()
      .eq("coreografia_id", id);

    if (relError) {
      console.error(relError);
      alert("Error al eliminar las relaciones de la coreografía.");
      return;
    }

    const { error } = await supabase.from("coreografias").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Error al eliminar la coreografía.");
    } else {
      fetchCoreografias();
    }
  }

  async function deleteMusic(coreografiaId: number) {
    if (!confirm("¿Seguro que quieres eliminar la música de esta coreografía?"))
      return;

    const nombreArchivo = `coreografia_${coreografiaId}`;

    // 1. Borrar del storage
    const { error: storageError } = await supabase.storage
      .from("coreografias_audio")
      .remove([nombreArchivo]);

    if (storageError) {
      alert("Error al eliminar el archivo de audio");
      console.error(storageError);
      return;
    }

    // 2. Borrar referencia en la BD
    const { error: dbError } = await supabase
      .from("coreografias")
      .update({ archivo_audio: null })
      .eq("id", coreografiaId);

    if (dbError) {
      alert("Error al actualizar la coreografía");
      console.error(dbError);
      return;
    }

    fetchCoreografias();
  }

  const filtered = coreografias.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="coreografias-container">
      <div className="coreografias-header">
        <h2 className="coreografias-title">Coreografías</h2>
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="coreografias-search"
        />
        <button
          className="coreografias-btn coreografias-btn-primary"
          onClick={() => {
            setEditando(null);
            setDialogOpen(true);
          }}
        >
          Crear
        </button>
      </div>

      <div className="coreografias-table-wrapper">
        {loading ? (
          <p className="coreografias-loading">Cargando coreografías...</p>
        ) : (
          <table className="coreografias-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Tipo</th>
                <th>Num</th>
                <th>Música</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre}</td>
                  <td>{c.categoria || "-"}</td>
                  <td>{c.tipo || "-"}</td>
                  <td>{c.coreografia_nadadora?.length || 0}</td>
                  <td>
                    {!c.archivo_audio ? (
                      <button
                        className="coreografias-btn coreografias-btn-musica"
                        onClick={() => uploadMusic(c.id)}
                      >
                        ➕ Añadir música
                      </button>
                    ) : (
                      <div className="audio-with-delete">
                        <CustomAudioPlayer src={c.archivo_audio} />
                        <button
                          className="coreografias-btn coreografias-btn-delete-music"
                          onClick={() => deleteMusic(c.id)}
                          title="Eliminar música"
                        >
                          ❌
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="coreografias-actions-wrapper">
                      <button
                        className="coreografias-btn coreografias-btn-view"
                        disabled={!c.movimientos || c.movimientos.length === 0}
                        onClick={() => {
                          if (!c.movimientos || c.movimientos.length === 0)
                            return;
                          setEditando(c);
                          setDialogEsquemaOpen(true);
                        }}
                      >
                        👁️
                      </button>
                      <button
                        className="coreografias-btn coreografias-btn-edit"
                        onClick={() => {
                          setEditando(c);
                          setDialogOpen(true);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="coreografias-btn coreografias-btn-delete"
                        onClick={() => handleDelete(c.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CoreografiaDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditando(null);
        }}
        onSave={fetchCoreografias}
        coreografia={editando}
      />
      <CoreografiaEsquemaDialog
        open={dialogEsquemaOpen}
        onClose={() => setDialogEsquemaOpen(false)}
        coreografia={editando}
      />
    </div>
  );

  // Subida de música
  async function uploadMusic(coreografiaId: number) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.onchange = async () => {
      if (!input.files?.[0]) return;
      const archivo = input.files[0];
      const nombreArchivo = `coreografia_${coreografiaId}`;

      const { error } = await supabase.storage
        .from("coreografias_audio")
        .upload(nombreArchivo, archivo, { upsert: true });

      if (error) {
        alert("Error al subir el audio");
        console.error(error);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("coreografias_audio")
        .getPublicUrl(nombreArchivo);

      const { error: updateError } = await supabase
        .from("coreografias")
        .update({ archivo_audio: publicUrl.publicUrl })
        .eq("id", coreografiaId);

      if (updateError) {
        alert("Error al actualizar la coreografía con el audio");
        console.error(updateError);
        return;
      }

      fetchCoreografias();
    };
    input.click();
  }
}

// Audio player simple para la tabla
function CustomAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(new Audio(src));
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;

    // Actualizamos duración cuando se carga el audio
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.pause();
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (playing) audio.pause();
    else audio.play();
    setPlaying(!playing);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    audio.currentTime = Number(e.target.value);
    setCurrentTime(audio.currentTime);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="audio-wrapper">
      <button className="play-btn" onClick={togglePlay}>
        {playing ? "⏸️" : "▶️"}
      </button>
      <input
        className="audio-seek"
        type="range"
        min={0}
        max={duration}
        step={0.1}
        value={currentTime}
        onChange={handleSeek}
      />
      <div className="audio-time">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
}
