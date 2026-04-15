import { supabase } from "./lib/supabaseClient";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children, role }: any) {
  const [allowed, setAllowed] = useState<null | boolean>(null);

  useEffect(() => {
    async function check(session: any | null = null) {
      const currentSession =
        session ?? (await supabase.auth.getSession()).data.session;

      if (!currentSession) {
        setAllowed(false);
        return;
      }

      const { data: user, error } = await supabase
        .from("users")
        .select("rol_id, aprobado")
        .eq("id", currentSession.user.id)
        .single();

      if (error || !user) {
        setAllowed(false);
        return;
      }

      if (!user.aprobado || (role && user.rol_id !== role)) {
        setAllowed(false);
        return;
      }

      setAllowed(true);
    }

    // Comprobación inicial
    check();

    // Listener de cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) setAllowed(false);
        else check(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [role]);
  if (allowed === null) return <p>Cargando...</p>;
  // 🔹 Sólo redirige si no hay sesión, no por rol
  if (allowed === false) return <Navigate to="/login" replace />;

  return children;
}
