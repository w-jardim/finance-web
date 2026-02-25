// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { api } from "../api/api";

function formatBRLFromCentavos(centavos) {
  const v = Number(centavos || 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizeLancamentos(resp) {
  // compat: pode vir { lancamentos: [...] } ou direto [...]
  if (Array.isArray(resp)) return resp;
  return resp?.lancamentos ?? [];
}

export function Dashboard() {
  const { user, token, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lancamentos, setLancamentos] = useState([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const resp = await api.getLancamentos(token);
        setLancamentos(normalizeLancamentos(resp));
      } catch (e) {
        // se token expirou ou inválido
        if (e?.status === 401) {
          logout();
          return;
        }
        setError("Falha ao carregar lançamentos.");
      } finally {
        setLoading(false);
      }
    };

    if (token) run();
  }, [token, logout]);

  const resumo = useMemo(() => {
    let entradas = 0;
    let saidas = 0;

    for (const l of lancamentos) {
      const valor = Number(l.valor_centavos || 0);
      if (l.tipo === "entrada") entradas += valor;
      else if (l.tipo === "saida") saidas += valor;
    }

    const saldo = entradas - saidas;

    return { entradas, saidas, saldo };
  }, [lancamentos]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        fontSize: '1.1rem',
        color: '#666'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <div>Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '1rem',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%'
    }}>
      {/* Header Section */}
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)',
        color: 'white'
      }}>
        <div style={{ marginBottom: '0.5rem', opacity: 0.9, fontSize: '0.9rem' }}>
          👋 Bem-vindo!
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
          {user?.email ?? '—'}
        </h1>
      </header>

      {/* Error Alert */}
      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
          color: 'white',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Cards Section */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* Saldo Card */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            fontSize: '6rem',
            opacity: 0.15
          }}>💰</div>
          <div style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600',
            opacity: 0.9,
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Saldo Total
          </div>
          <div style={{ 
            fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
            fontWeight: '800',
            letterSpacing: '-0.02em'
          }}>
            {formatBRLFromCentavos(resumo.saldo)}
          </div>
        </div>

        {/* Entradas Card */}
        <div style={{
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 8px 24px rgba(56, 239, 125, 0.35)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            fontSize: '6rem',
            opacity: 0.15
          }}>📈</div>
          <div style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600',
            opacity: 0.9,
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Entradas
          </div>
          <div style={{ 
            fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
            fontWeight: '800',
            letterSpacing: '-0.02em'
          }}>
            {formatBRLFromCentavos(resumo.entradas)}
          </div>
        </div>

        {/* Saídas Card */}
        <div style={{
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 8px 24px rgba(255, 107, 107, 0.35)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            fontSize: '6rem',
            opacity: 0.15
          }}>📉</div>
          <div style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600',
            opacity: 0.9,
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Saídas
          </div>
          <div style={{ 
            fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
            fontWeight: '800',
            letterSpacing: '-0.02em'
          }}>
            {formatBRLFromCentavos(resumo.saidas)}
          </div>
        </div>
      </section>

      {/* Lançamentos Section */}
      <section style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{
          margin: '0 0 1.5rem 0',
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#2d3748',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>📋</span>
          <span>Lançamentos</span>
        </h2>

        {lancamentos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: '#718096'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <div style={{ fontSize: '1.1rem' }}>Nenhum lançamento encontrado</div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
              Seus lançamentos aparecerão aqui
            </div>
          </div>
        ) : (
          <div>
            {/* Desktop Table - Hidden on Mobile */}
            <div style={{
              display: 'none',
              overflowX: 'auto'
            }}>
              <style>{`
                @media (min-width: 768px) {
                  .desktop-table { display: block !important; }
                  .mobile-cards { display: none !important; }
                }
              `}</style>
              <div className="desktop-table">
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr style={{
                      background: '#f7fafc',
                      borderBottom: '2px solid #e2e8f0'
                    }}>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#4a5568',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Data</th>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#4a5568',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Descrição</th>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#4a5568',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Tipo</th>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#4a5568',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lancamentos.map((l, idx) => (
                      <tr key={l.id} style={{
                        borderBottom: idx < lancamentos.length - 1 ? '1px solid #f1f5f9' : 'none',
                        transition: 'background-color 0.2s'
                      }}>
                        <td style={{ padding: '1rem', color: '#4a5568', fontSize: '0.9rem' }}>
                          {String(l.data_ocorrencia || "").slice(0, 10) || "—"}
                        </td>
                        <td style={{ padding: '1rem', color: '#2d3748', fontWeight: '500' }}>
                          {l.descricao ?? "—"}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{
                            padding: '0.375rem 0.875rem',
                            borderRadius: '20px',
                            fontWeight: '600',
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background: l.tipo === "entrada" 
                              ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                              : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                            color: 'white',
                            display: 'inline-block'
                          }}>
                            {l.tipo === 'entrada' ? '↗️ Entrada' : '↘️ Saída'}
                          </span>
                        </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'right',
                          fontWeight: '700',
                          fontSize: '1rem',
                          color: l.tipo === 'entrada' ? '#11998e' : '#ff6b6b'
                        }}>
                          {formatBRLFromCentavos(l.valor_centavos)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards - Visible on Mobile */}
            <div className="mobile-cards" style={{ display: 'block' }}>
              <style>{`
                @media (min-width: 768px) {
                  .mobile-cards { display: none !important; }
                  .desktop-table { display: block !important; }
                }
              `}</style>
              {lancamentos.map((l) => (
                <div key={l.id} style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: '600',
                        color: '#2d3748',
                        marginBottom: '0.25rem',
                        fontSize: '1rem'
                      }}>
                        {l.descricao ?? "—"}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#718096'
                      }}>
                        {String(l.data_ocorrencia || "").slice(0, 10) || "—"}
                      </div>
                    </div>
                    <div style={{
                      fontWeight: '700',
                      fontSize: '1.125rem',
                      color: l.tipo === 'entrada' ? '#11998e' : '#ff6b6b',
                      marginLeft: '1rem',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatBRLFromCentavos(l.valor_centavos)}
                    </div>
                  </div>
                  <div>
                    <span style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: '16px',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: l.tipo === "entrada" 
                        ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                        : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                      color: 'white',
                      display: 'inline-block'
                    }}>
                      {l.tipo === 'entrada' ? '↗️ Entrada' : '↘️ Saída'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}