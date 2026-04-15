import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./EntrenamientosUser.css";

interface Sesion {
  id: number;
  dia_semana: string; // Lunes, Martes...
  descripcion: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_sesion: string; // Agua, Sala, Agua+Sala
  fecha: string;
  semana_id: number;
}
interface Vacacion {
  id: number;
  titulo: string;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion?: string;
}
interface Semana {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
}

interface Props {
  userId: string;
}
const tipoSesionColor: { [key: string]: string } = {
  Agua: "#3b82f6", // azul
  Sala: "#10b981", // verde
  "Agua+Sala": "#f59e0b", // naranja
};

const tipoSesionIcon: { [key: string]: string } = {
  Agua: "💧",
  Sala: "🏋️",
  "Agua+Sala": "💧🏋️",
};
const diasSemana = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

function soloFecha(fecha: string | Date) {
  const d = new Date(fecha);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function EntrenamientosUser({ userId }: Props) {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [semanaActual, setSemanaActual] = useState<Semana | null>(null);
  const [verSemanaSiguiente, setVerSemanaSiguiente] = useState(false);
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);

  useEffect(() => {
    async function fetchDatos() {
      // 1️⃣ Nadadora
      const { data: nadadoraData } = await supabase
        .from("nadadoras")
        .select("id, nombre")
        .eq("user_id", userId)
        .single();
      if (!nadadoraData) return;
      const nadadoraId = nadadoraData.id;

      // 2️⃣ Grupo
      const { data: nadadoraGrupos } = await supabase
        .from("nadadora_grupos")
        .select("grupo_id")
        .eq("nadadora_id", nadadoraId)
        .single();
      if (!nadadoraGrupos) return;
      const grupoActual = nadadoraGrupos.grupo_id;

      // 3️⃣ Semanas
      const { data: semanasData } = await supabase
        .from("semanas")
        .select("*")
        .order("fecha_inicio", { ascending: true });
      if (!semanasData) return;

      const hoy = soloFecha(new Date());

      let semanaMostrar: Semana | undefined;
      if (verSemanaSiguiente) {
        semanaMostrar = semanasData.find(
          (s) => soloFecha(s.fecha_inicio) > hoy,
        );
      } else {
        semanaMostrar = semanasData.find(
          (s) =>
            soloFecha(s.fecha_inicio) <= hoy && soloFecha(s.fecha_fin) >= hoy,
        );
      }
      if (!semanaMostrar) return;
      setSemanaActual(semanaMostrar);

      // 4️⃣ Sesiones
      const { data: sesionesSemana } = await supabase
        .from("sesiones_entrenamiento")
        .select("*")
        .eq("semana_id", semanaMostrar.id)
        .order("hora_inicio", { ascending: true });

      const sesionesFiltradas = sesionesSemana?.filter((s) => {
        if (grupoActual === 2) {
          return s.dia_semana !== "Martes" && s.dia_semana !== "Jueves";
        }
        return true;
      });

      setSesiones(sesionesFiltradas || []);

      // 5️⃣ Vacaciones de la semana
      const { data: vacacionesSemana } = await supabase
        .from("vacaciones")
        .select("*")
        .or(
          `fecha_inicio.lte.${semanaMostrar.fecha_fin},fecha_fin.gte.${semanaMostrar.fecha_inicio}`,
        )
        .order("fecha_inicio", { ascending: true });

      setVacaciones(vacacionesSemana || []);
    }

    fetchDatos();
  }, [userId, verSemanaSiguiente]);

  const hoy = new Date();
  const diaHoy = hoy.toLocaleDateString("es-ES", { weekday: "long" });

  // Convertir a capitalizado igual que tu array ["Lunes", "Martes"...]
  const diaHoyCapitalizado =
    diaHoy.charAt(0).toUpperCase() + diaHoy.slice(1).toLowerCase();

  // Solo marcar si es Lunes–Viernes
  const marcarDia =
    !verSemanaSiguiente && diasSemana.includes(diaHoyCapitalizado)
      ? diaHoyCapitalizado
      : null;
  return (
    <div className="Entrenamientos-UsersVer-container">
      {/* <h2 className="Entrenamientos-UsersVer-title">Entrenamientos</h2> */}

      <div className="Entrenamientos-UsersVer-buttons">
        <button
          className={`Entrenamientos-UsersVer-button ${
            !verSemanaSiguiente ? "active" : ""
          }`}
          onClick={() => setVerSemanaSiguiente(false)}
        >
          Semana actual
        </button>
        <button
          className={`Entrenamientos-UsersVer-button ${
            verSemanaSiguiente ? "active" : ""
          }`}
          onClick={() => setVerSemanaSiguiente(true)}
        >
          Semana siguiente
        </button>
      </div>

      {semanaActual && (
        <p className="Entrenamientos-UsersVer-semana">
          Semana del {soloFecha(semanaActual.fecha_inicio).toLocaleDateString()}{" "}
          al {soloFecha(semanaActual.fecha_fin).toLocaleDateString()}
        </p>
      )}

      <div className="Entrenamientos-UsersVer-grid">
        {diasSemana.map((dia) => {
          if (!semanaActual) return null;
          const fechaDia = new Date(semanaActual!.fecha_inicio);
          fechaDia.setDate(fechaDia.getDate() + diasSemana.indexOf(dia));
          const fechaISO = fechaDia.toISOString().split("T")[0];

          // Buscar vacaciones activas en ese día
          const vacacionDia = vacaciones.find(
            (v) => fechaISO >= v.fecha_inicio && fechaISO <= v.fecha_fin,
          );

          return (
            <div
              key={dia}
              className={`Entrenamientos-UsersVer-dia ${
                marcarDia === dia ? "Entrenamientos-UsersVer-dia--hoy" : ""
              }`}
            >
              <h4>{dia}</h4>

              {vacacionDia ? (
                <div className="Entrenamientos-UsersVer-vacacion">
                  <span style={{ marginRight: "6px" }}>🏖️</span>
                  <p className="vacacion-titulo">{vacacionDia.titulo}</p>
                  {vacacionDia.descripcion && (
                    <p className="vacacion-descripcion">
                      {vacacionDia.descripcion}
                    </p>
                  )}
                </div>
              ) : sesiones.filter((s) => s.dia_semana === dia).length > 0 ? (
                sesiones
                  .filter((s) => s.dia_semana === dia)
                  .map((s) => {
                    let bordeStyle = {};
                    if (s.tipo_sesion === "Agua+Sala") {
                      bordeStyle = {
                        borderLeft: `5px solid ${tipoSesionColor["Agua+Sala"]}`,
                        background: `linear-gradient(90deg, ${tipoSesionColor["Agua"]}20, ${tipoSesionColor["Sala"]}20)`,
                      };
                    } else {
                      bordeStyle = {
                        borderLeft: `5px solid ${tipoSesionColor[s.tipo_sesion]}`,
                        background: `${tipoSesionColor[s.tipo_sesion]}10`,
                      };
                    }
                    return (
                      <div
                        key={s.id}
                        className="Entrenamientos-UsersVer-sesion"
                        style={bordeStyle}
                      >
                        <span style={{ marginRight: "6px" }}>
                          {tipoSesionIcon[s.tipo_sesion]}
                        </span>
                        <p>{s.descripcion}</p>
                        <p className="Entrenamientos-UsersVer-hora">
                          {s.hora_inicio.slice(0, 5)} - {s.hora_fin.slice(0, 5)}{" "}
                          ({s.tipo_sesion})
                        </p>
                      </div>
                    );
                  })
              ) : (
                <div className="Entrenamientos-UsersVer-dia-empty">
                  No hay entrenamiento
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
