import { useEffect, useRef } from "react";
import type { Coreografia } from "./Coreografias";
import "./CoreografiaEsquemaDialog.css";
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

interface Props {
  open: boolean;
  onClose: () => void;
  coreografia?: Coreografia | null;
}

export default function CoreografiaEsquemaDialog({
  open,
  onClose,
  coreografia,
}: Props) {
  const RADIO_PUNTO = 10;

  if (!open || !coreografia) return null;

  return (
    <div className="Esquema-Coreografias-Admin-overlay" onClick={onClose}>
      <div
        className="Esquema-Coreografias-Admin-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="Esquema-Coreografias-Admin-title">
          {coreografia.nombre || "Coreografía"}
        </h2>

        {coreografia.descripcion && (
          <p className="Esquema-Coreografias-Admin-descripcion">
            {coreografia.descripcion}
          </p>
        )}

        <div className="Esquema-Coreografias-Admin-bloques">
          {coreografia.movimientos?.map((bloque: Bloque, i) => (
            <div key={i} className="Esquema-Coreografias-Admin-bloque">
              {/* Lado izquierdo: tiempos y acciones */}
              <div className="Esquema-Coreografias-Admin-tiempos-acciones">
                <div className="Esquema-Coreografias-Admin-tiempos">
                  {bloque.tiempos.split("").map((t, j) => {
                    let bgColor = "#eee"; // default gris
                    let textColor = "#000"; // default negro

                    if (t === "1") {
                      bgColor = "#f4a261"; // naranja inicio
                      textColor = "#fff";
                    } else if (t === "8") {
                      bgColor = "#2a9d8f"; // azul final
                      textColor = "#fff";
                    }

                    return (
                      <span
                        key={j}
                        className="Esquema-Coreografias-Admin-tiempo"
                        style={{ backgroundColor: bgColor, color: textColor }}
                      >
                        {t}
                      </span>
                    );
                  })}
                </div>

                <ul className="Esquema-Coreografias-Admin-acciones">
                  {bloque.acciones.map((accion, j) => {
                    const nombres = accion.nadadoras?.map((id) => {
                      const nad = coreografia.coreografia_nadadora?.find(
                        (n) => n.nadadoras.id === id
                      );
                      return nad ? nad.nadadoras.nombre : id; // si no encuentra, deja el id
                    });
                    return (
                      <li key={j}>
                        {accion.movimiento}{" "}
                        {nombres && nombres.length > 0
                          ? `(Nadadoras: ${nombres.join(", ")})`
                          : ""}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Lado derecho: formación */}
              {bloque.formacion && (
                <BlockCanvasFormacion
                  formacion={bloque.formacion}
                  coreografia={coreografia}
                  radio={RADIO_PUNTO}
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
  radio: number;
}

function BlockCanvasFormacion({
  formacion,
  coreografia,
  radio,
}: BlockCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (formacion.length === 0) return;

    const xs = formacion.map((p) => p.x);
    const ys = formacion.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padding = 20;
    const width = maxX - minX || 100;
    const height = maxY - minY || 100;

    canvas.width = width + padding * 2;
    canvas.height = height + padding * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = (canvas.width - padding * 2) / (maxX - minX || 1);
    const scaleY = (canvas.height - padding * 2) / (maxY - minY || 1);

    formacion.forEach((p) => {
      const x = padding + (p.x - minX) * scaleX;
      const y = padding + (p.y - minY) * scaleY;

      ctx.beginPath();
      ctx.arc(x, y, radio, 0, Math.PI * 2);
      ctx.fillStyle = p.nadadoraId ? "green" : "blue";
      ctx.fill();
      ctx.stroke();

      if (p.nadadoraId && coreografia.coreografia_nadadora) {
        const nad = coreografia.coreografia_nadadora.find(
          (n) => n.nadadoras.id === p.nadadoraId
        );
        if (nad) {
          ctx.fillStyle = "black";
          ctx.font = "10px Arial";
          ctx.textAlign = "center";
          ctx.fillText(nad.nadadoras.nombre, x, y - radio - 2);
        }
      }
    });
  }, [formacion, coreografia, radio]);

  return (
    <canvas className="Esquema-Coreografias-Admin-canvas" ref={canvasRef} />
  );
}
