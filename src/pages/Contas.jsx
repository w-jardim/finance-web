// src/pages/Contas.jsx
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { api } from "../api/api";

export function Contas() {
  const { token, logout } = useAuth();

  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [nome, setNome] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);

  // Delete state
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchContas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await api.getContas(token);
      const list = Array.isArray(resp) ? resp : resp?.contas ?? [];
      setContas(list);
    } catch (e) {
      if (e?.status === 401) { logout(); return; }
      setError("Falha ao carregar contas.");
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) fetchContas();
  }, [token, fetchContas]);

  const resetForm = () => {
    setNome("");
    setEditingId(null);
    setFormError("");
    setFormSuccess("");
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (conta) => {
    setNome(conta.nome);
    setEditingId(conta.id);
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

    try {
      if (editingId) {
        await api.updateConta(token, editingId, nome.trim());
        setFormSuccess("Conta atualizada com sucesso!");
      } else {
        await api.createConta(token, nome.trim());
        setFormSuccess("Conta criada com sucesso!");
      }
      await fetchContas();
      setTimeout(() => {
        closeForm();
      }, 1200);
    } catch (err) {
      if (err?.status === 401) { logout(); return; }
      const msg = err?.payload?.erro || (editingId ? "Erro ao atualizar conta." : "Erro ao criar conta.");
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await api.deleteConta(token, id);
      setDeletingId(null);
      await fetchContas();
    } catch (err) {
      if (err?.status === 401) { logout(); return; }
      setError(err?.payload?.erro || "Erro ao excluir conta.");
      setDeletingId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#666' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <div>Carregando contas...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '1.75rem',
          fontWeight: '700',
          color: '#2d3748',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>🏦</span> Contas
        </h1>
        <button
          onClick={() => showForm ? closeForm() : openCreate()}
          style={{
            padding: '0.65rem 1.25rem',
            background: showForm
              ? 'linear-gradient(135deg, #718096 0%, #4a5568 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          {showForm ? '✕ Cancelar' : '＋ Nova Conta'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
          color: 'white',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span>⚠️</span> <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError("")} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
      )}

      {/* Form (Create / Edit) */}
      {showForm && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          border: editingId ? '2px solid #ecc94b44' : '2px solid #667eea22'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#2d3748' }}>
            {editingId ? '✏️ Editar Conta' : 'Nova Conta'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 250px' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#4a5568', fontSize: '0.85rem' }}>
                Nome da conta
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Ex: Nubank, Itaú, Carteira..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              />
            </div>
            <button
              type="submit"
              disabled={formLoading}
              style={{
                padding: '0.75rem 1.5rem',
                background: formLoading ? '#cbd5e0' : editingId
                  ? 'linear-gradient(135deg, #ecc94b 0%, #d69e2e 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: formLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {formLoading ? '⏳ Salvando...' : editingId ? '✏️ Atualizar' : '💾 Salvar'}
            </button>
          </form>

          {formError && (
            <div style={{ color: '#c62828', marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: '#ffebee', borderRadius: '8px', fontSize: '0.85rem' }}>
              ⚠️ {formError}
            </div>
          )}
          {formSuccess && (
            <div style={{ color: '#2e7d32', marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: '#e8f5e9', borderRadius: '8px', fontSize: '0.85rem' }}>
              ✅ {formSuccess}
            </div>
          )}
        </div>
      )}

      {/* List */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
      }}>
        {contas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#718096' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏦</div>
            <div style={{ fontSize: '1.1rem' }}>Nenhuma conta cadastrada</div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
              Crie sua primeira conta para organizar seus lançamentos
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {contas.map((conta) => (
              <div
                key={conta.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: deletingId === conta.id ? '#fff5f5' : '#f8fafc',
                  borderRadius: '12px',
                  border: deletingId === conta.id ? '1px solid #fc8181' : '1px solid #e2e8f0',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}>
                  🏦
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#2d3748', fontSize: '1rem' }}>
                    {conta.nome}
                  </div>
                  {conta.id && (
                    <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.15rem' }}>
                      ID: {conta.id}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {deletingId === conta.id ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#c53030', fontWeight: '600' }}>Excluir?</span>
                    <button
                      onClick={() => handleDelete(conta.id)}
                      disabled={deleteLoading}
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: deleteLoading ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                    >
                      {deleteLoading ? '⏳' : '✓ Sim'}
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: '#edf2f7',
                        color: '#4a5568',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => openEdit(conta)}
                      title="Editar"
                      style={actionBtnStyle}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#667eea'; e.currentTarget.style.color = 'white'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#edf2f7'; e.currentTarget.style.color = '#4a5568'; }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setDeletingId(conta.id)}
                      title="Excluir"
                      style={{ ...actionBtnStyle, }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#ff6b6b'; e.currentTarget.style.color = 'white'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#edf2f7'; e.currentTarget.style.color = '#4a5568'; }}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const actionBtnStyle = {
  padding: '0.4rem 0.6rem',
  background: '#edf2f7',
  color: '#4a5568',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  transition: 'all 0.2s',
  lineHeight: 1,
};
