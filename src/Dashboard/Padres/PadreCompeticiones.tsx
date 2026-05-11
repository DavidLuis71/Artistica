import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  CircularProgress,
    Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from "@mui/material";

const tipoChipStyles: Record<string, any> = {
  rutinas: {
    bgcolor: "#E3F2FD",
    color: "#1565C0",
    border: "1px solid #90CAF9",
  },
  figuras: {
    bgcolor: "#F3E5F5",
    color: "#6A1B9A",
    border: "1px solid #CE93D8",
  },
  tiempos: {
    bgcolor: "#E8F5E9",
    color: "#2E7D32",
    border: "1px solid #A5D6A7",
  },
  niveles: {
    bgcolor: "#FFF3E0",
    color: "#EF6C00",
    border: "1px solid #FFCC80",
  },
};

interface Competicion {
  id: number;
  nombre: string;
  tipo: "rutinas" | "figuras" | "tiempos" | "niveles";
  fecha: string;
  lugar: string;
  latitud?: number | null;
  longitud?: number | null;
  descripcion: string;
  hora_comienzo: string;
  hora_llegada: string;
  material_necesario: string;
  estado: "programada" | "curso" | "finalizada";
}


export default function CompeticionesPadre() {
  const [loading, setLoading] = useState(true);
  const [competencias, setCompetencias] = useState<Competicion[]>([]);
const [open, setOpen] = useState(false);
const [selected, setSelected] = useState<Competicion | null>(null);

const handleOpen = (c: Competicion) => {
  setSelected(c);
  setOpen(true);
};

const handleClose = () => {
  setOpen(false);
  setSelected(null);
};
  useEffect(() => {
    cargarDatos();
  }, []);

  const renderTipoChip = (tipo: string) => {
  const style = tipoChipStyles[tipo] || {};

  return (
    <Chip
      label={tipo.toUpperCase()}
      size="small"
      sx={{
        fontWeight: 600,
        ...style,
      }}
    />
  );
};
  const cargarDatos = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // 👨‍👩‍👧 Padre
    const { data: padre } = await supabase
      .from("padres")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!padre) return;

    // 🏁 Competiciones
    const { data: comps } = await supabase
      .from("competiciones")
      .select("*")
      .order("fecha", { ascending: true });

    setCompetencias(comps || []);

   
    setLoading(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

 const hoy = new Date();

const proximas = competencias
  .filter(c => new Date(c.fecha) >= hoy && c.estado !== "finalizada")
  .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

const pasadas = competencias
  .filter(c => new Date(c.fecha) < hoy || c.estado === "finalizada")
  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

const proxima = proximas[0];
const getTiempoRestante = (
  fecha: string,
  hora?: string
) => {
  const ahora = new Date();

  const objetivo = new Date(
    `${fecha}T${hora || "00:00"}`
  );

  const diffMs = objetivo.getTime() - ahora.getTime();

  if (diffMs <= 0) return "🔥 En curso o comenzada";

  const horas = Math.floor(diffMs / (1000 * 60 * 60));

  if (horas < 24) {
    return `⏳ Faltan ${horas} hora${horas !== 1 ? "s" : ""}`;
  }

  const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return `📅 Faltan ${dias} día${dias !== 1 ? "s" : ""}`;
};

return (
  <Box sx={{marginTop:"20px"}}>
   

    {/* 🟣 PRÓXIMA COMPETICIÓN DESTACADA */}
    {proxima && (
  <Card
  onClick={() => handleOpen(proxima)}
  sx={{
    mb: 4,
    cursor: "pointer",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
    background: "linear-gradient(135deg, #1e88e5, #42a5f5)",
    color: "white",
    transition: "0.3s",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
    },
  }}
>
  <CardContent sx={{ p: 3 }}>
    <Chip
      label="⭐ PRÓXIMA COMPETICIÓN"
      sx={{
        mb: 2,
        bgcolor: "rgba(255,255,255,0.2)",
        color: "white",
        fontWeight: 600,
      }}
    />

    <Typography variant="h5">
      {proxima.nombre}
    </Typography>

    <Typography sx={{ opacity: 0.9, mt: 1 }}>
      📅 {new Date(proxima.fecha).toLocaleDateString()} · 📍 {proxima.lugar}
    </Typography>
    <Typography
  sx={{
    mt: 1.5,
    fontWeight: 700,
    fontSize: "1rem",
    display: "inline-flex",
    alignItems: "center",
    gap: 1,
    bgcolor: "rgba(255,255,255,0.18)",
    px: 1.5,
    py: 0.7,
    borderRadius: 999,
    backdropFilter: "blur(4px)",
  }}
>
 {getTiempoRestante(
  proxima.fecha,
  proxima.hora_comienzo
)}
</Typography>

    <Box sx={{ mt: 2 }}>
  {renderTipoChip(proxima.tipo)}
</Box>
  </CardContent>
</Card>
    )}

    {/* 🟡 PRÓXIMAS COMPETICIONES */}
    {proximas.length > 1 && (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Próximas competiciones
        </Typography>

        <Stack spacing={2}>
          {proximas.slice(1).map((c) => (
<Card
  key={c.id}
  onClick={() => handleOpen(c)}
  sx={{
    cursor: "pointer",
    borderRadius: 3,
    transition: "0.25s",
    border: "1px solid #eee",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
      borderColor: "#1976d2",
    },
  }}
>
  <CardContent>
   <Stack
  direction="row"
  spacing={1}

>
  {renderTipoChip(c.tipo)}

  <Typography >
    {c.nombre}
  </Typography>
</Stack>

    <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
      📅 {new Date(c.fecha).toLocaleDateString()} · 📍 {c.lugar}
    </Typography>
  </CardContent>
</Card>
          ))}
        </Stack>
      </Box>
    )}

    {/* ⚫ PASADAS / HISTORIAL */}
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Historial
      </Typography>

      <Stack spacing={2}>
        {pasadas.map((c) => (
         <Card
  key={c.id}
  onClick={() => handleOpen(c)}
  sx={{
    cursor: "pointer",
    borderRadius: 3,
    opacity: 0.85,
    background: "#fafafa",
    border: "1px solid #eee",
    transition: "0.2s",
    "&:hover": {
      opacity: 1,
      transform: "translateX(4px)",
    },
  }}
>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Chip label={c.estado} size="small" />
                {renderTipoChip(c.tipo)}
              </Stack>

              <Typography variant="h6">
                {c.nombre}
              </Typography>

              <Typography variant="body2">
                {new Date(c.fecha).toLocaleDateString()} - {c.lugar}
              </Typography>

              {c.estado === "finalizada" && (
                <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                  Resultados disponibles
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
  <DialogTitle>
    {selected?.nombre}
  </DialogTitle>

  <DialogContent dividers>
    {selected && (
      <Stack spacing={2}>
        <Box>
          <Chip label={selected.estado} sx={{ mr: 1 }} />
          <Chip label={selected.tipo} />
        </Box>

        <Typography>
          📅 <strong>Fecha:</strong>{" "}
          {new Date(selected.fecha).toLocaleDateString()}
        </Typography>

        <Typography>
          📍 <strong>Lugar:</strong> {selected.lugar}
        </Typography>
        {selected.latitud && selected.longitud && (
  <Button
    variant="contained"
    size="small"
    sx={{ mt: 1 }}
    onClick={() => {
      const url = `https://www.google.com/maps?q=${selected.latitud},${selected.longitud}`;
      window.open(url, "_blank");
    }}
  >
    📍 Ver en Google Maps
  </Button>
)}

        <Divider />

        <Typography>
          📝 <strong>Descripción:</strong>
        </Typography>
        <Typography variant="body2">
          {selected.descripcion || "Sin descripción"}
        </Typography>

        <Divider />

        <Typography>
          🕒 <strong>Horario</strong>
        </Typography>

        <Typography variant="body2">
           Llegada: {selected.hora_llegada?.split(":").slice(0, 2).join(":") || "-"}<br />
          Inicio: {selected.hora_comienzo?.split(":").slice(0, 2).join(":") || "-"} 
         
        </Typography>

        <Divider />

        <Typography>
          🎒 <strong>Material necesario</strong>
        </Typography>
        <Typography variant="body2">
          {selected.material_necesario || "No especificado"}
        </Typography>

      </Stack>
    )}
  </DialogContent>

  <DialogActions>
    <Button onClick={handleClose}>Cerrar</Button>
  </DialogActions>
</Dialog>
  </Box>
);
}