import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 8000,
});

// Adjunta el token JWT en cada petición si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ga_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el token expira o es inválido, limpia la sesión
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ga_token');
      localStorage.removeItem('ga_user');
    }
    return Promise.reject(err);
  }
);

export const checkHealth = () => api.get('/health');

// ── Auth ──
export const loginUser    = (email, password)                                   => api.post('/auth/login',    { email, password });
export const registerUser = (nombre, apellido, email, password, telefono)       => api.post('/auth/register', { nombre, apellido, email, password, telefono });

// ── Categorías ──
export const getCategorias         = ()       => api.get('/categorias');
export const getCategoriaPorCodigo = (codigo) => api.get(`/categorias/${codigo}`);

// ── Reportes ──
export const getStats       = ()           => api.get('/reportes/stats');
export const createReporte  = (data) => api.post('/reportes', data);
export const getReportes    = (params)     => api.get('/reportes', { params });
export const getReporteById = (id, skipView = false) =>
  api.get(`/reportes/${id}`, skipView ? { params: { skip_view: 'true' } } : {});
export const updateReporte  = (id, data)   => api.patch(`/reportes/${id}`, data);
export const deleteReporte  = (id)         => api.delete(`/reportes/${id}`);

// ── Perfil / Auth ──
export const getPerfil            = ()                                               => api.get('/auth/perfil');
export const updatePerfil         = (data)                                            => api.patch('/auth/perfil', data);
export const changePassword       = (currentPassword, newPassword, confirmPassword)   => api.patch('/auth/cambiar-contrasena', { currentPassword, newPassword, confirmPassword });
export const updateNotifications  = (preferences)                                     => api.patch('/auth/notificaciones', preferences);

// ── Admin: gestión de usuarios (solo rol admin) ──
export const getAdminStats        = ()                  => api.get('/admin/usuarios/stats');
export const getAdminUsuarios     = (params)            => api.get('/admin/usuarios', { params });
export const getAdminUsuario      = (id)                => api.get(`/admin/usuarios/${id}`);
export const cambiarRolUsuario    = (id, rol)           => api.patch(`/admin/usuarios/${id}/rol`, { rol });
export const cambiarEstadoUsuario = (id, activo)        => api.patch(`/admin/usuarios/${id}/estado`, { activo });
export const eliminarUsuarioAdmin = (id)                => api.delete(`/admin/usuarios/${id}`);
