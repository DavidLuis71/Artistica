import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [rol, setRol] = useState(2); // 2=nadadora, 3=padre
  const [codigosNadadoras, setCodigosNadadoras] = useState<string[]>([]);
  const [nuevoCodigo, setNuevoCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // ❌ Validación: si es padre, debe tener al menos un código
    if (rol === 3 && codigosNadadoras.length === 0) {
      setError(
        "Debes agregar al menos un código de nadadora existente pulsando el botón +.",
      );
      setErrorCodigo(true); // activamos la alerta visual
      return;
    } else {
      setErrorCodigo(false); // lo desactivamos si ya hay código
    }

    // 1️⃣ Crear usuario en Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // 2️⃣ Guardar info adicional en tabla "users"
    if (data.user) {
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: data.user.id, // relaciona con Auth
          nombre,
          apellido,
          rol_id: rol,
          aprobado: false, // pendiente de aprobación
          creado_en: new Date(),
          codigos_nadadoras: rol === 3 ? codigosNadadoras : null,
        },
      ]);

      if (insertError) {
        setError(insertError.message);
      } else {
        setSuccess(
          "Cuenta creada correctamente. Revisa tu email  y espera aprobación del entrenador.",
        );
      }
    }
  };
  const agregarCodigo = () => {
    if (nuevoCodigo.trim() && !codigosNadadoras.includes(nuevoCodigo.trim())) {
      setCodigosNadadoras([...codigosNadadoras, nuevoCodigo.trim()]);
      setNuevoCodigo("");
    }
  };

  const eliminarCodigo = (codigo: string) => {
    setCodigosNadadoras(codigosNadadoras.filter((c) => c !== codigo));
  };

  return (
    <div className="pruebadelogin">
      <h2>Registrarse</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Apellido"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          required
        />

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

        <select value={rol} onChange={(e) => setRol(Number(e.target.value))}>
          <option value={2}>Nadadora</option>
          <option value={3}>Padre</option>
        </select>
        {rol === 3 && (
          <div style={{ marginTop: "10px" }}>
            <label>Códigos de tus hijas:</label>
            <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
              <input
                type="text"
                value={nuevoCodigo}
                onChange={(e) => setNuevoCodigo(e.target.value)}
                placeholder="Agregar código"
              />
              <button
                type="button"
                onClick={agregarCodigo}
                style={{
                  transform: errorCodigo ? "scale(1.3)" : "scale(1)", // agranda si hay error
                  backgroundColor: errorCodigo ? "#ff4d4d" : "#144166", // rojo si hay error
                  color: "white",
                  transition: "all 0.2s",
                }}
              >
                +
              </button>
            </div>
            <div style={{ marginTop: "5px" }}>
              {codigosNadadoras.map((c) => (
                <span
                  key={c}
                  style={{
                    display: "inline-block",
                    marginRight: "5px",
                    marginBottom: "5px",
                    padding: "3px 8px",
                    backgroundColor: "#144166",
                    color: "white",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() => eliminarCodigo(c)}
                >
                  {c} ×
                </span>
              ))}
            </div>
          </div>
        )}
        <button type="submit">Crear cuenta</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      <nav className="login-nav">
        <span>¿Ya tienes cuenta?</span>
        <Link to="/login">Login</Link>
      </nav>
    </div>
  );
}
