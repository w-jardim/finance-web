import { useNavigate } from "react-router-dom";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <div style={{ fontSize: "8rem", lineHeight: 1, fontWeight: 800 }}>404</div>
      <h1 style={{ margin: "1rem 0 0.5rem", fontSize: "1.75rem", fontWeight: 700 }}>
        Página não encontrada
      </h1>
      <p style={{ margin: 0, fontSize: "1.1rem", opacity: 0.85, maxWidth: 420 }}>
        O endereço que você tentou acessar não existe ou foi movido.
      </p>

      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "white",
            color: "#667eea",
            border: "none",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          Ir ao Dashboard
        </button>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "0.75rem 1.5rem",
            background: "rgba(255,255,255,0.15)",
            color: "white",
            border: "2px solid rgba(255,255,255,0.4)",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
