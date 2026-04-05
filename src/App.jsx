import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import NewReport from './pages/NewReport';
import ReportDetail from './pages/ReportDetail';
import NotFound from './pages/NotFound';
import FormularioReporte from './components/FormularioReporte';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Rutas públicas con Layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
            </Route>

            {/* Rutas de autenticación (sin Layout, pantalla completa) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Rutas protegidas con Layout */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route path="dashboard"      element={<Dashboard />} />
                <Route path="reports"         element={<Reports />} />
                <Route path="reports/new"     element={<NewReport />} />
                <Route path="reports/:id"     element={<ReportDetail />} />
                <Route path="nuevo-reporte"   element={<FormularioReporte />} />
                <Route path="profile"          element={<Profile />} />
                <Route path="settings"         element={<Settings />} />
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
