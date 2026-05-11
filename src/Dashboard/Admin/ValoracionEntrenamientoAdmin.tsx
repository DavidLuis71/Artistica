import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
} from "@mui/material";

interface Valoracion {
  nadadora_id: number;
  fecha: string;
  cansancio_entrenamiento: number;
  cansancio_general: number;
  motivacion: number;
  productividad: number;
  nadadora?: {
    nombre: string;
    apellido: string;
  };
}

interface Resumen {
  media: {
    cansancio_entrenamiento: number;
    cansancio_general: number;
    motivacion: number;
    productividad: number;
  };
  extremos: Record<string, Valoracion>;
  alertas: string[];
  evolucion?: any[];
}


export default function ResumenEntrenamientoAdmin() {
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mostrarSemana, setMostrarSemana] = useState(true);
  const [loading, setLoading] = useState(true);
  const [openCalendar, setOpenCalendar] = useState(false);
  const [nombres, setNombres] = useState<Record<number, string>>({});

  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    const { data } = await supabase
      .from("valoracion_entrenamiento")
      .select("* , nadadora:nadadora_id(nombre, apellido)")
      .order("fecha", { ascending: true });

    if (!data) return;

    setValoraciones(data);

    const map: Record<number, string> = {};
    data.forEach((v: any) => {
      map[v.nadadora_id] = `${v.nadadora?.nombre} ${v.nadadora?.apellido}`;
    });
    setNombres(map);

    setLoading(false);
  };

  const nombre = (id: number) => nombres[id] ?? `Nadadora ${id}`;

  useEffect(() => {
    if (!valoraciones.length) return;
    calcular();
  }, [valoraciones, selectedDate, mostrarSemana]);

  const calcular = () => {
    let data = valoraciones;

    if (!mostrarSemana && selectedDate) {
      const d = formatDate(selectedDate);
      data = data.filter((v) => v.fecha === d);
    }

    if (!data.length) return setResumen(null);

    const media = {
      cansancio_entrenamiento:
        data.reduce((a, b) => a + b.cansancio_entrenamiento, 0) / data.length,
      cansancio_general:
        data.reduce((a, b) => a + b.cansancio_general, 0) / data.length,
      motivacion: data.reduce((a, b) => a + b.motivacion, 0) / data.length,
      productividad: data.reduce((a, b) => a + b.productividad, 0) / data.length,
    };

    const extremos: any = {
      cansancio_entrenamiento: data.reduce((a, b) =>
        b.cansancio_entrenamiento > a.cansancio_entrenamiento ? b : a
      ),
      cansancio_general: data.reduce((a, b) =>
        b.cansancio_general > a.cansancio_general ? b : a
      ),
      motivacion: data.reduce((a, b) =>
        b.motivacion < a.motivacion ? b : a
      ),
      productividad: data.reduce((a, b) =>
        b.productividad < a.productividad ? b : a
      ),
    };

 const evolucion: any = {};

data.forEach((v) => {
  if (!evolucion[v.nadadora_id]) evolucion[v.nadadora_id] = [];

  evolucion[v.nadadora_id].push({
    fecha: v.fecha,
    cansancio_entrenamiento: v.cansancio_entrenamiento,
    cansancio_general: v.cansancio_general,
    motivacion: v.motivacion,
    productividad: v.productividad,
  });
});

const evolucionFinal = Object.entries(evolucion).map(([id, vals]: any) => {
  const serie = vals.sort(
    (a: any, b: any) =>
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  return {
    id,
    nombre: nombre(Number(id)),
    serie,
  };
});
 

    setResumen({
      media,
      extremos,
      alertas: [],
      evolucion: evolucionFinal,
    });
  };

  const datosDia =
    !mostrarSemana && selectedDate
      ? valoraciones.filter((v) => v.fecha === formatDate(selectedDate))
      : []



  if (loading) return <Typography>Cargando...</Typography>;

  return (
    <Box sx={{ p: 3 }}>

      <Typography variant="h4" sx={{ mb: 2 }}>
        Resumen Entrenamientos
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button variant="contained" onClick={() => setMostrarSemana(true)}>
          Resumen
        </Button>

        <Button variant="outlined" onClick={() => setOpenCalendar(true)}>
          Día
        </Button>
      </Box>

      {/* CALENDARIO */}
  <Dialog open={openCalendar} onClose={() => setOpenCalendar(false)}>
  <Box
    sx={{
      p: 2,
      "& .react-calendar": {
        border: "none",
        width: "100%",
        fontFamily: "Inter",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        borderRadius: 2,
      },

      "& .react-calendar__tile": {
        position: "relative",
        color: "#1e293b",
        fontSize: "0.9rem",
        borderRadius: "6px",
      },

      "& .react-calendar__tile abbr": {
        color: "#1e293b",
        textDecoration: "none",
        fontWeight: 500,
        position: "relative",
        zIndex: 1,
      },

      // hoy
      "& .react-calendar__tile--now": {
        backgroundColor: "#3b82f6",
        color: "white",
      },

      // seleccionado
      "& .react-calendar__tile--active": {
        backgroundColor: "#2563eb",
        color: "white",
      },

      // días con datos
      "& .dia-con-datos": {
        backgroundColor: "#dbeafe !important",
        fontWeight: 600,
      },
    }}
  >
   <Calendar
  onClickDay={(d) => {
    setSelectedDate(d);
    setMostrarSemana(false);
    setOpenCalendar(false);
  }}
  tileContent={({ date }) => {
    const fecha = formatDate(date);

    const count = valoraciones.filter((v) => v.fecha === fecha).length;

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.75rem",
          lineHeight: 1.1,
          color: "#1e293b",
        }}
      >
        {/* número del día SIEMPRE visible */}
        <Box sx={{ fontWeight: 600 }}>{date.getDate()}</Box>

        {/* contador */}
        {count > 0 && (
          <Box
            sx={{
              fontSize: "0.65rem",
              fontWeight: 700,
              color: "#2563eb",
            }}
          >
            {count}
          </Box>
        )}
      </Box>
    );
  }}
  tileClassName={({ date }) => {
    const fecha = formatDate(date);
    return valoraciones.some((v) => v.fecha === fecha)
      ? "dia-con-datos"
      : undefined;
  }}
/>
  </Box>
</Dialog>

{/* VALORACIONES DEL DÍA */}
{!mostrarSemana && selectedDate && (
  <Card
    sx={{
      mb: 3,
      borderRadius: 3,
      maxHeight: "70vh",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <CardContent sx={{ flex: 1, overflow: "hidden" }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Valoraciones del día
      </Typography>

      {/* 🔥 contenedor scroll horizontal + vertical */}
      <Box
        sx={{
          width: "100%",
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: "55vh",
          borderRadius: 2,
        }}
      >
        <Table
          size="small"
          sx={{
            minWidth: 650,
            "& th": {
              fontWeight: 600,
              whiteSpace: "nowrap",
            },
            "& td": {
              whiteSpace: "nowrap",
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Nadadora</TableCell>
              <TableCell>Entreno</TableCell>
              <TableCell>General</TableCell>
              <TableCell>Motivación</TableCell>
              <TableCell>Prod</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {datosDia.map((v, i) => (
              <TableRow key={i}>
                <TableCell>{nombre(v.nadadora_id)}</TableCell>
                <TableCell>{v.cansancio_entrenamiento}</TableCell>
                <TableCell>{v.cansancio_general}</TableCell>
                <TableCell>{v.motivacion}</TableCell>
                <TableCell>{v.productividad}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </CardContent>
  </Card>
)}
      {/* RESUMEN */}
      {resumen && (
        <Grid container spacing={2}>
          {[
            ["Cansancio entreno", resumen.media.cansancio_entrenamiento],
            ["Cansancio general", resumen.media.cansancio_general],
            ["Motivación", resumen.media.motivacion],
            ["Productividad", resumen.media.productividad],
          ].map(([label, value]: any) => (
            <Grid  key={label}>
              <Card>
                <CardContent>
                  <Typography>{label}</Typography>
                  <Typography variant="h5">{value.toFixed(1)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* EVOLUCIÓN */}
      {mostrarSemana && resumen?.evolucion && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5">Evolución por nadadora</Typography>

          {resumen.evolucion.map((n: any) => (
            <Card key={n.id} sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6">{n.nombre}</Typography>

{[
  { label: "Cansancio entrenamiento", key: "cansancio_entrenamiento" },
  { label: "Cansancio general", key: "cansancio_general" },
  { label: "Motivación", key: "motivacion" },
  { label: "Productividad", key: "productividad" },
].map((m) => (
  <Box key={m.key} sx={{ mb: 2 }}>

    <Typography
      sx={{
        fontSize: 13,
        fontWeight: 600,
        color: "#334155",
        mb: 0.5,
      }}
    >
      {m.label}
    </Typography>

 <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
  {n.serie.map((s: any, i: number) => {
    const value = s[m.key];

    const getColor = () => {
      if (m.key.includes("cansancio")) {
        if (value >= 8) return "#ef4444";
        if (value >= 6) return "#f59e0b";
        return "#22c55e";
      }

      // motivación/productividad
      if (value >= 8) return "#22c55e";
      if (value >= 6) return "#f59e0b";
      return "#ef4444";
    };

    return (
      <Box
        key={i}
        sx={{
          minWidth: 42,
          height: 42,
          borderRadius: "50%",
          background: getColor(),
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 14,
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
      >
        {value}
      </Box>
    );
  })}
</Box>

  </Box>
))}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}