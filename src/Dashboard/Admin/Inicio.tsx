import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./Inicio.css";

interface DiaResumen {
  fecha: string;
  asistencia: number;
  total: number;
}

interface Ranking {
  nombre: string;
  apellido: string;
  porcentaje: number;
}

export default function Inicio() {
  const [totalNadadoras, setTotalNadadoras] = useState(0);
  const [hoy, setHoy] = useState({ asistencia: 0, total: 0 });
  const [ultimosDias, setUltimosDias] = useState<DiaResumen[]>([]);
  const [ranking, setRanking] = useState<Ranking[]>([]);
  const [rankingMesCompleto, setRankingMesCompleto] = useState<Ranking[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const getToday = () => new Date().toISOString().split("T")[0];

  const loadData = async () => {
    const today = getToday();

    const { data: nadadoras } = await supabase
      .from("nadadoras")
      .select("id");

    setTotalNadadoras(nadadoras?.length || 0);

    const { data: asistenciasHoy } = await supabase
      .from("asistencias")
      .select("*")
      .eq("fecha", today);

    if (asistenciasHoy) {
      const asistencia = asistenciasHoy.filter(
        (a) =>
          a.asistencia === "Asistencia" ||
          a.asistencia === "Retraso"
      ).length;

      setHoy({
        asistencia,
        total: asistenciasHoy.length,
      });
    }

    const dias: DiaResumen[] = [];
    let i = 0;

    while (dias.length < 7) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const fecha = d.toISOString().split("T")[0];

      const { data } = await supabase
        .from("asistencias")
        .select("*")
        .eq("fecha", fecha);

      if (!data || data.length === 0) {
        i++;
        continue;
      }

      const validas = data.filter(
        (a) => a.asistencia !== "NoLeTocabaEntrenar"
      );

      const asistencia = validas.filter(
        (a) =>
          a.asistencia === "Asistencia" ||
          a.asistencia === "Retraso"
      ).length;

      dias.push({
        fecha,
        asistencia,
        total: validas.length,
      });

      i++;
    }

    setUltimosDias(dias.reverse());

    const buildRanking = (rows: any[]) => {
      const map: Record<string, any> = {};

      rows.forEach((a: any) => {
        const nombre = a.nadadora_grupos?.nadadoras?.nombre;
        const apellido = a.nadadora_grupos?.nadadoras?.apellido ?? "";

        if (!nombre) return;
        if (a.asistencia === "NoLeTocabaEntrenar") return;

        const key = `${nombre} ${apellido}`;

        if (!map[key]) {
          map[key] = {
            nombre,
            apellido,
            total: 0,
            asistencia: 0,
          };
        }

        map[key].total++;

        if (
          a.asistencia === "Asistencia" ||
          a.asistencia === "Retraso"
        ) {
          map[key].asistencia++;
        }
      });

      return Object.values(map)
        .map((v: any) => ({
          nombre: v.nombre,
          apellido: v.apellido,
          porcentaje:
            v.total === 0
              ? 0
              : Math.round((v.asistencia / v.total) * 100),
        }))
        .sort((a, b) => b.porcentaje - a.porcentaje);
    };

    const firstDay = today.slice(0, 8) + "01";

    const { data: mes } = await supabase
      .from("asistencias")
      .select(`
        asistencia,
        nadadora_grupo_id,
        nadadora_grupos (
          nadadora_id,
          nadadoras ( nombre, apellido )
        )
      `)
      .gte("fecha", firstDay)
      .lte("fecha", today);

    if (mes) {
      const rankingMes = buildRanking(mes);
      setRanking(rankingMes.slice(0, 5));
      setRankingMesCompleto(rankingMes);
    }
  };

  const porcentajeHoy =
    hoy.total > 0
      ? Math.round((hoy.asistencia / hoy.total) * 100)
      : 0;

  const getDayName = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    if (dateStr === today) return "Hoy";

    return new Date(dateStr).toLocaleDateString("es-ES", {
      weekday: "long",
    });
  };

  const getColor = (p: number) => {
    if (p < 60) return "#e74c3c";
    if (p < 75) return "#f39c12";
    if (p < 90) return "#2ecc71";
    return "#1e8449";
  };

  const getMedal = (i: number) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return `${i + 1}.`;
  };

  return (
    <div className="inicio-container">

      {/* GENERAL */}
      <section className="inicio-section">
        <h2>🏊 Vista general</h2>

        <div className="inicio-grid">
          <div className="inicio-card total">
            <h3>{totalNadadoras}</h3>
            <p>Nadadoras</p>
          </div>

          <div className="inicio-card ok">
            <h3>{porcentajeHoy}%</h3>
            <p>Asistencia hoy</p>
          </div>

          <div className="inicio-card warning">
            <h3>{hoy.asistencia}/{hoy.total}</h3>
            <p>Hoy</p>
          </div>
        </div>
      </section>

      {/* ÚLTIMOS 7 DÍAS */}
      <section className="inicio-section">
        <h3>📅 Últimos 7 días</h3>

        <div className="inicio-list">
          {ultimosDias.map((d, i) => {
            const p = Math.round((d.asistencia / d.total) * 100);

            return (
              <div key={i} className="inicio-list-item vertical">

                <div className="row">
                  <span className="day">{getDayName(d.fecha)}</span>
                  <span>{p}%</span>
                </div>

                <div className="bar-bg">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${p}%`,
                      background: getColor(p),
                    }}
                  />
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* RANKING VISUAL */}
      <section className="inicio-section">
        <h3>🏆 Top asistencia del mes</h3>

        <div className="ranking">
          {ranking.map((r, i) => (
            <div key={i} className="ranking-card">

              <div className="left">
                <div className="avatar">
                  {r.nombre[0]}{r.apellido?.[0] || ""}
                </div>

                <div>
                  <div className="name">
                    {getMedal(i)} {r.nombre} {r.apellido}
                  </div>

                  <div className="mini-bar-bg">
                    <div
                      className="mini-bar-fill"
                      style={{
                        width: `${r.porcentaje}%`,
                        background: getColor(r.porcentaje),
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="percent">
                {r.porcentaje}%
              </div>

            </div>
          ))}
        </div>
      </section>

{/* MES COMPLETO */}
<section className="inicio-section">
  <h3>📊 Mes completo</h3>

  <div className="ranking-container">
    {rankingMesCompleto.map((r, i) => {
      const isTop3 = i < 3;

      return (
        <div key={i} className="ranking-item">
          
          {/* Posición */}
          <div className={`ranking-pos ${isTop3 ? "top" : ""}`}>
            {i + 1}
          </div>

          {/* Info */}
          <div className="ranking-info">
            <div className="ranking-name">
              {r.nombre} {r.apellido}
            </div>

            <div className="ranking-bar">
              <div
                className="ranking-fill"
                style={{ width: `${r.porcentaje}%` }}
              />
            </div>
          </div>

          {/* % */}
          <div className="ranking-percent">
            {r.porcentaje}%
          </div>
        </div>
      );
    })}
  </div>
</section>

    </div>
  );
}