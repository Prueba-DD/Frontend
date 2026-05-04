/**
 * CONSTANTES DE CATEGORÍAS AMBIENTALES — Frontend
 * Espeja backend/docs/CONSTANTES_VALIDACION.js para uso en componentes React.
 */

// ── Enumeraciones ─────────────────────────────────────────────────────────────

export const TIPOS_CONTAMINACION = {
  AGUA:                         'agua',
  AIRE:                         'aire',
  SUELO:                        'suelo',
  RESIDUOS:                     'residuos',
  DEFORESTACION:                'deforestacion',
  INCENDIOS_FORESTALES:         'incendios_forestales',
  AVALANCHAS_FLUVIOTORRENCIALES:'avalanchas_fluviotorrenciales',
  OTRO:                         'otro',
};

export const NIVELES_SEVERIDAD = {
  BAJO:    'bajo',
  MEDIO:   'medio',
  ALTO:    'alto',
  CRITICO: 'critico',
};

// ── Configuración por categoría ───────────────────────────────────────────────

export const CONFIGURACION_CATEGORIAS = {

  // ── Nuevas: Riesgo Ambiental ──────────────────────────────────────────────

  [TIPOS_CONTAMINACION.DEFORESTACION]: {
    grupo: 'riesgo',
    nombre: 'Deforestación',
    descripcion: 'Tala o pérdida de cobertura forestal',
    icono: 'trees',
    color: '#22C55E',
    severidadPorDefecto: NIVELES_SEVERIDAD.ALTO,
    severidadesPermitidas: ['bajo', 'medio', 'alto'],
    camposRequeridos: ['titulo', 'descripcion', 'direccion', 'municipio', 'latitud', 'longitud'],
    sugerencias: [
      'Indicar extensión aproximada del área afectada',
      'Describir el tipo de tala (selectiva, masiva, etc.)',
      'Mencionar si hay actividad de extracción activa',
      'Especificar tipo de vegetación perdida',
    ],
    ejemploTitulo: 'Tala masiva de árboles en sector...',
    ejemploDescripcion:
      'Se observa pérdida de cobertura forestal de aproximadamente X hectáreas. ' +
      'Se evidencia actividad de extracción de madera...',
  },

  [TIPOS_CONTAMINACION.INCENDIOS_FORESTALES]: {
    grupo: 'riesgo',
    nombre: 'Incendios Forestales',
    descripcion: 'Fuegos descontrolados en bosques o vegetación',
    icono: 'flame',
    color: '#DC2626',
    severidadPorDefecto: NIVELES_SEVERIDAD.CRITICO,
    severidadesPermitidas: ['alto', 'critico'],
    camposRequeridos: ['titulo', 'descripcion', 'direccion', 'municipio', 'latitud', 'longitud'],
    sugerencias: [
      'Indicar URGENCIA: activo, controlado o extinguido',
      'Describir dirección de propagación del fuego',
      'Mencionar riesgo a poblaciones o infraestructura',
      'Incluir si se observa humo visible desde lejos',
    ],
    ejemploTitulo: 'Incendio forestal activo en zona de amortiguación',
    ejemploDescripcion:
      'Columna de humo visible desde varios puntos. Fuego se propaga hacia el norte. ' +
      'Riesgo para viviendas a 500 metros...',
  },

  [TIPOS_CONTAMINACION.AVALANCHAS_FLUVIOTORRENCIALES]: {
    grupo: 'riesgo',
    nombre: 'Avalanchas Fluviotorrenciales',
    descripcion: 'Crecidas súbitas de ríos, quebradas o arroyos',
    icono: 'waves',
    color: '#0EA5E9',
    severidadPorDefecto: NIVELES_SEVERIDAD.CRITICO,
    severidadesPermitidas: ['alto', 'critico'],
    camposRequeridos: ['titulo', 'descripcion', 'direccion', 'municipio', 'latitud', 'longitud'],
    sugerencias: [
      'Indicar nivel de aumento del agua',
      'Describir velocidad de la corriente',
      'Mencionar si hay arrastre de escombros o árboles',
      'Indicar zonas en inundación o en riesgo',
    ],
    ejemploTitulo: 'Crecida súbita del río Mocoa',
    ejemploDescripcion:
      'Río con crecida de 3 metros en menos de 1 hora. Arrastra troncos y material pesado. ' +
      'Alerta roja en zonas ribereñas...',
  },

  // ── Categorías de contaminación ───────────────────────────────────────────

  [TIPOS_CONTAMINACION.AGUA]: {
    grupo: 'contaminacion',
    nombre: 'Contaminación de Agua',
    descripcion: 'Contaminación del recurso hídrico',
    icono: 'droplet',
    color: '#3B82F6',
    severidadPorDefecto: NIVELES_SEVERIDAD.ALTO,
    severidadesPermitidas: ['bajo', 'medio', 'alto', 'critico'],
    camposRequeridos: ['titulo', 'descripcion', 'direccion'],
    sugerencias: [],
    ejemploTitulo: 'Vertimiento de químicos en el río',
    ejemploDescripcion: '',
  },

  [TIPOS_CONTAMINACION.AIRE]: {
    grupo: 'contaminacion',
    nombre: 'Contaminación del Aire',
    descripcion: 'Presencia de contaminantes atmosféricos',
    icono: 'wind',
    color: '#6B7280',
    severidadPorDefecto: NIVELES_SEVERIDAD.MEDIO,
    severidadesPermitidas: ['bajo', 'medio', 'alto', 'critico'],
    camposRequeridos: ['titulo', 'descripcion', 'direccion'],
    sugerencias: [],
    ejemploTitulo: 'Emisiones de humo negro en zona industrial',
    ejemploDescripcion: '',
  },

  [TIPOS_CONTAMINACION.SUELO]: {
    grupo: 'contaminacion',
    nombre: 'Contaminación del Suelo',
    descripcion: 'Degradación o contaminación del suelo',
    icono: 'leaf',
    color: '#84CC16',
    severidadPorDefecto: NIVELES_SEVERIDAD.MEDIO,
    severidadesPermitidas: ['bajo', 'medio', 'alto', 'critico'],
    camposRequeridos: ['titulo', 'descripcion', 'direccion'],
    sugerencias: [],
    ejemploTitulo: 'Derrame de aceite en terreno baldío',
    ejemploDescripcion: '',
  },

  [TIPOS_CONTAMINACION.RESIDUOS]: {
    grupo: 'contaminacion',
    nombre: 'Residuos y Desechos',
    descripcion: 'Acumulación o disposición incorrecta de basura',
    icono: 'trash2',
    color: '#EF4444',
    severidadPorDefecto: NIVELES_SEVERIDAD.MEDIO,
    severidadesPermitidas: ['bajo', 'medio', 'alto', 'critico'],
    camposRequeridos: ['titulo', 'descripcion', 'direccion'],
    sugerencias: [],
    ejemploTitulo: 'Basura acumulada en lote sin autorización',
    ejemploDescripcion: '',
  },

  [TIPOS_CONTAMINACION.OTRO]: {
    grupo: 'otro',
    nombre: 'Otro',
    descripcion: 'Otros tipos de riesgo ambiental',
    icono: 'helpCircle',
    color: '#8B5CF6',
    severidadPorDefecto: NIVELES_SEVERIDAD.MEDIO,
    severidadesPermitidas: ['bajo', 'medio', 'alto', 'critico'],
    camposRequeridos: ['titulo', 'descripcion', 'direccion'],
    sugerencias: [],
    ejemploTitulo: '',
    ejemploDescripcion: '',
  },
};

// ── Validadores ───────────────────────────────────────────────────────────────

export const validadores = {
  estiposContaminacionValido: (valor) =>
    Object.values(TIPOS_CONTAMINACION).includes(valor),

  esNivelSeveridadValido: (valor) =>
    Object.values(NIVELES_SEVERIDAD).includes(valor),

  esSeveridadPermitidaParaCategoria: (categoria, severidad) => {
    const config = CONFIGURACION_CATEGORIAS[categoria];
    return config ? config.severidadesPermitidas.includes(severidad) : false;
  },

  sonCoordenadasValidas: (latitud, longitud) => {
    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);
    return !isNaN(lat) && !isNaN(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180;
  },

  estanCamposRequeridos: (categoria, datos) => {
    const config = CONFIGURACION_CATEGORIAS[categoria];
    if (!config) return false;
    return config.camposRequeridos.every((campo) => datos[campo]?.toString().trim());
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export const helpers = {
  obtenerConfig:   (tipo) => CONFIGURACION_CATEGORIAS[tipo],
  obtenerNombre:   (tipo) => CONFIGURACION_CATEGORIAS[tipo]?.nombre    ?? 'Desconocido',
  obtenerColor:    (tipo) => CONFIGURACION_CATEGORIAS[tipo]?.color     ?? '#808080',
  obtenerIcono:    (tipo) => CONFIGURACION_CATEGORIAS[tipo]?.icono     ?? 'helpCircle',
  obtenerSugerencias: (tipo) => CONFIGURACION_CATEGORIAS[tipo]?.sugerencias ?? [],

  obtenerSeveridadesPermitidas: (tipo) =>
    CONFIGURACION_CATEGORIAS[tipo]?.severidadesPermitidas ?? Object.values(NIVELES_SEVERIDAD),

  obtenerCategoriasRiesgo: () => [
    TIPOS_CONTAMINACION.DEFORESTACION,
    TIPOS_CONTAMINACION.INCENDIOS_FORESTALES,
    TIPOS_CONTAMINACION.AVALANCHAS_FLUVIOTORRENCIALES,
  ],

  obtenerGrupo: (tipo) => CONFIGURACION_CATEGORIAS[tipo]?.grupo ?? 'otro',

  obtenerPorGrupo: (grupo) =>
    Object.entries(CONFIGURACION_CATEGORIAS)
      .filter(([, cfg]) => cfg.grupo === grupo)
      .map(([tipo]) => tipo),
};
