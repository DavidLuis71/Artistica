import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { supabase } from "../../lib/supabaseClient";

interface BloqueEntreno {
  titulo: string;
  series: string[];
}
function esVacacion(fecha: Date, vacaciones: any[]) {
  const f = normalizarFecha(fecha).getTime();

  return vacaciones.some(v => {
    const inicio = normalizarFecha(new Date(v.fecha_inicio)).getTime();
    const fin = normalizarFecha(new Date(v.fecha_fin)).getTime();

    return f >= inicio && f <= fin;
  });
}


function formatearFechaBonita(fecha: string | Date) {
  const d = new Date(fecha);

  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

interface Sesion {
  id: number;
  dia_semana: string;
  descripcion: BloqueEntreno[];
  hora_inicio: string;
  hora_fin: string;
  tipo_sesion: string;
  fecha: string;
  grupo_id?: number | null;
}

interface Props {
  userId: string;
}

function normalizarTexto(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
function capitalizarPrimera(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function normalizarFecha(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getDiaSemana(date: Date) {
  return date.toLocaleDateString("es-ES", { weekday: "long" });
}

export default function EntrenamientosUser({ userId }: Props) {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [grupoId, setGrupoId] = useState<number | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<any | null>(null);
  const [vacaciones, setVacaciones] = useState<any[]>([]);

  const abrirSesion = (sesion: any) => {
  if (!sesion) return;
  setDiaSeleccionado(sesion);
};

  useEffect(() => {
    async function fetchData() {
      const { data: nadadora } = await supabase
        .from("nadadoras")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!nadadora) return;
      const { data: vac } = await supabase
  .from("vacaciones")
  .select("*");

setVacaciones(vac || []);

      const { data: grupo } = await supabase
        .from("nadadora_grupos")
        .select("grupo_id")
        .eq("nadadora_id", nadadora.id)
        .single();

      setGrupoId(grupo?.grupo_id ?? null);

      const { data } = await supabase
        .from("sesiones_entrenamiento")
        .select("*")
        .order("fecha", { ascending: true });

      setSesiones(data || []);
    }

    fetchData();
  }, [userId]);

const hoySesion = useMemo(() => {
  const hoy = new Date();

  // 🚨 PRIORIDAD VACACIONES
  if (esVacacion(hoy, vacaciones)) return null;

  const dia = normalizarTexto(getDiaSemana(hoy));

  return sesiones.find(
    (s) =>
      normalizarTexto(s.dia_semana) === dia &&
      (grupoId === null || s.grupo_id === null || s.grupo_id === grupoId)
  );
}, [sesiones, grupoId, vacaciones]);

  const hoyVacaciones = useMemo(() => {
  return esVacacion(new Date(), vacaciones);
}, [vacaciones]);

const proximoSesion = useMemo(() => {
  // si hoy hay entrenamiento → no mostramos "próximo"
  if (hoySesion) return null;

  const hoy = normalizarFecha(new Date());

  return sesiones
    .filter((s) => {
      const fecha = normalizarFecha(new Date(s.fecha));
     return (
  fecha >= hoy &&
  !esVacacion(new Date(s.fecha), vacaciones) &&
  (grupoId === null || s.grupo_id === null || s.grupo_id === grupoId)
);
    })
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0];
}, [sesiones, grupoId, hoySesion]);

  const calendario = useMemo(() => {
    const base = new Date();

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);

      const dia = normalizarTexto(getDiaSemana(d));

   const sesion = sesiones.find((s) =>
  normalizarTexto(s.dia_semana) === dia &&
  !esVacacion(d, vacaciones) &&  
  (grupoId === null || s.grupo_id === null || s.grupo_id === grupoId)
);

      return { fecha: d, sesion };
    });
  }, [sesiones, grupoId]);

const renderBloques = (sesion?: Sesion) => (
  <Stack spacing={1.5} sx={{ mt: 1 }}>
    {(sesion?.descripcion || []).map((b, i) => (
      <Box
        key={i}
        sx={{
          p: 1.5,
          borderRadius: 3,
          background: "linear-gradient(135deg, #ffffff, #f7f9fc)",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        }}
      >
        {/* TITULO BLOQUE */}
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: 14,
            mb: 1,
            color: "#1e293b",
          }}
        >
          {b.titulo}
        </Typography>

        {/* LISTA DE SERIES */}
        <Stack spacing={0.8}>
          {b.series.map((serie, idx) => (
            <Box
              key={idx}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1,
                borderRadius: 2,
                backgroundColor: "rgba(25, 118, 210, 0.06)",
              }}
            >
              {/* bullet bonito */}
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "primary.main",
                  flexShrink: 0,
                }}
              />

              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#334155",
                }}
              >
                {serie}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    ))}
  </Stack>
);

  return (
    <Box sx={{ p: 2, maxWidth: 900, mx: "auto" }}>

      {/* 🔵 HOY */}
<Card
  sx={{
    mb: 2,
    borderRadius: 5,
    p: 0,
    overflow: "hidden",
    background:
      "linear-gradient(135deg, #2563eb 0%, #60a5fa 40%, #ecfeff 100%)",
    boxShadow: "0 12px 40px rgba(37,99,235,0.25)",
    color: "white",
  }}
>
  {/* HEADER VISUAL */}
  <Box
    sx={{
      p: 2,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "rgba(0,0,0,0.12)",
      backdropFilter: "blur(6px)",
    }}
  >
    <Box>
      <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
        🔥  HOY
      </Typography>

      <Typography sx={{ fontSize: 13, opacity: 0.85 }}>
        {new Date().toLocaleDateString("es-ES", {
          weekday: "long",
          day: "2-digit",
          month: "long",
        })}
      </Typography>
    </Box>

    {hoySesion && (
      <Box
        sx={{
          px: 1.5,
          py: 0.5,
          borderRadius: 999,
          backgroundColor: "rgba(34,197,94,0.2)",
          fontWeight: 900,
          fontSize: 12,
        }}
      >
        EN CURSO 💪
      </Box>
    )}
  </Box>

  <CardContent sx={{ bgcolor: "white", color: "#0f172a" }}>
{hoyVacaciones ? (
  <Typography sx={{ opacity: 0.8 }}>
    🏖️ Día de vacaciones
  </Typography>
) : !hoySesion ? (
  <Typography sx={{ opacity: 0.6 }}>
    Hoy no hay entrenamiento programado
  </Typography>
    ) : (
      <>
        {/* CHIP */}
        <Chip
          label={hoySesion.tipo_sesion}
          sx={{
            fontWeight: 800,
            mb: 2,
            background: "#eff6ff",
            color: "#1d4ed8",
          }}
        />

        {/* BLOQUES */}
        <Stack spacing={2}>
          {(hoySesion.descripcion || []).map((b, i) => {
            // colores suaves alternos
            const bgColors = ["#eff6ff", "#ecfeff", "#f0fdf4"];

            return (
              <Box
                key={i}
                sx={{
                  p: 2,
                  borderRadius: 4,
                  background: bgColors[i % bgColors.length],
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                {/* TITULO BLOQUE */}
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 15,
                    mb: 1,
                    color: "#0f172a",
                  }}
                >
                  {b.titulo}
                </Typography>

                {/* SERIES */}
                <Stack spacing={1}>
                  {b.series.map((s, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1,
                        borderRadius: 2,
                        background: "white",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background:
                            i === 0
                              ? "#3b82f6"
                              : i === 1
                              ? "#06b6d4"
                              : "#22c55e",
                        }}
                      />

                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                        {s}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Stack>

        {/* HORARIO */}
        <Typography sx={{ mt: 2, fontSize: 13, opacity: 0.6 }}>
          🕒 {hoySesion.hora_inicio} - {hoySesion.hora_fin}
        </Typography>
      </>
    )}
  </CardContent>
</Card>

      {/* 🟢 PRÓXIMO */}
      <Card
        sx={{
          mb: 2,
          borderRadius: 4,
          boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
        }}
      >
        <CardContent>
          <Typography sx={{ fontWeight: 700 }}>
            Próximo entrenamiento
          </Typography>

          {proximoSesion ? (
            <Box>
              <Chip
                label={proximoSesion.tipo_sesion}
                color="success"
                sx={{ mt: 1 }}
              />

              {renderBloques(proximoSesion)}

              <Typography sx={{ mt: 1, opacity: 0.6, fontSize: 13 }}>
                {proximoSesion.fecha} · {proximoSesion.hora_inicio}
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ mt: 1, opacity: 0.5 }}>
              Todavia no se puede ver el siguiente entrenamiento
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* 📅 CALENDARIO */}
      <Card
        sx={{
          borderRadius: 4,
          boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
        }}
      >
        <CardContent>
          <Typography sx={{ fontWeight: 700, mb: 2 }}>
            Semana
          </Typography>

          <Stack spacing={1}>
            {calendario.map((d, i) => (
            <Box
  key={i}
  onClick={() => abrirSesion(d.sesion)}
  sx={{
    p: 1.5,
    borderRadius: 3,
    cursor: d.sesion ? "pointer" : "default",
    transition: "0.25s",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",

    background: d.sesion
      ? "linear-gradient(135deg, #e0f2fe, #f0f9ff)"
      : "linear-gradient(135deg, #f8fafc, #ffffff)",

    border: d.sesion
      ? "1px solid rgba(59,130,246,0.25)"
      : "1px solid rgba(0,0,0,0.05)",

    boxShadow: d.sesion
      ? "0 4px 14px rgba(59,130,246,0.15)"
      : "0 2px 6px rgba(0,0,0,0.04)",

    "&:hover": d.sesion
      ? {
          transform: "translateY(-2px)",
          boxShadow: "0 10px 25px rgba(59,130,246,0.25)",
        }
      : {},
  }}
>
       
                <Typography sx={{ fontWeight: 500 }}>
                  {d.fecha.toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </Typography>

             {esVacacion(d.fecha, vacaciones) ? (
  <Chip
    size="small"
    label="Vacaciones 🏖️"
    sx={{
      fontWeight: 800,
      borderRadius: 2,
      background: "rgba(245, 158, 11, 0.15)",
      color: "#b45309",
    }}
  />
) : d.sesion ? (
  <Chip
    size="small"
    label={d.sesion.tipo_sesion}
    sx={{
      fontWeight: 700,
      borderRadius: 2,
      background: "rgba(59,130,246,0.12)",
      color: "#1d4ed8",
    }}
  />
) : (
  <Typography sx={{ opacity: 0.4, fontSize: 13 }}>
    Descanso
  </Typography>
)}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
      <Dialog
  open={Boolean(diaSeleccionado)}
  onClose={() => setDiaSeleccionado(null)}
  fullWidth
  maxWidth="sm"
>
<DialogTitle
  sx={{
    fontWeight: 900,
    background: "linear-gradient(135deg, #2563eb, #60a5fa)",
    color: "white",
  }}
>
  📅{" "}
  {diaSeleccionado
    ? capitalizarPrimera(formatearFechaBonita(diaSeleccionado.fecha))
    : "Entrenamiento del día"}
</DialogTitle>

  <DialogContent sx={{ mt: 2 }}>
    {diaSeleccionado ? (
      <>
        <Chip
          label={diaSeleccionado.tipo_sesion}
          sx={{ mb: 2, fontWeight: 700 }}
        />

        {renderBloques(diaSeleccionado)}

        <Typography sx={{ mt: 2, opacity: 0.6 }}>
          🕒 {diaSeleccionado.hora_inicio} - {diaSeleccionado.hora_fin}
        </Typography>
      </>
    ) : (
      <Typography>No hay entrenamiento</Typography>
    )}
  </DialogContent>
</Dialog>
    </Box>
  );
}