// src/pages/Juegos/MenuGeo.tsx
import { useState } from "react";
import Mapa from "./Mapa";
import Base from "./Base";
import GeoRecoleccion from "./GeoRecoleccion";

type ModoGeo = "menu" | "recolectar" | "torres" | "base" | "juego";

export default function MenuGeo() {
  const [modo, setModo] = useState<ModoGeo>("menu");

  return (
    <div>
      {modo === "menu" && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <h2>¿Qué quieres hacer?</h2>
          <button
            onClick={() => setModo("recolectar")}
            style={{ margin: "5px" }}
          >
            Recolectar recursos
          </button>
          {/* <button onClick={() => setModo("torres")} style={{ margin: "5px" }}>
            Crear/Mejorar torres
          </button> */}
          <button onClick={() => setModo("base")} style={{ margin: "5px" }}>
            Gestionar base y enemigos
          </button>
          <button onClick={() => setModo("juego")} style={{ margin: "5px" }}>
            Juego
          </button>
        </div>
      )}

      {modo === "recolectar" && (
        <div>
          <Mapa />
          <button onClick={() => setModo("menu")} style={{ marginTop: "10px" }}>
            Volver al menú
          </button>
        </div>
      )}

      {/* {modo === "torres" && (
        <div>
          <Mapa modoInicial="torres" />
          <button onClick={() => setModo("menu")} style={{ marginTop: "10px" }}>
            Volver al menú
          </button>
        </div>
      )} */}

      {modo === "base" && (
        <div>
          <Base />
          <button onClick={() => setModo("menu")} style={{ marginTop: "10px" }}>
            Volver al menú
          </button>
        </div>
      )}
      {modo === "juego" && (
        <div>
          <GeoRecoleccion />
          <button onClick={() => setModo("menu")} style={{ marginTop: "10px" }}>
            Volver al menú
          </button>
        </div>
      )}
    </div>
  );
}
