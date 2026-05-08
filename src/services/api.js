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
export const oauthGoogle   = (access_token) => api.post('/auth/google',   { access_token });
export const oauthFacebook = (code)          => api.post('/auth/facebook', { code });

// ── Categorías ──
export const getCategorias         = ()       => api.get('/categorias');
export const getCategoriaPorCodigo = (codigo) => api.get(`/categorias/${codigo}`);

// ── Reportes ──
export const getStats       = ()           => api.get('/reportes/stats');
// FE-20: stats analíticas
export const getStatsCategoria = ()                  => api.get('/reportes/stats/categoria');
export const getStatsTimeline  = (params)            => api.get('/reportes/stats/timeline', { params });
export const getHeatmapPoints  = ()                  => api.get('/reportes/stats/heatmap');
export const createReporte  = (data) => api.post('/reportes', data);
export const getReportes    = (params)     => api.get('/reportes', { params });
export const getReporteById = (id, skipView = false) =>
  api.get(`/reportes/${id}`, skipView ? { params: { skip_view: 'true' } } : {});
// FE-24 (BE-09): clasificación de imagen con IA antes de crear el reporte
export const analizarImagenIA = (file) => {
  const formData = new FormData();
  formData.append('imagen', file);
  return api.post('/reportes/analizar-imagen', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
};
export const updateReporte  = (id, data)   => api.patch(`/reportes/${id}`, data);
export const deleteReporte  = (id)         => api.delete(`/reportes/${id}`);
export const exportReportes = (params)     => api.get('/reportes/export', { params });

// ── Perfil / Auth ──
export const getPerfil            = ()                                               => api.get('/auth/perfil');
export const updatePerfil         = (data)                                            => api.patch('/auth/perfil', data);
export const updateAvatar         = (formData)                                        => api.patch('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const changePassword       = (currentPassword, newPassword, confirmPassword)   => api.patch('/auth/cambiar-contrasena', { currentPassword, newPassword, confirmPassword });
export const updateNotifications  = (preferences)                                     => api.patch('/auth/notificaciones', preferences);

export const getMisReportes     = (params)                                            => api.get('/reportes/mis-reportes', { params });
export const forgotPassword     = (email)                                              => api.post('/auth/forgot-password', { email });
export const resetPasswordToken = (token, newPassword, confirmPassword)                => api.post('/auth/reset-password', { token, newPassword, confirmPassword });
export const enviarVerificacionOtp = ()                                                => api.post('/auth/enviar-verificacion');
export const verificarEmailOtp     = (codigo)                                          => api.post('/auth/verificar-email', { codigo });

// ── Admin: gestión de usuarios (solo rol admin) ──
export const getAdminStats        = ()                  => api.get('/admin/usuarios/stats');
export const getAdminUsuarios     = (params)            => api.get('/admin/usuarios', { params });
export const getAdminUsuario      = (id)                => api.get(`/admin/usuarios/${id}`);
export const cambiarRolUsuario    = (id, rol)           => api.patch(`/admin/usuarios/${id}/rol`, { rol });
export const cambiarEstadoUsuario = (id, activo)        => api.patch(`/admin/usuarios/${id}/estado`, { activo });
export const eliminarUsuarioAdmin = (id)                => api.delete(`/admin/usuarios/${id}`);
