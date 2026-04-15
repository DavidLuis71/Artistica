import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./CompeticionesUser.css";

interface Competicion {
  id: number;
  nombre: string;
  tipo: "rutinas" | "figuras" | "tiempos" | "niveles";
  fecha: string;
  lugar: string;
  latitud?: number | null;
  longitud?: number | null;
  descripcion: string;
  hora_comienzo: string;
  hora_llegada: string;
  material_necesario: string;
  estado: "programada" | "curso" | "finalizada";
}

interface Props {
  userId: string;
}

export default function CompeticionesUser({ userId }: Props) {
  const [competencias, setCompetencias] = useState<Competicion[]>([]);
  const [resultados, setResultados] = useState<any>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalCompeticion, setModalCompeticion] = useState<Competicion | null>(
    null,
  );

  useEffect(() => {
    const cargarDatos = async () => {
      // 1. Obtener nadadora
      const { data: nadadora } = await supabase
        .from("nadadoras")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!nadadora) return;

      // 2. Obtener competiciones
      const { data: comps } = await supabase
        .from("competiciones")
        .select("*")
        .order("fecha", { ascending: true });

      setCompetencias(comps || []);

      // 3. Obtener resultados de finalizadas
      const resultadosTemp: any = {};

      for (const comp of comps || []) {
        if (comp.estado !== "finalizada") {
          resultadosTemp[comp.id] = null;
          continue;
        }

        switch (comp.tipo) {
          case "figuras": {
            const { data } = await supabase
              .from("resultados_figuras")
              .select("*")
              .eq("competicion_id", comp.id)
              .eq("nadadora_id", nadadora.id);
            resultadosTemp[comp.id] = data || [];
            break;
          }

          case "rutinas": {
            const { data } = await supabase
              .from("resultados_rutinas")
              .select("*")
              .eq("competicion_id", comp.id)
              .eq("nadadora_id", nadadora.id);
            resultadosTemp[comp.id] = data || [];
            break;
          }

          case "tiempos": {
            const { data } = await supabase
              .from("resultados_tiempos")
              .select("*")
              .eq("competicion_id", comp.id)
              .eq("nadadora_id", nadadora.id);
            resultadosTemp[comp.id] = data || [];
            break;
          }

          case "niveles": {
            // join con la tabla pruebas_niveles
            const { data } = await supabase
              .from("resultados_niveles")
              .select(
                `
              *,
              prueba:prueba_id (
                nombre,
                categoria,
                tipo
              )
            `,
              )
              .eq("competicion_id", comp.id)
              .eq("nadadora_id", nadadora.id);

            resultadosTemp[comp.id] =
              data?.map((r) => ({
                ...r,
                prueba_nombre: r.prueba?.nombre,
                categoria: r.prueba?.categoria,
                tipo_prueba: r.prueba?.tipo,
              })) || [];
            break;
          }
        }
      }

      setResultados(resultadosTemp);
    };

    cargarDatos();
  }, [userId]);

  const abrirModal = (competicion: Competicion) => {
    setModalCompeticion(competicion);
    setModalOpen(true);
  };
  const [hoy, setHoy] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setHoy(new Date());
    }, 60 * 1000); // cada minuto

    return () => clearInterval(interval);
  }, []);

  const proximaCompeticion = competencias
    .filter((c) => c.estado === "programada" && new Date(c.fecha) >= hoy)
    .sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    )[0];

  return (
    <div className="CompeticionesUser-container">
      {/* <h2 className="CompeticionesUser-title">Competiciones</h2> */}

      <div className="CompeticionesUser-grid">
        {competencias.map((c) => {
          const fechaHora = new Date(`${c.fecha}T${c.hora_comienzo}`);
          const diffMs = fechaHora.getTime() - hoy.getTime();
          const diffHoras = diffMs / (1000 * 60 * 60);
          const diffDias = diffMs / (1000 * 60 * 60 * 24);
          const horasRestantes = Math.max(1, Math.ceil(diffHoras));

          return (
            <div
              key={c.id}
              className={`
    CompeticionesUser-card 
    competicion-tipo-${c.tipo}
    ${proximaCompeticion?.id === c.id ? "competicion-proxima" : ""}
  `}
            >
              {proximaCompeticion?.id === c.id && (
                <div className="CompeticionesUser-proximaBadge">⭐ PRÓXIMA</div>
              )}

              <div
                className={`CompeticionesUser-estado CompeticionesUser-estado-${c.estado}`}
              >
                {c.estado.toUpperCase()}
              </div>

              <h3 className="CompeticionesUser-nombre">{c.nombre}</h3>
              <p>
                <strong>Fecha:</strong> {new Date(c.fecha).toLocaleDateString()}
              </p>
              <p>
                <strong>Lugar:</strong> {c.lugar}
              </p>
              {proximaCompeticion?.id === c.id && diffMs > 0 && (
                <p className="CompeticionesUser-countdown">
                  {diffHoras < 24 ? (
                    <>🔥 Empieza en {horasRestantes} horas</>
                  ) : (
                    <>⏳ Faltan {Math.ceil(diffDias)} días</>
                  )}
                </p>
              )}

              <button
                className="CompeticionesUser-botonVer"
                onClick={() => abrirModal(c)}
              >
                Ver detalles {c.estado === "finalizada" && "/ resultados"}
              </button>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {modalOpen && modalCompeticion && (
        <div
          className="CompeticionesUser-modalOverlay"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="CompeticionesUser-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{modalCompeticion.nombre}</h2>

            <p>
              <strong>Fecha:</strong>{" "}
              {new Date(modalCompeticion.fecha).toLocaleDateString()}
            </p>
            <p>
              <strong>Lugar:</strong> {modalCompeticion.lugar}{" "}
              {modalCompeticion.latitud && modalCompeticion.longitud ? (
                <a
                  href={`https://www.google.com/maps?q=${modalCompeticion.latitud},${modalCompeticion.longitud}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginLeft: "6px",
                    color: "#0077cc",
                    textDecoration: "underline",
                  }}
                >
                  Ver en Mapa
                </a>
              ) : null}
            </p>

            <p>
              <strong>Descripción:</strong> {modalCompeticion.descripcion}
            </p>
            <p>
              <strong>Material:</strong> {modalCompeticion.material_necesario}
            </p>
            <p>
              <strong>Hora llegada:</strong>{" "}
              {modalCompeticion.hora_llegada?.split(":").slice(0, 2).join(":")}
            </p>
            <p>
              <strong>Hora comienzo:</strong>{" "}
              {modalCompeticion.hora_comienzo?.split(":").slice(0, 2).join(":")}
            </p>

            {modalCompeticion.estado === "finalizada" && (
              <>
                <h3 className="CompeticionesUser-subtitle">Resultados</h3>
                {resultados[modalCompeticion.id]?.length ? (
                  <>
                    {/* FIGURAS */}
                    {modalCompeticion.tipo === "figuras" &&
                      resultados[modalCompeticion.id]?.map(
                        (r: any, i: number) => (
                          <div
                            key={i}
                            className="CompeticionesUser-resultadoBox"
                          >
                            <p>
                              <strong>{r.figura_nombre}</strong>
                            </p>
                            <p>
                              Notas: {r.nota1}, {r.nota2}, {r.nota3}, {r.nota4},{" "}
                              {r.nota5}
                            </p>
                            <p>
                              <strong>Nota final:</strong> {r.nota_final}
                            </p>
                          </div>
                        ),
                      )}

                    {/* RUTINAS */}
                    {modalCompeticion.tipo === "rutinas" &&
                      resultados[modalCompeticion.id]?.map(
                        (r: any, i: number) => (
                          <div
                            key={i}
                            className="CompeticionesUser-resultadoBox"
                          >
                            <p>Ejecución: {r.ejecucion}</p>
                            <p>Dificultad: {r.dificultad}</p>
                            <p>Impresión artística: {r.impresion_artistica}</p>
                            <p>
                              <strong>Nota:</strong> {r.nota}
                            </p>
                          </div>
                        ),
                      )}

                    {/* TIEMPOS */}
                    {modalCompeticion.tipo === "tiempos" &&
                      resultados[modalCompeticion.id]?.map(
                        (r: any, i: number) => (
                          <div
                            key={i}
                            className="CompeticionesUser-resultadoBox"
                          >
                            <p>
                              <strong>{r.prueba_nombre}</strong>
                            </p>
                            <p>Tiempo: {r.tiempo}</p>
                          </div>
                        ),
                      )}
                    {/* NIVELES */}
                    {modalCompeticion.tipo === "niveles" &&
                      resultados[modalCompeticion.id]?.map(
                        (r: any, i: number) => (
                          <div
                            key={i}
                            className="CompeticionesUser-resultadoBox"
                          >
                            <p>
                              <strong>{r.prueba_nombre}</strong>
                            </p>

                            {r.prueba.tipo === "aprobado" && (
                              <p>
                                Resultado:{" "}
                                {r.aprobado ? "Aprobado" : "Suspenso"}
                              </p>
                            )}

                            {r.prueba.tipo === "tiempo" && (
                              <p>Tiempo: {r.tiempo}</p> // ya en mm:ss:cc
                            )}

                            {r.prueba.tipo === "notas" && (
                              <>
                                <p>Notas: {r.notas.join(", ")}</p>
                                <p>Nota final: {r.nota_final}</p>
                              </>
                            )}
                          </div>
                        ),
                      )}
                  </>
                ) : (
                  <p>No hay resultados disponibles</p>
                )}
              </>
            )}

            <button
              className="CompeticionesUser-botonCerrar"
              onClick={() => setModalOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
