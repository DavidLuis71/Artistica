import { useEffect, useState } from "react";
import "./SnowEffect.css";

export default function SnowEffect() {
  const [showSnow, setShowSnow] = useState(false);
  const [flakes, setFlakes] = useState<
    { left: number; duration: number; size: number }[]
  >([]);

  useEffect(() => {
    const month = new Date().getMonth(); // 0 = enero, 11 = diciembre
    if (month === 11 || month === 0) setShowSnow(true);
  }, []);

  useEffect(() => {
    if (!showSnow) return;

    // Crear copos con posiciones aleatorias
    const nuevosFlakes = Array.from({ length: 20 }).map(() => ({
      left: Math.random() * 100, // porcentaje horizontal
      duration: 7 + Math.random() * 7, // duración entre 5-10s
      size: 2 + Math.random() * 10, // tamaño entre 10px y 30px
    }));

    setFlakes(nuevosFlakes);
  }, [showSnow]);

  if (!showSnow) return null;

  return (
    <div className="snow-container">
      {flakes.map((flake, i) => (
        <div
          key={i}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            fontSize: `${flake.size}px`,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${Math.random() * 5}s`, // ❌ Aquí agregamos un retraso aleatorio
          }}
        >
          ❄️
        </div>
      ))}
    </div>
  );
}
