import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute — protege rutas por autenticación y opcionalmente por rol.
 *
 * Props:
 *  - roles?: string[]  Si se indica, solo los usuarios con ese rol pueden acceder.
 *                      Si no se indica, cualquier usuario autenticado puede acceder.
 *
 * Redirige:
 *  - No autenticado → /login
 *  - Autenticado pero sin rol permitido → /dashboard (acceso denegado silencioso)
 */
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          <p className="text-gray-400 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
