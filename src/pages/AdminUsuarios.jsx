import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Shield, ShieldCheck, UserCircle,
  CheckCircle2, XCircle, Trash2, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, RefreshCw, Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAdminUsuarios, cambiarRolUsuario, cambiarEstadoUsuario, eliminarUsuarioAdmin } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

// ── Constantes ────────────────────────────────────────────────────────────────

const ROLES = ['ciudadano', 'moderador', 'admin'];

const rolBadge = {
  ciudadano: 'bg-green-500/15 text-green-400 border-green-500/30',
  moderador: 'bg-blue-500/15  text-blue-400  border-blue-500/30',
  admin:     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
};
const rolIcon = {
  ciudadano: UserCircle,
  moderador: ShieldCheck,
  admin:     Shield,
};
const rolLabel = { ciudadano: 'Ciudadano', moderador: 'Moderador', admin: 'Admin' };

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const PAGE_SIZE = 20;

// ── Modal de confirmación ─────────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = 'Confirmar', danger = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full shadow-2xl"
      >
        <div className="flex items-start gap-3 mb-5">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm">Cancelar</button>
          <button
            onClick={onConfirm}
            className={`text-sm font-semibold px-5 py-2.5 rounded-lg transition-all active:scale-95 ${
              danger
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-green-500 hover:bg-green-400 text-gray-950'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Fila de usuario ───────────────────────────────────────────────────────────

function UsuarioRow({ usuario, onCambiarRol, onToggleEstado, onEliminar, currentUserId, loadingId }) {
  const RolIcon = rolIcon[usuario.rol] ?? UserCircle;
  const isMe = usuario.id_usuario === currentUserId;
  const busy = loadingId === usuario.id_usuario;

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors"
    >
      {/* Usuario */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-400 text-xs font-bold shrink-0">
            {usuario.nombre?.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-100 truncate">
              {`${usuario.nombre} ${usuario.apellido ?? ''}`.trim()}
              {isMe && <span className="ml-1.5 text-xs text-yellow-400">(tú)</span>}
            </p>
            <p className="text-xs text-gray-500 truncate">{usuario.email}</p>
          </div>
        </div>
      </td>

      {/* Rol */}
      <td className="px-4 py-3">
        <select
          value={usuario.rol}
          disabled={isMe || busy}
          onChange={(e) => onCambiarRol(usuario, e.target.value)}
          className={`badge border cursor-pointer bg-transparent text-xs font-medium rounded-full px-2.5 py-1 ${rolBadge[usuario.rol]} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {ROLES.map((r) => (
            <option key={r} value={r} className="bg-gray-900 text-gray-200">{rolLabel[r]}</option>
          ))}
        </select>
      </td>

      {/* Estado */}
      <td className="px-4 py-3">
        <span className={`badge border ${usuario.activo ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
          {usuario.activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>

      {/* Registro */}
      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
        {formatDate(usuario.created_at)}
      </td>

      {/* Acciones */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {busy ? (
            <Loader2 size={15} className="text-gray-500 animate-spin" />
          ) : (
            <>
              {/* Activar / Desactivar */}
              {!isMe && (
                <button
                  onClick={() => onToggleEstado(usuario)}
                  title={usuario.activo ? 'Desactivar' : 'Activar'}
                  className={`p-1.5 rounded-lg transition-colors ${
                    usuario.activo
                      ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                      : 'text-gray-500 hover:text-green-400 hover:bg-green-500/10'
                  }`}
                >
                  {usuario.activo ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                </button>
              )}
              {/* Eliminar */}
              {!isMe && (
                <button
                  onClick={() => onEliminar(usuario)}
                  title="Eliminar usuario"
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AdminUsuarios() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [usuarios,   setUsuarios]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [loadingId,  setLoadingId]  = useState(null);
  const [page,       setPage]       = useState(0);
  const [search,     setSearch]     = useState('');
  const [filtroRol,  setFiltroRol]  = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');

  // Modal
  const [modal, setModal] = useState(null); // { type: 'rol'|'estado'|'eliminar', usuario, nuevoRol? }

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        limit:  PAGE_SIZE,
        offset: page * PAGE_SIZE,
        ...(search     && { search }),
        ...(filtroRol  && { rol: filtroRol }),
        ...(filtroActivo !== '' && { activo: filtroActivo }),
      };
      const { data } = await getAdminUsuarios(params);
      setUsuarios(data.data.usuarios ?? []);
      setTotal(data.data.total ?? 0);
    } catch {
      showToast('No se pudieron cargar los usuarios.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, filtroRol, filtroActivo]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  // Resetear página al cambiar filtros
  useEffect(() => { setPage(0); }, [search, filtroRol, filtroActivo]);

  // ── Acciones ──

  const handleCambiarRol = (usuario, nuevoRol) => {
    if (usuario.rol === nuevoRol) return;
    setModal({ type: 'rol', usuario, nuevoRol });
  };

  const handleToggleEstado = (usuario) => {
    setModal({ type: 'estado', usuario });
  };

  const handleEliminar = (usuario) => {
    setModal({ type: 'eliminar', usuario });
  };

  const executeAction = async () => {
    if (!modal) return;
    const { type, usuario, nuevoRol } = modal;
    setModal(null);
    setLoadingId(usuario.id_usuario);

    try {
      if (type === 'rol') {
        await cambiarRolUsuario(usuario.id_usuario, nuevoRol);
        showToast(`Rol cambiado a ${rolLabel[nuevoRol]}.`, 'success');
        fetchUsuarios();
      } else if (type === 'estado') {
        await cambiarEstadoUsuario(usuario.id_usuario, !usuario.activo);
        showToast(`Usuario ${!usuario.activo ? 'activado' : 'desactivado'}.`, 'success');
        fetchUsuarios();
      } else if (type === 'eliminar') {
        await eliminarUsuarioAdmin(usuario.id_usuario);
        showToast('Usuario eliminado.', 'success');
        setUsuarios((prev) => prev.filter((u) => u.id_usuario !== usuario.id_usuario));
        setTotal((t) => t - 1);
      }
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Error al realizar la acción.', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const modalMessage = () => {
    if (!modal) return '';
    const nombre = `${modal.usuario.nombre} ${modal.usuario.apellido ?? ''}`.trim();
    if (modal.type === 'rol')     return `¿Cambiar el rol de ${nombre} a ${rolLabel[modal.nuevoRol]}?`;
    if (modal.type === 'estado')  return `¿${modal.usuario.activo ? 'Desactivar' : 'Activar'} la cuenta de ${nombre}?`;
    if (modal.type === 'eliminar') return `¿Eliminar permanentemente la cuenta de ${nombre}? Esta acción no se puede deshacer.`;
    return '';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100">Gestión de Usuarios</h1>
            <p className="text-sm text-gray-500">{total} usuario(s) en total</p>
          </div>
        </div>
        <button onClick={fetchUsuarios} disabled={loading} className="flex items-center gap-2 btn-secondary text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>
        {/* Filtro rol */}
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-green-500"
        >
          <option value="">Todos los roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{rolLabel[r]}</option>)}
        </select>
        {/* Filtro activo */}
        <select
          value={filtroActivo}
          onChange={(e) => setFiltroActivo(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-green-500"
        >
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 text-yellow-500 animate-spin" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Users className="w-9 h-9 text-gray-700" />
            <p className="text-sm text-gray-500">No se encontraron usuarios.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Registro</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {usuarios.map((u) => (
                    <UsuarioRow
                      key={u.id_usuario}
                      usuario={u}
                      onCambiarRol={handleCambiarRol}
                      onToggleEstado={handleToggleEstado}
                      onEliminar={handleEliminar}
                      currentUserId={currentUser?.id_usuario}
                      loadingId={loadingId}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Página {page + 1} de {totalPages} ({total} usuarios)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 btn-secondary text-xs disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 btn-secondary text-xs disabled:opacity-40"
            >
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      <AnimatePresence>
        {modal && (
          <ConfirmModal
            message={modalMessage()}
            confirmLabel={modal.type === 'eliminar' ? 'Eliminar' : 'Confirmar'}
            danger={modal.type === 'eliminar' || (modal.type === 'estado' && modal.usuario.activo)}
            onConfirm={executeAction}
            onCancel={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
