import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./Asistencias.css";
import Toast from "../../utils/Toast";
// import AutocompleteSimple from "../../utils/AutocompleteSimple";

interface NadadoraGrupo {
  id: number; // id de nadadora_grupo
  nadadora: {
    id: number;
    nombre: string;
    apellido: string;
    codigo_unico: string;
  };
}

interface Temporada {
  id: number;
  nombre: string;
}

const tipoAsistencia = [
  "Asistencia",
  "Falta",
  "Retraso",
  "Enferma",
  "FaltaJustificada",
  "NoLeTocabaEntrenar",
];

const asistenciaColor: { [key: string]: string } = {
  Asistencia: "#4ce751ff", // verde
  Falta: "#ff6150ff", // rojo
  Retraso: "#f39c12", // naranja
  Enferma: "#c873e9ff", // morado
  FaltaJustificada: "#35aeffff", // azul
  NoLeTocabaEntrenar: "#afafafff", // gris
};
const iconosAusencia: { [key: string]: string } = {
  fecha_unica: "⚠️", // Día puntual
  semanal: "🔁", // Recurrente semanal
  rango: "📆", // De un día a otro
};

export default function Asistencias() {
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [nadadoraGrupos, setNadadoraGrupos] = useState<NadadoraGrupo[]>([]);
  const [selectedTemporada, setSelectedTemporada] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // const [modalAusenciasOpen, setModalAusenciasOpen] = useState(false);
  // const [nadadoraSeleccionadaId, setNadadoraSeleccionadaId] = useState<
  //   number | null
  // >(null);
  const [ausencias, setAusencias] = useState<any[]>([]);
  const [modalAusenciaOpen, setModalAusenciaOpen] = useState(false);
  const [ausenciaSeleccionada, setAusenciaSeleccionada] = useState<any>(null);

  // const [loadingAusencias, setLoadingAusencias] = useState(false);
  const [asistenciasOriginales, setAsistenciasOriginales] = useState<{
    [key: number]: string;
  }>({});
  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setToast({ message, type });
  };
  const [loadingAsistencias, setLoadingAsistencias] = useState(false);

  const [fecha, setFecha] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [asistencias, setAsistencias] = useState<{ [key: number]: string }>({});

  // 🔹 Cargar temporadas
  useEffect(() => {
    supabase
      .from("temporadas")
      .select("*")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTemporadas(data);
          setSelectedTemporada(data[0].id);
        }
      });
  }, []);

  // 🔹 Cargar nadadoras de la temporada
  useEffect(() => {
    if (!selectedTemporada) return;

    const fetchData = async () => {
      setLoadingAsistencias(true);
      try {
        const { data, error } = await supabase
          .from("nadadora_grupos")
          .select(
            "id, nadadora: nadadora_id (id, nombre,apellido, codigo_unico)",
          )
          .eq("temporada_id", selectedTemporada);

        if (error) throw error;

        if (data) {
          const formateadas = data
            .map((ng: any) => ({ id: ng.id, nadadora: ng.nadadora }))
            .filter((ng: any) => ng.nadadora !== null)
            .sort((a: NadadoraGrupo, b: NadadoraGrupo) => {
              const nombreA = `${a.nadadora.nombre} ${
                a.nadadora.apellido || ""
              }`.trim();
              const nombreB = `${b.nadadora.nombre} ${
                b.nadadora.apellido || ""
              }`.trim();
              return nombreA.localeCompare(nombreB, "es", {
                sensitivity: "base",
              });
            });

          setNadadoraGrupos(formateadas);

          // Cargar asistencias del día seleccionado
          const ids = formateadas.map((ng) => ng.id);
          const { data: asisData } = await supabase
            .from("asistencias")
            .select("nadadora_grupo_id, asistencia")
            .eq("fecha", fecha)
            .in("nadadora_grupo_id", ids);

          const map: { [key: number]: string } = {};
          asisData?.forEach((a) => {
            map[a.nadadora_grupo_id] = a.asistencia;
          });
          setAsistencias(map);
          setAsistenciasOriginales(map); // Guardamos copia
        }
      } catch (error) {
        console.error(error);
        showToast("Error cargando nadadoras 😕", "error");
      } finally {
        setLoadingAsistencias(false);
      }
    };

    fetchData();
  }, [selectedTemporada, fecha]);

  // 🔹 Cambiar asistencia en memoria
  const handleAsistenciaChange = (nadadoraGrupoId: number, value: string) => {
    setAsistencias((prev) => ({ ...prev, [nadadoraGrupoId]: value }));
  };

  // 🔹 Guardar asistencias nuevas o actualizar existentes
  const guardarAsistencias = async () => {
    if (!selectedTemporada) return;
    setLoading(true);

    const cambios = Object.entries(asistencias).filter(([id, nueva]) => {
      return asistenciasOriginales[Number(id)] !== nueva;
    });

    if (cambios.length === 0) {
      showToast("No hay cambios que guardar ✅", "info");
      setLoading(false);
      return;
    }

    for (const [nadadoraGrupoIdStr, nuevaAsistencia] of cambios) {
      const nadadoraGrupoId = Number(nadadoraGrupoIdStr);
      const asistenciaAnterior = asistenciasOriginales[nadadoraGrupoId] || null;

      // Insert o update
      if (asistenciaAnterior === null) {
        const { error: insertError } = await supabase
          .from("asistencias")
          .insert({
            nadadora_grupo_id: nadadoraGrupoId,
            fecha,
            asistencia: nuevaAsistencia,
          });
        if (insertError) console.error("Error insertando:", insertError);
      } else {
        const { data: existente } = await supabase
          .from("asistencias")
          .select("id")
          .eq("nadadora_grupo_id", nadadoraGrupoId)
          .eq("fecha", fecha)
          .maybeSingle();

        if (existente) {
          const { error: updateError } = await supabase
            .from("asistencias")
            .update({ asistencia: nuevaAsistencia })
            .eq("id", existente.id);
          if (updateError) console.error("Error actualizando:", updateError);
        }
      }

      // Llamada al RPC
      const { error: rpcError } = await supabase.rpc("procesar_asistencia", {
        p_nadadora_grupo_id: nadadoraGrupoId,
        p_fecha: fecha,
        p_tipo_asistencia: nuevaAsistencia,
        p_asistencia_anterior: asistenciaAnterior,
      });

      if (rpcError) console.error("Error procesando puntos:", rpcError);
    }

    // Actualizar las originales
    setAsistenciasOriginales({ ...asistencias });

    showToast("Asistencias guardadas correctamente ✅", "success");
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedTemporada) return;

    const fetchAusencias = async () => {
      // setLoadingAusencias(true);

      try {
        const nadadoraIds = nadadoraGrupos.map((ng) => ng.nadadora.id);
        const { data, error } = await supabase
          .from("ausencias_recurrentes")
          .select("*")
          .in("nadadora_id", nadadoraIds);

        if (error) throw error;
        setAusencias(data || []);
      } catch (error) {
        console.error(error);
        showToast("Error cargando ausencias recurrentes", "error");
      } finally {
        // setLoadingAusencias(false);
      }
    };

    fetchAusencias();
  }, [selectedTemporada, nadadoraGrupos]);

  // Función para formatear la fecha
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    const dias = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const diaSemana = dias[fecha.getDay()];
    const dia = fecha.getDate().toString().padStart(2, "0");
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
    const anio = fecha.getFullYear();
    return `${diaSemana} ${dia}/${mes}/${anio}`;
  };

  // Verifica si una ausencia afecta a la fecha seleccionada
  const estaAusenteHoy = (ausenciasNadadora: any[], fechaStr: string) => {
    const fecha = new Date(fechaStr);

    return ausenciasNadadora.filter((a) => {
      if (a.tipo_recurrencia === "fecha_unica") {
        return a.fecha_inicio === fechaStr;
      }

      if (a.tipo_recurrencia === "rango") {
        return (
          a.fecha_inicio <= fechaStr &&
          (!a.fecha_fin || a.fecha_fin >= fechaStr)
        );
      }

      if (a.tipo_recurrencia === "semanal" && Array.isArray(a.dias_semana)) {
        const diaSemana = fecha.getDay(); // 0 = domingo, 1 = lunes...
        // Ajustamos para que 0 = lunes, 6 = domingo si tus datos usan 0 = lunes
        const dia = diaSemana === 0 ? 6 : diaSemana - 1;
        return a.dias_semana.includes(dia);
      }

      return false;
    });
  };

  return (
    <div className="asistencias-container">
      <h2 className="asistencias-title">Asistencias</h2>

      {/* Filtros */}
      <div className="asistencias-filtros">
        <select
          value={selectedTemporada || ""}
          onChange={(e) => setSelectedTemporada(Number(e.target.value))}
        >
          {temporadas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      {/* Tabla con scroll */}
      <div className="asistencias-table-container">
        {loadingAsistencias ? (
          <div className="userDashboard-loader-alternate">
            <div className="userDashboard-loader-logoSpin">
              <img src="/logo.png" alt="Cargando..." />
            </div>
          </div>
        ) : (
          <table className="asistencias-table">
            <thead>
              <tr>
                <th>Nadadora</th>
                <th>Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {nadadoraGrupos.map((ng) => (
                <tr key={ng.id}>
                  <td>
                    {ng.nadadora.apellido
                      ? `${ng.nadadora.nombre} ${ng.nadadora.apellido.charAt(
                          0,
                        )}${ng.nadadora.apellido.charAt(
                          1,
                        )}${ng.nadadora.apellido.charAt(2)}.`
                      : ng.nadadora.nombre}
                  </td>

                  <td style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <select
                      value={asistencias[ng.id] || ""}
                      onChange={(e) =>
                        handleAsistenciaChange(ng.id, e.target.value)
                      }
                      style={{
                        backgroundColor:
                          asistenciaColor[asistencias[ng.id]] || "white",
                        flex: 1,
                      }}
                    >
                      <option value="">--</option>
                      {tipoAsistencia.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                    {/* Icono de ausencia recurrente */}
                    {estaAusenteHoy(
                      ausencias.filter((a) => a.nadadora_id === ng.nadadora.id),
                      fecha,
                    ).map((a) => (
                      <span
                        key={a.id}
                        style={{
                          color: "#ff6150",
                          fontSize: "1.2rem",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setAusenciaSeleccionada(a);
                          setModalAusenciaOpen(true);
                        }}
                      >
                        {iconosAusencia[a.tipo_recurrencia]}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button
        className="btn-guardar"
        onClick={guardarAsistencias}
        disabled={loading}
      >
        {loading && <span className="loader"></span>}
        {loading ? "Guardando..." : "Guardar Asistencias"}
      </button>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={5000} // 5 segundos
        />
      )}
      {/* Modal de ausencia */}
      {modalAusenciaOpen && ausenciaSeleccionada && (
        <div
          className="modal-backdrop"
          onClick={() => setModalAusenciaOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              width: "300px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h3>Ausencia</h3>
            <p>
              <strong>Motivo:</strong> {ausenciaSeleccionada.motivo}
            </p>
            <p>
              <strong>Fechas:</strong>{" "}
              {ausenciaSeleccionada.tipo_recurrencia === "fecha_unica" &&
                formatearFecha(ausenciaSeleccionada.fecha_inicio)}
              {ausenciaSeleccionada.tipo_recurrencia === "rango" &&
                `De ${formatearFecha(ausenciaSeleccionada.fecha_inicio)} a ${formatearFecha(ausenciaSeleccionada.fecha_fin)}`}
              {ausenciaSeleccionada.tipo_recurrencia === "semanal" &&
                `Días: ${ausenciaSeleccionada.dias_semana
                  .map(
                    (d: number) =>
                      [
                        "Lunes",
                        "Martes",
                        "Miércoles",
                        "Jueves",
                        "Viernes",
                        "Sábado",
                        "Domingo",
                      ][d],
                  )
                  .join(", ")}`}
            </p>
            <button
              onClick={() => setModalAusenciaOpen(false)}
              style={{
                marginTop: "10px",
                padding: "6px 12px",
                background: "#278cff",
                color: "white",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
