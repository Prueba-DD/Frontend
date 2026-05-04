import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import NewReport from './pages/NewReport';
import ReportDetail from './pages/ReportDetail';
import Trending from './pages/Trending';
import NotFound from './pages/NotFound';
import FormularioReporte from './components/FormularioReporte';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Moderacion from './pages/Moderacion';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerificarEmail from './pages/VerificarEmail';
import AdminPanel from './pages/AdminPanel';
import AdminUsuarios from './pages/AdminUsuarios';
import PoliticaPrivacidad from './pages/PoliticaPrivacidad';
import TerminosCondiciones from './pages/TerminosCondiciones';
import FacebookCallback from './pages/FacebookCallback';

function HomeRoute() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Home />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Rutas públicas con Layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomeRoute />} />
              <Route path="about" element={<Navigate to="/#nosotros" replace />} />
              <Route path="reports"      element={<Reports />} />
              <Route path="reports/:id"  element={<ReportDetail />} />
              <Route path="trending"     element={<Trending />} />
              <Route path="privacidad"   element={<PoliticaPrivacidad />} />
              <Route path="terminos"     element={<TerminosCondiciones />} />
            </Route>

            {/* Rutas de autenticación (sin Layout, pantalla completa) */}
            <Route path="/login"            element={<Auth />} />
            <Route path="/register"         element={<Auth />} />
            <Route path="/forgot-password"  element={<ForgotPassword />} />
            <Route path="/reset-password"   element={<ResetPassword />} />
            <Route path="/auth/callback/facebook"  element={<FacebookCallback />} />

            {/* ── Rutas protegidas: cualquier usuario autenticado ── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/verificar-email" element={<VerificarEmail />} />
              <Route path="/" element={<Layout />}>
                <Route path="dashboard"    element={<Dashboard />} />
                <Route path="reports/new"  element={<NewReport />} />
                <Route path="nuevo-reporte" element={<FormularioReporte />} />
                <Route path="profile"      element={<Profile />} />
                <Route path="settings"     element={<Settings />} />
              </Route>
            </Route>

            {/* ── Rutas protegidas: moderador y admin ── */}
            <Route element={<ProtectedRoute roles={['moderador', 'admin']} />}>
              <Route path="/" element={<Layout />}>
                <Route path="moderacion" element={<Moderacion />} />
              </Route>
            </Route>

            {/* ── Rutas protegidas: solo admin ── */}
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/" element={<Layout />}>
                <Route path="admin"          element={<AdminPanel />} />
                <Route path="admin/usuarios" element={<AdminUsuarios />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ToastContainer />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
