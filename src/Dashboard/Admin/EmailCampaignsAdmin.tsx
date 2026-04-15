// src/pages/EmailCampaignsAdmin.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./EmailCampaignsAdmin.css";
import { buildEmailTemplate } from "../../utils/plantillaCorreo";

interface Campaign {
  id: string;
  subject: string;
  body: string;
  status: "draft" | "pending" | "sent" | "failed";
  created_at: string;
  sent_at: string | null;
  total_recipients: number;
  total_sent: number;
  total_failed: number;
}

export default function EmailCampaignsAdmin() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from("email_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setCampaigns(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const createCampaign = async () => {
    if (!subject || !body) return alert("Completa asunto y mensaje");
    const fullHtml = buildEmailTemplate(subject, body, "{{name}}");
    const { error } = await supabase.from("email_campaigns").insert({
      subject,
      body: fullHtml,
      status: "draft",
    });

    if (error) {
      console.error(error);
      return;
    }

    setSubject("");
    setBody("");
    setCreating(false);
    fetchCampaigns();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("¿Seguro que quieres borrar esta campaña?")) return;

    await supabase.from("email_campaigns").delete().eq("id", id);
    fetchCampaigns();
  };

  const sendCampaign = async (id: string) => {
    if (!confirm("¿Enviar este correo a todos los usuarios?")) return;

    const { error } = await supabase
      .from("email_campaigns")
      .update({ status: "pending" })
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }
    // Aquí luego conectaremos tu función real de envío
    alert("Marcada como pendiente de envío 🚀");

    fetchCampaigns();
  };

  if (loading) return <p>Cargando campañas...</p>;

  return (
    <div className="email-admin">
      <h2>Campañas Email</h2>

      {!creating && (
        <button className="btn-primary" onClick={() => setCreating(true)}>
          + Nueva campaña
        </button>
      )}

      {creating && (
        <div className="email-form">
          <input
            type="text"
            placeholder="Asunto"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            placeholder="Mensaje (puede ser HTML)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div
            className="preview-box"
            dangerouslySetInnerHTML={{
              __html: buildEmailTemplate(subject, body, "Nombre"),
            }}
          />
          <div className="form-buttons">
            <button onClick={createCampaign}>Guardar</button>
            <button onClick={() => setCreating(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="campaign-list">
        {campaigns.map((c) => (
          <div key={c.id} className={`campaign-card ${c.status}`}>
            <h3>{c.subject}</h3>
            <p className="status">Estado: {c.status}</p>
            <p className="date">
              Creado: {new Date(c.created_at).toLocaleDateString()}
            </p>

            {c.status === "sent" && (
              <p className="stats">
                Enviados: {c.total_sent} | Fallidos: {c.total_failed}
              </p>
            )}

            <div className="card-buttons">
              {c.status === "draft" && (
                <button onClick={() => sendCampaign(c.id)}>Enviar</button>
              )}
              <button onClick={() => deleteCampaign(c.id)}>Borrar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
