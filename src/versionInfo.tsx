import { useState } from "react";
import { APP_VERSION } from "./version";

type Cambio = {
  descripcion: string;
  tipo: "general" | "usuario" | "admin";
};

const CHANGELOG: Record<string, Cambio[]> = {
  "1.0.9": [
    { descripcion: "Añadido generar carta de nadadora", tipo: "admin" },
    {
      descripcion: "Modificar cartasUser: ver carta de nadadora con un fondo",
      tipo: "usuario",
    },
    { descripcion: "Mantener la sesión iniciada", tipo: "general" },
  ],
  "1.1.0": [{ descripcion: "Prueba de notificaciones push", tipo: "usuario" }],
  "1.1.2": [
    {
      descripcion:
        "Quitar notificaciones push y pedir permiso de notificaciones",
      tipo: "usuario",
    },
  ],
  "1.1.3": [
    {
      descripcion: "Arreglo de mantener inicio de sesión activo",
      tipo: "general",
    },
    {
      descripcion: "Actualizar notificaciones al cambiar de sección en user",
      tipo: "usuario",
    },
    { descripcion: "Mejora visual en retos", tipo: "usuario" },
    {
      descripcion: "Mejora visual de modales en Competicion",
      tipo: "usuario",
    },
    { descripcion: "Cambio en cartas", tipo: "usuario" },
  ],
  "1.1.4": [{ descripcion: "Cambio visual, seccion cartas", tipo: "usuario" }],
  "1.1.5": [
    { descripcion: "Arreglo barras de cartas", tipo: "usuario" },
    { descripcion: "Apellidos en cronos", tipo: "admin" },
    { descripcion: "Confirmación de reseteo en cronos", tipo: "admin" },
    { descripcion: "Arreglo visual componente coreografías", tipo: "admin" },
    { descripcion: "Añadir apellido en dialog coreografías", tipo: "admin" },
    {
      descripcion:
        "Añadir historial de puntos en pantalla de inicio (carrusel)",
      tipo: "usuario",
    },
    {
      descripcion: "Añadir historial de cambios de versinones",
      tipo: "general",
    },
  ],
  "1.1.6": [
    { descripcion: "Nuevo tipo de rarezas de cartas", tipo: "usuario" },
    { descripcion: "Arreglo inicio de sesion para padres", tipo: "usuario" },
  ],
  "1.1.7": [
    {
      descripcion:
        "Mejora mantener la sesion para padres abierta al cerrar navegador",
      tipo: "usuario",
    },
  ],
  "1.1.8": [
    {
      descripcion: "Actualizacion loaders, con el logo de la aplicación",
      tipo: "usuario",
    },
    {
      descripcion: "Creación de chats privados entre nadadoras.",
      tipo: "usuario",
    },
    {
      descripcion: "Mejora de avisos dentro de la aplicación.",
      tipo: "general",
    },
  ],
  "1.1.9": [
    {
      descripcion:
        "Añadir calendario de asistencias en el analisis individual.",
      tipo: "admin",
    },
    {
      descripcion: "Mejora visual en los comentarios con el entrenador.",
      tipo: "usuario",
    },
  ],
  "1.2.0": [
    {
      descripcion: "Modificación de la lista para navegar entre secciones.",
      tipo: "usuario",
    },
    {
      descripcion:
        "Creacción de un trivial para mejorar los conocimientos sobre la natación artistica.",
      tipo: "usuario",
    },
  ],
  "1.2.1": [
    {
      descripcion:
        "Añade icono visual cuando hay mensajes nuevos sin leer en el chat.",
      tipo: "usuario",
    },
    {
      descripcion: "Mejoras en calcular logro semanal y mensual.",
      tipo: "general",
    },
    {
      descripcion:
        "Añadir historial de puntos y logros en informacion de nadadora.",
      tipo: "admin",
    },
  ],
  "1.2.2": [
    {
      descripcion: "Nuevas preguntas del trivial.",
      tipo: "usuario",
    },
    {
      descripcion: "Ordenar alfabeticamente en asistencias.",
      tipo: "admin",
    },
  ],
  "1.2.3": [
    {
      descripcion:
        "Orden alfabetico en logros y scrol en el historial de puntos.",
      tipo: "admin",
    },
    {
      descripcion:
        "Modificacion inicio. Coreografias por asistencias en calendario.",
      tipo: "admin",
    },
    {
      descripcion:
        "En asistencias, poder mandar las faltas justificadas, dias, rango de dias y dias recurrentes.",
      tipo: "usuario",
    },
    {
      descripcion:
        "Ver los dias, rango de fechas o fechar recurrentes que las niñas tienen faltas.",
      tipo: "admin",
    },
    {
      descripcion:
        "Añadir el boton X para borrar el nombre de una vez de el autocomplete.",
      tipo: "admin",
    },
    {
      descripcion: "Efecto navideño.",
      tipo: "usuario",
    },
    {
      descripcion: "Añadir la respuesta correcta al trivial.",
      tipo: "usuario",
    },
    {
      descripcion: "Añadir frase diaria motivadora.",
      tipo: "usuario",
    },
  ],
  "1.2.4": [
    {
      descripcion: "Quitar efecto navideño.",
      tipo: "usuario",
    },
    {
      descripcion: "Arreglar ranking de tiempos.",
      tipo: "admin",
    },
    {
      descripcion: "Poder borrar la música de una coreografía.",
      tipo: "admin",
    },
    {
      descripcion:
        "Ver las competiciones pasadas y las próximas en dos columnas.",
      tipo: "admin",
    },
  ],
  "1.2.5": [
    {
      descripcion: "Añadir Racha de asistencias",
      tipo: "usuario",
    },
    {
      descripcion:
        "Mejorar la visualización de historial de puntos en usuario en el inicio.",
      tipo: "usuario",
    },
    {
      descripcion:
        "Mejorar la visualización de competiciones, añadir ver cuál es la próxima competición",
      tipo: "usuario",
    },
    {
      descripcion: "Desactivación de la fusión de las cartas",
      tipo: "usuario",
    },
    {
      descripcion: "Mejora a la hora de crear sesiones de entrenamiento.",
      tipo: "admin",
    },
  ],
  "1.2.6": [
    {
      descripcion: "Añadir las ausencias en el calendario de las nadadoras.",
      tipo: "usuario",
    },
    {
      descripcion:
        "Mejora visualización de ver las ausencias de las nadadoras.",
      tipo: "admin",
    },
    {
      descripcion:
        "Mejora en la visualización de la información de la nadadora.",
      tipo: "admin",
    },
    {
      descripcion: "Cambio de visualización de valoración de entrenamiento.",
      tipo: "admin",
    },
    {
      descripcion:
        "Lógica de nadadora virtual y asignación cuando se crea la cuenta la nadadora.",
      tipo: "general",
    },
  ],
  "1.2.7": [
    {
      descripcion:
        "Mejora el chat con las nadadoras. Ahora en el inicio aparece que tienes mensajes sin leer.",
      tipo: "admin",
    },
    {
      descripcion: "Cambiar la pantalla de asistencias.",
      tipo: "usuario",
    },
    {
      descripcion:
        "Cambiar la pantalla de eventos y cambio de nombre a Agenda.",
      tipo: "usuario",
    },
    {
      descripcion:
        "Añadir nueva pantalla de inicio. ( Se puede cambiar en Ajustes->Estilo de panel principal)",
      tipo: "usuario",
    },
    {
      descripcion: "Añadir icono de nuevo mensaje en icono hamburguesa.",
      tipo: "usuario",
    },
  ],
  "1.3.1": [
    {
      descripcion:
        "Arreglo de los calculos de los logros mensuales y semanales.",
      tipo: "admin",
    },
    {
      descripcion: "Arreglo del estado del equipo.",
      tipo: "admin",
    },
    {
      descripcion: "Añadir el ranking del club.",
      tipo: "usuario",
    },
    {
      descripcion: "Incorporación de Reestablecer contraseña mediante correo.",
      tipo: "general",
    },
  ],
};

export default function VersionInfo() {
  const [mostrarChangelog, setMostrarChangelog] = useState(false);

  // Ordenar versiones descendente (de más nueva a más antigua)
  const versiones = Object.keys(CHANGELOG).sort((a, b) => (a > b ? -1 : 1));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span>v{APP_VERSION}</span>
      <button
        onClick={() => setMostrarChangelog(true)}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "1rem",
        }}
        title="Ver cambios"
      >
        ℹ️
      </button>

      {mostrarChangelog && (
        <>
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#fff",
              borderRadius: "12px",
              padding: "1rem 1.5rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              zIndex: 1000,
              maxHeight: "80vh",
              overflowY: "auto",
              width: "350px",
            }}
          >
            <h3>Historial de versiones</h3>
            {versiones.map((version) => (
              <div key={version} style={{ marginBottom: "1rem" }}>
                <h4 style={{ marginBottom: "0.3rem" }}>v{version}</h4>
                <ul style={{ paddingLeft: "1rem", margin: 0 }}>
                  {CHANGELOG[version].map((item, index) => (
                    <li
                      key={index}
                      style={{
                        marginBottom: "0.3rem",
                        color:
                          item.tipo === "admin"
                            ? "#d32f2f"
                            : item.tipo === "usuario"
                              ? "#00796b"
                              : "#333",
                      }}
                    >
                      [{item.tipo}] {item.descripcion}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <button
              onClick={() => setMostrarChangelog(false)}
              style={{
                marginTop: "1rem",
                background: "#4c6ef5",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "0.3rem 0.6rem",
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>
          <div
            onClick={() => setMostrarChangelog(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.3)",
              zIndex: 999,
            }}
          ></div>
        </>
      )}
    </div>
  );
}
