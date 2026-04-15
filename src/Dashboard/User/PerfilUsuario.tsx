// src/components/PerfilUsuario.tsx
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./PerfilUsuario.css";
import VersionInfo from "../../versionInfo";

interface Props {
  userId: string; // UUID de la tabla users
}
interface Logro {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha: string;
  veces_mejorado?: number;
  vigente: boolean;
}
interface StatsAsistencias {
  Asistencia: number;
  Falta: number;
  Retraso: number;
  Enferma: number;
  FaltaJustificada: number;
  porcentaje: number;
  coreografias: number;
}

export default function PerfilUsuario({ userId }: Props) {
  const navigate = useNavigate();
  // Datos usuario
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [userNombre, setUserNombre] = useState<string>("");
  const [rolNombre, setRolNombre] = useState<string>("");
  const [logros, setLogros] = useState<Logro[]>([]);
  const [codigoUnico, setCodigoUnico] = useState<string>("");
  const [stats, setStats] = useState<StatsAsistencias>({
    Asistencia: 0,
    Falta: 0,
    Retraso: 0,
    Enferma: 0,
    FaltaJustificada: 0,
    porcentaje: 0,
    coreografias: 0,
  });
  // Edición de foto
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [editingFoto, setEditingFoto] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [mensajeFoto, setMensajeFoto] = useState<string | null>(null);

  const handleFotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setTempImage(url);
    setEditingFoto(true);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Drag de imagen dentro del círculo
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDragging(true);
    setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };
  const handleMouseUp = () => setDragging(false);
  // Dibujar imagen en canvas
  useEffect(() => {
    if (!canvasRef.current || !tempImage) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.src = tempImage;
    img.onload = () => {
      const canvasSize = 200;

      // 1️⃣ Calcular escala inicial para cubrir el círculo
      const initialScale = Math.max(
        canvasSize / img.width,
        canvasSize / img.height
      );

      // 2️⃣ Usar scale del usuario o escala inicial si está en 1 (nuevo upload)
      const finalScale = scale === 1 ? initialScale : scale;

      const imgWidth = img.width * finalScale;
      const imgHeight = img.height * finalScale;

      // 3️⃣ Centrar la imagen solo si el offset está en su valor inicial
      const finalOffset = {
        x: offset.x === 0 ? (canvasSize - imgWidth) / 2 : offset.x,
        y: offset.y === 0 ? (canvasSize - imgHeight) / 2 : offset.y,
      };

      ctx.clearRect(0, 0, canvasSize, canvasSize);
      ctx.save();
      ctx.beginPath();
      ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, finalOffset.x, finalOffset.y, imgWidth, imgHeight);
      ctx.restore();
    };
  }, [tempImage, scale, offset]);

  const cropAndUpload = async () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], userId + ".jpg", { type: "image/jpeg" });
      await subirFoto(file);
      setEditingFoto(false);
      setTempImage(null);
    }, "image/jpeg");
    cargarPerfil();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    setDragging(true);
    setStartPos({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const touch = e.touches[0];
    setOffset({ x: touch.clientX - startPos.x, y: touch.clientY - startPos.y });
  };

  const handleTouchEnd = () => {
    setDragging(false);
  };

  useEffect(() => {
    async function cargarPerfil() {
      if (!userId) return;

      // 1️⃣ Cargar info del usuario
      const { data: userData } = await supabase
        .from("users")
        .select("nombre, rol_id")
        .eq("id", userId)
        .single();
      if (!userData) return;
      setUserNombre(userData.nombre);

      const { data: rolData } = await supabase
        .from("roles")
        .select("nombre")
        .eq("id", userData.rol_id)
        .single();
      setRolNombre(rolData?.nombre || "");

      // 2️⃣ Obtener id numérico de nadadora
      const { data: nadadoraData } = await supabase
        .from("nadadoras")
        .select("id , codigo_unico")
        .eq("user_id", userId)
        .single();
      if (!nadadoraData) return;
      setCodigoUnico(nadadoraData.codigo_unico);
      const nadadoraId = nadadoraData.id;

      // 3️⃣ Obtener temporada actual
      const hoy = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      // 1️⃣ Conseguir la temporada actual según fecha
      const { data: temporadaActual } = await supabase
        .from("temporadas")
        .select("id")
        .lte("fecha_inicio", hoy)
        .gte("fecha_fin", hoy)
        .single();
      if (!temporadaActual) {
        console.warn("No se encontró una temporada activa hoy:", hoy);
        return;
      }

      // 4️⃣ Obtener los nadadora_grupo_id de esta nadadora en la temporada actual
      const { data: gruposData, error: gruposErr } = await supabase
        .from("nadadora_grupos")
        .select("id")
        .eq("nadadora_id", nadadoraId)
        .eq("temporada_id", temporadaActual.id);

      if (gruposErr) {
        console.error(gruposErr);
        return;
      }
      // Obtener logros de la nadadora
      const { data: logrosData, error: logrosErr } = await supabase
        .from("nadadoras_logros")
        .select(
          `
    id,
    fecha,
    veces_mejorado,
    vigente,
    ultima_mejora,
    logro:logro_id(nombre, descripcion)
  `
        )
        .eq("nadadora_id", nadadoraId);

      if (logrosErr) {
        console.error(logrosErr);
      } else if (logrosData) {
        const formatted = (logrosData as any).map((l: any) => ({
          id: l.id,
          nombre: l.logro.nombre,
          descripcion: l.logro.descripcion,
          fecha: l.fecha,
          veces_mejorado: l.veces_mejorado,
          vigente: l.vigente,
        }));
        setLogros(formatted);
      }

      const grupoIds = gruposData?.map((g) => g.id) || [];

      if (grupoIds.length === 0) {
        setStats({
          Asistencia: 0,
          Falta: 0,
          Retraso: 0,
          Enferma: 0,
          FaltaJustificada: 0,
          porcentaje: 0,
          coreografias: 0,
        });
        return;
      }

      // 5️⃣ Obtener asistencias de esos grupos (solo temporada actual)
      const { data: asistenciasData, error: asistErr } = await supabase
        .from("asistencias")
        .select("asistencia")
        .in("nadadora_grupo_id", grupoIds);

      if (asistErr) {
        console.error(asistErr);
        return;
      }

      // 6️⃣ Calcular estadísticas
      const statsAsistencias: any = {
        Asistencia: 0,
        Falta: 0,
        Retraso: 0,
        Enferma: 0,
        FaltaJustificada: 0,
      };

      (asistenciasData || []).forEach((a: any) => {
        if (statsAsistencias[a.asistencia] !== undefined) {
          statsAsistencias[a.asistencia]++;
        }
      });

      const totalRelevante =
        statsAsistencias.Asistencia +
        statsAsistencias.Retraso +
        statsAsistencias.Enferma +
        statsAsistencias.FaltaJustificada;

      const porcentaje = totalRelevante
        ? Math.round((statsAsistencias.Asistencia / totalRelevante) * 100)
        : 0;

      // 4️⃣ Estadísticas de coreografías
      const { count: coreosCount } = await supabase
        .from("coreografia_nadadora")
        .select("coreografia_id", { count: "exact" })
        .eq("nadadora_id", nadadoraId);

      setStats({
        ...statsAsistencias,
        porcentaje,
        coreografias: coreosCount || 0,
      });

      // 5️⃣ Foto de perfil
      const { data: fileData, error: fileError } = await supabase.storage
        .from("fotos-perfil")
        .download(userId + ".jpg");
      console.log("🚀 ~ fileError:", fileError);
      setFotoUrl(fileError ? null : URL.createObjectURL(fileData));
    }

    cargarPerfil();
  }, [userId]);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("usuario");
    navigate("/");
  };

  async function subirFoto(file: File) {
    const fileName = userId + ".jpg";

    // Subir el archivo con upsert: true (reemplaza si ya existe)
    const { error: uploadError } = await supabase.storage
      .from("fotos-perfil")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error("Error subiendo nueva foto:", uploadError);
      return;
    }

    setMensajeFoto("La imagen se actualizará en unas horas...");
    setTimeout(() => setMensajeFoto(null), 5000);
    await new Promise((res) => setTimeout(res, 200));
    // Descargar el archivo recién subido para mostrarlo
    const { data: fileData, error: fileError } = await supabase.storage
      .from("fotos-perfil")
      .download(fileName);

    if (fileError) {
      console.error("Error descargando la foto subida:", fileError);
      setFotoUrl(null);
      return;
    }

    // Crear URL para mostrar en la interfaz y añadir cache-buster
    const url = URL.createObjectURL(fileData) + `?t=${Date.now()}`;
    setFotoUrl(url);
  }

  const asistenciaKeys = [
    "Asistencia",
    "Falta",
    "Retraso",
    "Enferma",
    "FaltaJustificada",
  ];

  function formatearAsistencia(key: string) {
    switch (key) {
      case "Asistencia":
        return "Asistencia";
      case "Falta":
        return "Falta";
      case "Retraso":
        return "Retraso";
      case "Enferma":
        return "Enferma";
      case "FaltaJustificada":
        return "Falta Justificada";
      default:
        // Si no coincide, poner la palabra separada por mayúsculas
        return key.replace(/([A-Z])/g, " $1").trim();
    }
  }
  function getPorcentajeColor(porcentaje: number) {
    if (porcentaje >= 80) return "#A8F4AB"; // verde pastel
    if (porcentaje >= 50) return "#F7F1A5"; // amarillo pastel
    if (porcentaje >= 35) return "#F7C4A5"; // naranja pastel
    return "#FFB3AC"; // rojo pastel
  }
  function getPorcentajeTextColor(porcentaje: number) {
    if (porcentaje >= 80) return "#0F7A12"; // verde oscuro
    if (porcentaje >= 50) return "#8A7A00"; // amarillo oscuro
    if (porcentaje >= 35) return "#8A3F00"; // naranja oscuro
    return "#8A0000"; // rojo oscuro
  }

  return (
    <div className="Perfil-User-container">
      <div className="Perfil-User-header">
        <div className="Perfil-User-foto">
          {fotoUrl && !editingFoto && (
            <img
              src={fotoUrl}
              alt="Foto"
              style={{ width: "100%", height: "100%" }}
            />
          )}
          {!fotoUrl && !editingFoto && (
            <div className="Perfil-User-fotoPlaceholder">
              {userNombre?.slice(0, 1).toUpperCase()}
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {editingFoto && tempImage && (
          <div className="editor-overlay">
            <canvas
              ref={canvasRef}
              width={200}
              height={200}
              style={{ borderRadius: "50%", touchAction: "none" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
            />
            <button onClick={cropAndUpload}>Guardar</button>
            <button onClick={() => setEditingFoto(false)}>Cancelar</button>
          </div>
        )}

        <div className="Perfil-User-info">
          <h2>{userNombre}</h2>
          <p>
            <strong>Rol:</strong> {rolNombre}
          </p>
          <p>
            <strong>Código:</strong> {codigoUnico}
          </p>

          {/* BOTÓN PARA SUBIR FOTO */}
          <button
            onClick={handleFotoClick}
            style={{
              marginTop: "10px",
              padding: "6px 12px",
              borderRadius: "6px",
              backgroundColor: "#10b981",
              color: "#fff",
              border: "none",
            }}
          >
            Subir foto
          </button>
          {mensajeFoto && (
            <p
              style={{
                marginTop: "6px",
                fontSize: "15px",
                borderRadius: "6px",
                padding: "6px 12px",
                color: "#000000ff",
                background: "#b99110d3",
              }}
            >
              {mensajeFoto}
            </p>
          )}

          {/* AVISO PARA MOVER FOTO */}
          {fotoUrl && (
            <p
              style={{
                marginTop: "6px",
                fontSize: "12px",
                color: "#555",
              }}
            >
              Arrastra la foto dentro del círculo para ajustarla
            </p>
          )}
        </div>
      </div>
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <VersionInfo />
      </div>
      <div className="Perfil-User-stats">
        <h3>Resumen</h3>
        <div className="Perfil-User-statsGrid">
          {asistenciaKeys.map((key) => (
            <div key={key} className={`Perfil-User-statCard asistencia-${key}`}>
              <p className="Perfil-User-statNumber">
                {stats[key as keyof StatsAsistencias]}
              </p>
              <p>{formatearAsistencia(key)}</p>
            </div>
          ))}

          <div
            className="Perfil-User-statCard"
            style={{ backgroundColor: getPorcentajeColor(stats.porcentaje) }}
          >
            <p
              className="Perfil-User-statNumber"
              style={{ color: getPorcentajeTextColor(stats.porcentaje) }}
            >
              {stats.porcentaje}%
            </p>
            <p>Asistencia %</p>
          </div>

          <div className="Perfil-User-statCard">
            <p className="Perfil-User-statNumber">{stats.coreografias}</p>
            <p>Coreografías</p>
          </div>
        </div>
        <div className="Perfil-User-logros">
          <h3>Logros</h3>
          {logros.length === 0 ? (
            <p>No tienes logros todavía.</p>
          ) : (
            <div className="Perfil-User-logrosGrid">
              {logros.map((l) => (
                <div
                  key={l.id}
                  className="Perfil-User-logroCard"
                  style={{ opacity: l.vigente ? 1 : 0.5 }}
                >
                  <h4>{l.nombre}</h4>
                  {l.descripcion && <p>{l.descripcion}</p>}
                  {l.veces_mejorado && l.veces_mejorado > 1 && (
                    <p className="logro-mejoras">
                      Mejorado {l.veces_mejorado} veces
                    </p>
                  )}
                  <p className="logro-fecha">
                    {new Date(l.fecha).toLocaleDateString()}
                  </p>
                  {!l.vigente && (
                    <span className="logro-perdido">⚠️ Perdido</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button className="Perfil-User-btnLogout" onClick={logout}>
        Cerrar sesión
      </button>
    </div>
  );
}
function cargarPerfil() {
  throw new Error("Function not implemented.");
}
