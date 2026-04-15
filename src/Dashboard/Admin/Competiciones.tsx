import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import CompeticionDialog from "./CompeticionDialog";
import ResultadosDialog from "./CompeticionesResultados/ResultadosDialog";
import "./Competiciones.css";

interface Competicion {
  id: number;
  nombre: string;
  tipo: "rutinas" | "figuras" | "tiempos" | "niveles";
  fecha: string;
  lugar: string | null;
  descripcion: string | null;
  hora_comienzo: string | null;
  hora_llegada: string | null;
  material_necesario: string | null;
  estado: string | null;
}

export default function Competiciones() {
  const [competiciones, setCompeticiones] = useState<Competicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Competicion | null>(null);
  const [resultadosDialogOpen, setResultadosDialogOpen] = useState(false);

  useEffect(() => {
    fetchCompeticiones();
  }, []);

  async function fetchCompeticiones() {
    setLoading(true);
    const { data, error } = await supabase
      .from("competiciones")
      .select("*")
      .order("fecha", { ascending: true });
    if (error) console.error("Error al cargar competiciones:", error);
    else setCompeticiones(data || []);
    setLoading(false);
  }
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const competicionesProximas = competiciones.filter(
    (c) => new Date(c.fecha) >= hoy,
  );

  const competicionesPasadas = competiciones.filter(
    (c) => new Date(c.fecha) < hoy,
  );

  return (
    <div className="competiciones-container">
      <div className="competiciones-header">
        <h2>Competiciones</h2>
        <button
          className="competiciones-btn-primary"
          onClick={() => setDialogOpen(true)}
        >
          Nueva
        </button>
      </div>

      {loading ? (
        <p>Cargando competiciones...</p>
      ) : (
        // <div className="competiciones-lista">
        //   {competiciones.map((c) => (
        //     <div key={c.id} className="competicion-card">
        //       <div className="competicion-info">
        //         <h3>{c.nombre}</h3>
        //         <span className={`competicion-tipo ${c.tipo}`}>
        //           {c.tipo.toUpperCase()}
        //         </span>
        //       </div>
        //       <div className="competicion-detalles">
        //         <p>
        //           <strong>Fecha:</strong>{" "}
        //           {new Date(c.fecha).toLocaleDateString()}
        //         </p>
        //         {c.lugar && (
        //           <p>
        //             <strong>Lugar:</strong> {c.lugar}
        //           </p>
        //         )}
        //         {c.descripcion && <p>{c.descripcion}</p>}
        //       </div>
        //       <div className="competicion-actions">
        //         <button
        //           className="competiciones-btn competiciones-btn-editar"
        //           onClick={() => {
        //             setEditando(c);
        //             setDialogOpen(true);
        //           }}
        //         >
        //           Editar
        //         </button>
        //         <button
        //           className="competiciones-btn calendario-btn-primary"
        //           onClick={() => {
        //             setEditando(c);
        //             setResultadosDialogOpen(true);
        //           }}
        //         >
        //           Agregar resultados
        //         </button>
        //       </div>
        //     </div>
        //   ))}
        // </div>
        <div className="competiciones-columns">
          {/* PASADAS */}
          <div className="competiciones-column">
            <h3 className="competiciones-column-title">🏁 Pasadas</h3>

            {competicionesPasadas.length === 0 ? (
              <p className="competiciones-empty">
                No hay competiciones pasadas
              </p>
            ) : (
              competicionesPasadas.map((c) => (
                <CompeticionCard
                  key={c.id}
                  competicion={c}
                  onEdit={() => {
                    setEditando(c);
                    setDialogOpen(true);
                  }}
                  onResultados={() => {
                    setEditando(c);
                    setResultadosDialogOpen(true);
                  }}
                />
              ))
            )}
          </div>
          {/* PRÓXIMAS */}
          <div className="competiciones-column">
            <h3 className="competiciones-column-title">🕒 Próximas</h3>

            {competicionesProximas.length === 0 ? (
              <p className="competiciones-empty">
                No hay competiciones próximas
              </p>
            ) : (
              competicionesProximas.map((c) => (
                <CompeticionCard
                  key={c.id}
                  competicion={c}
                  onEdit={() => {
                    setEditando(c);
                    setDialogOpen(true);
                  }}
                  onResultados={() => {
                    setEditando(c);
                    setResultadosDialogOpen(true);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}

      <CompeticionDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditando(null);
        }}
        onSave={fetchCompeticiones}
        competicion={editando}
      />
      <ResultadosDialog
        open={resultadosDialogOpen}
        onClose={() => setResultadosDialogOpen(false)}
        competicion={editando}
      />
    </div>
  );
}

function CompeticionCard({
  competicion,
  onEdit,
  onResultados,
}: {
  competicion: Competicion;
  onEdit: () => void;
  onResultados: () => void;
}) {
  return (
    <div className="competicion-card">
      <div className="competicion-info">
        <h3>{competicion.nombre}</h3>
        <span className={`competicion-tipo ${competicion.tipo}`}>
          {competicion.tipo.toUpperCase()}
        </span>
      </div>

      <div className="competicion-detalles">
        <p>
          <strong>Fecha:</strong>{" "}
          {new Date(competicion.fecha).toLocaleDateString()}
        </p>

        {competicion.lugar && (
          <p>
            <strong>Lugar:</strong> {competicion.lugar}
          </p>
        )}

        {competicion.descripcion && <p>{competicion.descripcion}</p>}
      </div>

      <div className="competicion-actions">
        <button
          className="competiciones-btn competiciones-btn-editar"
          onClick={onEdit}
        >
          Editar
        </button>

        <button
          className="competiciones-btn calendario-btn-primary"
          onClick={onResultados}
        >
          Agregar resultados
        </button>
      </div>
    </div>
  );
}
