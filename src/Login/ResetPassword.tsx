import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Capturar el token de Supabase desde la URL
  const query = new URLSearchParams(window.location.search);
  const accessToken = query.get("access_token");

  useEffect(() => {
    if (!accessToken) {
      setError("Enlace inválido o expirado.");
    }
  }, [accessToken]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError("Introduce todos los campos.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        alert("✅ Contraseña cambiada correctamente. Inicia sesión ahora.");
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pruebadelogin">
      <h2>Restablecer contraseña</h2>
      <form onSubmit={handleUpdatePassword}>
        <div className="pruebadelogin-password-container">
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="pruebadelogin-password-container">
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Cambiando..." : "Actualizar contraseña"}
        </button>
      </form>

      {error && <p>{error}</p>}
    </div>
  );
}
