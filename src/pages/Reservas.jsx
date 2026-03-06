// src/pages/Reservas.jsx
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { api } from "../api/api";

const STATUS_OPTIONS = [
  { value: "ativa", label: "Ativa", color: "#38a169", bg: "#e6fffa" },
  { value: "utilizada", label: "Utilizada", color: "#3182ce", bg: "#ebf8ff" },
  { value: "cancelada", label: "Cancelada", color: "#e53e3e", bg: "#fff5f5" },
];

function formatCurrency(centavos) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR");
}

export function Reservas() {
  const { token, logout } = useAuth();

  const [reservas, setReservas] = useState([]);
  const [contas, setContas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter
  const [filtroStatus, setFiltroStatus] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [contaId, setContaId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [valorReais, setValorReais] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataAlvo, setDataAlvo] = useState("");
  const [status, setStatus] = useState("ativa");

  // Delete state
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReservas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filtroStatus) params.status = filtroStatus;
      const resp = await api.getReservas(token, params);
      const list = Array.isArray(resp) ? resp : resp?.reservas ?? [];
      setReservas(list);
    } catch (e) {
      if (e?.status === 401) { logout(); return; }
      setError("Falha ao carregar reservas.");
    } finally {
      setLoading(false);
    }
  }, [token, logout, filtroStatus]);

  const fetchAux = useCallback(async () => {
    try {
      const [contasResp, catResp] = await Promise.all([
        api.getContas(token),
        api.getCategorias(token),
      ]);
      setContas(Array.isArray(contasResp) ? contasResp : contasResp?.contas ?? []);
      setCategorias(Array.isArray(catResp) ? catResp : catResp?.categorias ?? []);
    } catch (e) {
      if (e?.status === 401) { logout(); return; }
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) {
      fetchReservas();
      fetchAux();
    }
  }, [token, fetchReservas, fetchAux]);

  const resetForm = () => {
    setContaId("");
    setCategoriaId("");
    setValorReais("");
    setDescricao("");
    setDataAlvo("");
    setStatus("ativa");
    setEditingId(null);
    setFormError("");
    setFormSuccess("");
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (r) => {
    setContaId(String(r.conta_id));
    setCategoriaId(r.categoria_id ? String(r.categoria_id) : "");
    setValorReais((r.valor_centavos / 100).toFixed(2));
    setDescricao(r.descricao || "");
    setDataAlvo(r.data_alvo ? r.data_alvo.substring(0, 10) : "");
    setStatus(r.status);
    setEditingId(r.id);
    setFormError("");
    setFormSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFormLoading(true);

    const valorCentavos = Math.round(parseFloat(valorReais) * 100);
    if (!valorCentavos || valorCentavos <= 0) {
      setFormError("Valor deve ser maior que zero.");
      setFormLoading(false);
      return;
    }

    const body = {
      conta_id: Number(contaId),
      categoria_id: categoriaId ? Number(categoriaId) : null,
      valor_centavos: valorCentavos,
      descricao: descricao.trim() || null,
      data_alvo: dataAlvo,
      status,
    };

    try {
      if (editingId) {
        await api.updateReserva(token, editingId, body);
        setFormSuccess("Reserva atualizada com sucesso!");
      } else {
        await api.createReserva(token, body);
        setFormSuccess("Reserva criada com sucesso!");
      }
      await fetchReservas();
      setTimeout(() => closeForm(), 1200);
    } catch (err) {
      if (err?.status === 401) { logout(); return; }
      const msg = err?.payload?.erro || (editingId ? "Erro ao atualizar reserva." : "Erro ao criar reserva.");
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await api.deleteReserva(token, id);
      setDeletingId(null);
      await fetchReservas();
    } catch (err) {
      if (err?.status === 401) { logout(); return; }
      setError(err?.payload?.erro || "Erro ao excluir reserva.");
      setDeletingId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusInfo = (s) => STATUS_OPTIONS.find((o) => o.value === s) || STATUS_OPTIONS[0];

  // Totais
  const totalAtiva = reservas.filter((r) => r.status === "ativa").reduce((acc, r) => acc + r.valor_centavos, 0);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "#666" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
          <div>Carregando reservas...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem"
      }}>
        <h1 style={{
          margin: 0, fontSize: "1.75rem", fontWeight: "700", color: "#2d3748",
          display: "flex", alignItems: "center", gap: "0.5rem"
        }}>
          <span>🎯</span> Reservas
        </h1>
        <button
          onClick={() => (showForm ? closeForm() : openCreate())}
          style={{
            padding: "0.65rem 1.25rem",
            background: showForm
              ? "linear-gradient(135deg, #718096 0%, #4a5568 100%)"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white", border: "none", borderRadius: "12px", cursor: "pointer",
            fontSize: "0.9rem", fontWeight: "600",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)", transition: "all 0.2s"
          }}
        >
          {showForm ? "✕ Cancelar" : "＋ Nova Reserva"}
        </button>
      </div>

      {/* Resumo */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white", borderRadius: "16px", padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem", boxShadow: "0 4px 16px rgba(102,126,234,0.3)"
      }}>
        <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.25rem" }}>Total reservado (ativas)</div>
        <div style={{ fontSize: "1.75rem", fontWeight: "800" }}>{formatCurrency(totalAtiva)}</div>
      </div>

      {/* Filtro */}
      <div style={{
        display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center"
      }}>
        <span style={{ fontWeight: "600", color: "#4a5568", fontSize: "0.85rem" }}>Filtrar:</span>
        <button
          onClick={() => setFiltroStatus("")}
          style={{
            padding: "0.35rem 0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0",
            background: !filtroStatus ? "#667eea" : "#f7fafc",
            color: !filtroStatus ? "white" : "#4a5568",
            cursor: "pointer", fontSize: "0.8rem", fontWeight: "600", transition: "all 0.2s"
          }}
        >
          Todas
        </button>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFiltroStatus(opt.value)}
            style={{
              padding: "0.35rem 0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0",
              background: filtroStatus === opt.value ? opt.color : "#f7fafc",
              color: filtroStatus === opt.value ? "white" : "#4a5568",
              cursor: "pointer", fontSize: "0.8rem", fontWeight: "600", transition: "all 0.2s"
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
          color: "white", padding: "1rem 1.25rem", borderRadius: "12px",
          marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem"
        }}>
          <span>⚠️</span> <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "1rem" }}>✕</button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{
          background: "white", borderRadius: "16px", padding: "1.5rem",
          marginBottom: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          border: editingId ? "2px solid #ecc94b44" : "2px solid #667eea22"
        }}>
          <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600", color: "#2d3748" }}>
            {editingId ? "✏️ Editar Reserva" : "🎯 Nova Reserva"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
              {/* Conta */}
              <div>
                <label style={labelStyle}>Conta *</label>
                <select value={contaId} onChange={(e) => setContaId(e.target.value)} required style={inputStyle}>
                  <option value="">Selecione...</option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              {/* Categoria */}
              <div>
                <label style={labelStyle}>Categoria</label>
                <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} style={inputStyle}>
                  <option value="">Nenhuma</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.tipo})</option>
                  ))}
                </select>
              </div>
              {/* Valor */}
              <div>
                <label style={labelStyle}>Valor (R$) *</label>
                <input
                  type="number" step="0.01" min="0.01"
                  value={valorReais} onChange={(e) => setValorReais(e.target.value)}
                  required placeholder="0,00" style={inputStyle}
                />
              </div>
              {/* Data alvo */}
              <div>
                <label style={labelStyle}>Data Alvo *</label>
                <input
                  type="date" value={dataAlvo}
                  onChange={(e) => setDataAlvo(e.target.value)}
                  required style={inputStyle}
                />
              </div>
              {/* Status */}
              <div>
                <label style={labelStyle}>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {/* Descrição */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Descrição</label>
                <input
                  type="text" value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Reserva de emergência, Viagem..."
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
              <button
                type="submit" disabled={formLoading}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: formLoading ? "#cbd5e0" : editingId
                    ? "linear-gradient(135deg, #ecc94b 0%, #d69e2e 100%)"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white", border: "none", borderRadius: "10px",
                  cursor: formLoading ? "not-allowed" : "pointer",
                  fontSize: "0.9rem", fontWeight: "600", transition: "all 0.2s"
                }}
              >
                {formLoading ? "⏳ Salvando..." : editingId ? "✏️ Atualizar" : "💾 Salvar"}
              </button>
            </div>
          </form>

          {formError && (
            <div style={{ color: "#c62828", marginTop: "0.75rem", padding: "0.6rem 0.75rem", background: "#ffebee", borderRadius: "8px", fontSize: "0.85rem" }}>
              ⚠️ {formError}
            </div>
          )}
          {formSuccess && (
            <div style={{ color: "#2e7d32", marginTop: "0.75rem", padding: "0.6rem 0.75rem", background: "#e8f5e9", borderRadius: "8px", fontSize: "0.85rem" }}>
              ✅ {formSuccess}
            </div>
          )}
        </div>
      )}

      {/* List */}
      <div style={{
        background: "white", borderRadius: "16px", padding: "1.5rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)"
      }}>
        {reservas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#718096" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎯</div>
            <div style={{ fontSize: "1.1rem" }}>Nenhuma reserva encontrada</div>
            <div style={{ fontSize: "0.9rem", marginTop: "0.5rem", opacity: 0.7 }}>
              Crie sua primeira reserva para separar valores para objetivos futuros
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {reservas.map((r) => {
              const si = getStatusInfo(r.status);
              return (
                <div
                  key={r.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "1rem 1.25rem",
                    background: deletingId === r.id ? "#fff5f5" : "#f8fafc",
                    borderRadius: "12px",
                    border: deletingId === r.id ? "1px solid #fc8181" : "1px solid #e2e8f0",
                    transition: "all 0.2s", flexWrap: "wrap"
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: "42px", height: "42px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "10px", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "1.2rem", flexShrink: 0
                  }}>
                    🎯
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: "150px" }}>
                    <div style={{ fontWeight: "600", color: "#2d3748", fontSize: "1rem" }}>
                      {formatCurrency(r.valor_centavos)}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#718096", marginTop: "0.15rem" }}>
                      {r.descricao || "Sem descrição"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#a0aec0", marginTop: "0.15rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      {r.conta && <span>🏦 {r.conta.nome}</span>}
                      {r.categoria && <span>🏷️ {r.categoria.nome}</span>}
                      <span>📅 {formatDate(r.data_alvo)}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    padding: "0.25rem 0.65rem", borderRadius: "8px",
                    background: si.bg, color: si.color,
                    fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase"
                  }}>
                    {si.label}
                  </span>

                  {/* Actions */}
                  {deletingId === r.id ? (
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", color: "#c53030", fontWeight: "600" }}>Excluir?</span>
                      <button onClick={() => handleDelete(r.id)} disabled={deleteLoading}
                        style={{
                          padding: "0.35rem 0.75rem",
                          background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
                          color: "white", border: "none", borderRadius: "8px",
                          cursor: deleteLoading ? "not-allowed" : "pointer",
                          fontSize: "0.8rem", fontWeight: "600"
                        }}>
                        {deleteLoading ? "⏳" : "✓ Sim"}
                      </button>
                      <button onClick={() => setDeletingId(null)}
                        style={{
                          padding: "0.35rem 0.75rem", background: "#edf2f7",
                          color: "#4a5568", border: "1px solid #e2e8f0", borderRadius: "8px",
                          cursor: "pointer", fontSize: "0.8rem", fontWeight: "600"
                        }}>
                        Não
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => openEdit(r)} title="Editar" style={actionBtnStyle}
                        onMouseOver={(e) => { e.currentTarget.style.background = "#667eea"; e.currentTarget.style.color = "white"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = "#edf2f7"; e.currentTarget.style.color = "#4a5568"; }}>
                        ✏️
                      </button>
                      <button onClick={() => setDeletingId(r.id)} title="Excluir" style={actionBtnStyle}
                        onMouseOver={(e) => { e.currentTarget.style.background = "#ff6b6b"; e.currentTarget.style.color = "white"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = "#edf2f7"; e.currentTarget.style.color = "#4a5568"; }}>
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block", marginBottom: "0.4rem", fontWeight: "600", color: "#4a5568", fontSize: "0.85rem",
};

const inputStyle = {
  width: "100%", padding: "0.75rem 1rem", border: "2px solid #e2e8f0",
  borderRadius: "10px", fontSize: "0.95rem", boxSizing: "border-box",
  outline: "none", transition: "border-color 0.2s",
};

const actionBtnStyle = {
  padding: "0.4rem 0.6rem", background: "#edf2f7", color: "#4a5568",
  border: "none", borderRadius: "8px", cursor: "pointer",
  fontSize: "0.9rem", transition: "all 0.2s", lineHeight: 1,
};
