// src/components/Toast.tsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./Toast.css";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
}

export default function Toast({
  message,
  type = "info",
  duration = 3000,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return createPortal(
    <div className={`toast ${type}`}>{message}</div>,
    document.body // renderiza en el body, fuera del componente
  );
}
