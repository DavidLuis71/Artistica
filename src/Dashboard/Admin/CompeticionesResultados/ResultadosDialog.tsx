import { FormularioFiguras } from "./FormularioFiguras";
import { FormularioNiveles } from "./FormularioNiveles";
import { FormularioRutinas } from "./FormularioRutinas";
import { FormularioTiempos } from "./FormularioTiempos";

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

interface ResultadosDialogProps {
  open: boolean;
  onClose: () => void;
  competicion: Competicion | null;
}

export default function ResultadosDialog({
  open,
  onClose,
  competicion,
}: ResultadosDialogProps) {
  if (!open || !competicion) return null;

  return (
    <div className="resultados-modal">
      <div className="resultados-modal-panel">
        <h2 className="resultados-modal-title">
          Agregar resultados - {competicion.nombre}
        </h2>

        {competicion.tipo === "rutinas" && (
          <FormularioRutinas competicion={competicion} onClose={onClose} />
        )}
        {competicion.tipo === "figuras" && (
          <FormularioFiguras competicion={competicion} onClose={onClose} />
        )}
        {competicion.tipo === "tiempos" && (
          <FormularioTiempos competicion={competicion} onClose={onClose} />
        )}
        {competicion.tipo === "niveles" && (
          <FormularioNiveles competicion={competicion} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
