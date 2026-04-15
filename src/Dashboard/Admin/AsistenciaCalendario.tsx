import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

interface Asistencia {
  id: number;
  fecha: string;
  asistencia: string;
}

interface Props {
  asistencias: Asistencia[];
}

const asistenciaColor: Record<string, string> = {
  Asistencia: "#4ce751ff",
  Falta: "#ff6150ff",
  Retraso: "#f39c12",
  Enferma: "#c873e9ff",
  FaltaJustificada: "#35aeffff",
  NoLeTocabaEntrenar: "#afafafff",
};

const asistenciaLabel: Record<string, string> = {
  Asistencia: "Asistió",
  Falta: "Falta",
  Retraso: "Retraso",
  Enferma: "Enferma",
  FaltaJustificada: "Falta Justificada",
  NoLeTocabaEntrenar: "No entrenaba",
};

export function AsistenciasCalendario({ asistencias }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;
    const fechaStr = date.toLocaleDateString("sv-SE");
    const asistencia = asistencias.find((a) => a.fecha === fechaStr);
    const isToday = date.toDateString() === new Date().toDateString();

    return (
      <div
        className={`calendar-tile ${isToday ? "today" : ""}`}
        style={{
          backgroundColor: asistencia
            ? asistenciaColor[asistencia.asistencia]
            : "#f0f0f0",
          color: asistencia ? "#fff" : "#333",
        }}
        title={asistencia ? asistenciaLabel[asistencia.asistencia] : ""}
      >
        {date.getDate()}
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <Calendar
        className="calendar"
        onChange={(value) => value instanceof Date && setSelectedDate(value)}
        value={selectedDate}
        tileContent={tileContent}
      />
      {/* Leyenda */}
      <div className="calendar-legend">
        {Object.keys(asistenciaColor).map((key) => (
          <div key={key} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: asistenciaColor[key] }}
            />
            <span className="legend-label">{asistenciaLabel[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
