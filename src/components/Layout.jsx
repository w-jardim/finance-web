import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(to bottom, #f7fafc 0%, #edf2f7 100%)'
    }}>
      <style>{`
        @media (max-width: 640px) {
          .mobile-hide { display: none !important; }
        }
      `}</style>
      
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1rem',
        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '0.5rem 0.75rem',
              backdropFilter: 'blur(10px)'
            }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
                fontWeight: '800',
                letterSpacing: '0.05em'
              }}>
                💎 VIRAZUL
              </h1>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="mobile-hide" style={{ 
              fontSize: '0.85rem',
              opacity: 0.95,
              background: 'rgba(255,255,255,0.15)',
              padding: '0.375rem 0.75rem',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)'
            }}>
              {user?.email}
            </span>
            <button
              onClick={logout}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255,255,255,0.25)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.35)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              }}
            >
              🚪 Sair
            </button>
          </div>
        </div>
      </header>
      
      <main style={{ 
        flex: 1,
        width: '100%',
        padding: '1rem 0'
      }}>
        <Outlet />
      </main>
      
      <footer style={{
        background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
        color: 'white',
        padding: '1.5rem 1rem',
        textAlign: 'center',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            fontSize: '1.5rem',
            marginBottom: '0.5rem',
            opacity: 0.9
          }}>
            💎
          </div>
          <p style={{ 
            margin: 0, 
            fontSize: '0.875rem',
            opacity: 0.8,
            fontWeight: '500'
          }}>
            © {new Date().getFullYear()} VIRAZUL - Sistema de Gestão Financeira
          </p>
          <p style={{ 
            margin: '0.25rem 0 0 0', 
            fontSize: '0.75rem',
            opacity: 0.6
          }}>
            Desenvolvido com ❤️ para suas finanças
          </p>
        </div>
      </footer>
    </div>
  );
}
