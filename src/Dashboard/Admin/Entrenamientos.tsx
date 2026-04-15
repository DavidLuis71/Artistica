"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./Entrenamientos.css";

interface Semana {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
}
interface Vacacion {
  id: number;
  titulo: string;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion?: string;
}

interface Sesion {
  id: number;
  semana_id: number;
  dia_semana: "Lunes" | "Martes" | "Miercoles" | "Jueves" | "Viernes";
  descripcion: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_sesion: "Agua" | "Sala" | "Agua+sala";
  fecha: string;
}

const diasSemana = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
const tiposSesion = ["Agua", "Sala", "Agua+Sala"];

export default function Entrenamientos() {
  const [semanas, setSemanas] = useState<Semana[]>([]);
  const [selectedSemana, setSelectedSemana] = useState<number | null>(null);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [formSesion, setFormSesion] = useState<Partial<Sesion>>({});
  const [fechaInicioTemporada, setFechaInicioTemporada] = useState<string>("");
  const [fechaFinTemporada, setFechaFinTemporada] = useState<string>("");
  const [dialogDescripcion, setDialogDescripcion] = useState<{
    abierta: boolean;
    texto: string;
  }>({ abierta: false, texto: "" });
  const [dialogEliminar, setDialogEliminar] = useState<{
    abierta: boolean;
    id: number | null;
  }>({ abierta: false, id: null });

  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);

  const [nuevaVacacion, setNuevaVacacion] = useState({
    titulo: "",
    fecha_inicio: "",
    fecha_fin: "",
    descripcion: "",
  });

  const handleVerDescripcion = (sesion: Sesion) => {
    setDialogDescripcion({
      abierta: true,
      texto: sesion.descripcion || "Sin descripción",
    });
  };

  // 🔹 Cargar semanas y vacaciones
  useEffect(() => {
    fetchSemanas();
    fetchVacaciones();
  }, []);

  const fetchVacaciones = async () => {
    const { data, error } = await supabase
      .from("vacaciones")
      .select("*")
      .order("fecha_inicio", { ascending: true });

    if (error) console.error(error);
    else setVacaciones(data || []);
  };

  const fetchSemanas = async () => {
    const { data, error } = await supabase
      .from("semanas")
      .select("*")
      .order("fecha_inicio", { ascending: true });
    if (error) console.error(error);
    else setSemanas(data || []);
  };

  // 🔹 Crear semanas automáticamente desde temporada
  const handleCrearSemanasTemporada = async () => {
    if (!fechaInicioTemporada || !fechaFinTemporada)
      return alert("Selecciona fechas de inicio y fin de temporada");

    const fechaInicio = new Date(fechaInicioTemporada);
    const fechaFin = new Date(fechaFinTemporada);

    // 🔹 Obtener todas las semanas existentes
    const { data: semanasExistentesData, error: errorSemanas } = await supabase
      .from("semanas")
      .select("fecha_inicio");
    if (errorSemanas) return alert("Error al cargar semanas existentes");

    const semanasExistentes = (semanasExistentesData || []).map(
      (s) => s.fecha_inicio,
    );

    const semanasAInsertar: { fecha_inicio: string; fecha_fin: string }[] = [];
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const actual = new Date(fechaInicio);

    // 🔹 Primero llevamos actual al primer lunes
    const dia = actual.getDay();
    const diff = dia === 0 ? 1 : (8 - dia) % 7;
    actual.setDate(actual.getDate() + diff);

    while (actual <= fechaFin) {
      const lunes = new Date(actual);
      const viernes = new Date(lunes);
      viernes.setDate(lunes.getDate() + 4);

      const fechaLunes = formatDate(lunes);

      if (!semanasExistentes.includes(fechaLunes)) {
        semanasAInsertar.push({
          fecha_inicio: fechaLunes,
          fecha_fin: formatDate(viernes),
        });
      }

      // 🔥 Avanzamos SIEMPRE lunes → lunes
      actual.setDate(actual.getDate() + 7);
    }

    if (semanasAInsertar.length === 0)
      return alert("Ya existen todas las semanas de la temporada");

    // Insertar semanas nuevas
    const { data: dataNuevasSemanas, error } = await supabase
      .from("semanas")
      .insert(semanasAInsertar)
      .select("*");

    if (error) return alert("Error al crear semanas: " + error.message);

    // Crear sesiones por defecto para las semanas nuevas
    for (const semana of dataNuevasSemanas || []) {
      const sesionesPorDefecto = diasSemana.map((dia) => {
        const horaInicio = "17:30";
        const horaFin = dia === "Viernes" ? "20:30" : "19:30";
        const tipoSesion = dia === "Viernes" ? "Agua+Sala" : "Agua";
        const descripcionPorDefecto: Record<string, string> = {
          Lunes: "Entrenamiento de agua",
          Martes: "Entrenamiento de agua",
          Miercoles: "Entrenamiento de agua",
          Jueves: "Entrenamiento de agua",
          Viernes: "Entrenamiento doble: Agua + Sala",
        };
        return {
          dia_semana: dia,
          descripcion: descripcionPorDefecto[dia] || "",
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          tipo_sesion: tipoSesion,
          fecha: getFechaPorDia(semana, dia),
          semana_id: semana.id,
        };
      });
      await supabase.from("sesiones_entrenamiento").insert(sesionesPorDefecto);
    }

    setFechaInicioTemporada("");
    setFechaFinTemporada("");
    fetchSemanas();
  };

  const crearVacacion = async () => {
    if (
      !nuevaVacacion.titulo ||
      !nuevaVacacion.fecha_inicio ||
      !nuevaVacacion.fecha_fin
    ) {
      alert("Completa todos los campos obligatorios");
      return;
    }

    const { error } = await supabase.from("vacaciones").insert([
      {
        titulo: nuevaVacacion.titulo,
        fecha_inicio: nuevaVacacion.fecha_inicio,
        fecha_fin: nuevaVacacion.fecha_fin,
        descripcion: nuevaVacacion.descripcion,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error al crear vacaciones");
    } else {
      setNuevaVacacion({
        titulo: "",
        fecha_inicio: "",
        fecha_fin: "",
        descripcion: "",
      });
      fetchVacaciones();
    }
  };

  // 🔹 Seleccionar semana y cargar sesiones
  useEffect(() => {
    if (!selectedSemana) return;
    fetchSesiones(selectedSemana);
  }, [selectedSemana]);

  const fetchSesiones = async (semanaId: number) => {
    const { data, error } = await supabase
      .from("sesiones_entrenamiento")
      .select("*")
      .eq("semana_id", semanaId)
      .order("dia_semana", { ascending: true });
    if (error) console.error(error);
    else setSesiones(data || []);
  };

  // 🔹 Guardar sesión (crear o actualizar)
  const handleGuardarSesion = async () => {
    if (
      !selectedSemana ||
      !formSesion.dia_semana ||
      !formSesion.descripcion ||
      !formSesion.hora_inicio ||
      !formSesion.hora_fin ||
      !formSesion.tipo_sesion ||
      !formSesion.fecha
    )
      return alert("Rellena todos los campos de la sesión");

    if (formSesion.id) {
      // Actualizar
      const { error } = await supabase
        .from("sesiones_entrenamiento")
        .update(formSesion)
        .eq("id", formSesion.id);
      if (error) return alert("Error al actualizar sesión");
    } else {
      // Crear nueva
      const { error } = await supabase
        .from("sesiones_entrenamiento")
        .insert([{ ...formSesion, semana_id: selectedSemana }]);
      if (error) return alert("Error al crear sesión");
    }

    setFormSesion({});
    fetchSesiones(selectedSemana);
  };

  const handleEditarSesion = (sesion: Sesion) => {
    setFormSesion(sesion);
  };

  const handleEliminarSesion = async () => {
    if (!dialogEliminar.id) return;

    const { error } = await supabase
      .from("sesiones_entrenamiento")
      .delete()
      .eq("id", dialogEliminar.id);

    if (!error) {
      fetchSesiones(selectedSemana!);
    }

    setDialogEliminar({ abierta: false, id: null });
  };

  // 🔹 Formatear fecha YYYY-MM-DD sin problemas de zona horaria
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Función para calcular la fecha del día de la semana dentro de la semana seleccionada
  const getFechaPorDia = (semana: Semana, dia: string) => {
    const dias = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
    const index = dias.indexOf(dia);
    if (index === -1) return "";
    const fecha = new Date(semana.fecha_inicio);
    fecha.setDate(fecha.getDate() + index);
    return formatDate(fecha);
  };

  const formatDateDMY = (isoDate: string) => {
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0"); // meses 0-11
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="entrenamientos-container">
      <h2>Entrenamientos</h2>

      {/* 🔹 Crear semanas temporada */}
      <div className="temporada-inputs">
        <input
          type="date"
          value={fechaInicioTemporada}
          onChange={(e) => setFechaInicioTemporada(e.target.value)}
        />
        <input
          type="date"
          value={fechaFinTemporada}
          onChange={(e) => setFechaFinTemporada(e.target.value)}
        />
        <button
          onClick={handleCrearSemanasTemporada}
          className="entrenamientos-btn-primary"
        >
          Crear semanas temporada
        </button>
      </div>

      {/* Seleccionar semana */}
      <div className="campo">
        <label>Selecciona semana:</label>
        <select
          className="entrenamientos-input-select"
          value={selectedSemana || ""}
          onChange={(e) => setSelectedSemana(Number(e.target.value))}
        >
          <option value="">--</option>
          {semanas.map((s) => (
            <option key={s.id} value={s.id}>
              📅 {formatDateDMY(s.fecha_inicio)} ➜ 📅{" "}
              {formatDateDMY(s.fecha_fin)}
            </option>
          ))}
        </select>
      </div>

      {/* Formulario sesión */}
      {selectedSemana && (
        <div className="entrenamientos-sesion-form">
          <h3>Nueva / Editar Sesión</h3>

          <select
            className="entrenamientos-input-select"
            value={formSesion.dia_semana || ""}
            onChange={(e) => {
              const dia = e.target.value as any;
              const semana = semanas.find((s) => s.id === selectedSemana)!;
              const fechaCalculada = getFechaPorDia(semana, dia);

              // Autocompletar horas
              const horaInicio = "17:30";
              const horaFin = dia === "Viernes" ? "20:30" : "19:30";

              setFormSesion({
                ...formSesion,
                dia_semana: dia,
                fecha: fechaCalculada,
                hora_inicio: horaInicio,
                hora_fin: horaFin,
              });
            }}
          >
            <option value="">Selecciona día</option>
            {diasSemana.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <input
            className="entrenamientos-input-field"
            type="time"
            value={formSesion.hora_inicio || ""}
            onChange={(e) =>
              setFormSesion({ ...formSesion, hora_inicio: e.target.value })
            }
          />
          <input
            className="entrenamientos-input-field"
            type="time"
            value={formSesion.hora_fin || ""}
            onChange={(e) =>
              setFormSesion({ ...formSesion, hora_fin: e.target.value })
            }
          />
          <input
            className="entrenamientos-input-field"
            type="text"
            placeholder="Descripción"
            value={formSesion.descripcion || ""}
            onChange={(e) =>
              setFormSesion({ ...formSesion, descripcion: e.target.value })
            }
          />
          <select
            className="entrenamientos-input-select"
            value={formSesion.tipo_sesion || ""}
            onChange={(e) =>
              setFormSesion({
                ...formSesion,
                tipo_sesion: e.target.value as any,
              })
            }
          >
            <option value="">Tipo de sesión</option>
            {tiposSesion.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            className="entrenamientos-input-field"
            type="date"
            value={formSesion.fecha || ""}
            onChange={(e) =>
              setFormSesion({ ...formSesion, fecha: e.target.value })
            }
          />

          <button
            onClick={handleGuardarSesion}
            className="entrenamientos-btn-success"
          >
            Guardar Sesión
          </button>
        </div>
      )}

      {/* Listado de sesiones */}
      {sesiones.length > 0 && (
        <div className="entrenamientos-tabla-wrapper">
          <table className="entrenamientos-tabla">
            <thead>
              <tr>
                <th>Día</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.map((s) => (
                <tr key={s.id}>
                  {/* ✅ Hacemos que el día sea clicable */}
                  <td
                    style={{ cursor: "pointer", color: "#2175ff" }}
                    onClick={() => handleEditarSesion(s)}
                    title="Editar sesión"
                  >
                    {s.dia_semana}
                  </td>
                  <td>{s.hora_inicio.slice(0, 5)}</td>
                  <td>{s.hora_fin.slice(0, 5)}</td>
                  <td>{s.tipo_sesion}</td>
                  <td className="acciones-columna">
                    {/* Ver descripción */}
                    <button
                      onClick={() => handleVerDescripcion(s)}
                      title="Ver descripción"
                      className="entrenamientos-btn-icon"
                    >
                      📄
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => handleEditarSesion(s)}
                      title="Editar sesión"
                      className="entrenamientos-btn-icon"
                    >
                      ✏️
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() =>
                        setDialogEliminar({ abierta: true, id: s.id })
                      }
                      title="Eliminar sesión"
                      className="entrenamientos-btn-icon"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {dialogDescripcion.abierta && (
            <div className="mini-dialog-overlay">
              <div className="mini-dialog">
                <h3>Descripción</h3>
                <p>{dialogDescripcion.texto}</p>

                <button
                  className="mini-dialog-close"
                  onClick={() =>
                    setDialogDescripcion({ abierta: false, texto: "" })
                  }
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
          {dialogEliminar.abierta && (
            <div className="mini-dialog-overlay">
              <div className="mini-dialog">
                <h3>Confirmar eliminación</h3>
                <p>¿Seguro que quieres eliminar esta sesión?</p>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                  }}
                >
                  <button
                    className="mini-dialog-close"
                    onClick={() =>
                      setDialogEliminar({ abierta: false, id: null })
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    className="mini-dialog-delete"
                    onClick={handleEliminarSesion}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <h2 className="vacaciones-titulo">Vacaciones</h2>

      <div className="vacaciones-form">
        <input
          type="text"
          placeholder="Título"
          value={nuevaVacacion.titulo}
          onChange={(e) =>
            setNuevaVacacion({ ...nuevaVacacion, titulo: e.target.value })
          }
        />

        <input
          type="date"
          value={nuevaVacacion.fecha_inicio}
          onChange={(e) =>
            setNuevaVacacion({ ...nuevaVacacion, fecha_inicio: e.target.value })
          }
        />

        <input
          type="date"
          value={nuevaVacacion.fecha_fin}
          onChange={(e) =>
            setNuevaVacacion({ ...nuevaVacacion, fecha_fin: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="Descripción"
          value={nuevaVacacion.descripcion}
          onChange={(e) =>
            setNuevaVacacion({ ...nuevaVacacion, descripcion: e.target.value })
          }
        />

        <button onClick={crearVacacion}>Crear vacaciones</button>
      </div>

      <div className="vacaciones-tabla-wrapper">
        <table className="vacaciones-tabla">
          <thead>
            <tr>
              <th>Título</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {vacaciones.map((v) => (
              <tr key={v.id}>
                <td>{v.titulo}</td>
                <td>{v.fecha_inicio}</td>
                <td>{v.fecha_fin}</td>
                <td>{v.descripcion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
