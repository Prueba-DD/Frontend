import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getPerfil } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Valida el token contra el backend al montar
  useEffect(() => {
    const token = localStorage.getItem('ga_token');
    if (!token) { setLoading(false); return; }

    getPerfil()
      .then(({ data }) => {
        setUser(data.data.user);
        localStorage.setItem('ga_user', JSON.stringify(data.data.user));
      })
      .catch(() => {
        localStorage.removeItem('ga_token');
        localStorage.removeItem('ga_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    const { token, user: userData } = res.data.data;
    localStorage.setItem('ga_token', token);
    localStorage.setItem('ga_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (nombre, apellido, email, password, telefono) => {
    const res = await registerUser(nombre, apellido, email, password, telefono);
    const { token, user: userData } = res.data.data;
    localStorage.setItem('ga_token', token);
    localStorage.setItem('ga_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('ga_token');
    localStorage.removeItem('ga_user');
    setUser(null);
    showToast('Sesión cerrada', 'info', 3500, { position: 'top-center', subtitle: 'Hasta pronto' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
