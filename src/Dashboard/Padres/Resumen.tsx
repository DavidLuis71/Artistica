import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { supabase } from "../../lib/supabaseClient";
import { AsistenciasCalendario } from "../Admin/AsistenciaCalendario";

const formatearFecha = (fecha: string) => {
  const d = new Date(fecha);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
  });
};

const getColor = (value: number, type: "lowGood" | "highGood") => {
  if (type === "lowGood") {
    if (value <= 3) return "#4caf50"; // verde (bien)
    if (value <= 6) return "#ffb300"; // amarillo
    return "#ef5350"; // rojo (mal)
  } else {
    if (value >= 7) return "#4caf50";
    if (value >= 4) return "#ffb300";
    return "#ef5350";
  }
};
const diasSinValoracion = (fecha?: string) => {
  if (!fecha) return null;
  const hoy = new Date();
  const f = new Date(fecha);
  const diff = hoy.getTime() - f.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export default function ResumenPadre() {
  const [nadadoras, setNadadoras] = useState<any[]>([]);
  const [nadadoraSeleccionadaId, setNadadoraSeleccionadaId] =
    useState<number | "">("");

  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [proximaSesion, setProximaSesion] = useState<any>(null);
  const [valoraciones, setValoraciones] = useState<any[]>([]);
  const [proximaCompeticion, setProximaCompeticion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const nadadoraSeleccionada = nadadoras.find(
    (n) => n.id === nadadoraSeleccionadaId
  );

  useEffect(() => {
    cargarNadadoras();
  }, []);

  useEffect(() => {
    if (!nadadoraSeleccionadaId) return;
    cargarDatosNadadora();
  }, [nadadoraSeleccionadaId]);

 const cargarNadadoras = async () => {
  setLoading(true);

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const { data: padre } = await supabase
      .from("padres")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!padre) return;

    const { data: relaciones } = await supabase
      .from("padres_nadadoras")
      .select("nadadora_id")
      .eq("padre_id", padre.id);

    const ids = relaciones?.map((r) => r.nadadora_id) || [];

    const { data: nadadorasData } = await supabase
      .from("nadadoras")
      .select("*")
      .in("id", ids);

    const lista = nadadorasData || [];

    const hoy = new Date().toISOString().split("T")[0];

    const { data: competiciones } = await supabase
      .from("competiciones")
      .select("*")
      .gte("fecha", hoy)
      .order("fecha", { ascending: true })
      .limit(1);

    setProximaCompeticion(competiciones?.[0] || null);

    setNadadoras(lista);
    setNadadoraSeleccionadaId(lista[0]?.id || "");
  } finally {
    setLoading(false);
  }
};

  const cargarDatosNadadora = async () => {
   setLoading(true);

  try {
    const nadadoraId = nadadoraSeleccionadaId;

    setAsistencias([]);
    setProximaSesion(null);
    setValoraciones([]);

    // 🔹 Asistencias
    const { data: grupos } = await supabase
      .from("nadadora_grupos")
      .select("id")
      .eq("nadadora_id", nadadoraId);

    const grupoIds = grupos?.map((g) => g.id) || [];

    let asistenciasData: any[] = [];

    if (grupoIds.length > 0) {
      const { data } = await supabase
        .from("asistencias")
        .select("*")
        .in("nadadora_grupo_id", grupoIds);

      asistenciasData = data || [];
    }

    setAsistencias(asistenciasData);

    // 🔹 Próxima sesión
    const hoy = new Date().toISOString().split("T")[0];

    const { data: sesiones } = await supabase
      .from("sesiones_entrenamiento")
      .select("*")
      .gte("fecha", hoy)
      .order("fecha", { ascending: true })
      .limit(1);

    setProximaSesion(sesiones?.[0] || null);

    // 🔹 Valoraciones (últimas 3)
    const { data: valoracionesData } = await supabase
      .from("valoracion_entrenamiento")
      .select("*")
      .eq("nadadora_id", nadadoraId)
      .order("fecha", { ascending: false })
      .limit(3);

    setValoraciones(valoracionesData || []);
    } finally {
    setLoading(false);
  }
  };
const ultimaValoracion = valoraciones?.[0];
  if (loading || !nadadoraSeleccionadaId) {
  return (
    <Box sx={{
      height: "60vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: 2
    }}>
      <CircularProgress />
      <Typography sx={{ opacity: 0.7 }}>
        Cargando información...
      </Typography>
    </Box>
  );
}
  return (
    <Box >

      {/* 🔽 SELECT */}
      {nadadoras.length > 1 && (
        <Box sx={{ marginTop: "10px" }}>
          <FormControl fullWidth>
            <InputLabel sx={{color:"black"}}>Selecciona una hija</InputLabel>
            <Select
              value={nadadoraSeleccionadaId}
              label="Selecciona una hija"
              onChange={(e) =>
                setNadadoraSeleccionadaId(e.target.value as number)
              }
                  sx={{
      borderRadius: 3,
      color: "black",
      fontWeight: 600,

      background: "rgba(255, 255, 255, 0.62)",
      backdropFilter: "blur(12px)",

      border: "1px solid rgba(255, 255, 255, 0)",

      transition: "0.3s",

      "&:hover": {
        background: "rgba(255,255,255,0.18)",
        transform: "translateY(-1px)",
      },

      "& .MuiOutlinedInput-notchedOutline": {
        border: "none",
      },

      "& .MuiSelect-icon": {
        color: "black",
      },
    }}
            >
              {nadadoras.map((n) => (
                <MenuItem key={n.id} value={n.id}>
                  {n.nombre} {n.apellido}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* 🔒 CONTENIDO */}
      {nadadoraSeleccionada && (
        <Grid
  container
  spacing={2}
  sx={{
    maxWidth: 1100,
    justifyContent: "center",
    alignItems: "stretch",
  }}
>

          {/* 👧 INFO */}
          <Grid sx={{marginTop:"10px"}}>
            <Card>
              <CardContent sx={{ display: "flex", gap: 2 }}>
                <Avatar
                  src={nadadoraSeleccionada.foto_pos}
                  sx={{ width: 60, height: 60 }}
                />
                <Box>
                  <Typography variant="h6">
                    {nadadoraSeleccionada.nombre} {nadadoraSeleccionada.apellido}
                  </Typography>
                  <Typography>
                    Nivel {nadadoraSeleccionada.nivel}
                  </Typography>
                  <Typography>
                    {nadadoraSeleccionada.puntos} puntos
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 📅 ASISTENCIAS */}
          <Grid>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">
                  Asistencias
                </Typography>

                {asistencias.length === 0 ? (
                  <Typography>No hay datos</Typography>
                ) : (
                  <AsistenciasCalendario asistencias={asistencias} />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 📅 PRÓXIMA SESIÓN */}
          <Grid>
            <Card
              sx={{
                borderRadius: 3,
                background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                color: "white",
              }}
            >
              <CardContent>

                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                  Próximo entrenamiento
                </Typography>

                {proximaSesion ? (
                  <Box sx={{ mt: 1 }}>

                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {proximaSesion.titulo}
                    </Typography>

                    <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 0.5 }}>

                      <Typography sx={{ opacity: 0.9, fontWeight: 500 }}>
                        📅 {proximaSesion.dia_semana} · {formatearFecha(proximaSesion.fecha)}
                      </Typography>

                      <Typography sx={{ opacity: 0.75 }}>
                        🕒 {proximaSesion.hora_inicio?.slice(0, 5)} -{" "}
                        {proximaSesion.hora_fin?.slice(0, 5)}
                      </Typography>

                    </Box>

                  </Box>
                ) : (
                  <Typography sx={{ opacity: 0.8 }}>
                    No hay sesiones próximas
                  </Typography>
                )}

              </CardContent>
            </Card>
          </Grid>

          {/* 💬 VALORACIONES (NUEVO SISTEMA) */}
{/* 💬 VALORACIONES (NUEVO SISTEMA) */}
<Grid>
  <Card
    sx={{
      borderRadius: 3,
      background: "linear-gradient(135deg, #141E30 0%, #243B55 100%)",
      color: "white",
    }}
  >
    <CardContent>

      <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
        Seguimiento diario
      </Typography>

      {/* ⚠️ ALERTA */}
     {ultimaValoracion &&
  diasSinValoracion(ultimaValoracion.fecha) !== null &&
  diasSinValoracion(ultimaValoracion.fecha)! > 5 && (
          <Box
            sx={{
              mt: 2,
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              background: "rgba(255, 87, 87, 0.15)",
              border: "1px solid rgba(255, 87, 87, 0.4)",
            }}
          >
            <Typography sx={{ fontWeight: 600 }}>
              ⚠️ Falta de seguimiento diario
            </Typography>

            <Typography sx={{ fontSize: 13, opacity: 0.8 }}>
              Lleva {diasSinValoracion(valoraciones[0].fecha)} días sin registrar valoraciones.
            </Typography>
          </Box>
        )}

      {/* LISTA */}
      {valoraciones.length === 0 ? (
        <Box sx={{
          mt: 2,
          p: 1.5,
          borderRadius: 2,
          background: "rgba(255, 87, 87, 0.15)",
          border: "1px solid rgba(255, 87, 87, 0.4)",
        }}>
          <Typography sx={{ fontWeight: 500 }}>
            Sin valoraciones registradas
          </Typography>

          <Typography sx={{ fontSize: 13, opacity: 0.8 }}>
            La nadadora aún no ha enviado ningún seguimiento de entrenamiento.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>

         {valoraciones.map((v) => (
  <Box
    key={v.id}
    sx={{
      p: 1.5,
      borderRadius: 2,
      background: "rgba(255,255,255,0.08)",
    }}
  >

    {/* FECHA */}
    <Typography sx={{ fontSize: 13, opacity: 0.85, mb: 1 }}>
      📅 {new Date(v.fecha).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })}
    </Typography>

    {/* GRID DE ESTADOS VISUALES */}
    <Grid container spacing={1}>

      {/* CANSANCIO ENTRENAMIENTO (menos es mejor) */}
      <Grid>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography sx={{ fontSize: 12 }}>Cansancio entrenamiento</Typography>

          <Box
            sx={{
              height: 6,
              borderRadius: 5,
              background: "#333",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${(v.cansancio_entrenamiento / 10) * 100}%`,
                height: "100%",
                background: getColor(v.cansancio_entrenamiento, "lowGood"),
              }}
            />
          </Box>

          <Typography sx={{ fontSize: 12, opacity: 0.8 }}>
            {v.cansancio_entrenamiento}/10
          </Typography>
        </Box>
      </Grid>

      {/* CANSANCIO GENERAL */}
      <Grid>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography sx={{ fontSize: 12 }}>Cansancio general</Typography>

          <Box sx={{ height: 6, borderRadius: 5, background: "#333" }}>
            <Box
              sx={{
                width: `${(v.cansancio_general / 10) * 100}%`,
                height: "100%",
                background: getColor(v.cansancio_general, "lowGood"),
              }}
            />
          </Box>

          <Typography sx={{ fontSize: 12, opacity: 0.8 }}>
            {v.cansancio_general}/10
          </Typography>
        </Box>
      </Grid>

      {/* MOTIVACIÓN (más es mejor) */}
      <Grid>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography sx={{ fontSize: 12 }}>Motivación</Typography>

          <Box sx={{ height: 6, borderRadius: 5, background: "#333" }}>
            <Box
              sx={{
                width: `${(v.motivacion / 10) * 100}%`,
                height: "100%",
                background: getColor(v.motivacion, "highGood"),
              }}
            />
          </Box>

          <Typography sx={{ fontSize: 12, opacity: 0.8 }}>
            {v.motivacion}/10
          </Typography>
        </Box>
      </Grid>

      {/* PRODUCTIVIDAD */}
      <Grid>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography sx={{ fontSize: 12 }}>Productividad</Typography>

          <Box sx={{ height: 6, borderRadius: 5, background: "#333" }}>
            <Box
              sx={{
                width: `${(v.productividad / 10) * 100}%`,
                height: "100%",
                background: getColor(v.productividad, "highGood"),
              }}
            />
          </Box>

          <Typography sx={{ fontSize: 12, opacity: 0.8 }}>
            {v.productividad}/10
          </Typography>
        </Box>
      </Grid>

    </Grid>

    {/* COMENTARIO */}
    {v.comentarios && (
      <Box sx={{ mt: 1 }}>
        <Typography sx={{ fontSize: 12, opacity: 0.8 }}>
          Comentario
        </Typography>
        <Typography sx={{ fontSize: 13 }}>
          {v.comentarios}
        </Typography>
      </Box>
    )}

  </Box>
))}

        </Box>
      )}

    </CardContent>
  </Card>
</Grid>
{/* 🏆 PRÓXIMA COMPETICIÓN */}
<Grid>
  <Card
    sx={{
      borderRadius: 3,
      background: "linear-gradient(135deg, #141E30 0%, #243B55 100%)",
      color: "white",
    }}
  >
    <CardContent>

      <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
        Próxima competición
      </Typography>

      {proximaCompeticion ? (
        <Box sx={{ mt: 1 }}>

          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {proximaCompeticion.nombre}
          </Typography>

          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 0.5 }}>

            <Typography sx={{ opacity: 0.9 }}>
             
               📅 {proximaCompeticion.fecha}
            </Typography>

            {proximaCompeticion.lugar && (
              <Typography sx={{ opacity: 0.8 }}>
                📍 {proximaCompeticion.lugar}
              </Typography>
            )}

            {proximaCompeticion.hora_comienzo && (
              <Typography sx={{ opacity: 0.75 }}>
                🕒 {proximaCompeticion.hora_comienzo.slice(0, 5)}
              </Typography>
            )}

          </Box>

        </Box>
      ) : (
        <Typography sx={{ opacity: 0.8 }}>
          No hay competiciones próximas
        </Typography>
      )}

    </CardContent>
  </Card>
</Grid>
        </Grid>
      )}
    </Box>
  );
}