import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Lancamentos } from './pages/Lancamentos';
import { Contas } from './pages/Contas';
import { Categorias } from './pages/Categorias';
import { Reservas } from './pages/Reservas';
import { Layout } from './components/Layout';
import { NotFound } from './pages/NotFound';

// Root wrapper that provides AuthContext to all routes
function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/',
        element: <Layout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'lancamentos',
            element: <Lancamentos />,
          },
          {
            path: 'contas',
            element: <Contas />,
          },
          {
            path: 'categorias',
            element: <Categorias />,
          },
          {
            path: 'reservas',
            element: <Reservas />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
