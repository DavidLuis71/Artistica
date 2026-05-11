import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Stack,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
  
} from "@mui/material";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const labels: Record<string, string> = {
  Asistencia: "Asistencias",
  Retraso: "Retrasos",
  Falta: "Faltas",
  FaltaJustificada: "Justificadas",
  Enferma: "Enfermas",
};
const diasSemana = [
  "Lunes","Martes","Miécoles","Jueves","Viernes","Sábado","Domingo"
];

const formatearFecha = (f: string) =>
  new Date(f).toLocaleDateString("es-ES");

const diasTexto = (dias: number[] = []) =>
  dias.map((i) => diasSemana[i].toLowerCase()).join(", ");


const asistenciaColor: { [key: string]: string } = {
  Asistencia: "#4ce751ff",
  Falta: "#ff6150ff",
  Retraso: "#f39c12",
  Enferma: "#c873e9ff",
  FaltaJustificada: "#35aeffff",
  NoLeTocabaEntrenar: "#888888ff",
};

interface Nadadora {
  id: number;
  nombre: string;
  apellido: string;
}

interface Asistencia {
  id: number;
  fecha: string;
  asistencia: string;
}

export default function Asistencias() {
  const [loading, setLoading] = useState(true);

  const [nadadoras, setNadadoras] = useState<Nadadora[]>([]);
  const [selectedNadadora, setSelectedNadadora] = useState<number | "">("");
const [ausenciasRecurrentes, setAusenciasRecurrentes] = useState<any[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
const [tipoAusencia, setTipoAusencia] = useState("fecha_unica");
const [motivo, setMotivo] = useState("");
const [fechaInicio, setFechaInicio] = useState("");
const [fechaFin, setFechaFin] = useState("");
const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

useEffect(() => {
  if (selectedNadadora) {
    cargarAsistencias(selectedNadadora);
    cargarAusenciasRecurrentes(selectedNadadora);
  }
}, [selectedNadadora]);

const cargarAusenciasRecurrentes = async (nadadoraId: number) => {
  const { data, error } = await supabase
    .from("ausencias_recurrentes")
    .select("*")
    .eq("nadadora_id", nadadoraId);

  if (!error) setAusenciasRecurrentes(data || []);
};

  const cargarDatos = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Buscar padre
    const { data: padre, error: padreError } = await supabase
      .from("padres")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (padreError || !padre) {
      console.error(padreError);
      setLoading(false);
      return;
    }

    // Buscar hijas
    const { data, error } = await supabase
      .from("padres_nadadoras")
      .select(`
        nadadoras (
          id,
          nombre,
          apellido
        )
      `)
      .eq("padre_id", padre.id);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const nadadorasFormateadas =
      data?.map((item: any) => item.nadadoras) || [];

    setNadadoras(nadadorasFormateadas);

    // Seleccionar automáticamente la primera
    if (nadadorasFormateadas.length > 0) {
      setSelectedNadadora(nadadorasFormateadas[0].id);
    }

    setLoading(false);
  };

  const cargarAsistencias = async (nadadoraId: number) => {
    setAsistencias([]);

    // Buscar grupo actual
    const { data: grupo, error: grupoError } = await supabase
      .from("nadadora_grupos")
      .select("id")
      .eq("nadadora_id", nadadoraId)
      .order("fecha_asignacion", { ascending: false })
      .limit(1)
      .single();

    if (grupoError || !grupo) {
      console.error(grupoError);
      return;
    }

    // Buscar asistencias
    const { data, error } = await supabase
      .from("asistencias")
      .select("*")
      .eq("nadadora_grupo_id", grupo.id)
      .order("fecha", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setAsistencias(data || []);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 10,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

 const hoy = new Date();

const mesActual = hoy.getMonth() + 1;
const añoActual = hoy.getFullYear();

const esPositiva = (a: string) =>
  a === "Asistencia" || a === "Retraso";

const esNegativa = (a: string) =>
  a === "Falta" || a === "FaltaJustificada" || a === "Enferma";

const esValida = (a: string) =>
  esPositiva(a) || esNegativa(a);

const asistenciasMes = asistencias.filter((a) => {
  const [year, month] = a.fecha.split("-").map(Number);

  return (
    month === mesActual &&
    year === añoActual
  );
});


const asistenciasValidasMes = asistenciasMes.filter((a) =>
  esValida(a.asistencia)
);

const positivasMes = asistenciasMes.filter((a) =>
  esPositiva(a.asistencia)
).length;

const porcentaje =
  asistenciasValidasMes.length > 0
    ? Math.round((positivasMes / asistenciasValidasMes.length) * 100)
    : 0;


    // =========================
// PORCENTAJE TOTAL CURSO
// =========================


const asistenciasValidasCurso = asistencias.filter((a) =>
  esValida(a.asistencia)
);

const positivasCurso = asistencias.filter((a) =>
  esPositiva(a.asistencia)
).length;

const porcentajeTotal =
  asistenciasValidasCurso.length > 0
    ? Math.round((positivasCurso / asistenciasValidasCurso.length) * 100)
    : 0;


const getPorcentajeColor = (valor: number) => {
  if (valor < 50) return "#e53935"; // rojo peligro
  if (valor < 65) return "#fb8c00"; // naranja
  if (valor < 75) return "#fdd835"; // amarillo
  if (valor < 85) return "#7cb342"; // verde suave

  return "#43a047"; // verde bueno
};

const porcentajeColor = getPorcentajeColor(porcentaje);

const porcentajeTotalColor = getPorcentajeColor(porcentajeTotal);

const contarTipos = (lista: Asistencia[]) => {
  return {
    Asistencia: lista.filter((a) => a.asistencia === "Asistencia").length,
    Retraso: lista.filter((a) => a.asistencia === "Retraso").length,
    Falta: lista.filter((a) => a.asistencia === "Falta").length,
    FaltaJustificada: lista.filter((a) => a.asistencia === "FaltaJustificada").length,
    Enferma: lista.filter((a) => a.asistencia === "Enferma").length,
  };
};

const mes = contarTipos(asistenciasMes);
const curso = contarTipos(asistencias);

const guardarAusencia = async () => {
  if (!selectedNadadora) return;

  const payload: any = {
    nadadora_id: selectedNadadora,
    motivo,
    tipo_recurrencia: tipoAusencia,
  };

  if (tipoAusencia === "fecha_unica") {
    payload.fecha_inicio = fechaInicio;
  }

  if (tipoAusencia === "rango") {
    payload.fecha_inicio = fechaInicio;
    payload.fecha_fin = fechaFin;
  }

  if (tipoAusencia === "semanal") {
    payload.dias_semana = diasSeleccionados;
  }

  const { error } = await supabase
    .from("ausencias_recurrentes")
    .insert(payload);

  if (!error) {
    setModalOpen(false);
    setMotivo("");
    setFechaInicio("");
    setFechaFin("");
    setDiasSeleccionados([]);
    cargarAusenciasRecurrentes(selectedNadadora as number);
  } else {
    console.error(error);
  }
};

  return (
    <Box>

      {/* SELECTOR NADADORA */}
      <FormControl fullWidth sx={{ mb: 3, marginTop:"10px" }}>
        <InputLabel>Nadadora</InputLabel>

        <Select
          value={selectedNadadora}
          label="Nadadora"
          onChange={(e) =>
            setSelectedNadadora(Number(e.target.value))
          }
        >
          {nadadoras.map((n) => (
            <MenuItem key={n.id} value={n.id}>
              {n.nombre} {n.apellido || ""}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
{ausenciasRecurrentes.length > 0 && (
  <Chip
    label={`📅 ${ausenciasRecurrentes.length} ausencias programadas`}
    color="warning"
    sx={{ mb: 2 }}
  />
)}
<button
  onClick={() => setModalOpen(true)}
  style={{
    marginBottom: 12,
    padding: "8px 12px",
    borderRadius: 8,
    background: "#1976d2",
    color: "white",
    border: "none",
  }}
>
  ➕ Añadir ausencia
</button>
      {/* RESUMEN */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Card>
  <CardContent>
    <Typography variant="h6">
      Ausencias programadas
    </Typography>

    {ausenciasRecurrentes.length === 0 ? (
      <Typography color="text.secondary">
        No hay ausencias programadas.
      </Typography>
    ) : (
<List dense sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
  {ausenciasRecurrentes.map((a) => (
    <Card
      key={a.id}
      variant="outlined"
      sx={{
        p: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >

      <Typography
        variant="caption"
        sx={{  minWidth: 120, textAlign: "right" }}
      >
       {a.tipo_recurrencia === "fecha_unica"
  ? `${formatearFecha(a.fecha_inicio)} · ${a.motivo}`

  : a.tipo_recurrencia === "rango"
  ? `${formatearFecha(a.fecha_inicio)} → ${formatearFecha(a.fecha_fin)} · ${a.motivo}`

  : a.tipo_recurrencia === "semanal"
  ? `Todos los ${diasTexto(a.dias_semana)} · ${a.motivo}`

  : a.motivo}
      </Typography>
    </Card>
  ))}
</List>
    )}
  </CardContent>
</Card>
        <Card>
          <CardContent>
            <Typography variant="h6">
              Porcentaje mensual
            </Typography>

            <Typography
  variant="h3"
  sx={{
    fontWeight: "bold",
    color: porcentajeColor,
    transition: "0.3s",
  }}
>
  {porcentaje}%
</Typography>

          <LinearProgress
  variant="determinate"
  value={porcentaje}
  sx={{
    height: 12,
    borderRadius: 10,
    mt: 2,
    backgroundColor: "#e0e0e0",

    "& .MuiLinearProgress-bar": {
      backgroundColor: porcentajeColor,
      borderRadius: 10,
      transition: "0.4s",
    },
  }}
/>
<Box
  sx={{
    display: "flex",
    flexWrap: "wrap",
    gap: 1,
    mt: 2,
  }}
>
  {Object.entries(mes).map(([key, value]) => (
    <Chip
      key={key}
      label={`${labels[key]}: ${value}`}
      sx={{
        backgroundColor: asistenciaColor[key],
        color: "#fff",
        fontWeight: "bold",
        fontSize: "1rem",
      }}
    />
  ))}
</Box>
          </CardContent>
        </Card>

        <Card>
  <CardContent>
    <Typography variant="h6">
      Asistencia total del curso
    </Typography>

    <Typography
      variant="h3"
      sx={{
        fontWeight: "bold",
        color: porcentajeTotalColor,
      }}
    >
      {porcentajeTotal}%
    </Typography>

    <LinearProgress
      variant="determinate"
      value={porcentajeTotal}
      sx={{
        height: 12,
        borderRadius: 10,
        mt: 2,
        backgroundColor: "#e0e0e0",
        "& .MuiLinearProgress-bar": {
          backgroundColor: porcentajeTotalColor,
        },
      }}
    />
    <Box
  sx={{
    display: "flex",
    flexWrap: "wrap",
    gap: 1,
    mt: 2,
  }}
>
  {Object.entries(curso).map(([key, value]) => (
    <Chip
      key={key}
      label={`${labels[key]}: ${value}`}
      sx={{
        backgroundColor: asistenciaColor[key],
        color: "#fff",
        fontWeight: "bold",
        fontSize: "1rem",
      }}
    />
  ))}
</Box>
  </CardContent>
</Card>

      </Stack>

      {/* HISTORIAL */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Historial
          </Typography>

          {asistencias.length === 0 ? (
            <Typography color="text.secondary">
              No hay asistencias registradas.
            </Typography>
          ) : (
            <Box
 sx={{
  maxHeight: 400,
  overflowY: "auto",
  pr: 1,
  scrollBehavior: "smooth",
  borderRadius: 2,
}}
>
            <List>
              {asistencias.map((a) => (
                <ListItem
                  key={a.id}
                  divider
                  secondaryAction={
                  <Chip
  label={a.asistencia}
  sx={{
    backgroundColor: asistenciaColor[a.asistencia],
    color: "#fff",
    fontWeight: "bold",
  }}
/>
                  }
                >
                  <ListItemText
                    primary={new Date(a.fecha).toLocaleDateString(
                      "es-ES"
                    )}
                  />
                </ListItem>
              ))}
            </List>
            </Box>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
 <Dialog
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>Nueva ausencia</DialogTitle>

<DialogContent dividers>
  <Stack spacing={2}>

    <TextField
      label="Motivo"
      value={motivo}
      onChange={(e) => setMotivo(e.target.value)}
      fullWidth
    />

    <FormControl fullWidth>
      <InputLabel>Tipo de ausencia</InputLabel>
      <Select
        value={tipoAusencia}
        label="Tipo de ausencia"
        onChange={(e) => setTipoAusencia(e.target.value)}
      >
        <MenuItem value="fecha_unica">Fecha única</MenuItem>
        <MenuItem value="rango">Rango de fechas</MenuItem>
        <MenuItem value="semanal">Recurrente semanal</MenuItem>
      </Select>
    </FormControl>

    {tipoAusencia === "fecha_unica" && (
      <TextField
        label="Fecha"
        type="date"
       slotProps={{
    inputLabel: { shrink: true },
  }}
        value={fechaInicio}
        onChange={(e) => setFechaInicio(e.target.value)}
        fullWidth
      />
    )}

    {tipoAusencia === "rango" && (
      <Stack direction="row" spacing={2}>
        <TextField
          label="Inicio"
          type="date"
           slotProps={{
    inputLabel: { shrink: true },
  }}
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          fullWidth
        />
        <TextField
          label="Fin"
          type="date"
          slotProps={{
    inputLabel: { shrink: true },
  }}
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          fullWidth
        />
      </Stack>
    )}

    {tipoAusencia === "semanal" && (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Días de la semana
        </Typography>

        <Stack direction="row" spacing={1}>
          {diasSemana.map((d, i) => {
            const selected = diasSeleccionados.includes(i);

            return (
              <Chip
                key={i}
                label={d}
                clickable
                color={selected ? "primary" : "default"}
                variant={selected ? "filled" : "outlined"}
                onClick={() => {
                  if (selected) {
                    setDiasSeleccionados(
                      diasSeleccionados.filter((x) => x !== i)
                    );
                  } else {
                    setDiasSeleccionados([...diasSeleccionados, i]);
                  }
                }}
              />
            );
          })}
        </Stack>
      </Box>
    )}
  </Stack>
</DialogContent>

<DialogActions sx={{ px: 3, py: 2 }}>
  <Button
    onClick={() => setModalOpen(false)}
    color="inherit"
  >
    Cancelar
  </Button>

  <Button
    variant="contained"
    onClick={guardarAusencia}
    disabled={
      !motivo ||
      (tipoAusencia === "fecha_unica" && !fechaInicio) ||
      (tipoAusencia === "rango" && (!fechaInicio || !fechaFin)) ||
      (tipoAusencia === "semanal" && diasSeleccionados.length === 0)
    }
  >
    Guardar ausencia
  </Button>
</DialogActions>
</Dialog>
)}
    </Box>
  );
}