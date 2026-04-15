// src/components/UsuariosPendientes.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./UsuariosPendientes.css";

interface UsuarioPendiente {
  id: string; // UUID de Supabase
  nombre: string;
  apellido: string;
  rol: string;
  codigos_nadadoras?: string[]; // solo para padres
  hijas?: string[];
}
function normalizarNombre(nombre: string) {
  if (!nombre) return "";
  return nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();
}
// Función para generar código único
function generarCodigoUnico(nombre: string) {
  const nombreMayus = nombre.toUpperCase().replace(/\s+/g, "");

  // Tomar primeras 2 letras o repetir si el nombre es corto
  const primeras =
    nombreMayus.length >= 2
      ? nombreMayus.slice(0, 2)
      : nombreMayus.padEnd(2, nombreMayus);

  // Tomar últimas 2 letras o repetir si el nombre es corto
  const ultimas =
    nombreMayus.length >= 2
      ? nombreMayus.slice(-2)
      : nombreMayus.padStart(2, nombreMayus);

  // Generar números aleatorios de 2-3 cifras
  const nums1 = Math.floor(Math.random() * 900 + 10); // 10-999
  const nums2 = Math.floor(Math.random() * 900 + 10); // 10-999

  return `${primeras}${nums1}${ultimas}${nums2}`;
}

export default function UsuariosPendientes() {
  const [pendientes, setPendientes] = useState<UsuarioPendiente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [nadadorasVirtuales, setNadadorasVirtuales] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [seleccionVirtual, setSeleccionVirtual] = useState<{
    [userId: string]: number | "";
  }>({});

  const fetchNadadorasVirtuales = async () => {
    const { data, error } = await supabase
      .from("nadadoras")
      .select("id, nombre")
      .is("user_id", null);

    if (!error && data) setNadadorasVirtuales(data);
  };

  const fetchPendientes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        nombre,
        apellido,
        rol_id,
        codigos_nadadoras,
        roles:rol_id (nombre)
      `,
      )
      .eq("aprobado", false);
    if (!error && data) {
      const usuarios: UsuarioPendiente[] = await Promise.all(
        data.map(async (u: any) => {
          let hijas: string[] = [];

          if (u.rol_id === 3 && u.codigos_nadadoras?.length) {
            const { data: nadadorasData } = await supabase
              .from("nadadoras")
              .select("nombre, codigo_unico")
              .in("codigo_unico", u.codigos_nadadoras);

            if (nadadorasData) {
              hijas = nadadorasData.map((n) => n.nombre);
            }
          }

          return {
            id: u.id,
            nombre: u.nombre,
            apellido: u.apellido,
            rol: u.roles.nombre,
            hijas,
            codigos_nadadoras: u.codigos_nadadoras,
          };
        }),
      );

      setPendientes(usuarios);
    }
    setLoading(false);
  };

  const aceptarUsuario = async (usuario: UsuarioPendiente) => {
    setLoading(true);

    // 1. Actualizar aprobado a true
    const { error: errorUpdate } = await supabase
      .from("users")
      .update({ aprobado: true })
      .eq("id", usuario.id);
    if (errorUpdate) {
      alert("Error al aprobar usuario: " + errorUpdate.message);
      setLoading(false);
      return;
    }

    // 2. Crear entrada en nadadoras o padres según rol
    if (usuario.rol === "nadadora") {
      const nadadoraVirtualId = seleccionVirtual[usuario.id];

      if (nadadoraVirtualId) {
        const nombreNormalizado = normalizarNombre(usuario.nombre);
        const apellidoNormalizado = normalizarNombre(usuario.apellido);
        const codigoUnico = generarCodigoUnico(usuario.nombre);
        // ✅ Si seleccionó una nadadora virtual, asignar el user_id
        const { error: updateVirtualError } = await supabase
          .from("nadadoras")
          .update({
            user_id: usuario.id,
            nombre: nombreNormalizado,
            apellido: apellidoNormalizado,
            codigo_unico: codigoUnico,
          })
          .eq("id", nadadoraVirtualId);

        if (updateVirtualError) {
          alert(
            "Error asignando nadadora virtual: " + updateVirtualError.message,
          );
          setLoading(false);
          return;
        }
      } else {
        // ✅ Si no seleccionó virtual, crear nueva nadadora como antes
        const nombreNormalizado = normalizarNombre(usuario.nombre);
        const apellidoNormalizado = normalizarNombre(usuario.apellido);
        const codigoUnico = generarCodigoUnico(usuario.nombre);

        const { error: insertError } = await supabase.from("nadadoras").insert({
          user_id: usuario.id,
          nombre: nombreNormalizado,
          apellido: apellidoNormalizado,
          codigo_unico: codigoUnico,
        });

        if (insertError) {
          alert("Error creando nadadora: " + insertError.message);
          setLoading(false);
          return;
        }
      }
    } else if (usuario.rol === "padre") {
      const nombreNormalizado = normalizarNombre(usuario.nombre);
      // Insertar en tabla padres
      const { data: padreData, error: padreError } = await supabase
        .from("padres")
        .insert({ user_id: usuario.id, nombre: nombreNormalizado })
        .select()
        .single();

      if (padreError || !padreData) {
        alert("Error al crear registro de padre: " + padreError?.message);
        setLoading(false);
        return;
      }

      const padreId = padreData.id;

      // Insertar relaciones padres_nadadoras según codigos_nadadoras
      if (usuario.codigos_nadadoras?.length) {
        for (const codigo of usuario.codigos_nadadoras) {
          // Buscar nadadora por codigo_unico
          const { data: nadadoraData, error: nadadoraError } = await supabase
            .from("nadadoras")
            .select("id")
            .eq("codigo_unico", codigo)
            .single();

          if (!nadadoraError && nadadoraData) {
            const { error: insertError } = await supabase
              .from("padres_nadadoras")
              .insert({
                padre_id: padreId,
                nadadora_id: nadadoraData.id,
              });

            if (insertError) {
              console.error(
                "Error insertando padre-nadadora:",
                insertError.message,
              );
              alert(
                "Error insertando relación padre-nadadora: " +
                  insertError.message,
              );
            }
          }
        }
      }
    }

    // 3️⃣ Refrescar lista
    await fetchPendientes();
  };
  const denegarUsuario = async (usuario: UsuarioPendiente) => {
    const confirmar = confirm(
      `¿Seguro que quieres denegar a ${usuario.nombre}?`,
    );
    if (!confirmar) return;

    setLoading(true);

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", usuario.id);

    if (error) {
      alert("Error al denegar usuario: " + error.message);
    }

    await fetchPendientes(); // refrescar lista
  };

  useEffect(() => {
    fetchPendientes();
    fetchNadadorasVirtuales();
  }, []);

  if (loading)
    return <p className="loading-text">Cargando usuarios pendientes...</p>;

  return (
    <div className="usuarios-pendientes-container">
      <h2 className="usuarios-pendientes-title">
        Usuarios Pendientes de Aprobación
      </h2>
      {pendientes.length === 0 ? (
        <p className="no-usuarios">No hay usuarios pendientes.</p>
      ) : (
        <ul className="UsuarioP-usuarios-list">
          {pendientes.map((u) => (
            <li key={u.id} className="UsuarioP-usuario-item">
              <span className="UsuarioP-usuario-nombre">
                {u.nombre} ({u.rol})
              </span>
              {u.rol === "nadadora" && (
                <select
                  value={seleccionVirtual[u.id] || ""}
                  onChange={(e) =>
                    setSeleccionVirtual({
                      ...seleccionVirtual,
                      [u.id]: e.target.value ? parseInt(e.target.value) : "",
                    })
                  }
                >
                  <option value="">-- Sin nadadora virtual --</option>
                  {nadadorasVirtuales.map((nv) => (
                    <option key={nv.id} value={nv.id}>
                      {nv.nombre}
                    </option>
                  ))}
                </select>
              )}

              {u.rol === "padre" && u.hijas && (
                <span className="UsuarioP-usuario-hijas">
                  Hijas: {u.hijas.join(", ")}
                </span>
              )}
              <div className="UsuarioP-usuario-botones">
                <button
                  className="UsuarioP-btn-aceptar"
                  onClick={() => aceptarUsuario(u)}
                >
                  Aceptar
                </button>
                <button
                  className="UsuarioP-btn-denegar"
                  onClick={() => denegarUsuario(u)}
                >
                  Denegar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
