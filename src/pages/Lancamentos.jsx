// src/pages/Lancamentos.jsx
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { api } from "../api/api";

const formatBRL = (centavos) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const today = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

export function Lancamentos() {
  const { token, logout } = useAuth();

  // Data lists
  const [lancamentos, setLancamentos] = useState([]);
  const [contas, setContas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filtroInicio, setFiltroInicio] = useState(firstOfMonth());
  const [filtroFim, setFiltroFim] = useState(today());

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [valorReais, setValorReais] = useState("");
  const [tipo, setTipo] = useState("saida");
  const [dataOcorrencia, setDataOcorrencia] = useState(today());
  const [contaId, setContaId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);

  // Delete state
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Reserva usa categorias de saída (dinheiro alocado)
  const categoriasFiltradas = categorias.filter((c) =>
    tipo === "reserva" ? c.tipo === "saida" : c.tipo === tipo
  );

  /* ------------- FETCHERS ------------- */
  const fetchLancamentos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filtroInicio) params.inicio = filtroInicio;
      if (filtroFim) params.fim = filtroFim;
      const resp = await api.getLancamentos(token, params);
      const list = Array.isArray(resp) ? resp : resp?.lancamentos ?? [];
      setLancamentos(list);
    } catch (e) {
      if (e?.status === 401) { logout(); return; }
      setError("Falha ao carregar lançamentos.");
    } finally {
      setLoading(false);
    }
  }, [token, logout, filtroInicio, filtroFim]);

  const fetchAux = useCallback(async () => {
    try {
      const [c, cat] = await Promise.all([
        api.getContas(token),
        api.getCategorias(token, {}),
      ]);
      setContas(Array.isArray(c) ? c : c?.contas ?? []);
      setCategorias(Array.isArray(cat) ? cat : cat?.categorias ?? []);
    } catch (e) {
      if (e?.status === 401) logout();
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) { fetchLancamentos(); fetchAux(); }
  }, [token, fetchLancamentos, fetchAux]);

  /* ------------- SUMMARIES ------------- */
  const resumo = lancamentos.reduce(
    (acc, l) => {
      const v = l.valor_centavos ?? 0;
      if (l.tipo === "entrada") acc.entradas += v;
      else if (l.tipo === "reserva") acc.reservas += v;
      else acc.saidas += v;
      return acc;
    },
    { entradas: 0, saidas: 0, reservas: 0 }
  );
  resumo.saldo = resumo.entradas - resumo.saidas - resumo.reservas;

  /* ------------- LOOKUP MAPS ------------- */
  const contaMap = Object.fromEntries(contas.map((c) => [String(c.id), c.nome]));
  const categoriaMap = Object.fromEntries(categorias.map((c) => [String(c.id), c.nome]));
  const getNomeConta = (l) => l.conta?.nome || contaMap[String(l.conta_id)] || "—";
  const getNomeCategoria = (l) => l.categoria?.nome || categoriaMap[String(l.categoria_id)] || "—";

  /* ------------- FORM HANDLERS ------------- */
  const resetForm = () => {
    setDescricao("");
    setValorReais("");
    setTipo("saida");
    setDataOcorrencia(today());
    setContaId("");
    setCategoriaId("");
    setEditingId(null);
    setFormError("");
    setFormSuccess("");
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (l) => {
    setDescricao(l.descricao);
    setValorReais((l.valor_centavos / 100).toFixed(2));
    setTipo(l.tipo);
    setDataOcorrencia(l.data_ocorrencia ? l.data_ocorrencia.slice(0, 10) : today());
    setContaId(l.conta_id || l.contaId || "");
    setCategoriaId(l.categoria_id || l.categoriaId || "");
    setEditingId(l.id);
    setFormError("");
    setFormSuccess("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

    const centavos = Math.round(parseFloat(valorReais.replace(",", ".")) * 100);
    if (isNaN(centavos) || centavos <= 0) {
      setFormError("Informe um valor válido.");
      setFormLoading(false);
      return;
    }

    const body = {
      descricao: descricao.trim(),
      valor_centavos: centavos,
      tipo,
      data_ocorrencia: dataOcorrencia,
    };
    if (contaId) body.conta_id = Number(contaId);
    if (categoriaId) body.categoria_id = Number(categoriaId);

    try {
      if (editingId) {
        await api.updateLancamento(token, editingId, body);
        setFormSuccess("Lançamento atualizado com sucesso!");
      } else {
        await api.createLancamento(token, body);
        setFormSuccess("Lançamento criado com sucesso!");
      }
      await fetchLancamentos();
      setTimeout(() => closeForm(), 1200);
    } catch (err) {
      if (err?.status === 401) { logout(); return; }
      setFormError(err?.payload?.erro || (editingId ? "Erro ao atualizar lançamento." : "Erro ao criar lançamento."));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await api.deleteLancamento(token, id);
      setDeletingId(null);
      await fetchLancamentos();
    } catch (err) {
      if (err?.status === 401) { logout(); return; }
      setError(err?.payload?.erro || "Erro ao excluir lançamento.");
      setDeletingId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ------------- RENDER ------------- */
  if (loading && lancamentos.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#666' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <div>Carregando lançamentos...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>💰</span> Lançamentos
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
          {showForm ? '✕ Cancelar' : '＋ Novo Lançamento'}
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

      {/* Form */}
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
            {editingId ? '✏️ Editar Lançamento' : '💰 Novo Lançamento'}
          </h2>
          {(tipo === 'saida' || tipo === 'reserva') && (
            <div style={{
              background: resumo.saldo > 0 ? 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)' : 'linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              border: resumo.saldo > 0 ? '1px solid #c8e6c9' : '1px solid #ffcdd2'
            }}>
              <span style={{ fontSize: '1.2rem' }}>{resumo.saldo > 0 ? '💰' : '⚠️'}</span>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#4a5568', fontWeight: '600' }}>Saldo disponível para distribuir</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: resumo.saldo >= 0 ? '#2e7d32' : '#c62828' }}>
                  {formatBRL(resumo.saldo)}
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Descrição</label>
                <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} required placeholder="Ex: Supermercado, Salário..." style={inputStyle}
                  onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <div>
                <label style={labelStyle}>Valor (R$)</label>
                <input type="number" value={valorReais} onChange={(e) => setValorReais(e.target.value)} required min="0.01" step="0.01" placeholder="0,00" style={inputStyle}
                  onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <div>
                <label style={labelStyle}>Tipo</label>
                <select value={tipo} onChange={(e) => { setTipo(e.target.value); setCategoriaId(""); }} style={{ ...inputStyle, background: 'white', cursor: 'pointer' }}>
                  <option value="entrada">↗️ Entrada</option>
                  <option value="saida">↘️ Saída</option>
                  <option value="reserva">🏦 Reserva</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Data</label>
                <input type="date" value={dataOcorrencia} onChange={(e) => setDataOcorrencia(e.target.value)} required style={inputStyle}
                  onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <div>
                <label style={labelStyle}>Conta</label>
                <select value={contaId} onChange={(e) => setContaId(e.target.value)} style={{ ...inputStyle, background: 'white', cursor: 'pointer' }}>
                  <option value="">Selecione</option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Categoria</label>
                <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} style={{ ...inputStyle, background: 'white', cursor: 'pointer' }}>
                  <option value="">Selecione</option>
                  {categoriasFiltradas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={formLoading}
              style={{
                padding: '0.75rem 2rem',
                background: formLoading ? '#cbd5e0' : editingId
                  ? 'linear-gradient(135deg, #ecc94b 0%, #d69e2e 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: formLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              {formLoading ? '⏳ Salvando...' : editingId ? '✏️ Atualizar' : '💾 Salvar'}
            </button>
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
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        marginBottom: '1rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'flex-end'
      }}>
        <div>
          <label style={labelStyle}>Início</label>
          <input type="date" value={filtroInicio} onChange={(e) => setFiltroInicio(e.target.value)} style={{ ...inputStyle, width: '160px' }}
            onFocus={handleFocus} onBlur={handleBlur} />
        </div>
        <div>
          <label style={labelStyle}>Fim</label>
          <input type="date" value={filtroFim} onChange={(e) => setFiltroFim(e.target.value)} style={{ ...inputStyle, width: '160px' }}
            onFocus={handleFocus} onBlur={handleBlur} />
        </div>
      </div>

      {/* Resume Mini Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <MiniCard label="Saldo Disponível" value={formatBRL(resumo.saldo)} color={resumo.saldo >= 0 ? '#11998e' : '#ff6b6b'} icon="💎" />
        <MiniCard label="Entradas" value={formatBRL(resumo.entradas)} color="#11998e" icon="📈" />
        <MiniCard label="Saídas" value={formatBRL(resumo.saidas)} color="#ff6b6b" icon="📉" />
        <MiniCard label="Reservas" value={formatBRL(resumo.reservas)} color="#d69e2e" icon="🏦" />
      </div>

      {/* Transactions List */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
      }}>
        {lancamentos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#718096' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💸</div>
            <div style={{ fontSize: '1.1rem' }}>Nenhum lançamento encontrado</div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
              Crie um lançamento para começar
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div style={{ overflowX: 'auto' }} className="desktop-only">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Descrição</th>
                    <th style={thStyle}>Tipo</th>
                    <th style={thStyle}>Valor</th>
                    <th style={thStyle}>Data</th>
                    <th style={thStyle}>Conta</th>
                    <th style={thStyle}>Categoria</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #edf2f7', background: deletingId === l.id ? '#fff5f5' : 'transparent' }}>
                      <td style={tdStyle}>{l.descricao}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: l.tipo === 'entrada' ? '#e8f5e9' : l.tipo === 'reserva' ? '#fefcbf' : '#ffebee',
                          color: l.tipo === 'entrada' ? '#2e7d32' : l.tipo === 'reserva' ? '#975a16' : '#c62828'
                        }}>
                          {l.tipo === 'entrada' ? '↗️' : l.tipo === 'reserva' ? '🏦' : '↘️'} {l.tipo}
                        </span>
                      </td>
                      <td style={{
                        ...tdStyle,
                        fontWeight: '700',
                        color: l.tipo === 'entrada' ? '#11998e' : l.tipo === 'reserva' ? '#d69e2e' : '#ff6b6b'
                      }}>
                        {l.tipo === 'entrada' ? '+' : l.tipo === 'reserva' ? '⇥' : '−'} {formatBRL(l.valor_centavos)}
                      </td>
                      <td style={tdStyle}>
                        {l.data_ocorrencia ? new Date(l.data_ocorrencia).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td style={tdStyle}>{getNomeConta(l)}</td>
                      <td style={tdStyle}>{getNomeCategoria(l)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {deletingId === l.id ? (
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#c53030', fontWeight: '600' }}>Excluir?</span>
                            <button onClick={() => handleDelete(l.id)} disabled={deleteLoading}
                              style={{ padding: '0.3rem 0.6rem', background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)', color: 'white', border: 'none', borderRadius: '6px', cursor: deleteLoading ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>
                              {deleteLoading ? '⏳' : '✓ Sim'}
                            </button>
                            <button onClick={() => setDeletingId(null)}
                              style={{ padding: '0.3rem 0.6rem', background: '#edf2f7', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>
                              Não
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                            <button onClick={() => openEdit(l)} title="Editar" style={actionBtnStyle}
                              onMouseOver={(e) => { e.currentTarget.style.background = '#667eea'; e.currentTarget.style.color = 'white'; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = '#edf2f7'; e.currentTarget.style.color = '#4a5568'; }}>
                              ✏️
                            </button>
                            <button onClick={() => setDeletingId(l.id)} title="Excluir" style={actionBtnStyle}
                              onMouseOver={(e) => { e.currentTarget.style.background = '#ff6b6b'; e.currentTarget.style.color = 'white'; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = '#edf2f7'; e.currentTarget.style.color = '#4a5568'; }}>
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-only" style={{ display: 'grid', gap: '0.75rem' }}>
              {lancamentos.map((l) => (
                <div key={l.id} style={{
                  padding: '1rem',
                  background: deletingId === l.id ? '#fff5f5' : '#f8fafc',
                  border: deletingId === l.id ? '1px solid #fc8181' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#2d3748' }}>{l.descricao}</div>
                      <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.15rem' }}>
                        {l.data_ocorrencia ? new Date(l.data_ocorrencia).toLocaleDateString("pt-BR") : "—"}
                        {getNomeConta(l) !== "—" ? ` · ${getNomeConta(l)}` : ""}
                        {getNomeCategoria(l) !== "—" ? ` · ${getNomeCategoria(l)}` : ""}
                      </div>
                    </div>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: l.tipo === 'entrada' ? '#e8f5e9' : l.tipo === 'reserva' ? '#fefcbf' : '#ffebee',
                      color: l.tipo === 'entrada' ? '#2e7d32' : l.tipo === 'reserva' ? '#975a16' : '#c62828',
                      whiteSpace: 'nowrap'
                    }}>
                      {l.tipo === 'entrada' ? '↗️' : l.tipo === 'reserva' ? '🏦' : '↘️'} {l.tipo}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                      fontWeight: '700',
                      fontSize: '1.1rem',
                      color: l.tipo === 'entrada' ? '#11998e' : l.tipo === 'reserva' ? '#d69e2e' : '#ff6b6b'
                    }}>
                      {l.tipo === 'entrada' ? '+' : l.tipo === 'reserva' ? '⇥' : '−'} {formatBRL(l.valor_centavos)}
                    </div>
                    {deletingId === l.id ? (
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#c53030', fontWeight: '600' }}>Excluir?</span>
                        <button onClick={() => handleDelete(l.id)} disabled={deleteLoading}
                          style={{ padding: '0.3rem 0.65rem', background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: deleteLoading ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                          {deleteLoading ? '⏳' : '✓ Sim'}
                        </button>
                        <button onClick={() => setDeletingId(null)}
                          style={{ padding: '0.3rem 0.65rem', background: '#edf2f7', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                          Não
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button onClick={() => openEdit(l)} title="Editar" style={actionBtnStyle}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#667eea'; e.currentTarget.style.color = 'white'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#edf2f7'; e.currentTarget.style.color = '#4a5568'; }}>
                          ✏️
                        </button>
                        <button onClick={() => setDeletingId(l.id)} title="Excluir" style={actionBtnStyle}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#ff6b6b'; e.currentTarget.style.color = 'white'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#edf2f7'; e.currentTarget.style.color = '#4a5568'; }}>
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ------------- Sub-component ------------- */
function MiniCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '14px',
      padding: '1rem 1.25rem',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '0.3rem' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: '700', color }}>
        {value}
      </div>
    </div>
  );
}

/* ------------- Constants ------------- */
const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontWeight: '600',
  color: '#4a5568',
  fontSize: '0.85rem',
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '2px solid #e2e8f0',
  borderRadius: '10px',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const thStyle = {
  textAlign: 'left',
  padding: '0.75rem 0.75rem',
  fontWeight: '600',
  color: '#4a5568',
  fontSize: '0.82rem',
  borderBottom: '2px solid #e2e8f0',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tdStyle = {
  padding: '0.75rem 0.75rem',
  fontSize: '0.9rem',
  color: '#2d3748',
};

const actionBtnStyle = {
  padding: '0.35rem 0.55rem',
  background: '#edf2f7',
  color: '#4a5568',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  transition: 'all 0.2s',
  lineHeight: 1,
};

const handleFocus = (e) => { e.currentTarget.style.borderColor = '#667eea'; };
const handleBlur = (e) => { e.currentTarget.style.borderColor = '#e2e8f0'; };
