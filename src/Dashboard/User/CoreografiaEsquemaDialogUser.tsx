// CoreografiaEsquemaDialogUser.tsx
import { useRef, useEffect, useState } from "react";

import "../Admin/CoreografiaEsquemaDialog.css";
import { supabase } from "../../lib/supabaseClient";

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
}
interface Movimiento {
  numeroDeOchos: number;
  tiempos: string;
  acciones: { movimiento: string; nadadoras: number[] | null }[];
  formacion?: { x: number; y: number; nadadoraId: number | null }[];
}
interface Nadadora {
  id: number;
  nombre: string;
}

interface Props {
  coreografia: Coreografia;
  open: boolean;
  onClose: () => void;
  nadadoraIdActual: number;
}

export default function CoreografiaEsquemaDialogUser({
  coreografia,
  open,
  onClose,
  nadadoraIdActual,
}: Props) {
  console.log("🚀 ~ nadadoraIdActual:", nadadoraIdActual);
  const [nadadoras, setNadadoras] = useState<Nadadora[]>([]);
  const RADIO_PUNTO = 10;

  useEffect(() => {
    if (!open) return;

    async function fetchNadadoras() {
      const { data, error } = await supabase
        .from("coreografia_nadadora")
        .select(`nadadora_id, nadadoras(nombre)`)
        .eq("coreografia_id", coreografia.id);

      if (error || !data) return;

      setNadadoras(
        data.map((n: any) => ({
          id: n.nadadora_id,
          nombre: n.nadadoras.nombre,
        }))
      );
    }

    fetchNadadoras();
  }, [open, coreografia.id]);
  if (!open) return null;

  return (
    <div className="Esquema-Coreografias-Admin-overlay" onClick={onClose}>
      <div
        className="Esquema-Coreografias-Admin-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="Esquema-Coreografias-Admin-title">
          {coreografia.nombre}
        </h2>

        {coreografia.descripcion && (
          <p className="Esquema-Coreografias-Admin-descripcion">
            {coreografia.descripcion}
          </p>
        )}

        <div className="Esquema-Coreografias-Admin-bloques">
          {coreografia.movimientos?.map((bloque, i) => (
            <div key={i} className="Esquema-Coreografias-Admin-bloque">
              <div className="Esquema-Coreografias-Admin-tiempos-acciones">
                <div className="Esquema-Coreografias-Admin-tiempos">
                  {bloque.tiempos.split("").map((t, j) => (
                    <span key={j} className="Esquema-Coreografias-Admin-tiempo">
                      {t}
                    </span>
                  ))}
                </div>
                <ul className="Esquema-Coreografias-Admin-acciones">
                  {bloque.acciones.map((accion, j) => {
                    return (
                      <li
                        key={j}
                        style={{
                          color: accion.nadadoras?.includes(nadadoraIdActual)
                            ? "#FF6347"
                            : "black",
                        }}
                      >
                        {accion.movimiento}{" "}
                        {accion.nadadoras
                          ?.map(
                            (id) =>
                              nadadoras.find((n) => n.id === id)?.nombre || id
                          )
                          .join(", ")}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {bloque.formacion && (
                <BlockCanvasFormacion
                  formacion={bloque.formacion}
                  coreografia={coreografia}
                  nadadoras={nadadoras}
                  radio={RADIO_PUNTO}
                  nadadoraIdActual={nadadoraIdActual}
                />
              )}
            </div>
          ))}
        </div>

        <div className="Esquema-Coreografias-Admin-actions">
          <button onClick={onClose} className="Esquema-Coreografias-Admin-btn">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

interface BlockCanvasProps {
  formacion: { x: number; y: number; nadadoraId: number | null }[];
  coreografia: Coreografia;
  nadadoras: Nadadora[];
  radio: number;
  nadadoraIdActual: number;
}

function BlockCanvasFormacion({
  formacion,
  coreografia,
  nadadoras,
  radio,
  nadadoraIdActual,
}: BlockCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!formacion.length) return;

    // Crear un mapa de id -> nombre
    const nadadorasMap = new Map<number, string>();
    coreografia.coreografia_nadadora?.forEach((n) => {
      if (n.nadadoras?.id && n.nadadoras.nombre) {
        nadadorasMap.set(n.nadadoras.id, n.nadadoras.nombre);
      }
    });

    const xs = formacion.map((p) => p.x);
    const ys = formacion.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padding = 20;
    canvas.width = maxX - minX + padding * 2;
    canvas.height = maxY - minY + padding * 2;

    const scaleX = (canvas.width - padding * 2) / (maxX - minX || 1);
    const scaleY = (canvas.height - padding * 2) / (maxY - minY || 1);

    formacion.forEach((p) => {
      const x = padding + (p.x - minX) * scaleX;
      const y = padding + (p.y - minY) * scaleY;

      ctx.beginPath();
      ctx.arc(x, y, radio, 0, Math.PI * 2);
      console.log("🚀 ~ p.nadadoraId", p.nadadoraId);

      if (p.nadadoraId !== null && p.nadadoraId !== undefined) {
        console.log("aqui");
        ctx.fillStyle =
          Number(p.nadadoraId) === Number(nadadoraIdActual)
            ? "#FF6347"
            : "green";
      } else {
        ctx.fillStyle = "blue"; // puntos vacíos
      }

      ctx.fill();
      ctx.stroke();

      // Dibujar el nombre si existe
      if (p.nadadoraId) {
        const nad = nadadoras.find((n) => n.id === p.nadadoraId);
        if (nad) {
          ctx.fillStyle = "black";
          ctx.font = "10px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(nad.nombre, x, y - radio - 2);
        }
      }
    });
  }, [formacion, coreografia, radio, nadadoras, nadadoraIdActual]);

  return (
    <canvas ref={canvasRef} className="Esquema-Coreografias-Admin-canvas" />
  );
}
