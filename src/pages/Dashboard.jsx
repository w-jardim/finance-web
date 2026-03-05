// src/pages/Dashboard.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { api } from "../api/api";

function formatBRLFromCentavos(centavos) {
  const v = Number(centavos || 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizeLancamentos(resp) {
  if (Array.isArray(resp)) return resp;
  return resp?.lancamentos ?? [];
}

export function Dashboard() {
  const { user, token, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lancamentos, setLancamentos] = useState([]);

  // Filtros por período
  const [filtroInicio, setFiltroInicio] = useState("");
  const [filtroFim, setFiltroFim] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filtroInicio) params.inicio = filtroInicio;
      if (filtroFim) params.fim = filtroFim;
      const resp = await api.getLancamentos(token, params);
      setLancamentos(normalizeLancamentos(resp));
    } catch (e) {
      if (e?.status === 401) {
        logout();
        return;
      }
      setError("Falha ao carregar lançamentos.");
    } finally {
      setLoading(false);
    }
  }, [token, filtroInicio, filtroFim, logout]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  const handleFiltrar = (e) => {
    e.preventDefault();
    fetchData();
  };

  const limparFiltros = () => {
    setFiltroInicio("");
    setFiltroFim("");
    setTimeout(() => fetchData(), 0);
  };

  const resumo = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    let reservas = 0;

    for (const l of lancamentos) {
      const valor = Number(l.valor_centavos || 0);
      if (l.tipo === "entrada") entradas += valor;
      else if (l.tipo === "reserva") reservas += valor;
      else if (l.tipo === "saida") saidas += valor;
    }

    const saldo = entradas - saidas - reservas;
    return { entradas, saidas, reservas, saldo };
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ marginBottom: '0.5rem', opacity: 0.9, fontSize: '0.9rem' }}>
              👋 Bem-vindo!
            </div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
              {user?.email ?? '—'}
            </h1>
          </div>
          <Link
            to="/lancamentos"
            style={{
              padding: '0.6rem 1.25rem',
              background: 'rgba(255,255,255,0.25)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '600',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s'
            }}
          >
            ＋ Novo Lançamento
          </Link>
        </div>
      </header>

      {/* Filtro por período */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-end',
        flexWrap: 'wrap'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '600', color: '#4a5568', fontSize: '0.8rem' }}>
            Início
          </label>
          <input
            type="date"
            value={filtroInicio}
            onChange={(e) => setFiltroInicio(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '600', color: '#4a5568', fontSize: '0.8rem' }}>
            Fim
          </label>
          <input
            type="date"
            value={filtroFim}
            onChange={(e) => setFiltroFim(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>
        <button
          onClick={handleFiltrar}
          style={{
            padding: '0.55rem 1.25rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}
        >
          🔍 Filtrar
        </button>
        {(filtroInicio || filtroFim) && (
          <button
            onClick={limparFiltros}
            style={{
              padding: '0.55rem 1rem',
              background: '#f1f5f9',
              color: '#4a5568',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            ✕ Limpar
          </button>
        )}
      </div>

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

        {/* Reservas Card */}
        <div style={{
          background: 'linear-gradient(135deg, #ecc94b 0%, #d69e2e 100%)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 8px 24px rgba(214, 158, 46, 0.35)',
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
          }}>🏦</div>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            opacity: 0.9,
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Reservas
          </div>
          <div style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
            fontWeight: '800',
            letterSpacing: '-0.02em'
          }}>
            {formatBRLFromCentavos(resumo.reservas)}
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[
          { to: '/lancamentos', icon: '📋', label: 'Lançamentos', desc: 'Ver todos' },
          { to: '/contas', icon: '🏦', label: 'Contas', desc: 'Gerenciar' },
          { to: '/categorias', icon: '🏷️', label: 'Categorias', desc: 'Gerenciar' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              background: 'white',
              borderRadius: '14px',
              padding: '1.25rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              textDecoration: 'none',
              color: '#2d3748',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              border: '2px solid transparent',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)';
            }}
          >
            <span style={{ fontSize: '2rem' }}>{item.icon}</span>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>{item.desc}</div>
            </div>
          </Link>
        ))}
      </section>

      {/* Últimos Lançamentos */}
      <section style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#2d3748',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>📋</span>
            <span>Últimos Lançamentos</span>
          </h2>
          {lancamentos.length > 5 && (
            <Link
              to="/lancamentos"
              style={{ color: '#667eea', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none' }}
            >
              Ver todos →
            </Link>
          )}
        </div>

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
            {lancamentos.slice(0, 10).map((l) => (
              <div key={l.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 0',
                borderBottom: '1px solid #f1f5f9',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: l.tipo === 'entrada'
                      ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                      : l.tipo === 'reserva'
                        ? 'linear-gradient(135deg, #ecc94b 0%, #d69e2e 100%)'
                        : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    flexShrink: 0
                  }}>
                    {l.tipo === 'entrada' ? '↗️' : l.tipo === 'reserva' ? '🏦' : '↘️'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: '600',
                      color: '#2d3748',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {l.descricao ?? "—"}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                      {String(l.data_ocorrencia || "").slice(0, 10) || "—"}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  color: l.tipo === 'entrada' ? '#11998e' : l.tipo === 'reserva' ? '#d69e2e' : '#ff6b6b',
                  whiteSpace: 'nowrap'
                }}>
                  {l.tipo === 'entrada' ? '+' : l.tipo === 'reserva' ? '⇥' : '-'} {formatBRLFromCentavos(l.valor_centavos)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
