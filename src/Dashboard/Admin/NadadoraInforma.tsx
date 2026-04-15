import { useEffect, useState } from "react";
import "./NadadoraInforma.css";
import { supabase } from "../../lib/supabaseClient";
import AutocompleteSimple from "../../utils/AutocompleteSimple";
import { AsistenciasCalendario } from "./AsistenciaCalendario";

interface Nadadora {
  id: number;
  nombre: string;
  apellido?: string;
  nivel: number;
  puntos: number;
  progreso: number;
  foto_pos?: string;
  user_id: string;
}

export default function NadadoraDashboard() {
  const [nadadoras, setNadadoras] = useState<Nadadora[]>([]);
  const [nadadoraSeleccionada, setNadadoraSeleccionada] =
    useState<Nadadora | null>(null);
  console.log("🚀 ~ nadadoraSeleccionada:", nadadoraSeleccionada);
  const [logros, setLogros] = useState<any[]>([]);
  const [retos, setRetos] = useState<any[]>([]);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [coreografias, setCoreografias] = useState<any[]>([]);
  const [loadingSecciones, setLoadingSecciones] = useState(false);
  const [tiempos, setTiempos] = useState<
    Record<string, { ultimo: any; mejor: any; historial: any[] }>
  >({});
  const [foto, setFoto] = useState<{ fotoUrl: string | null } | null>(null);
  const [valoraciones, setValoraciones] = useState<any[]>([]);
  const [historialPuntos, setHistorialPuntos] = useState<any[]>([]);
  const [pruebaAbierta, setPruebaAbierta] = useState<string | null>(null);

  useEffect(() => {
    // Cargar todas las nadadoras
    const fetchNadadoras = async () => {
      const { data, error } = await supabase
        .from("nadadoras")
        .select("*")
        .order("nombre");

      if (error) return console.error(error);
      setNadadoras(data || []);
    };

    fetchNadadoras();
  }, []);

  // Cargar secciones al seleccionar nadadora
  useEffect(() => {
    if (!nadadoraSeleccionada) return;

    const fetchSecciones = async () => {
      setLoadingSecciones(true);
      try {
        // 1️⃣ Logros
        const logrosRes = await supabase
          .from("nadadoras_logros")
          .select("logro_id, logros!inner(nombre, puntos_extra)")
          .eq("nadadora_id", nadadoraSeleccionada.id);

        // 2️⃣ Retos con nombre
        const retosRes = await supabase
          .from("nadadoras_retos")
          .select("id, cumplido, puntos_otorgados, retos!inner(nombre, puntos)")
          .eq("nadadora_id", nadadoraSeleccionada.id);

        // 3️⃣ Asistencias (por nadadora_grupo)
        const { data: grupos } = await supabase
          .from("nadadora_grupos")
          .select("id")
          .eq("nadadora_id", nadadoraSeleccionada.id);

        const grupoIds = grupos?.map((g) => g.id) || [];
        let asistenciasData: any[] = [];
        if (grupoIds.length > 0) {
          const asistRes = await supabase
            .from("asistencias")
            .select("*")
            .in("nadadora_grupo_id", grupoIds);
          asistenciasData = asistRes.data || [];
        }

        // 4️⃣ Coreografías
        const coreoRes = await supabase
          .from("coreografia_nadadora")
          .select("coreografia_id, coreografias!inner(nombre)")
          .eq("nadadora_id", nadadoraSeleccionada.id);

        // 5 tiempos
        const tiemposRes = await supabase
          .from("tiempos")
          .select("*")
          .eq("nadadora_id", nadadoraSeleccionada.id)
          .order("fecha", { ascending: true });

        // 6️⃣ Valoraciones de entrenamiento
        const valoracionesRes = await supabase
          .from("valoracion_entrenamiento")
          .select("*")
          .eq("nadadora_id", nadadoraSeleccionada.id)
          .order("fecha", { ascending: false }); // últimas primero

        // 6️7 Historial de puntos
        const puntosRes = await supabase
          .from("historial_puntos")
          .select("*")
          .eq("nadadora_id", nadadoraSeleccionada.id)
          .order("fecha", { ascending: false }); // los más recientes primero

        const { data: fotoData } = supabase.storage
          .from("fotos-perfil")
          .getPublicUrl(nadadoraSeleccionada?.user_id + ".jpg");

        setFoto({ fotoUrl: fotoData?.publicUrl || null });
        const tiemposPorPrueba = tiemposRes.data?.reduce(
          (acc, t) => {
            if (!acc[t.prueba]) {
              acc[t.prueba] = {
                ultimo: t,
                mejor: t,
                historial: [],
              };
            }

            acc[t.prueba].historial.push(t);
            if (Number(t.tiempo) < Number(acc[t.prueba].mejor.tiempo)) {
              acc[t.prueba].mejor = t;
            }

            acc[t.prueba].ultimo = t;

            return acc;
          },
          {} as Record<string, { ultimo: any; mejor: any; historial: any[] }>,
        );

        // Guardar en estado
        setLogros(logrosRes.data || []);
        setRetos(retosRes.data || []);
        setAsistencias(asistenciasData);
        setCoreografias(coreoRes.data || []);
        setTiempos(tiemposPorPrueba || {});
        setValoraciones(valoracionesRes.data || []);
        setHistorialPuntos(puntosRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSecciones(false);
      }
    };

    fetchSecciones();
  }, [nadadoraSeleccionada]);

  const opcionesNadadoras = nadadoras.map((n) => ({
    id: n.id,
    label: `${n.nombre} ${n.apellido || ""}`.trim(),
  }));
  function formatearFechaConDia(fechaStr: string) {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div className="NadadoraDashboard-container">
      <h2>Selecciona una nadadora</h2>
      <AutocompleteSimple
        options={opcionesNadadoras}
        value={nadadoraSeleccionada?.id}
        onChange={(id) => {
          const n = nadadoras.find((n) => n.id === id) || null;
          setNadadoraSeleccionada(n);
        }}
        placeholder="Busca una nadadora..."
      />
      {/* Información general */}
      {nadadoraSeleccionada && (
        <div className="NadadoraDashboard-section general">
          <img
            src={foto?.fotoUrl || "/default.jpg"}
            alt={nadadoraSeleccionada.nombre}
            className="foto"
          />

          <div className="info">
            <h2>
              {nadadoraSeleccionada.nombre} {nadadoraSeleccionada.apellido}
            </h2>
            <p>Nivel: {nadadoraSeleccionada.nivel}</p>
            <p>Puntos: {nadadoraSeleccionada.puntos}</p>
            <p>Progreso: {nadadoraSeleccionada.progreso}%</p>
          </div>
          {/* <div className="indicadores">
            <div className="indicador">Logros: 5</div>
            <div className="indicador">Retos Cumplidos: 3</div>
            <div className="indicador">Retos Pendientes: 2</div>
          </div> */}

          <div className="section">
            <h3>⏱️ Tiempos</h3>

            {loadingSecciones ? (
              <p>Cargando...</p>
            ) : Object.keys(tiempos).length === 0 ? (
              <p>No hay registros de tiempos</p>
            ) : (
              <div className="tiempos-grid">
                {Object.entries(tiempos).map(([prueba, t]) => {
                  const abierta = pruebaAbierta === prueba;

                  return (
                    <div key={prueba} className="tiempo-card">
                      <div
                        className="tiempo-header clickable"
                        onClick={() =>
                          setPruebaAbierta(abierta ? null : prueba)
                        }
                      >
                        <span className="tiempo-prueba">{prueba}</span>
                        <span className="ver-mas">{abierta ? "▲" : "▼"}</span>
                      </div>

                      <div className="tiempo-body">
                        <div className="tiempo-bloque mejor">
                          <span className="label">Mejor</span>
                          <span className="valor">
                            {formatearTiempo(Number(t.mejor.tiempo))}
                          </span>
                          <span className="fecha">
                            {new Date(t.mejor.fecha).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="tiempo-bloque ultimo">
                          <span className="label">Último</span>
                          <span className="valor">
                            {formatearTiempo(Number(t.ultimo.tiempo))}
                          </span>
                          <span className="fecha">
                            {new Date(t.ultimo.fecha).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {abierta && (
                        <div className="historial-tiempos">
                          {t.historial
                            .slice()
                            .reverse()
                            .map((registro, index, arr) => {
                              // Para calcular la diferencia con el anterior (mirando hacia atrás en el historial original)
                              const siguiente = arr[index + 1]; // Como estamos haciendo reverse(), "siguiente" es el anterior en orden cronológico
                              let diffLabel = "";
                              if (siguiente) {
                                const diff =
                                  Number(registro.tiempo) -
                                  Number(siguiente.tiempo);
                                if (diff > 0)
                                  diffLabel = `${formatearDiferenciaTiempo(diff)}`; // subió el tiempo
                                else if (diff < 0)
                                  diffLabel = `${formatearDiferenciaTiempo(diff)}`; // bajó el tiempo
                                else diffLabel = "0";
                              }

                              return (
                                <div key={registro.id} className="fila-tiempo">
                                  <span>
                                    {new Date(
                                      registro.fecha,
                                    ).toLocaleDateString()}
                                  </span>
                                  <span>
                                    {diffLabel && (
                                      <span className="diff-tiempo">
                                        ({diffLabel}){" "}
                                      </span>
                                    )}
                                    {formatearTiempo(Number(registro.tiempo))}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sección Asistencia */}
          <div className="section">
            <h3>📅 Asistencia</h3>
            {loadingSecciones ? (
              <p>Cargando...</p>
            ) : asistencias.length === 0 ? (
              <p>No hay registros de asistencia</p>
            ) : (
              <AsistenciasCalendario asistencias={asistencias} />
            )}
          </div>

          {/* Sección Historial de Puntos */}
          <div className="section historial-puntos">
            <h3>💰 Historial de Puntos</h3>
            {loadingSecciones ? (
              <p>Cargando...</p>
            ) : historialPuntos.length === 0 ? (
              <p>No tiene historial de puntos</p>
            ) : (
              <div className="timeline">
                {historialPuntos.map((p) => {
                  let tipo = "default";
                  let label = p.detalle;

                  // 1️⃣ Asistencias: buscamos la flecha
                  if (p.origen === "asistencia" && p.detalle.includes("→")) {
                    const [, afterArrow] = p.detalle
                      .split("→")
                      .map((s: any) => s.trim());
                    label = afterArrow;
                    if (afterArrow === "Asistencia") tipo = "asistencia";
                    else if (afterArrow === "Retraso") tipo = "retraso";
                    else if (afterArrow === "Falta") tipo = "falta";
                  }

                  // 2️⃣ Logros semanales/mensuales
                  else if (p.origen === "logro") {
                    if (p.detalle.toLowerCase().includes("semanal"))
                      tipo = "logro-semanal";
                    else if (p.detalle.toLowerCase().includes("mensual"))
                      tipo = "logro-mensual";
                    else tipo = "logro"; // cualquier otro logro
                  }

                  return (
                    <div key={p.id} className={`timeline-item ${tipo}`}>
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <span className="detalle">{label}</span>
                        <span className="fecha">
                          {new Date(p.fecha).toLocaleDateString()}
                        </span>

                        <span className="puntos">{p.puntos} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sección Valoraciones */}
          <div className="section valoraciones">
            <h3>💪 Valoraciones de Entrenamiento</h3>
            {loadingSecciones ? (
              <p>Cargando...</p>
            ) : valoraciones.length === 0 ? (
              <p>No hay valoraciones registradas</p>
            ) : (
              <div className="valoraciones-grid">
                {valoraciones.map((v) => (
                  <div key={v.id} className="valoracion-card">
                    <div className="valoracion-header">
                      <span>{formatearFechaConDia(v.fecha)}</span>
                    </div>

                    <div className="valoracion-body">
                      <div className="barra-valoracion">
                        <span>Cansancio Entrenamiento</span>
                        <div className="barra">
                          <div
                            className="barra-fill cansancio"
                            style={{
                              width: `${v.cansancio_entrenamiento * 10}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="barra-valoracion">
                        <span>Cansancio General</span>
                        <div className="barra">
                          <div
                            className="barra-fill general"
                            style={{ width: `${v.cansancio_general * 10}%` }}
                          />
                        </div>
                      </div>
                      <div className="barra-valoracion">
                        <span>Motivación</span>
                        <div className="barra">
                          <div
                            className="barra-fill motivacion"
                            style={{ width: `${v.motivacion * 10}%` }}
                          />
                        </div>
                      </div>
                      <div className="barra-valoracion">
                        <span>Productividad</span>
                        <div className="barra">
                          <div
                            className="barra-fill productividad"
                            style={{ width: `${v.productividad * 10}%` }}
                          />
                        </div>
                      </div>
                      {v.comentarios && (
                        <p className="comentario">💬 {v.comentarios}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sección Logros */}
          <div className="section">
            <h3>🏆 Logros</h3>
            {loadingSecciones ? (
              <p>Cargando...</p>
            ) : logros.length === 0 ? (
              <p>No tiene logros</p>
            ) : (
              <div className="Secion-admin-logros-grid">
                {logros.map((l) => (
                  <div key={l.logro_id} className="Secion-admin-logro-card">
                    <div className="Secion-admin-logro-icon">🏆</div>
                    <div className="Secion-admin-logro-nombre">
                      {l.logros.nombre}
                    </div>
                    {l.logros.puntos_extra && (
                      <div className="Secion-admin-logro-puntos">
                        +{l.logros.puntos_extra} pts
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sección Retos */}
          <div className="section">
            <h3>🎯 Retos</h3>
            {loadingSecciones ? (
              <p>Cargando...</p>
            ) : retos.length === 0 ? (
              <p>No tiene retos</p>
            ) : (
              <div className="Seccion-Retos-Admin-retos-grid">
                {retos.map((r) => (
                  <div
                    key={r.id}
                    className={`Seccion-Retos-Admin-reto-card ${r.cumplido ? "cumplido" : "pendiente"}`}
                  >
                    <div className="Seccion-Retos-Admin-reto-nombre">
                      {r.retos.nombre}
                    </div>
                    <div className="Seccion-Retos-Admin-reto-puntos">
                      {r.puntos_otorgados} pts
                    </div>
                    <div className="Seccion-Retos-Admin-reto-estado">
                      {r.cumplido ? "✅ Cumplido" : "⏳ Pendiente"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sección Coreografías */}
          <div className="section">
            <h3>💃 Coreografías</h3>
            {loadingSecciones ? (
              <p>Cargando...</p>
            ) : coreografias.length === 0 ? (
              <p>No tiene coreografías</p>
            ) : (
              <div className="Seccion-Coreos-Admin-coreografias-grid">
                {coreografias.map((c) => (
                  <div
                    key={c.coreografia_id}
                    className="Seccion-Coreos-Admin-coreografia-card"
                  >
                    <div className="Seccion-Coreos-Admin-coreografia-icon">
                      💃
                    </div>
                    <div className="Seccion-Coreos-Admin-coreografia-nombre">
                      {c.coreografias.nombre}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatearTiempo(segundos: number) {
  if (!segundos && segundos !== 0) return "-";

  const minutos = Math.floor(segundos / 60);
  const segRestantes = segundos % 60;

  const segundosEnteros = Math.floor(segRestantes);
  const centesimas = Math.round((segRestantes - segundosEnteros) * 100);

  return `${minutos}:${segundosEnteros.toString().padStart(2, "0")}.${centesimas
    .toString()
    .padStart(2, "0")}`;
}
function formatearDiferenciaTiempo(diffSegundos: number) {
  const signo = diffSegundos > 0 ? "+" : "";
  return `${signo}${diffSegundos.toFixed(2)} s`;
}
