import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";
// import { APP_VERSION } from "../version";
import VersionInfo from "../versionInfo";
// import SnowEffect from "../Dashboard/User/SnowEffect";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  const navigate = useNavigate();

  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // Si hay sesión, redirigir según rol
        supabase
          .from("users")
          .select("rol_id, aprobado")
          .eq("id", data.session.user.id)
          .single()
          .then(({ data: user }) => {
            if (user?.aprobado) {
              if (user.rol_id === 1) navigate("/admin-dashboard");
              else if (user.rol_id === 2) navigate("/user-dashboard");
              else if (user.rol_id === 3) navigate("/padre-dashboard");
            }
          });
      }
      setLoadingSession(false);
    });
  }, [navigate]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault(); // Evita el banner automático
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt(); // Muestra el diálogo de instalación

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("✅ El usuario instaló la app");
    } else {
      console.log("❌ El usuario canceló la instalación");
    }
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1️⃣ Autenticar usuario con email y contraseña
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        },
      );

      if (authError) {
        setError("Email o contraseña incorrectos");
        return;
      }

      const user = data.user;
      if (!user) {
        setError("No se pudo obtener la información del usuario.");
        return;
      }

      // 2️⃣ Obtener datos del usuario de tu tabla 'users'
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, nombre, rol_id, aprobado")
        .eq("id", user.id)
        .single();

      if (userError || !userData) {
        setError("No se pudo obtener la información del usuario.");
        return;
      }

      // 3️⃣ Comprobar si el usuario está aprobado
      if (!userData.aprobado) {
        setError("Tu cuenta aún no ha sido aprobada por un entrenador.");
        return;
      }

      // 4️⃣ Suscribirse a Push si el usuario lo permite
      // try {
      //   const registration = await navigator.serviceWorker.ready;
      //   const existingSubscription =
      //     await registration.pushManager.getSubscription();

      //   if (!existingSubscription) {
      //     const permission = await Notification.requestPermission();
      //     if (permission === "granted") {
      //       const vapidPublicKey =
      //         "BH4zzkucBZ6-aDgNdWwEW-OEaIPuB2pfmsdWTZwI7-Obi7m95Q2ABgkzCMr6jZLBJIEVal8lcqoviz4uNIFWhKk";
      //       await subscribeUserToPush(userData.id, vapidPublicKey);
      //       console.log("Usuario suscrito a Push ✅");
      //     } else {
      //       console.log("⚠️ Permiso de notificaciones denegado");
      //     }
      //   } else {
      //     console.log("Ya existe una suscripción activa 🔔");
      //   }
      // } catch (pushErr) {
      //   console.warn("Error al suscribirse a Push, pero se ignora:", pushErr);
      // }

      // 5️⃣ Redirigir según rol
      if (userData.rol_id === 1)
        navigate("/admin-dashboard", { replace: true });
      else if (userData.rol_id === 2)
        navigate("/user-dashboard", { replace: true });
      else if (userData.rol_id === 3)
        navigate("/padre-dashboard", { replace: true });
    } catch (err) {
      setError("Ha ocurrido un error inesperado.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Introduce tu email para recuperar la contraseña");
      return;
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    console.log("🚀 ~ data:", data);

    if (error) {
      setError(
        "Si el email existe, recibirás un correo para restablecer la contraseña.",
      );
    } else {
      setError("Revisa tu correo para restablecer la contraseña");
    }
  };
  // useEffect(() => {
  //   if ("serviceWorker" in navigator) {
  //     navigator.serviceWorker
  //       .register("/sw.js")
  //       .then(() => console.log("Service Worker registrado"))
  //       .catch(console.error);
  //   }
  // }, []);
  if (loadingSession)
    return (
      <div className="splash-container">
        <div className="splash-ripple"></div>
        <img src="/logo.png" className="splash-logo" />
      </div>
    );
  return (
    <div className="pruebadelogin">
      {/* <SnowEffect /> */}
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="pruebadelogin-password-container">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            className="pruebadelogin-toggle-password"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Cargando..." : "Entrar"}
        </button>
        {/* Enlace de recuperación debajo del formulario */}
        <Link
          to="#"
          onClick={handleForgotPassword}
          className="pruebadelogin-forgot"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </form>
      {error && <p>{error}</p>}

      {canInstall && (
        <button
          onClick={handleInstallClick}
          className="install-button"
          style={{
            marginTop: "15px",
            backgroundColor: "#1e90ff",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          📲 Instalar NatArt
        </button>
      )}

      <nav className="login-nav">
        <span>¿No tienes cuenta?</span>
        <Link to="/register">Registro</Link>

        <div
          style={{
            position: "absolute",
            bottom: "5px",
            right: "15px",
            fontSize: "0.8rem",
            color: "#000000ff",
          }}
        >
          <VersionInfo />
        </div>
      </nav>
    </div>
  );
}
