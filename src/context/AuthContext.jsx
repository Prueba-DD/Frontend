import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getPerfil, oauthGoogle, oauthFacebook } from '../services/api';
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

  const refreshUser = async () => {
    const res = await getPerfil();
    const userData = res.data.data.user;
    localStorage.setItem('ga_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const _saveSession = (token, userData) => {
    localStorage.setItem('ga_token', token);
    localStorage.setItem('ga_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const loginWithGoogle = async (accessToken) => {
    const res = await oauthGoogle(accessToken);
    const { token, user: userData } = res.data.data;
    return _saveSession(token, userData);
  };

  const loginWithFacebook = async (code) => {
    const res = await oauthFacebook(code);
    const { token, user: userData } = res.data.data;
    return _saveSession(token, userData);
  };

  const logout = () => {
    localStorage.removeItem('ga_token');
    localStorage.removeItem('ga_user');
    setUser(null);
    showToast('Sesión cerrada', 'info', 3500, { position: 'top-center', subtitle: 'Hasta pronto' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, loginWithGoogle, loginWithFacebook }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
