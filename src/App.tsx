import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/login";
import Register from "./Login/register";
import AdminDashboard from "./Dashboard/Admin/AdminDashboard";
import UserDashboard from "./Dashboard/User/UserDashboard";
import PWAUpdater from "./PWAUpdater";
import ProtectedRoute from "./ProtectedRoute";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import Splash from "./Login/splash";
import ResetPassword from "./Login/ResetPassword";
// import PushPrompt from "./PushPrompt";

// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/service-worker.js")
//       .then((registration) => {
//         console.log("Service Worker registrado:", registration);
//       })
//       .catch((error) => {
//         console.error("Error registrando Service Worker:", error);
//       });
//   });
// }

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simula el tiempo de validación real de sesión
    const check = async () => {
      await supabase.auth.getSession();
      setTimeout(() => setLoading(false), 2200);
    };
    check();
  }, []);
  return (
    <>
      {loading && <Splash />}

      <Router>
        <PWAUpdater />
        {/* <PushPrompt /> */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Login />} />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute role={1}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute role={2}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/padre-dashboard"
            element={
              <ProtectedRoute role={3}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </Router>
    </>
  );
}
