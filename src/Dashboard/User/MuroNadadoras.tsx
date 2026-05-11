import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./MuroNadadoras.css";

interface Reacciones {
  [emoji: string]: number[];
}
interface Post {
  id: number;
  nadadora_id: number;
  user_id: string;
  nombre: string;
  apellido: string;
  texto: string;
  creado_en: string;
  reacciones: Reacciones;
  comentarios: Comment[];
  fotoUrl?: string | null;
}

interface Comment {
  id: number;
  post_id: number;
  nadadora_id: number;
  nombre: string;
  apellido: string;
  texto: string;
  creado_en: string;
  fotoUrl?: string | null;
}

interface Props {
  nadadoraId: number;
}

const EMOJIS = ["❤️", "😂", "👏", "😮", "😢", "🔥", "💪"];
export default function MuroNadadoras({ nadadoraId }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [emojiVisibleFor, setEmojiVisibleFor] = useState<number | null>(null);
  const [nuevoPost, setNuevoPost] = useState("");
  const [nuevoComentario, setNuevoComentario] = useState<{
    [postId: number]: string;
  }>({});
  const [loading, setLoading] = useState(true);

  // Nuevo estado: controla si se ha abierto el chat grupal
  const [chatAbierto, setChatAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [nadadoras, setNadadoras] = useState<
    { id: number; nombre: string; apellido: string }[]
  >([]);
  const [conversaciones, setConversaciones] = useState<
    { id: number; nadadora_1_id: number; nadadora_2_id: number }[]
  >([]);

  const [chatActual, setChatActual] = useState<{
    id: number;
    otraNadadoraId: number;
  } | null>(null);
  const [mensajes, setMensajes] = useState<
    {
      id: number;
      remitente_id: number;
      texto: string;
      creado_en: string;
      leido: boolean;
    }[]
  >([]);

  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [otraNadadora, setOtraNadadora] = useState<{
    nombre: string;
    apellido: string;
  } | null>(null);
  const [unreadByChatId, setUnreadByChatId] = useState<{
    [chatId: number]: number;
  }>({});
const [hayPostsSinLeer, setHayPostsSinLeer] = useState(false);
  const mensajesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mensajesEndRef.current) {
      mensajesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [chatActual]);

  useEffect(() => {
    if (!chatActual) return;

    // Esperamos un pequeño tiempo a que React pinte los mensajes
    const timeout = setTimeout(() => {
      if (mensajesEndRef.current) {
        mensajesEndRef.current.scrollIntoView({ behavior: "auto" });
      }
    }, 80); // 50–120 ms funciona perfecto

    return () => clearTimeout(timeout);
  }, [chatActual, mensajes.length]);

useEffect(() => {
  fetchNadadoras();
  fetchConversaciones();
  comprobarPostsSinLeer();

  if (chatAbierto) {
    fetchPosts();
  }
}, [chatAbierto]);


  const comprobarPostsSinLeer = async () => {
  // Último post del muro
  const { data: ultimoPost } = await supabase
    .from("posts_nadadoras")
    .select("creado_en, nadadora_id")
    .neq("nadadora_id", nadadoraId)
    .order("creado_en", { ascending: false })
    .limit(1)
    .single();

  if (!ultimoPost) return;

  // Última vez que abrió el chat grupal
  const { data: leido } = await supabase
    .from("posts_nadadoras_leidos")
    .select("ultimo_post_visto")
    .eq("nadadora_id", nadadoraId)
    .single();

  if (!leido) {
    setHayPostsSinLeer(true);
    return;
  }

  const ultimoVisto = new Date(leido.ultimo_post_visto).getTime();
  const ultimoMensaje = new Date(ultimoPost.creado_en).getTime();

  setHayPostsSinLeer(ultimoMensaje > ultimoVisto);
};
  const fetchNadadoras = async () => {
    const { data } = await supabase
      .from("nadadoras")
      .select("id, nombre, apellido");
    if (data) setNadadoras(data);
  };

  const fetchConversaciones = async () => {
    const { data } = await supabase
      .from("chats")
      .select("*")
      .or(`nadadora_1_id.eq.${nadadoraId},nadadora_2_id.eq.${nadadoraId}`); // chats donde participas
    if (data) {
      setConversaciones(data);
      await fetchUnreadCounts(data);
    }
  };

  const fetchUnreadCounts = async (convs: { id: number }[]) => {
    const unreadMap: { [id: number]: number } = {};

    for (const c of convs) {
      const { count } = await supabase
        .from("mensajes_chats")
        .select("*", { count: "exact", head: true })
        .eq("chat_id", c.id)
        .neq("remitente_id", nadadoraId)
        .eq("leido", false);

      unreadMap[c.id] = count || 0;
    }

    setUnreadByChatId(unreadMap);
  };
  const fetchMensajes = async (chatId: number) => {
    const { data } = await supabase
      .from("mensajes_chats")
      .select("*")
      .eq("chat_id", chatId)
      .order("creado_en", { ascending: true });

    setMensajes(data || []);
  };

  const abrirOCrearChat = async (otraId: number) => {
    // Primero buscamos si ya existe un chat con esa otra nadadora
    const { data } = await supabase
      .from("chats")
      .select("*")
      .or(
        `and(nadadora_1_id.eq.${nadadoraId},nadadora_2_id.eq.${otraId}),and(nadadora_1_id.eq.${otraId},nadadora_2_id.eq.${nadadoraId})`,
      )
      .limit(1);

    const chatExistente = data?.[0]; // <--- acceder al primer elemento
    let chatId = chatExistente?.id;

    if (!chatId) {
      // Si no existe, creamos el chat
      const { data: nuevoChat } = await supabase
        .from("chats")
        .insert({
          nadadora_1_id: nadadoraId,
          nadadora_2_id: otraId,
        })
        .select()
        .single();

      chatId = nuevoChat?.id;
      if (nuevoChat) {
        setConversaciones((prev) => [...prev, nuevoChat]);
      }
    }

    setChatActual({ id: chatId!, otraNadadoraId: otraId });
    // Obtener datos de la otra nadadora
    const { data: otra } = await supabase
      .from("nadadoras")
      .select("nombre, apellido")
      .eq("id", otraId)
      .single();

    setOtraNadadora(otra || null);
    await fetchMensajes(chatId!);
    await marcarMensajesLeidos(chatId!);
    await fetchMensajes(chatId!);
    setUnreadByChatId((prev) => ({ ...prev, [chatId!]: 0 }));
  };

  const resultadosFiltrados = nadadoras.filter(
    (n) =>
      n.id !== nadadoraId &&
      `${n.nombre} ${n.apellido}`
        .toLowerCase()
        .includes(busqueda.toLowerCase()),
  );
  const fetchPosts = async () => {
    if (!chatAbierto) return;
    setLoading(true);
    const { data: postsData } = await supabase
      .from("posts_nadadoras")
      .select("*")
      .order("creado_en", { ascending: false });

    if (!postsData || postsData.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const nadadoraIds = Array.from(
      new Set(postsData.map((p) => p.nadadora_id)),
    );
    const postIds = postsData.map((p) => p.id);

    // Traemos nombres y fotos de las nadadoras de los posts
    const { data: nadadorasData } = await supabase
      .from("nadadoras")
      .select("id, nombre, apellido, user_id")
      .in("id", nadadoraIds);

    // Traemos comentarios de todos los posts
    const { data: comentariosData } = await supabase
      .from("comentarios_nadadoras_posts")
      .select("*")
      .in("post_id", postIds);

    // Nadadoras que comentaron
    const nadadorasComentariosIds = Array.from(
      new Set(comentariosData?.map((c) => c.nadadora_id) || []),
    );

    const { data: nadadorasComentariosData } = await supabase
      .from("nadadoras")
      .select("id, nombre, apellido, user_id")
      .in("id", nadadorasComentariosIds);

    const postsWithNames = await Promise.all(
      postsData.map(async (post) => {
        const nadadora = nadadorasData?.find((n) => n.id === post.nadadora_id);

        let fotoUrl = null;
        if (nadadora) {
          const { data: fileData, error } = await supabase.storage
            .from("fotos-perfil")
            .download(nadadora.user_id + ".jpg");
          if (!error && fileData) fotoUrl = URL.createObjectURL(fileData);
        }

        // Filtramos comentarios de este post y agregamos nombre, apellido y foto
        const comentarios = await Promise.all(
          comentariosData
            ?.filter((c) => c.post_id === post.id)
            .map(async (c) => {
              const nadComent = nadadorasComentariosData?.find(
                (n) => n.id === c.nadadora_id,
              );

              let fotoComentUrl: string | null = null;
              if (nadComent?.user_id) {
                const { data: fileData, error } = await supabase.storage
                  .from("fotos-perfil")
                  .download(nadComent.user_id + ".jpg");
                if (!error && fileData)
                  fotoComentUrl = URL.createObjectURL(fileData);
              }

              return {
                ...c,
                nombre: nadComent?.nombre || "Desconocido",
                apellido: nadComent?.apellido || "",
                fotoUrl: fotoComentUrl,
              };
            }) || [],
        );

        return {
          ...post,
          nombre: nadadora?.nombre || "Desconocido",
          apellido: nadadora?.apellido || "",
          fotoUrl,
          comentarios,
        };
      }),
    );

    setPosts(postsWithNames);
    setLoading(false);
  };


  const marcarChatGrupalLeido = async () => {
  const now = new Date().toISOString();

  // 1. Intentar actualizar primero
  const { data, error } = await supabase
    .from("posts_nadadoras_leidos")
    .update({ ultimo_post_visto: now })
    .eq("nadadora_id", nadadoraId)
    .select();

  if (error) {
    console.error(error);
    return;
  }

  // 2. Si no existe fila → insert
  if (!data || data.length === 0) {
    await supabase.from("posts_nadadoras_leidos").insert({
      nadadora_id: nadadoraId,
      ultimo_post_visto: now,
    });
  }
};

  useEffect(() => {
    if (chatAbierto) fetchPosts();
  }, [chatAbierto]);

  const handlePost = async () => {
    if (!nuevoPost.trim()) return;
    const { data } = await supabase
      .from("posts_nadadoras")
      .insert({
        nadadora_id: nadadoraId,
        texto: nuevoPost,
      })
      .select()
      .single();
    if (data) {
      setPosts((prev) => [data as Post, ...prev]);
      setNuevoPost("");
    }
  };

  const enviarMensaje = async () => {
    if (!chatActual || !nuevoMensaje.trim()) return;

    const { data } = await supabase
      .from("mensajes_chats")
      .insert({
        chat_id: chatActual.id,
        remitente_id: nadadoraId,
        texto: nuevoMensaje,
      })
      .select()
      .single();

    if (data) {
      setMensajes((prev) => [...prev, data]);
      setNuevoMensaje("");
    }
  };

  const handleReaccion = async (postId: number, emoji: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const prev = post.reacciones || {};

    // Quitar cualquier reacción previa del usuario
    const newReacciones: Reacciones = {};
    Object.entries(prev).forEach(([e, users]) => {
      newReacciones[e] = (users || []).filter((id) => id !== nadadoraId);
    });

    // Si no estaba ya en la reacción actual, agregar
    const userAlreadyReacted = prev[emoji]?.includes(nadadoraId) || false;
    if (!userAlreadyReacted) {
      newReacciones[emoji] = [...(newReacciones[emoji] || []), nadadoraId];
    }
    const { data } = await supabase
      .from("posts_nadadoras")
      .update({ reacciones: newReacciones })
      .eq("id", postId)
      .select()
      .single();

    if (data) {
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, reacciones: data.reacciones } : p,
        ),
      );
      setEmojiVisibleFor(null); // cerrar popup
    }
  };

  //funcion para enviar comentario del post
  const handleComentario = async (postId: number) => {
    const texto = nuevoComentario[postId]?.trim();
    if (!texto) return;

    const { data } = await supabase
      .from("comentarios_nadadoras_posts")
      .insert({
        post_id: postId,
        nadadora_id: nadadoraId,
        texto,
      })
      .select()
      .single();

    if (data) {
      // Actualizamos el estado de posts con el nuevo comentario
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comentarios: [...(p.comentarios || []), data] }
            : p,
        ),
      );
      setNuevoComentario((prev) => ({ ...prev, [postId]: "" }));
    }
  };

  const marcarMensajesLeidos = async (chatId: number) => {
    await supabase
      .from("mensajes_chats")
      .update({ leido: true })
      .eq("chat_id", chatId)
      .neq("remitente_id", nadadoraId) // solo mensajes del otro
      .eq("leido", false);
  };

  return (
    <div className="MuroNadadoras-container">
      {/* --- Primera vista: buscador + botón chat grupal --- */}
      {!chatAbierto && !chatActual && (
        <div>
          {/* Buscador de compañeras */}
          <div className="buscadorNadadoras">
            <input
              type="text"
              placeholder="Buscar compañera..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && resultadosFiltrados.length > 0 && (
              <div className="resultadosScroll">
                {resultadosFiltrados.map((n) => {
                  const chatExistente = conversaciones.find(
                    (c) =>
                      (c.nadadora_1_id === n.id &&
                        c.nadadora_2_id === nadadoraId) ||
                      (c.nadadora_2_id === n.id &&
                        c.nadadora_1_id === nadadoraId),
                  );

                  return (
                    <div key={n.id} className="resultadoBusqueda">
                      <span>
                        {n.nombre} {n.apellido}
                      </span>
                      <button
                        onClick={() => abrirOCrearChat(n.id)}
                        className={
                          chatExistente ? "btnAbrirChat" : "btnCrearChat"
                        }
                      >
                        {chatExistente ? "Abrir chat" : "Crear chat"}
                        {chatExistente &&
                          unreadByChatId[chatExistente.id] > 0 && (
                            <span className="notifDot" />
                          )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <button
            className="btnEntrarChat"
              onClick={async () => {
              setChatAbierto(true);
              await marcarChatGrupalLeido();
            }}
          >
            Entrar al chat grupal
             {hayPostsSinLeer && (
    <span className="notifDot">!</span>
  )}
          </button>

          {/* Botones para conversaciones existentes */}
          <div className="conversacionesExistentes">
            {conversaciones.map((c) => {
              // Determinar la otra nadadora
              const otraId =
                c.nadadora_1_id === nadadoraId
                  ? c.nadadora_2_id
                  : c.nadadora_1_id;
              const otra = nadadoras.find((n) => n.id === otraId);
              if (!otra) return null;

              return (
                <button
                  key={c.id}
                  className="btnAbrirChat"
                  onClick={() => abrirOCrearChat(otraId)}
                >
                  Chat con {otra.nombre} {otra.apellido}
                  {unreadByChatId[c.id] > 0 && (
                    <span className="notifDot">{unreadByChatId[c.id]}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* --- Chat privado --- */}
      {chatActual && (
        <div className="MuroNadadoras-conteiner-privado">
          {" "}
          <button className="btnSalirChat" onClick={() => setChatActual(null)}>
            Volver a chats
          </button>
          <div className="chatPrivadoContainer">
            <div className="chatHeader">
              <strong>
                {otraNadadora
                  ? `${otraNadadora.nombre} ${otraNadadora.apellido}`
                  : "Chat privado"}
              </strong>
            </div>

            <div className="mensajesWrapper">
              {mensajes.map((m) => (
                <div
                  key={m.id}
                  className={`mensaje ${
                    m.remitente_id === nadadoraId ? "propio" : "otro"
                  }`}
                >
                  {m.texto}
                  {m.remitente_id === nadadoraId && (
                    <span className="tick">{m.leido ? "✓✓" : ""}</span>
                  )}
                  <span className="fecha">
                    {new Date(m.creado_en).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
              <div ref={mensajesEndRef} />
            </div>

            <div className="nuevoMensajeWrapper">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
              />
              <button onClick={enviarMensaje}>Enviar</button>
            </div>
          </div>
        </div>
      )}
      {/* --- Chat grupal abierto --- */}
      {chatAbierto && !chatActual && (
        <div>
          <button
            className="btnSalirChat"
            onClick={() => setChatAbierto(false)}
          >
            Salir del chat grupal
          </button>

          {/* Input nuevo post */}
          <div className="MuroNadadoras-inputWrapper">
            <textarea
              placeholder="Comparte algo con tus compañeras..."
              value={nuevoPost}
              onChange={(e) => setNuevoPost(e.target.value)}
              rows={2}
            />
            <button onClick={handlePost}>Publicar</button>
          </div>

          {loading ? (
            <div className="cargandoPosts">
              <div className="spinner"></div>
              <span>Cargando posts...</span>
            </div>
          ) : (
            <div className="MuroNadadoras-posts">
              {posts.map((post) => (
                <div key={post.id} className="MuroNadadoras-postCard">
                  <div className="MuroNadadoras-postHeader">
                    {post.fotoUrl ? (
                      <img
                        src={post.fotoUrl}
                        alt={post.nombre}
                        className="MuroNadadoras-postFoto"
                      />
                    ) : (
                      <div className="MuroNadadoras-postFotoPlaceholder">
                        {(post.nombre?.[0] || "?").toUpperCase()}
                      </div>
                    )}
                    <span className="MuroNadadoras-postNombre">
                      {post.nombre} {post.apellido}
                    </span>
                    <span className="MuroNadadoras-postFecha">
                      {new Date(post.creado_en).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="MuroNadadoras-postTexto">{post.texto}</p>

                  <div className="postReacciones">
                    {Object.entries(post.reacciones || {})
                      .filter(([, users]) => (users?.length || 0) > 0)
                      .map(([emoji, users]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaccion(post.id, emoji)}
                        >
                          {emoji} {users?.length || 0}
                        </button>
                      ))}
                    <button onClick={() => setEmojiVisibleFor(post.id)}>
                      😊
                    </button>

                    {emojiVisibleFor === post.id && (
                      <div className="emojiPopup">
                        {EMOJIS.map((emoji) => (
                          <span
                            key={emoji}
                            className="emojiOption"
                            onClick={() => handleReaccion(post.id, emoji)}
                          >
                            {emoji}
                          </span>
                        ))}
                        <input
                          type="text"
                          // autoFocus
                          className="emojiInput"
                          onFocus={(e) => e.currentTarget.blur()}
                          onChange={(e) => {
                            const text = e.currentTarget.value;
                            const firstEmoji = [...text].find((char) =>
                              /\p{Emoji}/u.test(char),
                            );
                            if (firstEmoji) {
                              handleReaccion(post.id, firstEmoji);
                              e.currentTarget.value = "";
                            }
                          }}
                        />
                      </div>
                    )}

                    <div className="postComentarios">
                      {post.comentarios?.map((c) => (
                        <div key={c.id} className="comentarioCard">
                          {c.fotoUrl ? (
                            <img
                              src={c.fotoUrl}
                              alt={c.nombre}
                              className="comentarioFoto"
                            />
                          ) : (
                            <div className="comentarioFotoPlaceholder">
                              {(c.nombre?.[0] || "?").toUpperCase()}
                            </div>
                          )}
                          <span className="comentarioNombre">
                            {c.nombre} {c.apellido}:
                          </span>{" "}
                          {c.texto}
                        </div>
                      ))}

                      <div className="nuevoComentarioWrapper">
                        <input
                          type="text"
                          placeholder="Escribe un comentario..."
                          value={nuevoComentario[post.id] || ""}
                          onChange={(e) =>
                            setNuevoComentario((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleComentario(post.id)
                          }
                        />
                        <button onClick={() => handleComentario(post.id)}>
                          Enviar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
