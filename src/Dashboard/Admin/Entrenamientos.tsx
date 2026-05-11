"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
  MenuItem,
} from "@mui/material";
import { Grid } from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { getDiaSemana } from "../../utils/Formatear";

interface SerieBlock {
  titulo: string;
  series: string[];
}

interface Sesion {
  id: number;
  fecha: string;
  titulo: string;
  descripcion: SerieBlock[];
  estado: "borrador" | "publicado";
  hora_inicio: string;
  hora_fin: string;
   dia_semana: string;
   tipo_sesion: string;
   plantilla_id?: number | null;
}
interface Plantilla {
  id: number;
  nombre: string;
  tipo: string;
  descripcion_base: SerieBlock[];
  duracion_estimada: number;
}

export default function Entrenamientos() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Sesion>>({
    descripcion: [],
  });

  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
const [openPlantilla, setOpenPlantilla] = useState(false);
const [formPlantilla, setFormPlantilla] = useState<Partial<Plantilla>>({
  descripcion_base: [],
});

  const fetchPlantillas = async () => {
  const { data } = await supabase
    .from("plantillas_entrenamiento")
    .select("*");

  setPlantillas(data || []);
};

useEffect(() => {
  fetchSesiones();
  fetchPlantillas();
}, []);

const fetchSesiones = async () => {
  const { data } = await supabase
    .from("sesiones_entrenamiento")
    .select("*")
    .order("fecha", { ascending: false });

  const normalizadas = (data || []).map((s) => ({
    ...s,
    descripcion: Array.isArray(s.descripcion)
      ? s.descripcion
      : typeof s.descripcion === "string"
      ? JSON.parse(s.descripcion)
      : [],
  }));

  setSesiones(normalizadas);
};

  // 🔥 AUTOHORAS
  const autoHoras = (fecha: string) => {
    const day = new Date(fecha).getDay();
    if (day === 5) return { inicio: "17:30", fin: "20:30" };
    return { inicio: "17:30", fin: "19:30" };
  };

  const handleChangeFecha = (fecha: string) => {
    const horas = autoHoras(fecha);

    setForm({
      ...form,
      fecha,
      hora_inicio: horas.inicio,
      hora_fin: horas.fin,
    });
  };

  // 🔥 BLOQUES

  const addBlock = () => {
    const newBlocks = [...(form.descripcion || [])];
    newBlocks.push({ titulo: "", series: [] });

    setForm({ ...form, descripcion: newBlocks });
  };

  const updateBlockTitle = (index: number, value: string) => {
const newBlocks = [...(form.descripcion || [])];
newBlocks[index] = {
  ...newBlocks[index],
  titulo: value,
};

    setForm({ ...form, descripcion: newBlocks });
  };

  const removeBlock = (index: number) => {
    const newBlocks = [...(form.descripcion || [])];
    newBlocks.splice(index, 1);

    setForm({ ...form, descripcion: newBlocks });
  };

  // 🔥 SERIES

  const addSerie = (blockIndex: number) => {
    const newBlocks = [...(form.descripcion || [])];
    newBlocks[blockIndex].series.push("");

    setForm({ ...form, descripcion: newBlocks });
  };

  const updateSerie = (
    blockIndex: number,
    serieIndex: number,
    value: string
  ) => {
    const newBlocks = [...(form.descripcion || [])];
    newBlocks[blockIndex].series[serieIndex] = value;

    setForm({ ...form, descripcion: newBlocks });
  };

  const removeSerie = (blockIndex: number, serieIndex: number) => {
    const newBlocks = [...(form.descripcion || [])];
    newBlocks[blockIndex].series.splice(serieIndex, 1);

    setForm({ ...form, descripcion: newBlocks });
  };

  // 🔥 SAVE
const handleSave = async () => {
  if (!form.fecha || !form.titulo) return;

  const payload = {
    ...form,
    descripcion: form.descripcion || [],
    estado: "borrador",
     dia_semana: getDiaSemana(form.fecha), 
      tipo_sesion: form.tipo_sesion || "Agua",
  };

  // si editas
  if ((form as any).id) {
    await supabase
      .from("sesiones_entrenamiento")
      .update(payload)
      .eq("id", (form as any).id);
  } else {
    await supabase.from("sesiones_entrenamiento").insert([payload]);
  }

  setOpen(false);
  setForm({ descripcion: [] });
  fetchSesiones();
};

const handleSavePlantilla = async () => {
  if (!formPlantilla.nombre) return;

  const payload = {
    nombre: formPlantilla.nombre,
    tipo: formPlantilla.tipo || "general",
    descripcion_base: formPlantilla.descripcion_base || [],
    duracion_estimada: formPlantilla.duracion_estimada || 90,
  };

  if ((formPlantilla as any).id) {
    await supabase
      .from("plantillas_entrenamiento")
      .update(payload)
      .eq("id", (formPlantilla as any).id);
  } else {
    await supabase.from("plantillas_entrenamiento").insert([payload]);
  }

  setOpenPlantilla(false);
  setFormPlantilla({ descripcion_base: [] });
  fetchPlantillas();
};

const handleDeleteSesion = async (id: number) => {
  const confirm = window.confirm("¿Seguro que quieres eliminar este entrenamiento?");
  if (!confirm) return;

  await supabase
    .from("sesiones_entrenamiento")
    .delete()
    .eq("id", id);

  fetchSesiones();
};

const handleDeletePlantilla = async (id: number) => {
  const confirm = window.confirm("¿Eliminar plantilla?");
  if (!confirm) return;

  await supabase
    .from("plantillas_entrenamiento")
    .delete()
    .eq("id", id);

  fetchPlantillas();
};

const handleEditPlantilla = (p: Plantilla) => {
  setFormPlantilla(p);
  setOpenPlantilla(true);
};


  const hoy = new Date().toISOString().split("T")[0];

  return (
   <Box sx={{
  p: { xs: 2, md: 4 },
  maxWidth: 1200,
  mx: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 4,
}}>
   <Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 2,
  }}
>
  <Box>
    <Typography variant="h4">
      Entrenamientos
    </Typography>
  </Box>

  <Box sx={{ display: "flex", gap: 1 }}>
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      sx={{
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 600,
  }}
      onClick={() => setOpen(true)}
    >
      Entrenamiento
    </Button>

    <Button
      variant="outlined"
      startIcon={<AddIcon />}
      onClick={() => setOpenPlantilla(true)}
    >
      Plantilla
    </Button>
  </Box>
</Box>



      <Typography variant="h5" sx={{ mt: 4 }}>
  Plantillas
</Typography>

<Grid container spacing={3}>
  {plantillas.map((p) => (
        <Grid sx={{ xs:"12" , sm:"6" , md:"4"}}  key={p.id}>
      <Card
  sx={{
    height: "100%",
    borderRadius: 3,
    p: 2,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    background: "linear-gradient(145deg, #ffffff, #f8fafc)",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    transition: "all 0.25s ease",
    border: "1px solid rgba(0,0,0,0.05)",
    "&:hover": {
      transform: "translateY(-6px)",
      boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
    },
  }}
>
        <CardContent sx={{ p: 0, mb: 2 }}>
         <Typography
  variant="h6"
  sx={{ fontWeight: 700, mb: 0.5 }}
>
  {p.nombre}
</Typography>
         <Chip
  label={p.tipo}
  size="small"
  sx={{
    fontWeight: 600,
    background: "#e0f2fe",
    color: "#075985",
  }}
/>

         <Box
  sx={{
    mt: 2,
    display: "flex",
    gap: 1,
    justifyContent: "space-between",
  }}
>
            <Button size="small" sx={{
    textTransform: "none",
    fontWeight: 600,
  }} onClick={() => handleEditPlantilla(p)}>
              Editar
            </Button>

            <Button
               size="small"
  color="error"
  sx={{
    textTransform: "none",
    fontWeight: 600,
  }}
              onClick={() => handleDeletePlantilla(p.id)}
            >
              Eliminar
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  ))}
</Grid>

      {/* LISTADO */}
      <Grid container spacing={2}>
        {sesiones.map((s) => {
          
          const esPasado = s.fecha < hoy;

          return (
              <Card
  sx={{
    borderRadius: 3,
    p: 1,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: 2,
    transition: "0.2s",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: 6,
    },
    opacity: esPasado ? 0.5 : 1,
  }}
>
                <CardContent>
                   <Typography variant="caption" color="text.secondary">
    {new Date(s.fecha).toLocaleDateString()}
  </Typography>

  <Typography variant="h6">
    {s.titulo}
  </Typography>

  <Typography variant="body2" color="text.secondary">
    {s.hora_inicio} - {s.hora_fin}
  </Typography>

  <Box sx={{ mt: 1 }}>
   <Chip
  label={s.estado}
  size="small"
  sx={{
    fontWeight: 600,
    background:
      s.estado === "publicado"
        ? "#dcfce7"
        : "#fef9c3",
    color:
      s.estado === "publicado"
        ? "#166534"
        : "#92400e",
  }}
/>
  </Box>
                </CardContent>
                <Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    px: 1,
    pb: 1,
  }}
>
  <Box sx={{ display: "flex", gap: 1 }}>
    <Button size="small" onClick={() => { setForm(s); setOpen(true); }}>
      Editar
    </Button>

    {s.estado === "borrador" && (
      <Button size="small" variant="contained">
        Publicar
      </Button>
    )}
  </Box>

  <IconButton color="error" onClick={() => handleDeleteSesion(s.id)}>
    <DeleteIcon />
  </IconButton>
</Box>
              </Card>
          );
        })}
      </Grid>

      {/* MODAL */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Crear entrenamiento</DialogTitle>

       <DialogContent
  sx={{
    display: "flex",
    flexDirection: "column",
    gap: 2,
  }}
>
          <TextField
            fullWidth
            type="date"
            margin="normal"
            onChange={(e) => handleChangeFecha(e.target.value)}
          />
<TextField
  select
  fullWidth
  label="Tipo de sesión"
  margin="normal"
  value={form.tipo_sesion || ""}
  onChange={(e) =>
    setForm({ ...form, tipo_sesion: e.target.value })
  }
>
  <MenuItem value="Agua">Agua</MenuItem>
  <MenuItem value="Sala">Sala</MenuItem>
  <MenuItem value="Agua+Sala">Agua+Sala</MenuItem>
</TextField>

<TextField
  select
  fullWidth
  label="Plantilla"
  margin="normal"
  value={form.plantilla_id || ""}
  onChange={(e) => {
    const id = Number(e.target.value);

    const plantilla = plantillas.find((p) => p.id === id);

    setForm({
      ...form,
      plantilla_id: id,
      descripcion: plantilla?.descripcion_base || [],
    });
  }}
>
  {plantillas.map((p) => (
    <MenuItem key={p.id} value={p.id}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Typography>{p.nombre}</Typography>

        <Chip
          label={p.tipo}
          size="small"
        />
      </Box>
    </MenuItem>
  ))}
</TextField>

          <TextField
            fullWidth
            label="Título"
            margin="normal"
            value={form.titulo || ""}
            onChange={(e) =>
              setForm({ ...form, titulo: e.target.value })
            }
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6">Bloques</Typography>

          {(form.descripcion || []).map((block, bIndex) => (
            <Box
  key={bIndex}
  sx={{
    border: "1px solid",
    borderColor: "divider",
    borderRadius: 2,
    p: 2,
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    gap: 1.5,
  }}
>
              <Box  >
                <TextField
                  fullWidth
                    label="Bloque (ej: Calentamiento, Parte principal)"
  placeholder="Ej: Calentamiento"
                  value={block.titulo}
                   sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: "#fff",
    },
  }}
                  onChange={(e) =>
                    updateBlockTitle(bIndex, e.target.value)
                  }
                />

                <IconButton onClick={() => removeBlock(bIndex)}>
                  <DeleteIcon />
                </IconButton>
              </Box>

              {block.series.map((serie, sIndex) => (
                <Box key={sIndex} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <TextField
                    fullWidth
                    label="Serie"
                    value={serie}
                    onChange={(e) =>
                      updateSerie(bIndex, sIndex, e.target.value)
                    }
                  />

                  <IconButton
                    onClick={() => removeSerie(bIndex, sIndex)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}

              <Button
                startIcon={<AddIcon />}
                onClick={() => addSerie(bIndex)}
                 sx={{
    alignSelf: "flex-start",
    textTransform: "none",
    fontWeight: 600,
    color: "primary.main",
  }}
              >
                Añadir serie
              </Button>
            </Box>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={addBlock}
            sx={{
    mt: 2,
    py: 1,
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 700,
    border: "1px dashed",
    borderColor: "primary.main",
  }}
          >
            Añadir bloque
          </Button>

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            onClick={handleSave}
          >
            Guardar entrenamiento
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={openPlantilla} onClose={() => setOpenPlantilla(false)} fullWidth maxWidth="md">
  <DialogTitle>Crear plantilla</DialogTitle>

  <DialogContent>
    <TextField
      fullWidth
      label="Nombre"
      margin="normal"
      value={formPlantilla.nombre || ""}
      onChange={(e) =>
        setFormPlantilla({ ...formPlantilla, nombre: e.target.value })
      }
    />

    <TextField
      fullWidth
      label="Tipo"
      margin="normal"
      value={formPlantilla.tipo || ""}
      onChange={(e) =>
        setFormPlantilla({ ...formPlantilla, tipo: e.target.value })
      }
    />

    <Divider sx={{ my: 2 }} />

    <Typography variant="h6">Bloques</Typography>

{(formPlantilla.descripcion_base || []).map((block, bIndex) => (
  <Box key={bIndex} sx={{ mb: 2 }}>
    
    {/* BLOQUE */}
    <TextField
      fullWidth
      label="Bloque"
      value={block.titulo}
      onChange={(e) => {
        const copy = [...(formPlantilla.descripcion_base || [])];
        copy[bIndex].titulo = e.target.value;
        setFormPlantilla({ ...formPlantilla, descripcion_base: copy });
      }}
    />

    {/* SERIES */}
    {block.series.map((serie, sIndex) => (
      <Box key={sIndex} sx={{ display: "flex", gap: 1, mt: 1 }}>
        <TextField
          fullWidth
          label="Serie"
          value={serie}
          onChange={(e) => {
            const copy = [...(formPlantilla.descripcion_base || [])];
            copy[bIndex].series[sIndex] = e.target.value;
            setFormPlantilla({ ...formPlantilla, descripcion_base: copy });
          }}
            sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
    },
  }}
        />

        <IconButton
          onClick={() => {
            const copy = [...(formPlantilla.descripcion_base || [])];
            copy[bIndex].series.splice(sIndex, 1);
            setFormPlantilla({ ...formPlantilla, descripcion_base: copy });
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    ))}

    {/* añadir serie */}
    <Button
      size="small"
      onClick={() => {
        const copy = [...(formPlantilla.descripcion_base || [])];
        copy[bIndex].series.push("");
        setFormPlantilla({ ...formPlantilla, descripcion_base: copy });
      }}
    >
      + Añadir serie
    </Button>
  </Box>
))}

    <Button
      startIcon={<AddIcon />}
      onClick={() => {
        const copy = [...(formPlantilla.descripcion_base || [])];
        copy.push({ titulo: "", series: [] });
        setFormPlantilla({ ...formPlantilla, descripcion_base: copy });
      }}
    >
      Añadir bloque
    </Button>

    <Button
      fullWidth
      variant="contained"
      sx={{ mt: 3 }}
      onClick={handleSavePlantilla}
    >
      Guardar plantilla
    </Button>
  </DialogContent>
</Dialog>
    </Box>
  );
}