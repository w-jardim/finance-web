// src/pages/Lancamentos.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { api } from "../api/api";

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

const formatBRL = (centavos) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const today = () => new Date().toISOString().slice(0, 10);

const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const toList = (resp) => (Array.isArray(resp) ? resp : resp?.lancamentos ?? []);

function getApiErrorMessage(err, fallback) {
  const code = err?.payload?.erro;
  if (code === "origem_nao_entrada" || code === "origem_deve_ser_saida") {
    return "A API ainda nao foi atualizada para aceitar transferencias entre contas. Publique o backend corrigido e tente novamente.";
  }
  if (code === "conta_id_obrigatorio") return "Conta obrigatoria.";
  if (code === "tipo_invalido") return "Tipo de lancamento invalido.";
  if (code === "valor_centavos_invalido") return "Informe um valor valido.";
  if (code === "data_ocorrencia_obrigatoria") return "Data obrigatoria.";
  if (typeof code === "string" && code.trim()) return code;
  return fallback;
}

/**
 * Retorna um Set com os IDs de lançamentos que fazem parte de uma transferência.
 * Uma transferência = entrada com origem_lancamento_id + a saída referenciada.
 * Ambos devem ser excluídos de somas financeiras.
 */
function buildTransferIdSet(list) {
  const set = new Set();
  for (const l of list) {
    if (l.origem_lancamento_id) {
      set.add(Number(l.id));
      set.add(Number(l.origem_lancamento_id));
    }
  }
  return set;
}

/**
 * Soma lançamentos respeitando regras de negócio:
 *  - Transferências são ignoradas
 *  - Entradas contam somente se recebido
 *  - Reservas contam somente se separado
 *  - Saídas contam sempre
 */
function sumLancamentos(list, transferIdSet) {
  let entradas = 0, saidas = 0, reservas = 0;
  for (const l of list) {
    if (transferIdSet.has(Number(l.id))) continue;
    const v = Number(l.valor_centavos || 0);
    if (l.tipo === "entrada") { if (l.recebido) entradas += v; }
    else if (l.tipo === "reserva") { if (l.separado) reservas += v; }
    else saidas += v;
  }
  return { entradas, saidas, reservas };
}

/* ═══════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════ */

export function Lancamentos() {
  const { token, logout } = useAuth();

  /* ── Dados da API ── */
  const [lancamentos, setLancamentos] = useState([]);
  const [allLancamentos, setAllLancamentos] = useState([]);
  const [contas, setContas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ── Filtros ── */
  const [filtroInicio, setFiltroInicio] = useState(firstOfMonth());
  const [filtroFim, setFiltroFim] = useState(today());
  const [filtroPago, setFiltroPago] = useState("all");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroConta, setFiltroConta] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroRecebido, setFiltroRecebido] = useState("all");
  const [filtroSeparado, setFiltroSeparado] = useState("all");
  const [filtroBusca, setFiltroBusca] = useState("");

  /* ── Formulário de lançamento ── */
  const [showForm, setShowForm] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [valorReais, setValorReais] = useState("");
  const [tipo, setTipo] = useState("saida");
  const [dataOcorrencia, setDataOcorrencia] = useState(today());
  const [contaId, setContaId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [origemLancamentoId, setOrigemLancamentoId] = useState("");
  const [entradasList, setEntradasList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  /* ── Formulário de transferência ── */
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState(today());
  const [transferDesc, setTransferDesc] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState(null);

  /* ── Delete ── */
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ═══════════════════════════════════════════
     VALORES DERIVADOS (useMemo)
     ═══════════════════════════════════════════ */

  const transferIds = useMemo(() => buildTransferIdSet(allLancamentos), [allLancamentos]);

  const categoriasFiltradas = useMemo(
    () => categorias.filter((c) =>
      tipo === "reserva" ? c.tipo === "saida" || c.tipo === "reserva" : c.tipo === tipo
    ),
    [categorias, tipo]
  );

  const visibleLancamentos = useMemo(
    () => lancamentos.filter((l) => {
      if (filtroConta && String(l.conta_id) !== String(filtroConta)) return false;
      if (filtroCategoria && String(l.categoria_id) !== String(filtroCategoria)) return false;
      if (filtroBusca && !String(l.descricao || "").toLowerCase().includes(filtroBusca.toLowerCase())) return false;
      return true;
    }),
    [lancamentos, filtroConta, filtroCategoria, filtroBusca]
  );

  const resumo = useMemo(() => {
    const r = sumLancamentos(allLancamentos, transferIds);
    r.saldo = r.entradas - r.saidas - r.reservas;
    return r;
  }, [allLancamentos, transferIds]);

  const saldoDisponivel = resumo.saldo;

  const contaMap = useMemo(() => Object.fromEntries(contas.map((c) => [String(c.id), c.nome])), [contas]);
  const categoriaMap = useMemo(() => Object.fromEntries(categorias.map((c) => [String(c.id), c.nome])), [categorias]);
  const getNomeConta = (l) => l.conta?.nome || contaMap[String(l.conta_id)] || "—";
  const getNomeCategoria = (l) => l.categoria?.nome || categoriaMap[String(l.categoria_id)] || "—";

  /* ═══════════════════════════════════════════
     FETCHERS
     ═══════════════════════════════════════════ */

  const fetchLancamentos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filtroInicio) params.inicio = filtroInicio;
      if (filtroFim) params.fim = filtroFim;
      if (filtroTipo !== "all") params.tipo = filtroTipo;
      if (filtroPago !== "all") params.pago = filtroPago === "paid";
      if (filtroRecebido !== "all") params.recebido = filtroRecebido === "received";
      if (filtroSeparado !== "all") params.separado = filtroSeparado === "separated";

      const [filteredResp, allResp] = await Promise.all([
        api.getLancamentos(token, params),
        api.getLancamentos(token, { fim: filtroFim }),
      ]);

      const filtered = toList(filteredResp);
      setLancamentos(filtered);
      setAllLancamentos(toList(allResp));
    } catch (e) {
      if (e?.status === 401) { logout(); return; }
      setError(getApiErrorMessage(e, "Falha ao carregar lançamentos."));
    } finally {
      setLoading(false);
    }
  }, [token, logout, filtroInicio, filtroFim, filtroPago, filtroTipo, filtroRecebido, filtroSeparado]);

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

  const fetchEntradas = useCallback(async () => {
    try { return toList(await api.getLancamentos(token, { tipo: "entrada" })); }
    catch { return []; }
  }, [token]);

  useEffect(() => {
    if (token) { fetchLancamentos(); fetchAux(); }
  }, [token, fetchLancamentos, fetchAux]);

  useEffect(() => {
    if (!showForm || tipo !== "reserva") return;
    let mounted = true;
    fetchEntradas().then((list) => { if (mounted) setEntradasList(list); });
    return () => { mounted = false; };
  }, [showForm, tipo, fetchEntradas]);

  /* ═══════════════════════════════════════════
     FORM HANDLERS
     ═══════════════════════════════════════════ */

  const resetForm = () => {
    setDescricao(""); setValorReais(""); setTipo("saida");
    setDataOcorrencia(today()); setContaId(""); setCategoriaId("");
    setEditingId(null); setFormError(""); setFormSuccess("");
    setOrigemLancamentoId(""); setEntradasList([]);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (l) => {
    setDescricao(l.descricao);
    setValorReais((l.valor_centavos / 100).toFixed(2));
    setTipo(l.tipo);
    setDataOcorrencia(l.data_ocorrencia ? l.data_ocorrencia.slice(0, 10) : today());
    setContaId(l.conta_id || l.contaId || "");
    setCategoriaId(l.categoria_id || l.categoriaId || "");
    setOrigemLancamentoId(l.origem_lancamento_id || "");
    setEditingId(l.id);
    setFormError(""); setFormSuccess("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => { resetForm(); setShowForm(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(""); setFormSuccess(""); setFormLoading(true);

    const centavos = Math.round(parseFloat(valorReais.replace(",", ".")) * 100);
    if (isNaN(centavos) || centavos <= 0) {
      setFormError("Informe um valor válido.");
      setFormLoading(false);
      return;
    }

    const body = { descricao: descricao.trim(), valor_centavos: centavos, tipo, data_ocorrencia: dataOcorrencia };
    if (contaId) body.conta_id = Number(contaId);
    if (categoriaId) body.categoria_id = Number(categoriaId);
    if (origemLancamentoId) body.origem_lancamento_id = Number(origemLancamentoId);

    try {
      if (editingId) {
        await api.updateLancamento(token, editingId, body);
        setFormSuccess("Lançamento atualizado!");
      } else {
        await api.createLancamento(token, body);
        setFormSuccess("Lançamento criado!");
      }
      await fetchLancamentos();
      setTimeout(closeForm, 1200);
    } catch (err) {
      if (err?.status === 401) { logout(); return; }
      setFormError(err?.payload?.erro || "Erro ao salvar lançamento.");
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

  /* ═══════════════════════════════════════════
     TRANSFER HANDLER
     ═══════════════════════════════════════════ */

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setTransferError(null);
    setTransferLoading(true);
    try {
      if (!transferFrom || !transferTo) { setTransferError("Selecione conta origem e destino"); return; }
      if (transferFrom === transferTo) { setTransferError("Contas devem ser diferentes"); return; }

      const valor = Math.round(parseFloat((transferAmount || "0").replace(",", ".")) * 100);
      if (!valor || valor <= 0) { setTransferError("Informe um valor válido"); return; }

      const origemConta = contas.find((c) => c.nome === transferFrom);
      const destinoConta = contas.find((c) => c.nome === transferTo);
      if (!origemConta || !destinoConta) { setTransferError("Conta inválida"); return; }

      const saidaResp = await api.createLancamento(token, {
        tipo: "saida", conta_id: Number(origemConta.id), categoria_id: null,
        valor_centavos: valor, data_ocorrencia: transferDate,
        descricao: transferDesc || `Transferência para ${transferTo}`,
      });
      const saidaId = saidaResp?.lancamento?.id ?? saidaResp?.id;

      try {
        await api.createLancamento(token, {
          tipo: "entrada", conta_id: Number(destinoConta.id), categoria_id: null,
          valor_centavos: valor, data_ocorrencia: transferDate,
          descricao: transferDesc || `Transferência de ${transferFrom}`,
          origem_lancamento_id: saidaId,
        });
        setShowTransfer(false);
        setTransferFrom(""); setTransferTo(""); setTransferAmount(""); setTransferDesc("");
        await fetchLancamentos();
      } catch (err) {
        try { await api.deleteLancamento(token, saidaId); } catch { /* rollback best-effort */ }
        setTransferError(getApiErrorMessage(err, "Falha ao criar entrada de destino"));
      }
    } catch (err) {
      setTransferError(getApiErrorMessage(err, "Falha ao criar saída na conta origem"));
    } finally {
      setTransferLoading(false);
    }
  };

  /* ═══════════════════════════════════════════
     ACTION HELPER (toggle pago/recebido/separado)
     ═══════════════════════════════════════════ */

  const handleAction = async (apiFn, id, errorMsg) => {
    try {
      await apiFn(token, id);
      await fetchLancamentos();
    } catch (err) {
      if (err?.status === 401) logout();
      else setError(errorMsg);
    }
  };

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */

  if (loading && lancamentos.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "#666" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
          <div>Carregando lançamentos...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem", maxWidth: "1100px", margin: "0 auto", width: "100%" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: "700", color: "#2d3748", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>💰</span> Lançamentos
        </h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => (showForm ? closeForm() : openCreate())}
            style={{ padding: "0.65rem 1.25rem", background: showForm ? "linear-gradient(135deg,#718096,#4a5568)" : "linear-gradient(135deg,#667eea,#764ba2)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", boxShadow: "0 4px 12px rgba(102,126,234,0.3)" }}>
            {showForm ? "✕ Cancelar" : "＋ Novo Lançamento"}
          </button>
          <button onClick={() => { setShowTransfer(true); setTransferError(null); }}
            style={{ padding: "0.65rem 1.25rem", background: "linear-gradient(135deg,#16a34a,#059669)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", boxShadow: "0 4px 12px rgba(6,95,70,0.2)" }}>
            🔄 Transferência
          </button>
        </div>
      </div>

      {/* ── Error global ── */}
      {error && (
        <div style={{ background: "linear-gradient(135deg,#ff6b6b,#ee5a6f)", color: "white", padding: "1rem 1.25rem", borderRadius: "12px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span>⚠️</span> <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "1rem" }}>✕</button>
        </div>
      )}

      {/* ── Transferência ── */}
      {showTransfer && (
        <form onSubmit={handleTransferSubmit} style={{ background: "white", borderRadius: "12px", padding: "1rem", marginBottom: "1rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h2 style={{ margin: "0 0 0.75rem 0", fontSize: "1rem", fontWeight: "700" }}>Transferência entre contas</h2>
          {transferError && <div style={{ color: "#c62828", marginBottom: "0.5rem" }}>{transferError}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>Conta origem</label>
              <select required value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)} style={inputStyle}>
                <option value="">Selecione</option>
                {contas.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Conta destino</label>
              <select required value={transferTo} onChange={(e) => setTransferTo(e.target.value)} style={inputStyle}>
                <option value="">Selecione</option>
                {contas.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Valor</label>
              <input required name="transferAmount" type="number" step="0.01" min="0.01" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Data</label>
              <input required name="transferDate" type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Descrição</label>
              <input name="transferDesc" value={transferDesc} onChange={(e) => setTransferDesc(e.target.value)} placeholder="Opcional" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button type="submit" disabled={transferLoading}
              style={{ padding: "0.6rem 0.9rem", background: transferLoading ? "#cbd5e0" : "#16a34a", color: "white", border: "none", borderRadius: "10px", cursor: transferLoading ? "not-allowed" : "pointer", fontWeight: "600" }}>
              {transferLoading ? "Enviando..." : "Executar Transferência"}
            </button>
            <button type="button" onClick={() => setShowTransfer(false)} disabled={transferLoading}
              style={{ padding: "0.6rem 0.9rem", background: "#edf2f7", border: "none", borderRadius: "10px", cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* ── Formulário criar/editar ── */}
      {showForm && (
        <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", border: editingId ? "2px solid #ecc94b44" : "2px solid #667eea22" }}>
          <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600", color: "#2d3748" }}>
            {editingId ? "✏️ Editar Lançamento" : "💰 Novo Lançamento"}
          </h2>
          {(tipo === "saida" || tipo === "reserva") && (
            <div style={{
              background: saldoDisponivel > 0 ? "linear-gradient(135deg,#e8f5e9,#f1f8e9)" : "linear-gradient(135deg,#ffebee,#fce4ec)",
              borderRadius: "12px", padding: "0.75rem 1rem", marginBottom: "1rem",
              display: "flex", alignItems: "center", gap: "0.75rem",
              border: saldoDisponivel > 0 ? "1px solid #c8e6c9" : "1px solid #ffcdd2"
            }}>
              <span style={{ fontSize: "1.2rem" }}>{saldoDisponivel > 0 ? "💰" : "⚠️"}</span>
              <div>
                <div style={{ fontSize: "0.8rem", color: "#4a5568", fontWeight: "600" }}>Saldo disponível para distribuir</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: saldoDisponivel >= 0 ? "#2e7d32" : "#c62828" }}>
                  {formatBRL(saldoDisponivel)}
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={labelStyle}>Descrição</label>
                <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} required placeholder="Ex: Supermercado, Salário..." style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <div>
                <label style={labelStyle}>Valor (R$)</label>
                <input type="number" value={valorReais} onChange={(e) => setValorReais(e.target.value)} required min="0.01" step="0.01" placeholder="0,00" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <div>
                <label style={labelStyle}>Tipo</label>
                <select value={tipo} onChange={(e) => { setTipo(e.target.value); setCategoriaId(""); }} style={{ ...inputStyle, background: "white", cursor: "pointer" }}>
                  <option value="entrada">↗️ Entrada</option>
                  <option value="saida">↘️ Saída</option>
                  <option value="reserva">🏦 Reserva</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Data</label>
                <input type="date" value={dataOcorrencia} onChange={(e) => setDataOcorrencia(e.target.value)} required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <div>
                <label style={labelStyle}>Conta</label>
                <select value={contaId} onChange={(e) => setContaId(e.target.value)} style={{ ...inputStyle, background: "white", cursor: "pointer" }}>
                  <option value="">Selecione</option>
                  {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Categoria</label>
                <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} style={{ ...inputStyle, background: "white", cursor: "pointer" }}>
                  <option value="">Selecione</option>
                  {categoriasFiltradas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              {tipo === "reserva" && (
                <div>
                  <label style={labelStyle}>Consumir da Entrada</label>
                  <select value={origemLancamentoId} onChange={(e) => setOrigemLancamentoId(e.target.value)} style={{ ...inputStyle, background: "white", cursor: "pointer" }}>
                    <option value="">Nenhuma / Selecionar...</option>
                    {entradasList.map((en) => (
                      <option key={en.id} value={en.id}>
                        {`${en.descricao || "Entrada"} · ${en.data_ocorrencia ? new Date(en.data_ocorrencia).toLocaleDateString("pt-BR") : ""} · ${formatBRL(en.valor_centavos)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <button type="submit" disabled={formLoading}
              style={{ padding: "0.75rem 2rem", background: formLoading ? "#cbd5e0" : editingId ? "linear-gradient(135deg,#ecc94b,#d69e2e)" : "linear-gradient(135deg,#667eea,#764ba2)", color: "white", border: "none", borderRadius: "10px", cursor: formLoading ? "not-allowed" : "pointer", fontSize: "0.95rem", fontWeight: "600" }}>
              {formLoading ? "⏳ Salvando..." : editingId ? "✏️ Atualizar" : "💾 Salvar"}
            </button>
            {formError && <div style={{ color: "#c62828", marginTop: "0.75rem", padding: "0.6rem 0.75rem", background: "#ffebee", borderRadius: "8px", fontSize: "0.85rem" }}>⚠️ {formError}</div>}
            {formSuccess && <div style={{ color: "#2e7d32", marginTop: "0.75rem", padding: "0.6rem 0.75rem", background: "#e8f5e9", borderRadius: "8px", fontSize: "0.85rem" }}>✅ {formSuccess}</div>}
          </form>
        </div>
      )}

      {/* ── Filtros ── */}
      <div style={{ background: "white", borderRadius: "16px", padding: "1rem 1.25rem", marginBottom: "1rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <FilterField label="Início"><input type="date" value={filtroInicio} onChange={(e) => setFiltroInicio(e.target.value)} style={{ ...inputStyle, width: "160px" }} onFocus={handleFocus} onBlur={handleBlur} /></FilterField>
        <FilterField label="Fim"><input type="date" value={filtroFim} onChange={(e) => setFiltroFim(e.target.value)} style={{ ...inputStyle, width: "160px" }} onFocus={handleFocus} onBlur={handleBlur} /></FilterField>
        <FilterField label="Pagamento">
          <select value={filtroPago} onChange={(e) => setFiltroPago(e.target.value)} style={{ ...inputStyle, width: "160px" }}>
            <option value="all">Todos</option><option value="paid">Pagos</option><option value="unpaid">A pagar</option>
          </select>
        </FilterField>
        <FilterField label="Tipo">
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ ...inputStyle, width: "160px" }}>
            <option value="all">Todos</option><option value="entrada">Entrada</option><option value="saida">Saída</option><option value="reserva">Reserva</option>
          </select>
        </FilterField>
        <FilterField label="Recebido">
          <select value={filtroRecebido} onChange={(e) => setFiltroRecebido(e.target.value)} style={{ ...inputStyle, width: "160px" }}>
            <option value="all">Todos</option><option value="received">Recebidos</option><option value="unreceived">A receber</option>
          </select>
        </FilterField>
        <FilterField label="Separado">
          <select value={filtroSeparado} onChange={(e) => setFiltroSeparado(e.target.value)} style={{ ...inputStyle, width: "160px" }}>
            <option value="all">Todos</option><option value="separated">Separados</option><option value="unseparated">Não separados</option>
          </select>
        </FilterField>
        <FilterField label="Conta">
          <select value={filtroConta} onChange={(e) => setFiltroConta(e.target.value)} style={{ ...inputStyle, width: "200px" }}>
            <option value="">Todas</option>
            {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </FilterField>
        <FilterField label="Categoria">
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={{ ...inputStyle, width: "200px" }}>
            <option value="">Todas</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </FilterField>
        <FilterField label="Busca" style={{ minWidth: "200px" }}>
          <input placeholder="Pesquisar descrição" value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} style={inputStyle} />
        </FilterField>
      </div>

      {/* ── Resumo Mini Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <MiniCard label="Saldo Disponível" value={formatBRL(resumo.saldo)} color={resumo.saldo >= 0 ? "#11998e" : "#ff6b6b"} icon="💎" />
        <MiniCard label="Entradas" value={formatBRL(resumo.entradas)} color="#11998e" icon="📈" />
        <MiniCard label="Saídas" value={formatBRL(resumo.saidas)} color="#ff6b6b" icon="📉" />
        <MiniCard label="Reservas" value={formatBRL(resumo.reservas)} color="#d69e2e" icon="🏦" />
      </div>

      {/* ── Lista de Lançamentos ── */}
      <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        {visibleLancamentos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#718096" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💸</div>
            <div style={{ fontSize: "1.1rem" }}>Nenhum lançamento encontrado</div>
            <div style={{ fontSize: "0.9rem", marginTop: "0.5rem", opacity: 0.7 }}>Crie um lançamento para começar</div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div style={{ overflowX: "auto" }} className="desktop-only">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Descrição</th>
                    <th style={thStyle}>Tipo</th>
                    <th style={thStyle}>Valor</th>
                    <th style={thStyle}>Data</th>
                    <th style={thStyle}>Conta</th>
                    <th style={thStyle}>Categoria</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLancamentos.map((l) => (
                    <tr key={l.id} style={{ borderBottom: "1px solid #edf2f7", background: deletingId === l.id ? "#fff5f5" : "transparent" }}>
                      <td style={tdStyle}>{l.descricao}</td>
                      <td style={tdStyle}><TipoBadge tipo={l.tipo} /></td>
                      <td style={{ ...tdStyle, fontWeight: "700", color: tipoColor(l.tipo) }}>
                        {l.tipo === "entrada" ? "+" : l.tipo === "reserva" ? "⇥" : "−"} {formatBRL(l.valor_centavos)}
                      </td>
                      <td style={tdStyle}>{l.data_ocorrencia ? new Date(l.data_ocorrencia).toLocaleDateString("pt-BR") : "—"}</td>
                      <td style={tdStyle}>{getNomeConta(l)}</td>
                      <td style={tdStyle}>{getNomeCategoria(l)}</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <ActionButtons l={l} deletingId={deletingId} deleteLoading={deleteLoading}
                          onEdit={() => openEdit(l)} onDelete={() => handleDelete(l.id)}
                          onStartDelete={() => setDeletingId(l.id)} onCancelDelete={() => setDeletingId(null)}
                          onAction={handleAction} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-only" style={{ display: "grid", gap: "0.75rem" }}>
              {visibleLancamentos.map((l) => (
                <div key={l.id} style={{
                  padding: "1rem", background: deletingId === l.id ? "#fff5f5" : "#f8fafc",
                  border: deletingId === l.id ? "1px solid #fc8181" : "1px solid #e2e8f0",
                  borderRadius: "12px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div>
                      <div style={{ fontWeight: "600", color: "#2d3748" }}>{l.descricao}</div>
                      <div style={{ fontSize: "0.8rem", color: "#a0aec0", marginTop: "0.15rem" }}>
                        {l.data_ocorrencia ? new Date(l.data_ocorrencia).toLocaleDateString("pt-BR") : "—"}
                        {getNomeConta(l) !== "—" ? ` · ${getNomeConta(l)}` : ""}
                        {getNomeCategoria(l) !== "—" ? ` · ${getNomeCategoria(l)}` : ""}
                      </div>
                    </div>
                    <TipoBadge tipo={l.tipo} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: "700", fontSize: "1.1rem", color: tipoColor(l.tipo) }}>
                      {l.tipo === "entrada" ? "+" : l.tipo === "reserva" ? "⇥" : "−"} {formatBRL(l.valor_centavos)}
                    </div>
                    <ActionButtons l={l} deletingId={deletingId} deleteLoading={deleteLoading}
                      onEdit={() => openEdit(l)} onDelete={() => handleDelete(l.id)}
                      onStartDelete={() => setDeletingId(l.id)} onCancelDelete={() => setDeletingId(null)}
                      onAction={handleAction} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (min-width: 769px) { .mobile-only { display: none !important; } }
        @media (max-width: 768px) { .desktop-only { display: none !important; } }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUB-COMPONENTES
   ═══════════════════════════════════════════ */

function FilterField({ label, children, style }) {
  return <div style={style}><label style={labelStyle}>{label}</label>{children}</div>;
}

function TipoBadge({ tipo }) {
  const cfg = {
    entrada: { bg: "#e8f5e9", color: "#2e7d32", icon: "↗️" },
    reserva: { bg: "#fefcbf", color: "#975a16", icon: "🏦" },
    saida:   { bg: "#ffebee", color: "#c62828", icon: "↘️" },
  };
  const c = cfg[tipo] || cfg.saida;
  return (
    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600", background: c.bg, color: c.color, whiteSpace: "nowrap" }}>
      {c.icon} {tipo}
    </span>
  );
}

function tipoColor(tipo) {
  return tipo === "entrada" ? "#11998e" : tipo === "reserva" ? "#d69e2e" : "#ff6b6b";
}

function ActionButtons({ l, deletingId, deleteLoading, onEdit, onDelete, onStartDelete, onCancelDelete, onAction }) {
  if (deletingId === l.id) {
    return (
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem", color: "#c53030", fontWeight: "600" }}>Excluir?</span>
        <button onClick={onDelete} disabled={deleteLoading}
          style={{ padding: "0.3rem 0.6rem", background: "linear-gradient(135deg,#ff6b6b,#ee5a6f)", color: "white", border: "none", borderRadius: "6px", cursor: deleteLoading ? "not-allowed" : "pointer", fontSize: "0.75rem", fontWeight: "600" }}>
          {deleteLoading ? "⏳" : "✓ Sim"}
        </button>
        <button onClick={onCancelDelete}
          style={{ padding: "0.3rem 0.6rem", background: "#edf2f7", color: "#4a5568", border: "1px solid #e2e8f0", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}>
          Não
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", justifyContent: "center" }}>
      <ActionBtn icon="✏️" title="Editar" onClick={onEdit} />
      <ActionBtn icon="🗑️" title="Excluir" onClick={onStartDelete} />

      {l.tipo === "saida" && (l.pago
        ? <ActionBtn icon="💸" label="Estornado" title="Estornar" onClick={() => onAction(api.unpayLancamento, l.id, "Falha ao estornar.")} />
        : <ActionBtn icon="✅" label="Marcar Pago" title="Marcar pago" onClick={() => onAction(api.payLancamento, l.id, "Falha ao marcar pago.")} />
      )}

      {l.tipo === "entrada" && (l.recebido
        ? <ActionBtn icon="📥" label="Recebido" title="Cancelar recebido" onClick={() => onAction(api.unreceiveLancamento, l.id, "Falha ao cancelar recebido.")} />
        : <ActionBtn icon="📥" label="Marcar Recebido" title="Marcar recebido" onClick={() => onAction(api.receiveLancamento, l.id, "Falha ao marcar recebido.")} />
      )}

      {l.tipo === "reserva" && (l.separado
        ? <ActionBtn icon="🧾" label="Separado" title="Desseparar" onClick={() => onAction(api.unseparateLancamento, l.id, "Falha ao desseparar.")} />
        : <ActionBtn icon="🧾" label="Marcar Separado" title="Marcar separado" onClick={() => onAction(api.separateLancamento, l.id, "Falha ao marcar separado.")} />
      )}
    </div>
  );
}

function ActionBtn({ icon, label, title, onClick }) {
  return (
    <button onClick={onClick} title={title} style={actionBtnStyle}
      onMouseOver={(e) => { e.currentTarget.style.background = "#667eea"; e.currentTarget.style.color = "white"; }}
      onMouseOut={(e) => { e.currentTarget.style.background = "#edf2f7"; e.currentTarget.style.color = "#4a5568"; }}>
      {icon}{label ? ` ${label}` : ""}
    </button>
  );
}

function MiniCard({ label, value, color, icon }) {
  return (
    <div style={{ background: "white", borderRadius: "14px", padding: "1rem 1.25rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: "0.8rem", color: "#718096", marginBottom: "0.3rem" }}>{icon} {label}</div>
      <div style={{ fontSize: "1.25rem", fontWeight: "700", color }}>{value}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CONSTANTES DE ESTILO
   ═══════════════════════════════════════════ */

const labelStyle = { display: "block", marginBottom: "0.4rem", fontWeight: "600", color: "#4a5568", fontSize: "0.85rem" };
const inputStyle = { width: "100%", padding: "0.75rem 1rem", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "0.95rem", boxSizing: "border-box", outline: "none", transition: "border-color 0.2s" };
const thStyle = { textAlign: "left", padding: "0.75rem", fontWeight: "600", color: "#4a5568", fontSize: "0.82rem", borderBottom: "2px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" };
const tdStyle = { padding: "0.75rem", fontSize: "0.9rem", color: "#2d3748" };
const actionBtnStyle = { padding: "0.35rem 0.55rem", background: "#edf2f7", color: "#4a5568", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s", lineHeight: 1 };
const handleFocus = (e) => { e.currentTarget.style.borderColor = "#667eea"; };
const handleBlur = (e) => { e.currentTarget.style.borderColor = "#e2e8f0"; };
