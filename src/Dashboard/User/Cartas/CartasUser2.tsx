import { useEffect, useState } from "react";
import "./CartasUser2.css";
import { supabase } from "../../../lib/supabaseClient";
import { StatBar } from "./StatBar";
import Toast from "../../../utils/Toast";

export interface CartaNadadora {
  id: number;
  carta_id: number;
  nombre: string;
  descripcion: string;
  imagen_url: string;
  nivel: number;
  flexibilidad: number;
  fuerza: number;
  apnea: number;
  impresion_artistica: number;
  rareza: "comun" | "rara" | "epica" | "legendaria" | "especial";
  rareza_base: "comun" | "rara" | "epica" | "legendaria" | "especial";
  tipo: "diaria" | "reto" | "entrenador" | "nadadora";
}

interface Carta {
  id: number;
  nombre: string;
  descripcion: string;
  imagen_url: string;
  tipo: "diaria" | "reto" | "entrenador" | "nadadora";
  rareza_base: "comun" | "rara" | "epica" | "legendaria" | "especial";
}

interface Props {
  nadadoraId: number;
  irACoreografia?: (cartas: CartaNadadora[]) => void;
}

export default function AlbumCartas({ nadadoraId, irACoreografia }: Props) {
  const [cartas, setCartas] = useState<CartaNadadora[]>([]);
  const [cartasPosibles, setCartasPosibles] = useState<Carta[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [cartasDetalle, setCartasDetalle] = useState<CartaNadadora[]>([]);
  //   const [modalConfirmFusion, setModalConfirmFusion] = useState(false);

  const [isAdquiriendo, setIsAdquiriendo] = useState(false);
  // 🔹 Estado para carta diaria
  const [cartaDelDia, setCartaDelDia] = useState<CartaNadadora | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setToast({ message, type });
  };

  // 🔹 Rangos de stats por rareza
  const statsRanges: Record<string, [number, number]> = {
    comun: [10, 45],
    rara: [25, 60],
    epica: [40, 75],
    legendaria: [55, 100],
    especial: [100, 100],
  };

  // 🔹 Probabilidades de rareza
  const rarezaProbabilidades = [
    { rareza: "comun", peso: 60 },
    { rareza: "rara", peso: 25 },
    { rareza: "epica", peso: 10 },
    { rareza: "legendaria", peso: 5 },
    { rareza: "especial", peso: 0 },
  ];

  // 🔹 Aux: número aleatorio entre min y max
  const randomStat = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  // 🔹 Aux: elegir rareza aleatoria según probabilidad
  const elegirRareza = () => {
    const total = rarezaProbabilidades.reduce((sum, r) => sum + r.peso, 0);
    const rnd = Math.random() * total;
    let acumulado = 0;
    for (const r of rarezaProbabilidades) {
      acumulado += r.peso;
      if (rnd <= acumulado)
        return r.rareza as
          | "comun"
          | "rara"
          | "epica"
          | "legendaria"
          | "especial";
    }
    return "comun";
  };

  // 🔹 Función para adquirir carta diaria
  const adquirirCartaDiaria = async () => {
    if (isAdquiriendo) return; // ⛔ evita llamadas dobles
    setIsAdquiriendo(true);
    const hoy = new Date().toISOString().slice(0, 10);
    try {
      // Verificar si ya adquirió carta diaria
      const { data: cartaHoy } = await supabase
        .from("cartas_nadadora")
        .select("*")
        .eq("nadadora_id", nadadoraId)
        .eq("fecha_adquisicion", hoy)
        .eq("cartas.tipo", "diaria");

      if (cartaHoy) {
        showToast("Ya adquiriste la carta del día", "info");
        return;
      }

      // Elegir rareza y carta disponible
      const rareza = elegirRareza();
      const { data: cartasDisponibles } = await supabase
        .from("cartas")
        .select("*")
        .eq("tipo", "diaria")
        .eq("rareza_base", rareza);

      if (!cartasDisponibles || cartasDisponibles.length === 0) {
        showToast("No hay cartas disponibles de esta rareza hoy", "error");
        return;
      }

      const cartaAleatoria =
        cartasDisponibles[Math.floor(Math.random() * cartasDisponibles.length)];
      const [min, max] = statsRanges[rareza];

      const nuevaCartaData = {
        nadadora_id: nadadoraId,
        carta_id: cartaAleatoria.id,
        nivel: 1,
        flexibilidad: randomStat(min, max),
        fuerza: randomStat(min, max),
        apnea: randomStat(min, max),
        impresion_artistica: randomStat(min, max),
        rareza,
        bonificacion_asistencia_usada: false,
        fecha_adquisicion: hoy,
      };

      const { data: nuevaCarta, error } = await supabase
        .from("cartas_nadadora")
        .insert([nuevaCartaData])
        .select("*, cartas(*)")
        .single();

      if (error || !nuevaCarta) throw error;

      setCartas((prev) => [...prev, nuevaCarta]);
      setCartaDelDia({
        id: nuevaCarta.id,
        carta_id: cartaAleatoria.id,
        nivel: nuevaCarta.nivel,
        flexibilidad: nuevaCarta.flexibilidad,
        fuerza: nuevaCarta.fuerza,
        apnea: nuevaCarta.apnea,
        impresion_artistica: nuevaCarta.impresion_artistica,
        rareza: nuevaCarta.rareza,
        nombre: cartaAleatoria.nombre,
        descripcion: cartaAleatoria.descripcion,
        imagen_url: cartaAleatoria.imagen_url,
        tipo: cartaAleatoria.tipo,
        rareza_base: cartaAleatoria.rareza_base,
      });

      showToast("Carta diaria adquirida ✅", "success");
    } catch (err) {
      console.error("Error al adquirir carta diaria:", err);
      showToast("Ocurrió un error al adquirir la carta 😕", "error");
    } finally {
      setIsAdquiriendo(false); // 🔓 desbloquea siempre
    }
  };

  // Contadores de rarezas obtenidas
  const totalCartasPorRareza = {
    comun: 0,
    rara: 0,
    epica: 0,
    legendaria: 0,
    especial: 0,
  };

  // Contadores de rarezas posibles (del álbum completo)
  const totalPosiblesPorRareza = {
    comun: 0,
    rara: 0,
    epica: 0,
    legendaria: 0,
    especial: 0,
  };

  // Rellenar contadores
  // Agrupar cartas por carta_id (solo 1 por nombre/carta)
  const cartasUnicas = new Map<number, CartaNadadora>();

  cartas.forEach((c) => {
    if (!cartasUnicas.has(c.carta_id)) {
      cartasUnicas.set(c.carta_id, c);
    }
  });

  // Ahora llenamos los contadores solo con cartas únicas
  cartasUnicas.forEach((c) => {
    totalCartasPorRareza[c.rareza_base]++;
  });

  cartasPosibles.forEach((c) => {
    totalPosiblesPorRareza[c.rareza_base]++;
  });

  const ordenRareza: Record<string, number> = {
    comun: 1,
    rara: 2,
    epica: 3,
    legendaria: 4,
  };

  // Ordenar las cartas posibles por rareza y nombre
  const cartasOrdenadas = [...cartasPosibles].sort((a, b) => {
    const r1 = ordenRareza[a.rareza_base];
    const r2 = ordenRareza[b.rareza_base];

    if (r1 !== r2) return r1 - r2;
    return a.nombre.localeCompare(b.nombre);
  });

  // Cargar cartas
  useEffect(() => {
    async function cargarCartas() {
      // Todas las cartas posibles
      const { data: todasCartas } = await supabase.from("cartas").select("*");
      if (todasCartas) setCartasPosibles(todasCartas);

      // Cartas que tiene la nadadora
      const { data: cartasData } = await supabase
        .from("cartas_nadadora")
        .select(
          `id, carta_id, nivel, flexibilidad, fuerza, apnea, impresion_artistica, rareza,
           cartas(nombre, descripcion, imagen_url, tipo, rareza_base)`,
        )
        .eq("nadadora_id", nadadoraId);

      if (cartasData) {
        const cartasFormateadas = cartasData.map((c: any) => ({
          ...c,
          nombre: c.cartas.nombre,
          descripcion: c.cartas.descripcion,
          imagen_url: c.cartas.imagen_url,
          tipo: c.cartas.tipo,
          rareza_base: c.cartas.rareza_base,
        }));
        setCartas(cartasFormateadas);
      }
    }
    async function cargarCartaDelDia() {
      const hoy = new Date().toISOString().slice(0, 10);
      const { data: cartasHoy } = await supabase
        .from("cartas_nadadora")
        .select(`*, cartas(nombre, descripcion, imagen_url, tipo, rareza_base)`)
        .eq("nadadora_id", nadadoraId)
        .eq("fecha_adquisicion", hoy)
        .eq("cartas.tipo", "diaria")
        .limit(1); // ← evita múltiples filas sin error
      const cartaHoy = cartasHoy?.[0];
      if (cartaHoy) {
        setCartaDelDia({
          id: cartaHoy.id,
          carta_id: cartaHoy.carta_id,
          nivel: cartaHoy.nivel,
          flexibilidad: cartaHoy.flexibilidad,
          fuerza: cartaHoy.fuerza,
          apnea: cartaHoy.apnea,
          impresion_artistica: cartaHoy.impresion_artistica,
          rareza: cartaHoy.rareza,
          nombre: cartaHoy.cartas.nombre,
          descripcion: cartaHoy.cartas.descripcion,
          imagen_url: cartaHoy.cartas.imagen_url,
          tipo: cartaHoy.cartas.tipo,
          rareza_base: cartaHoy.cartas.rareza_base,
        });
      }
    }
    cargarCartaDelDia();
    cargarCartas();
  }, [nadadoraId]);

  // Función para fusionar cartas
  // async function combinarCartas(
  //   cartaPrincipal: CartaNadadora,
  //   cartaExtra: CartaNadadora
  // ) {
  //   try {
  //     const nuevoNivel = cartaPrincipal.nivel + 1;
  //     const statsKeys: (keyof CartaNadadora)[] = [
  //       "flexibilidad",
  //       "fuerza",
  //       "apnea",
  //       "impresion_artistica",
  //     ];
  //     const totalStats = statsKeys.reduce(
  //       (sum, k) => sum + Number(cartaPrincipal[k]),
  //       0
  //     );

  //     const aumentoTotal = 10;
  //     const cartaMejorada: CartaNadadora = { ...cartaPrincipal };
  //     cartaMejorada.nivel = nuevoNivel;
  //     statsKeys.forEach((k) => {
  //       const key = k as keyof Pick<
  //         CartaNadadora,
  //         "flexibilidad" | "fuerza" | "apnea" | "impresion_artistica"
  //       >;
  //       const valorActual = cartaPrincipal[key] as number; // aseguramos que es número
  //       const proporcion = valorActual / totalStats;

  //       cartaMejorada[key] = Math.round(
  //         valorActual + aumentoTotal * proporcion
  //       ) as number;
  //     });

  //     // Actualizar en Supabase
  //     const { error: updateError } = await supabase
  //       .from("cartas_nadadora")
  //       .update({
  //         nivel: cartaMejorada.nivel,
  //         flexibilidad: cartaMejorada.flexibilidad,
  //         fuerza: cartaMejorada.fuerza,
  //         apnea: cartaMejorada.apnea,
  //         impresion_artistica: cartaMejorada.impresion_artistica,
  //       })
  //       .eq("id", cartaPrincipal.id);
  //     if (updateError) throw updateError;

  //     // Eliminar carta extra
  //     const { error: deleteError } = await supabase
  //       .from("cartas_nadadora")
  //       .delete()
  //       .eq("id", cartaExtra.id);
  //     if (deleteError) throw deleteError;

  //     setCartas((prev) =>
  //       prev
  //         .filter((c) => c.id !== cartaExtra.id)
  //         .map((c) => (c.id === cartaPrincipal.id ? cartaMejorada : c))
  //     );

  //     showToast(
  //       `${cartaPrincipal.nombre} ha subido a nivel ${nuevoNivel} ✨`,
  //       "success"
  //     );
  //   } catch (err) {
  //     console.error("Error al combinar cartas:", err);
  //     showToast("Ocurrió un error al combinar las cartas 😕", "error");
  //   }
  // }

  // Abrir modal mostrando todas las cartas de ese nombre
  function handleCartaClick(carta: CartaNadadora) {
    const cartasMismoNombre = cartas.filter((c) => c.nombre === carta.nombre);
    setCartasDetalle(cartasMismoNombre);
    setModalVisible(true);
  }

  return (
    <div className="Album-User-container">
      <div className="Album-User-info-coleccion">
        <div className="info-row">
          <div className="info-total">
            <span className="info-title">Colección:</span>
            <span className="info-number">
              {cartasUnicas.size} / {cartasPosibles.length}
            </span>
          </div>
        </div>

        <div className="info-rareza-row">
          <div className="chip comun">
            <span className="rareza-nombre">Común</span>
            <span className="rareza-num">
              {" "}
              {totalCartasPorRareza.comun}/{totalPosiblesPorRareza.comun}{" "}
            </span>
          </div>
          <div className="chip rara">
            <span className="rareza-nombre">Rara</span>
            <span className="rareza-num">
              {" "}
              {totalCartasPorRareza.rara}/{totalPosiblesPorRareza.rara}{" "}
            </span>
          </div>
          <div className="chip epica">
            <span className="rareza-nombre">Épica</span>
            <span className="rareza-num">
              {" "}
              {totalCartasPorRareza.epica}/{totalPosiblesPorRareza.epica}{" "}
            </span>
          </div>
          <div className="chip legendaria">
            <span className="rareza-nombre">Legendaria</span>
            <span className="rareza-num">
              {" "}
              {totalCartasPorRareza.legendaria}/
              {totalPosiblesPorRareza.legendaria}{" "}
            </span>
          </div>
          <div className="chip especial">
            <span className="rareza-nombre">Especial</span>
            <span className="rareza-num">
              {" "}
              {totalCartasPorRareza.especial}/
              {totalPosiblesPorRareza.especial}{" "}
            </span>
          </div>
        </div>
      </div>
      {!cartaDelDia && (
        <div style={{ textAlign: "center", margin: "10px 0" }}>
          <button
            className="Album-User-boton-diaria"
            onClick={adquirirCartaDiaria}
            disabled={isAdquiriendo}
          >
            Adquirir carta diaria
          </button>
        </div>
      )}

      {cartaDelDia && (
        <div
          className={`Album-User-carta-dia Album-User-${cartaDelDia.rareza_base}`}
        >
          <img src={cartaDelDia.imagen_url} alt={cartaDelDia.nombre} />
          <h3>{cartaDelDia.nombre}</h3>
          <p>{cartaDelDia.descripcion}</p>
          <div className="Album-User-carta-stats">
            <StatBar
              label="Flex"
              value={cartaDelDia.flexibilidad}
              color="#4db8ff"
            />
            <StatBar
              label="Fuerza"
              value={cartaDelDia.fuerza}
              color="#ff4d4d"
            />
            <StatBar label="Apnea" value={cartaDelDia.apnea} color="#33cc33" />
            <StatBar
              label="Imp"
              value={cartaDelDia.impresion_artistica}
              color="#bb33ff"
            />
          </div>
        </div>
      )}

      <div className="Album-User-grid">
        {cartasOrdenadas.map((c) => {
          const cartasUsuarioMismoId = cartas.filter(
            (cu) => cu.carta_id === c.id,
          );
          const cartaUsuario = cartasUsuarioMismoId[0]; // la primera carta si hay varias
          const cantidad = cartasUsuarioMismoId.length;
          return (
            <div
              key={c.id}
              className={`Album-User-cromo ${
                cartaUsuario
                  ? `Album-User-${cartaUsuario.rareza_base}`
                  : `Album-User-faltante Album-User-${c.rareza_base}` // aplicamos rareza tenue
              }`}
              onClick={() => cartaUsuario && handleCartaClick(cartaUsuario)}
            >
              <img
                src={cartaUsuario ? cartaUsuario.imagen_url : "/carta-base.png"}
                alt={"Carta"}
                className={cartaUsuario ? "" : "grayscale"} // clase extra para CSS
              />
              <div className="Album-User-cromo-nombre">
                {" "}
                {cartaUsuario ? c.nombre : "¿?¿?¿?"}
              </div>
              {cartaUsuario && (
                <div className="Album-User-cromo-nivel">
                  {"⭐".repeat(cartaUsuario.nivel)}
                </div>
              )}
              {/* Badge de cantidad si hay más de una carta */}
              {cantidad > 1 && (
                <div className="Album-User-cromo-badge">{cantidad}</div>
              )}
            </div>
          );
        })}
      </div>

      {modalVisible && (
        <div
          className="Album-User-modal-overlay"
          onClick={() => {
            setModalVisible(false);
          }}
        >
          <div
            className="Album-User-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{cartasDetalle[0]?.nombre}</h2>

            <div className="Album-User-cartas-lista">
              {cartasDetalle.map((c) => (
                <div
                  key={c.id}
                  className={`Album-User-carta-fusion Album-User-${
                    c.rareza_base
                  } `}
                  onClick={() => {
                    console.log("carta seleccionada", c);
                  }}
                >
                  <img src={c.imagen_url} alt={c.nombre} />
                  <div>Nivel: {c.nivel}</div>
                  <div className="Album-User-carta-stats">
                    <StatBar
                      label="Flex"
                      value={c.flexibilidad}
                      color="#4db8ff"
                    />
                    <StatBar label="Fuerza" value={c.fuerza} color="#ff4d4d" />
                    <StatBar label="Apnea" value={c.apnea} color="#33cc33" />
                    <StatBar
                      label="Imp"
                      value={c.impresion_artistica}
                      color="#bb33ff"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* {cartaSeleccionadaFusion && cartaExtraFusion && (
              <div className="Album-User-modal-confirm">
                <h3>Confirmar fusión</h3>
                <p>
                  La carta <b>{cartaSeleccionadaFusion.nombre}</b> será la
                  principal.
                </p>
                <p>
                  ¿Deseas fusionarla con <b>{cartaExtraFusion.nombre}</b>?
                </p>
                <div className="Album-User-modal-buttons">
                  <button
                    onClick={() => {
                      combinarCartas(cartaSeleccionadaFusion, cartaExtraFusion);
                      setCartaSeleccionadaFusion(null);
                      setCartaExtraFusion(null);
                    }}
                  >
                    Confirmar
                  </button>
                  <button onClick={() => setCartaExtraFusion(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )} */}

            <button onClick={() => setModalVisible(false)}>Cerrar</button>
          </div>
        </div>
      )}
      <div style={{ textAlign: "center", margin: "15px 0" }}>
        <button
          className="Album-User-boton-coreografia"
          onClick={() => irACoreografia?.(cartas)}
        >
          🎶 Montar coreografía
        </button>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} duration={3000} />
      )}
    </div>
  );
}
