"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
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
    newBlocks[index].titulo = value;

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

  await supabase.from("plantillas_entrenamiento").insert([payload]);

  setOpenPlantilla(false);
  setFormPlantilla({ descripcion_base: [] });
  fetchPlantillas();
};
  const hoy = new Date().toISOString().split("T")[0];

  return (
    <Box>
      <Typography variant="h4" >
        Entrenamientos
      </Typography>

      {/* ACCIONES */}
      <Box  >
        <Button variant="contained" onClick={() => setOpen(true)}>
          + Crear entrenamiento
        </Button>

       <Button variant="outlined" onClick={() => setOpenPlantilla(true)}>
  + Crear plantilla
</Button>
      </Box>

      {/* LISTADO */}
      <Grid container spacing={2}>
        {sesiones.map((s) => {
          const esPasado = s.fecha < hoy;

          return (
            <Grid  key={s.id}>
              <Card sx={{ opacity: esPasado ? 0.5 : 1 }}>
                <CardContent>
                  <Typography >
                    {new Date(s.fecha).toLocaleDateString()}
                  </Typography>

                  <Typography>{s.titulo}</Typography>

                  <Typography variant="body2">
                    {s.hora_inicio} - {s.hora_fin}
                  </Typography>

                  <Box >
                    <Chip
                      label={s.estado}
                      color={
                        s.estado === "publicado" ? "success" : "default"
                      }
                    />
                  </Box>

                  {!esPasado && (
                    <Box >
                      <Button
                        size="small"
                        onClick={() => {
                          setForm(s);
                          setOpen(true);
                        }}
                      >
                        Editar
                      </Button>

                      {s.estado === "borrador" && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={async () => {
                            await supabase
                              .from("sesiones_entrenamiento")
                              .update({ estado: "publicado" })
                              .eq("id", s.id);

                            fetchSesiones();
                          }}
                        >
                          Publicar
                        </Button>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* MODAL */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Crear entrenamiento</DialogTitle>

        <DialogContent>
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
      {p.nombre}
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
            <Box key={bIndex}>
              <Box  >
                <TextField
                  fullWidth
                    label="Bloque (ej: Calentamiento, Parte principal)"
  placeholder="Ej: Calentamiento"
                  value={block.titulo}
                  onChange={(e) =>
                    updateBlockTitle(bIndex, e.target.value)
                  }
                />

                <IconButton onClick={() => removeBlock(bIndex)}>
                  <DeleteIcon />
                </IconButton>
              </Box>

              {block.series.map((serie, sIndex) => (
                <Box key={sIndex} >
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
                sx={{ mt: 1 }}
              >
                Añadir serie
              </Button>
            </Box>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={addBlock}
            sx={{ mt: 2 }}
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