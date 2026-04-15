import { useEffect, useState } from "react";

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export function StatBar({
  label,
  value,
  max = 100,
  color = "#4db8ff",
}: StatBarProps) {
  const porcentaje = Math.min((value / max) * 100, 100);
  const [fillWidth, setFillWidth] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setFillWidth(porcentaje), 10);
    return () => clearTimeout(timeout);
  }, [porcentaje]);

  return (
    <div className="stat-bar-container overlay">
      <div className="stat-bar-bg">
        <div
          className="stat-bar-fill"
          style={{ width: `${fillWidth}%`, backgroundColor: color }}
        />
        <div className="stat-bar-overlay">
          <span className="stat-bar-label">{label}</span>
          <span className="stat-bar-value">{value}</span>
        </div>
      </div>
    </div>
  );
}
