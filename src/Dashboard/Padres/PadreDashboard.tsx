import { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemText,

} from "@mui/material";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import Resumen from "./Resumen"

interface Seccion {
  key: string;
  label: string;
  component: React.ComponentType<any>;
}

const drawerWidth = 240;

export default function DashboardBase() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [section, setSection] = useState("inicio");
    const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

    const logout = async () => {
      await supabase.auth.signOut();
      navigate("/");
    };

  // 🔥 Define aquí tus secciones
  const secciones: Seccion[] = [
    {
      key: "inicio",
      label: "Inicio",
      component: () => <Resumen />,
    },
    {
      key: "asistencias",
      label: "Asistencias",
      component: () => <div>Asistencias</div>,
    },
     {
      key: "competiciones",
      label: "Competiciones",
      component: () => <div>Competiciones</div>,
    },
    {
      key: "perfil",
      label: "Perfil",
      component: () => <div>Perfil</div>,
    },
  ];

  const seccionActual = secciones.find((s) => s.key === section);

  const drawer = (
    <Box sx={{ textAlign: "center" }}>
      
      <List sx={{marginTop:"100px"}}>
        {secciones.map((s) => (
          <ListItemButton
            key={s.key}
            selected={section === s.key}
            onClick={() => {
              setSection(s.key);
              setMobileOpen(false);
            }}
            sx={{
              mx: 1,
              borderRadius: 2,
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "white",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              },
            }}
          >
            <ListItemText primary={s.label} />
            
          </ListItemButton>
          
        ))}
      </List>
      <Box sx={{ mt: "auto", p: 2 }}>
  <ListItemButton
    onClick={logout}
    sx={{
      borderRadius: 2,
      color: "error.main",
      "&:hover": {
        backgroundColor: "error.main",
        color: "white",
      },
    }}
  >
    <ListItemText primary="Cerrar sesión" />
  </ListItemButton>
</Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>


      {/* HEADER */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
<Toolbar sx={{ px: 2 , width:"100%" }}>
  {/* TÍTULO */}
  <Typography variant="h6" noWrap>
    {seccionActual?.label || "Dashboard"}
  </Typography>

  {/* BOTÓN HAMBURGUESA */}
  <IconButton
    onClick={handleDrawerToggle}
    sx={{
      ml: "auto", 
      mr: -1, 
      border: "1px solid",
      borderColor: "rgba(255,255,255,0.3)",
      borderRadius: 2,
      p: 1,
      bgcolor: "rgba(255,255,255,0.1)",
      "&:hover": {
        bgcolor: "rgba(255,255,255,0.2)",
      },
      display: { sm: "none" }, 
    }}
  >
    <MenuIcon />
  </IconButton>
</Toolbar>
      </AppBar>

      {/* SIDEBAR */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* MAIN */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: "100vh",
    overflow: "auto",
    backgroundColor: "#fff",
        }}
      >
        {/* Spacer para el AppBar */}
        <Toolbar />

        {seccionActual && <seccionActual.component />}
      </Box>
    </Box>
  );
}