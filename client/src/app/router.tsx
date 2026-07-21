import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { TopNav } from '@/components/layout/TopNav';
import { useAuthStore } from '@/store/authStore';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { IotHome } from '@/pages/iot/IotHome';
import { ServiceHome } from '@/pages/service/ServiceHome';

function AppLayout() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/iot', element: <IotHome /> },
          { path: '/service', element: <ServiceHome /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
