import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { UserCircle, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/reports', label: 'Reportes' },
];

const rolLabel = { ciudadano: 'Ciudadano', moderador: 'Moderador', admin: 'Admin' };
const rolColor = { ciudadano: 'text-green-400', moderador: 'text-blue-400', admin: 'text-yellow-400' };

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-150 ${
      isActive ? 'text-green-400' : 'text-gray-300 hover:text-green-400'
    }`;

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0">
          <img src="/chrome-192x192.png" alt="GreenAlert" className="h-9 w-9 object-contain" />
          <span className="ml-2 font-bold text-white tracking-tight hidden sm:inline">
            Green<span className="text-green-400">Alert</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop: acciones */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/reports/new" className="btn-primary text-sm">
                + Nuevo Reporte
              </Link>

              {/* Avatar / menú usuario */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border border-gray-700 bg-gray-900 hover:border-gray-600 transition"
                >
                  <span className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 text-xs font-bold">
                    {user.nombre?.charAt(0).toUpperCase()}
                  </span>
                  <div className="text-left leading-tight hidden lg:block">
                    <p className="text-xs font-medium text-gray-200 max-w-[110px] truncate">{`${user.nombre} ${user.apellido || ''}`.trim()}</p>
                    <p className={`text-[10px] ${rolColor[user.rol] ?? 'text-gray-400'}`}>{rolLabel[user.rol] ?? user.rol}</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-xl py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-800">
                      <p className="text-sm font-medium text-gray-100 truncate">{`${user.nombre} ${user.apellido || ''}`.trim()}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                      <UserCircle size={15} className="text-gray-500" /> Mi Perfil
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                      <SettingsIcon size={15} className="text-gray-500" /> Configuración
                    </Link>
                    <div className="border-t border-gray-800 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm">
                Iniciar sesión
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-800 bg-gray-950 px-4 py-4 flex flex-col gap-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}

          {user ? (
            <>
              {/* Info usuario en mobile */}
              <div className="flex items-center gap-3 px-3 py-3 bg-gray-900 rounded-lg border border-gray-800">
                <span className="w-9 h-9 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 font-bold shrink-0">
                  {user.nombre?.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{user.nombre}</p>
                  <p className={`text-xs ${rolColor[user.rol] ?? 'text-gray-400'}`}>{rolLabel[user.rol] ?? user.rol}</p>
                </div>
              </div>
              <Link to="/reports/new" className="btn-primary text-sm text-center" onClick={() => setOpen(false)}>
                + Nuevo Reporte
              </Link>
              <Link to="/profile" className="text-sm text-gray-300 hover:text-white transition-colors" onClick={() => setOpen(false)}>
                Mi Perfil
              </Link>
              <Link to="/settings" className="text-sm text-gray-300 hover:text-white transition-colors" onClick={() => setOpen(false)}>
                Configuración
              </Link>
              <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 text-left transition-colors">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm text-center" onClick={() => setOpen(false)}>
                Iniciar sesión
              </Link>
              <Link to="/register" className="btn-primary text-sm text-center" onClick={() => setOpen(false)}>
                Registrarse
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
