import { useEffect, useState } from "react";
import { preguntasTrivial } from "./preguntas";
import { supabase } from "../../../../lib/supabaseClient";
import "./MiniTriviaUser.css";

interface MiniTriviaUserProps {
  nadadoraId: number;
}
interface Pregunta {
  id: number;
  texto: string;
  opciones: string[];
  correcta: string;
  imagen?: string; // URL opcional de la imagen
}
export default function MiniTriviaUser({ nadadoraId }: MiniTriviaUserProps) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  const [puntos, setPuntos] = useState(0);
  const [ranking, setRanking] = useState<any[]>([]);
  const [enviado, setEnviado] = useState(false);
  const [yaJugadoHoy, setYaJugadoHoy] = useState(false);

  useEffect(() => {
    async function cargarDatos() {
      const fechaHoy = new Date().toISOString().split("T")[0];

      // Comprobar si ya jugó hoy
      const { data: resultadoHoy } = await supabase
        .from("resultados_trivia")
        .select("puntos")
        .eq("nadadora_id", nadadoraId)
        .eq("fecha", fechaHoy)
        .single();

      if (resultadoHoy) {
        setYaJugadoHoy(true);
        setPuntos(resultadoHoy.puntos);
      } else {
        setPreguntas(
          preguntasTrivial.sort(() => 0.5 - Math.random()).slice(0, 5)
        );
      }

      // Cargar ranking de hoy
      const { data: rankingHoy } = await supabase
        .from("resultados_trivia")
        .select(
          `
          puntos,
          nadadora_id,
          nadadora:nadadora_id (nombre, apellido)
        `
        )
        .eq("fecha", fechaHoy)
        .order("puntos", { ascending: false });

      if (rankingHoy) {
        const rankingConPosicion = rankingHoy.map((r, i) => ({
          ...r,
          posicion: i + 1,
          esUsuario: r.nadadora_id === nadadoraId,
        }));
        setRanking(rankingConPosicion);
      }
    }

    cargarDatos();
  }, [nadadoraId]);

  const handleResponder = (
    preguntaId: number,
    opcion: string,
    correcta: string
  ) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: opcion }));
    if (opcion === correcta) setPuntos((prev) => prev + 10);
  };

  const enviarResultados = async () => {
    if (enviado) return; // ya enviado
    setEnviado(true);
    // Guardar en Supabase o localStorage
    await supabase.from("resultados_trivia").insert({
      nadadora_id: nadadoraId,
      fecha: new Date().toISOString().split("T")[0],
      puntos,
    });
    setYaJugadoHoy(true);
    const { data: rankingHoy } = await supabase
      .from("resultados_trivia")
      .select(
        `
    puntos,
    nadadora_id,
    nadadora:nadadora_id (nombre, apellido)
  `
      )
      .eq("fecha", new Date().toISOString().split("T")[0])
      .order("puntos", { ascending: false });

    if (!rankingHoy) return;

    // Calcular posición de la usuaria
    const rankingConPosicion = rankingHoy.map((r, i) => ({
      ...r,
      posicion: i + 1,
      esUsuario: r.nadadora_id === nadadoraId,
    }));

    setRanking(rankingConPosicion);
  };

  return (
    <div className="Trivial-User-Container">
      <h2 className="Trivial-User-Title">Mini Trivial</h2>
      <h3 className="Trivial-User-RankingTitle">Ranking de hoy</h3>
      <div className="Trivial-User-Ranking-Container">
        <ol className="Trivial-User-Ranking">
          {ranking.map((r: any) => {
            let claseMedalla = "";
            let iconoMedalla = "";

            if (r.posicion === 1) {
              claseMedalla = "Trivial-User-Ranking-Oro";
              iconoMedalla = "🥇";
            } else if (r.posicion === 2) {
              claseMedalla = "Trivial-User-Ranking-Plata";
              iconoMedalla = "🥈";
            } else if (r.posicion === 3) {
              claseMedalla = "Trivial-User-Ranking-Bronce";
              iconoMedalla = "🥉";
            }

            return (
              <li
                key={r.nadadora_id}
                className={`${
                  r.esUsuario ? "Trivial-User-Ranking-Usuario" : ""
                } ${claseMedalla}`}
              >
                <span className="Trivial-User-Ranking-Texto">
                  {iconoMedalla} {r.posicion}. {r.nadadora.nombre}{" "}
                  {r.nadadora.apellido}
                </span>
                <span className="Trivial-User-Ranking-Puntos">
                  {r.puntos} pts
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      {!yaJugadoHoy && (
        <div className="Trivial-User-Preguntas-Container">
          <h3>Preguntas:</h3>
          {preguntas.map((p) => (
            <div key={p.id} className="Trivial-User-Pregunta">
              <p className="Trivial-User-PreguntaTexto">{p.texto}</p>
              {p.imagen && (
                <img
                  src={p.imagen}
                  alt="Figura de natación artística"
                  className="Trivial-User-PreguntaImagen"
                />
              )}
              <div className="Trivial-User-Opciones">
                {p.opciones.map((op) => (
                  <button
                    key={op}
                    className={`Trivial-User-Opcion ${
                      respuestas[p.id] === op
                        ? op === p.correcta
                          ? "Trivial-User-Opcion-Correcta"
                          : "Trivial-User-Opcion-Incorrecta"
                        : ""
                    }`}
                    onClick={() => handleResponder(p.id, op, p.correcta)}
                    disabled={respuestas[p.id] !== undefined}
                  >
                    {op}
                  </button>
                ))}
              </div>
              {/* Mostrar la respuesta correcta si el usuario falló */}
              {respuestas[p.id] && respuestas[p.id] !== p.correcta && (
                <p className="Trivial-User-RespuestaCorrecta">
                  ✔ La respuesta correcta era: <strong>{p.correcta}</strong>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!yaJugadoHoy && (
        <button className="Trivial-User-Enviar" onClick={enviarResultados}>
          Enviar resultados
        </button>
      )}
    </div>
  );
}
