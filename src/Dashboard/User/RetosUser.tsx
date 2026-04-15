import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./RetosUser.css";

interface Reto {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  puntos: number;
  dificultad: string;
  cumplido?: boolean;
}

interface RetosUserProps {
  nadadoraId: number;
}

const dificultadOrden: Record<string, number> = {
  facil: 1,
  medio: 2,
  dificil: 3,
  muy_dificil: 4,
};

export default function RetosUser({ nadadoraId }: RetosUserProps) {
  const [retos, setRetos] = useState<Reto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalReto, setModalReto] = useState<Reto | null>(null);
  const [filtros, setFiltros] = useState("todos");
  const retosFiltrados =
    filtros === "todos" ? retos : retos.filter((r) => r.dificultad === filtros);
  useEffect(() => {
    const fetchRetos = async () => {
      setLoading(true);

      const { data: retosData, error: retosError } = await supabase
        .from("retos")
        .select("*")
        .order("creado_en", { ascending: false });

      if (retosError) {
        console.error(retosError);
        setLoading(false);
        return;
      }

      const { data: nadadoraRetos, error: nadadoraRetosError } = await supabase
        .from("nadadoras_retos")
        .select("reto_id, cumplido")
        .eq("nadadora_id", nadadoraId);

      if (nadadoraRetosError) {
        console.error(nadadoraRetosError);
        setLoading(false);
        return;
      }

      const retosConEstado = retosData.map((reto: any) => {
        const nadReto = nadadoraRetos.find((nr: any) => nr.reto_id === reto.id);
        return { ...reto, cumplido: nadReto?.cumplido ?? false };
      });
      retosConEstado.sort(
        (a, b) => dificultadOrden[a.dificultad] - dificultadOrden[b.dificultad],
      );

      setRetos(retosConEstado);
      setLoading(false);
    };

    fetchRetos();
  }, [nadadoraId]);

  if (loading)
    return <div className="RetosUser-loading">Cargando retos...</div>;

  return (
    <div className="RetosUser-container">
      <div className="RetosUser-filtros">
        <button
          onClick={() => setFiltros("todos")}
          data-dificultad="todas"
          className={filtros === "todos" ? "active" : ""}
        >
          Todos
        </button>

        <button
          onClick={() => setFiltros("facil")}
          data-dificultad="facil"
          className={filtros === "facil" ? "active" : ""}
        >
          ⭐
        </button>

        <button
          onClick={() => setFiltros("medio")}
          data-dificultad="medio"
          className={filtros === "medio" ? "active" : ""}
        >
          🔥
        </button>

        <button
          onClick={() => setFiltros("dificil")}
          data-dificultad="dificil"
          className={filtros === "dificil" ? "active" : ""}
        >
          ⚡
        </button>

        <button
          onClick={() => setFiltros("muy_dificil")}
          data-dificultad="muy_dificil"
          className={filtros === "muy_dificil" ? "active" : ""}
        >
          💀
        </button>
      </div>

      <div className="RetosUser-grid">
        {retosFiltrados.map((r) => (
          <div
            key={r.id}
            className={`RetosUser-card dificultad-${r.dificultad} ${
              r.cumplido ? "cumplido" : "no-cumplido"
            }`}
            onClick={() => setModalReto(r)}
          >
            {r.cumplido && <div className="RetosUser-badge">COMPLETADO ✅</div>}
            <h3 className="RetosUser-cardNombre">
              {r.dificultad === "facil" && "⭐ Fácil"}
              {r.dificultad === "medio" && "🔥 Medio"}
              {r.dificultad === "dificil" && "⚡ Difícil"}
              {r.dificultad === "muy_dificil" && "💀 Extremo"}
              <span className={`RetosUser-dificultadTag ${r.dificultad}`}>
                {r.nombre}
              </span>
            </h3>

            <p className="RetosUser-cardPuntos">{r.puntos} pts</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalReto && (
        <div
          className="RetosUser-modalOverlay"
          onClick={() => setModalReto(null)}
        >
          <div
            className="RetosUser-modalContent"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{modalReto.nombre}</h3>
            <p>{modalReto.descripcion}</p>
            <p>
              <strong>Tipo:</strong> {modalReto.tipo}
            </p>
            <p>
              <strong>Puntos:</strong> {modalReto.puntos}
            </p>
            {modalReto.cumplido && (
              <span className="RetosUser-cardCompletado">✅ Completado</span>
            )}
            <button
              className="RetosUser-modalClose"
              onClick={() => setModalReto(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
