import { useRef, useEffect, useState } from "react";

export interface PuntoFormacion {
  x: number;
  y: number;
  nadadoraId: number | null;
}

interface FormacionEditorProps {
  formacion: PuntoFormacion[];
  onChange: (puntos: PuntoFormacion[]) => void;
  nadadoras: { id: number; nombre: string }[]; // lista de nadadoras disponibles
}

export default function FormacionEditor({
  formacion,
  onChange,
  nadadoras,
}: FormacionEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [puntos, setPuntos] = useState<PuntoFormacion[]>(formacion || []);
  const [modo, setModo] = useState<"pintar" | "borrar" | "asignarNadadora">(
    "pintar"
  );
  const [nadadoraSeleccionada, setNadadoraSeleccionada] = useState<
    number | null
  >(null);
  const RADIO_PUNTO = 10;

  // 🔹 Redibujar puntos
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    puntos.forEach((p) => {
      // Color del punto
      ctx.beginPath();
      ctx.arc(p.x, p.y, RADIO_PUNTO, 0, Math.PI * 2);
      ctx.fillStyle = p.nadadoraId !== null ? "green" : "blue";
      ctx.fill();
      ctx.stroke();

      // Nombre de la nadadora si existe
      if (p.nadadoraId !== null) {
        const nadadora = nadadoras.find((n) => n.id === p.nadadoraId);
        if (nadadora) {
          ctx.font = "12px Arial";
          ctx.fillStyle = "#000";
          ctx.textAlign = "center";
          ctx.fillText(nadadora.nombre, p.x, p.y - RADIO_PUNTO - 4);
        }
      }
    });
  }, [puntos, nadadoras]);

  // 🔹 Actualizar puntos si cambian las props
  useEffect(() => {
    setPuntos(formacion || []);
  }, [formacion]);

  // 🔹 Obtener coordenadas
  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX: number;
    let clientY: number;

    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else return null;

    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  // 🔹 Añadir / borrar / asignar nadadora
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoords(e);
    if (!coords) return;

    if (modo === "borrar") {
      const index = puntos.findIndex(
        (p) => Math.hypot(p.x - coords.x, p.y - coords.y) <= RADIO_PUNTO
      );
      if (index >= 0) {
        setPuntos((prev) => {
          const newPoints = [...prev];
          newPoints.splice(index, 1);
          onChange(newPoints);
          return newPoints;
        });
      }
    } else if (modo === "asignarNadadora") {
      if (nadadoraSeleccionada === null) return;
      const index = puntos.findIndex(
        (p) => Math.hypot(p.x - coords.x, p.y - coords.y) <= RADIO_PUNTO
      );
      if (index >= 0) {
        setPuntos((prev) => {
          const newPoints = [...prev];
          newPoints[index].nadadoraId = nadadoraSeleccionada;
          onChange(newPoints);
          return newPoints;
        });
      }
    } else {
      // pintar
      setPuntos((prev) => {
        const newPoints = [
          ...prev,
          { x: coords.x, y: coords.y, nadadoraId: null },
        ];
        onChange(newPoints);
        return newPoints;
      });
    }
  };
  // 🔹 Nadadoras disponibles (no asignadas aún)
  const nadadorasDisponibles = nadadoras.filter(
    (n) => !puntos.some((p) => p.nadadoraId === n.id)
  );
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => setModo("pintar")}
          style={{
            backgroundColor: modo === "pintar" ? "#2a9d8f" : "#ccc",
            color: "white",
            marginRight: 5,
          }}
        >
          🎨 Pintar
        </button>
        <button
          onClick={() => setModo("borrar")}
          style={{
            backgroundColor: modo === "borrar" ? "#e63946" : "#ccc",
            color: "white",
            marginRight: 5,
          }}
        >
          ❌ Borrar
        </button>
        <button
          onClick={() => setModo("asignarNadadora")}
          style={{
            backgroundColor: modo === "asignarNadadora" ? "#f4a261" : "#ccc",
            color: "white",
          }}
        >
          🙋‍♀️ Asignar Nadadora
        </button>
      </div>

      {modo === "asignarNadadora" && (
        <select
          value={nadadoraSeleccionada || ""}
          onChange={(e) => setNadadoraSeleccionada(Number(e.target.value))}
          style={{ marginBottom: 8 }}
        >
          <option value="">-- Selecciona nadadora --</option>
          {nadadorasDisponibles.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre}
            </option>
          ))}
        </select>
      )}

      <canvas
        ref={canvasRef}
        width={320}
        height={320}
        onClick={handleClick}
        onTouchStart={handleClick}
        style={{ border: "1px solid #ccc", touchAction: "none" }}
      />

      <p style={{ fontSize: "12px", color: "#555" }}>
        Modo actual: {modo}. Haz click para{" "}
        {modo === "pintar"
          ? "añadir"
          : modo === "borrar"
          ? "borrar"
          : "asignar una nadadora"}{" "}
        puntos.
      </p>
    </div>
  );
}
