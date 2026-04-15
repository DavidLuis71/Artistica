import { createClient } from "@supabase/supabase-js";

// 👉 Tu URL y tu clave anon (pública) de Supabase
const supabaseUrl = "https://ntblpxsamoavksjxomke.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50YmxweHNhbW9hdmtzanhvbWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTM2OTgsImV4cCI6MjA3Njk4OTY5OH0.1UYVmH668qRp1GBmhnpmqCZZcdF-0TOp5ZFxaEInz7g"; // <-- tu clave anon pública

// Creamos el cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
