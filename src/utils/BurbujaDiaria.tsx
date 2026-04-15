import { useEffect, useState } from "react";

interface BurbujaProps {
  onClick: () => void; // función para sumar puntos
}

export default function BurbujaDiaria({ onClick }: BurbujaProps) {
  const [visible, setVisible] = useState(false);
  const [explota, setExplota] = useState(false);
  const [showPlus, setShowPlus] = useState(false);

  const hoyStr = new Date().toISOString().split("T")[0];
  const [posicion] = useState({
    left: Math.random() * 80 + 10, // entre 10% y 90%
    top: Math.random() * 60 + 10, // entre 10% y 70%
  });

  useEffect(() => {
    // Comprobar si ya se ha explotado la burbuja hoy
    const explotadaHoy = localStorage.getItem("burbujaDiaria");
    if (explotadaHoy !== hoyStr) {
      setVisible(true);
    }
  }, []);

  const handleClick = () => {
    setExplota(true);
    setShowPlus(true);
    localStorage.setItem("burbujaDiaria", hoyStr);
    onClick(); //suma 1 punto

    // Desaparece burbuja tras la animación
    setTimeout(() => setVisible(false), 400);

    // Ocultar +1 después de animación
    setTimeout(() => setShowPlus(false), 1000);
  };

  if (!visible) return null;

  return (
    <>
      <div
        onClick={handleClick}
        style={{
          position: "fixed",
          left: `${posicion.left}%`,
          top: `${posicion.top}%`,
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #72f6ffb4, #0396ffb0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#000000",
          fontWeight: "bold",
          fontSize: "1.2rem",
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: "0 0 12px rgba(0,0,0,0.3)",
          animation: "float 4s ease-in-out infinite alternate",
          userSelect: "none",
          transform: explota ? "scale(2) rotate(20deg)" : "scale(1)",
          opacity: explota ? 0 : 1,
          transition: "transform 0.4s ease, opacity 0.4s ease",
        }}
      >
        1
      </div>

      {showPlus && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            top: "200px", // ajustar según la posición de tus puntos
            transform: "translateX(-50%)",
            color: "#000000",
            fontWeight: "bold",
            fontSize: "1.5rem",
            opacity: 1,
            animation: "subePlus 1s forwards",
            pointerEvents: "none",
            zIndex: 10000,
          }}
        >
          +1
        </div>
      )}

      <style>
        {`
        @keyframes float {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-20px); }
        }
        @keyframes subePlus {
          0% { transform: translateX(-50%) translateY(0); opacity: 1; }
          100% { transform: translateX(-50%) translateY(-50px); opacity: 0; }
        }
      `}
      </style>
    </>
  );
}
