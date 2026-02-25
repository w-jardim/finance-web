// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isRegistro, setIsRegistro] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, registrar } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = isRegistro
        ? await registrar(email, senha)
        : await login(email, senha);

      if (result?.success) {
        navigate("/dashboard");
        return;
      }

      setError(result?.error || "Falha na autenticação");
    } catch {
      setError("Falha inesperada. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          width: "100%",
          maxWidth: "420px",
          backdropFilter: "blur(10px)"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            fontSize: "3rem",
            marginBottom: "1rem"
          }}>
            💎
          </div>
          <h1
            style={{
              margin: "0 0 0.5rem 0",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontSize: "2.25rem",
              fontWeight: "800",
              letterSpacing: "0.02em",
            }}
          >
            VIRAZUL
          </h1>
          <p style={{ margin: 0, color: "#666", fontSize: "0.95rem", fontWeight: "500" }}>
            {isRegistro ? "✨ Criar nova conta" : "👋 Acesse sua conta"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "600",
                color: "#2d3748",
                fontSize: "0.9rem"
              }}
            >
              📧 Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              autoComplete="email"
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "1rem",
                boxSizing: "border-box",
                transition: "all 0.2s",
                outline: "none"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#667eea";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "600",
                color: "#2d3748",
                fontSize: "0.9rem"
              }}
            >
              🔒 Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete={isRegistro ? "new-password" : "current-password"}
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "1rem",
                boxSizing: "border-box",
                transition: "all 0.2s",
                outline: "none"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#667eea";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {error && (
            <div
              style={{
                color: "#c62828",
                marginBottom: "1rem",
                padding: "0.85rem 1rem",
                background: "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
                borderRadius: "12px",
                fontSize: "0.9rem",
                border: "1px solid rgba(198,40,40,0.2)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "1rem",
              background: loading 
                ? "#cbd5e0" 
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "700",
              transition: "all 0.3s",
              boxShadow: loading ? "none" : "0 4px 12px rgba(102, 126, 234, 0.4)",
              transform: loading ? "scale(0.98)" : "scale(1)"
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.5)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
              }
            }}
          >
            {loading
              ? "⏳ Processando..."
              : isRegistro
              ? "✨ Criar Conta"
              : "🚀 Entrar"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <button
            onClick={() => {
              setIsRegistro(!isRegistro);
              setError("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#667eea",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "600",
              padding: "0.5rem"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            {isRegistro
              ? "👉 Já tem uma conta? Faça login"
              : "👉 Não tem uma conta? Registre-se"}
          </button>
        </div>
      </div>
    </div>
  );
}