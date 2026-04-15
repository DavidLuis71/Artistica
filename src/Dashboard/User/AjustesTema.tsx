import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./AjustesTema.css";

interface Config {
  color_header: string;
  color_texto_header: string;
  color_fondo_dashboard: string;
  color_menu_lateral: string;
  color_menu_activo: string;
  inicio_default: string;
}

const VALORES_PREDETERMINADOS: Config = {
  color_header: "#6db1ff",
  color_texto_header: "#ffffff",
  color_fondo_dashboard: "#a2d2ff",
  color_menu_lateral: "#f5f5f5",
  color_menu_activo: "#e4edff",
  inicio_default: "inicio2",
};

export default function AjustesTema({
  userId,
  onCambioInicio,
}: {
  userId: string;
  onCambioInicio?: (inicio: string) => void;
}) {
  const [config, setConfig] = useState<Config>(VALORES_PREDETERMINADOS);
  console.log("🚀 ~ config:", config);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargar() {
      if (!userId) return;

      const { data: cfg } = await supabase
        .from("config_usuarios")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (cfg) {
        setConfig(cfg);
        aplicarCSS(cfg);
      }

      setCargando(false);
    }
    cargar();
  }, [userId]);

  function aplicarCSS(cfg: Config) {
    for (const [key, value] of Object.entries(cfg)) {
      document.documentElement.style.setProperty(
        `--${key.replace(/_/g, "-")}`,
        value,
      );
    }
  }

  function cambiarColor(campo: keyof Config, valor: string) {
    const nueva = { ...config, [campo]: valor };
    setConfig(nueva);
    aplicarCSS(nueva);
  }

  async function guardarCambios() {
    setGuardando(true);

    await supabase.from("config_usuarios").update(config).eq("user_id", userId);

    setGuardando(false);
  }

  async function restaurarPredeterminados() {
    setConfig(VALORES_PREDETERMINADOS);
    aplicarCSS(VALORES_PREDETERMINADOS);

    setGuardando(true);

    await supabase
      .from("config_usuarios")
      .update(VALORES_PREDETERMINADOS)
      .eq("user_id", userId);

    setGuardando(false);
  }

  if (cargando) return <p>Cargando configuración...</p>;

  return (
    <div className="AjustesTema-User-container">
      <h2 className="AjustesTema-User-title">🎨 Ajustes de Tema</h2>
      <p>Personaliza cómo ves la aplicación.</p>

      <div className="AjustesTema-User-grid">
        {[
          ["color_header", "Color del Header"],
          ["color_texto_header", "Texto del Header"],
          ["color_fondo_dashboard", "Fondo del Dashboard"],
          ["color_menu_lateral", "Menú Lateral"],
          ["color_menu_activo", "Opción Activa"],
        ].map(([campo, label]) => (
          <div key={campo} className="AjustesTema-User-item">
            <label>{label}</label>
            <input
              type="color"
              value={(config as any)[campo]}
              onChange={(e) =>
                cambiarColor(campo as keyof Config, e.target.value)
              }
              className="AjustesTema-User-colorInput"
            />
          </div>
        ))}
        <h3>Estilo de panel principal</h3>
        <div className="AjustesTema-User-item">
          {/* <label>Estilo de panel principal</label> */}
          <select
            value={config.inicio_default}
            onChange={async (e) => {
              const nuevoInicio = e.target.value;
              const nuevaConfig = { ...config, inicio_default: nuevoInicio };

              setConfig(nuevaConfig);

              // 🔥 Avisar al Dashboard en tiempo real
              if (onCambioInicio) {
                onCambioInicio(nuevoInicio);
              }

              // 🔥 Guardar en BD
              try {
                await supabase
                  .from("config_usuarios")
                  .update({ inicio_default: nuevoInicio })
                  .eq("user_id", userId);
              } catch (error) {
                console.error("Error actualizando inicio_default:", error);
              }
            }}
            className="AjustesTema-User-select"
          >
            <option value="inicio">Inicio clásico</option>
            <option value="inicio2">Inicio avanzado</option>
          </select>
        </div>
      </div>

      <button
        onClick={guardarCambios}
        disabled={guardando}
        className="AjustesTema-User-btnGuardar"
      >
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>

      <button
        onClick={restaurarPredeterminados}
        className="AjustesTema-User-btnReset"
      >
        Restablecer valores predeterminados
      </button>
    </div>
  );
}
