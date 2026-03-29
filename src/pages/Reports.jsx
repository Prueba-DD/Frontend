import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplets, Trees, Flame, Wind, Trash2, Leaf, Search, Lightbulb, AlertTriangle, Waves, ChevronLeft, ChevronRight, CalendarDays, User } from 'lucide-react';
import { getReportes } from '../services/api';
import { helpers } from '../constants/categorias';

const statusClass = {
  pendiente:   'bg-gray-500/15 text-gray-400 border border-gray-500/30',
  en_revision: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  verificado:  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  en_proceso:  'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  resuelto:    'bg-green-500/15 text-green-400 border border-green-500/30',
  rechazado:   'bg-red-500/15 text-red-400 border border-red-500/30',
};

const statusLabel = {
  pendiente: 'Pendiente', en_revision: 'En revisión', verificado: 'Verificado',
  en_proceso: 'En proceso', resuelto: 'Resuelto', rechazado: 'Rechazado',
};

const severityClass = {
  bajo:    'bg-green-500/15 text-green-400 border border-green-500/30',
  medio:   'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  alto:    'bg-red-500/15 text-red-400 border border-red-500/30',
  critico: 'bg-red-600/25 text-rose-200 border border-red-500/60',
};

const severityLabel = { bajo: 'Baja', medio: 'Media', alto: 'Alta', critico: 'Crítico' };

const typeIcons = {
  agua:                         Droplets,
  aire:                         Wind,
  suelo:                        Trees,
  ruido:                        Flame,
  residuos:                     Trash2,
  luminica:                     Lightbulb,
  deforestacion:                Trees,
  incendios_forestales:         Flame,
  deslizamientos:               AlertTriangle,
  avalanchas_fluviotorrenciales: Waves,
  otro:                         Leaf,
};

const TYPES_RIESGO       = ['deforestacion', 'incendios_forestales', 'deslizamientos', 'avalanchas_fluviotorrenciales'];
const TYPES_CONTAMINACION = ['agua', 'aire', 'suelo', 'ruido', 'residuos', 'luminica'];
const ALL_TYPES           = [...TYPES_RIESGO, ...TYPES_CONTAMINACION, 'otro'];

const STATUSES = ['Todos', 'pendiente', 'en_revision', 'verificado', 'en_proceso', 'resuelto', 'rechazado'];

const GRUPOS = [
  { value: 'Todos',         label: 'Todas las categorías' },
  { value: 'riesgo',        label: '⚠ Riesgo Natural' },
  { value: 'contaminacion', label: '☁ Contaminación' },
];

const PAGE_SIZE = 20;

function getTypeLabel(tipo) {
  return helpers.obtenerConfig(tipo)?.nombre ?? tipo;
}

function getCategoryColor(tipo) {
  return helpers.obtenerConfig(tipo)?.color ?? '#6B7280';
}

function typesForGroup(group) {
  if (group === 'riesgo')        return TYPES_RIESGO;
  if (group === 'contaminacion') return TYPES_CONTAMINACION;
  return ALL_TYPES;
}

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports]          = useState([]);
  const [loading, setLoading]          = useState(true);
  const [error, setError]              = useState('');
  const [search,       setSearch]      = useState('');
  const [groupFilter,  setGroupFilter] = useState('Todos');
  const [typeFilter,   setTypeFilter]  = useState('Todos');
  const [statusFilter, setStatusFilter]= useState('Todos');
  const [page,         setPage]        = useState(1);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (typeFilter   !== 'Todos') params.tipo_contaminacion = typeFilter;
        if (statusFilter !== 'Todos') params.estado = statusFilter;
        const { data } = await getReportes(params);
        setReports(data.data.reportes ?? []);
      } catch {
        setError('No se pudo cargar la lista de reportes.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [typeFilter, statusFilter]);

  // When group changes, reset type filter if it no longer belongs to the group
  useEffect(() => {
    if (groupFilter !== 'Todos' && typeFilter !== 'Todos') {
      if (!typesForGroup(groupFilter).includes(typeFilter)) setTypeFilter('Todos');
    }
  }, [groupFilter]);

  // Reset page when filters/search change
  useEffect(() => { setPage(1); }, [search, groupFilter, typeFilter, statusFilter]);

  const filtered = reports.filter((r) => {
    if (groupFilter !== 'Todos' && helpers.obtenerGrupo(r.tipo_contaminacion) !== groupFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.titulo?.toLowerCase().includes(q) &&
        !r.direccion?.toLowerCase().includes(q) &&
        !r.municipio?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const noData    = !loading && reports.length === 0 && !error;
  const noResults = !loading && reports.length > 0 && filtered.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Reportes de Riesgo y Contaminación</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {loading
              ? 'Cargando...'
              : noData
                ? 'Sin reportes aún'
                : `${filtered.length} reporte${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link to="/reports/new" className="btn-primary text-sm self-start sm:self-auto">
          + Nuevo Reporte
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título, dirección o municipio..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading || noData}
          />
        </div>
        {/* Group */}
        <select
          className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-green-500 transition-colors disabled:opacity-40"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          disabled={loading}
        >
          {GRUPOS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
        {/* Type — scoped to selected group */}
        <select
          className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-green-500 transition-colors disabled:opacity-40"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          disabled={loading}
        >
          <option value="Todos">Todos los tipos</option>
          {typesForGroup(groupFilter).map((t) => (
            <option key={t} value={t}>{getTypeLabel(t)}</option>
          ))}
        </select>
        {/* Status */}
        <select
          className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-green-500 transition-colors disabled:opacity-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          disabled={loading}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'Todos' ? 'Todos los estados' : statusLabel[s]}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card text-center py-16 text-gray-500">
          <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Cargando reportes...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card text-center py-12 text-red-400">
          <p>{error}</p>
        </div>
      )}

      {/* Empty state */}
      {noData && (
        <div className="card text-center py-20 text-gray-500">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-green-500" />
          </div>
          <p className="font-semibold text-gray-300 text-lg">Aún no hay reportes</p>
          <p className="text-sm mt-2 text-gray-500">Sé el primero en reportar un problema ambiental en tu zona.</p>
          <Link to="/reports/new" className="btn-primary inline-block mt-6">Crear primer reporte</Link>
        </div>
      )}

      {/* Sin resultados tras filtrar */}
      {noResults && (
        <div className="card text-center py-16 text-gray-500">
          <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 text-gray-500" />
          </div>
          <p className="font-medium">No se encontraron reportes con esos filtros.</p>
          <button
            onClick={() => { setSearch(''); setGroupFilter('Todos'); setTypeFilter('Todos'); setStatusFilter('Todos'); }}
            className="text-sm text-green-400 hover:underline mt-2"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Grid de reportes */}
      {!loading && !error && !noData && !noResults && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((r) => {
              const Icon  = typeIcons[r.tipo_contaminacion] ?? Leaf;
              const color = getCategoryColor(r.tipo_contaminacion);
              const lugar = [r.municipio, r.departamento].filter(Boolean).join(', ') || r.direccion || '—';
              const fecha = r.created_at
                ? new Date(r.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
                : null;
              return (
                <div
                  key={r.id_reporte}
                  onClick={() => navigate(`/reports/${r.id_reporte}`)}
                  className="card hover:border-green-700 transition-colors cursor-pointer group flex flex-col gap-3"
                >
                  {/* Tipo + Severidad */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-1.5" style={{ color }}>
                      <Icon className="w-4 h-4 shrink-0" />
                      {getTypeLabel(r.tipo_contaminacion)}
                    </span>
                    <span className={`badge ${severityClass[r.nivel_severidad]}`}>
                      {severityLabel[r.nivel_severidad] ?? r.nivel_severidad}
                    </span>
                  </div>

                  {/* Título */}
                  <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors leading-snug">
                    {r.titulo}
                  </h3>

                  {/* Descripción */}
                  {r.descripcion && (
                    <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{r.descripcion}</p>
                  )}

                  {/* Ubicación */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-auto pt-2 border-t border-gray-800">
                    <span>📍</span>
                    <span className="truncate">{lugar}</span>
                  </div>

                  {/* Estado + Fecha */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className={`badge ${statusClass[r.estado]}`}>{statusLabel[r.estado] ?? r.estado}</span>
                    {fecha && (
                      <span className="flex items-center gap-1 text-gray-600">
                        <CalendarDays size={11} />
                        {fecha}
                      </span>
                    )}
                  </div>

                  {/* Autor */}
                  {(r.autor_nombre || r.autor_apellido) && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 pt-1">
                      <User size={11} className="shrink-0" />
                      <span className="truncate">{[r.autor_nombre, r.autor_apellido].filter(Boolean).join(' ')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 gap-4">
              <p className="text-xs text-gray-500">
                Página <span className="text-gray-300 font-medium">{page}</span> de <span className="text-gray-300 font-medium">{totalPages}</span>
                {' '}· mostrando {Math.min(PAGE_SIZE, filtered.length - (page - 1) * PAGE_SIZE)} de {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-gray-700 text-gray-300 hover:border-green-600 hover:text-green-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} /> Anterior
                </button>

                {/* Números de página */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                    .reduce((acc, n, idx, arr) => {
                      if (idx > 0 && arr[idx - 1] !== n - 1) acc.push('…');
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === '…' ? (
                        <span key={`ellipsis-${idx}`} className="px-1 text-gray-600 text-sm select-none">…</span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(item)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            page === item
                              ? 'bg-green-600 text-white'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-gray-700 text-gray-300 hover:border-green-600 hover:text-green-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
