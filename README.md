# GreenAlert - Frontend

Aplicación web para la plataforma de monitoreo ambiental ciudadano GreenAlert. Construida con React, Vite y TailwindCSS.

---

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Componentes Principales](#componentes-principales)
- [Páginas Disponibles](#páginas-disponibles)
- [Autenticación](#autenticación)
- [Build & Deploy](#build--deploy)

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| **Framework** | React 18+ |
| **Build Tool** | Vite |
| **Styling** | TailwindCSS 3+ |
| **Routing** | React Router v6 |
| **HTTP Client** | Axios |
| **Estado Global** | React Context API |
| **Iconos** | Lucide React |
| **PostCSS** | Para procesamiento de CSS |
| **Desarrollo** | ESM modules |

---

## 📦 Requisitos Previos

- **Node.js** 18.0.0 o superior ([descargar](https://nodejs.org/))
- **npm** 9.0.0 o superior
- **Backend** corriendo en `http://localhost:3000`
- **Git** para versionamiento

### Verificar versiones:

```bash
node --version    # v18.0.0 o superior
npm --version     # 9.0.0 o superior
```

---

## 🚀 Instalación

1. **Clonar el repositorio** (o descargar código):

```bash
git clone https://github.com/tu-usuario/greenalert-frontend.git
cd greenalert-frontend
```

2. **Instalar dependencias**:

```bash
npm install
```

3. **Configurar conexión con backend** (ver sección [Configuración](#configuración))

---

## ⚙️ Configuración

### URL del Backend

El archivo `src/services/api.js` configura la conexión con el backend vía Axios:

```javascript
const api = axios.create({
  baseURL: '/api',
  timeout: 8000,
});
```

### Proxying de Vite

El archivo `vite.config.js` redirige `/api/*` al backend:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    }
  }
}
```

**Ejemplo de funcionamiento:**
- Cliente solicita: `/api/auth/login`
- Vite redirige a: `http://localhost:3000/auth/login`

### Variables de Entorno

Si necesitas variables de entorno, crea un archivo `.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=GreenAlert
```

Y accede desde el código con: `import.meta.env.VITE_API_URL`

---

## ▶️ Ejecución

### Desarrollo (con hot-reload)

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Vista Previa

```bash
npm run preview
```

---

## 📝 Scripts Disponibles

```bash
npm run dev          # Inicia servidor de desarrollo (Vite)
npm run build        # Genera build para producción
npm run preview      # Sirve la build localmente
npm run lint         # Verifica sintaxis (si está configurado)
```

---

## 📁 Estructura del Proyecto

```
frontend/
├── .env                          # Variables de entorno (NO commitear)
├── .env.example                  # Plantilla de variables
├── .gitignore                    # Archivos a ignorar en git
├── node_modules/                 # Dependencias instaladas
├── package.json                  # Definición de proyecto
├── package-lock.json             # Lock de versiones
├── vite.config.js                # Configuración de Vite
├── tailwind.config.js            # Configuración de TailwindCSS
├── postcss.config.js             # Configuración de PostCSS
├── index.html                    # HTML principal
├── README.md                     # Este archivo
│
├── public/                       # Archivos estáticos
│   └── favicon.ico
│
├── src/
│   ├── main.jsx                  # Punto de entrada
│   ├── App.jsx                   # Definición de rutas
│   ├── index.css                 # Estilos globales
│   │
│   ├── assets/                   # Imágenes, logos, etc.
│   │
│   ├── components/               # Componentes reutilizables
│   │   ├── FormularioReporte.jsx # Formulario para crear reportes
│   │   ├── Layout.jsx            # Layout principal con navbar/footer
│   │   ├── Navbar.jsx            # Barra de navegación
│   │   ├── ProtectedRoute.jsx    # Wrapper para rutas protegidas
│   │   ├── LocationPicker.jsx    # Selector de ubicación en mapa
│   │   ├── ReportsMap.jsx        # Mapa de reportes
│   │   ├── FormSection.jsx       # Sección de formulario reutilizable
│   │   └── PasswordStrengthIndicator.jsx  # Indicador de contraseña
│   │
│   ├── constants/                # Enumeraciones y configuraciones
│   │   └── categorias.js         # Definición de categorías
│   │
│   ├── context/                  # Estado global (Context API)
│   │   └── AuthContext.jsx       # Estado de autenticación
│   │
│   ├── pages/                    # Páginas/vistas por ruta
│   │   ├── Home.jsx              # Página principal
│   │   ├── Login.jsx             # Login
│   │   ├── Register.jsx          # Registro
│   │   ├── Dashboard.jsx         # Dashboard del usuario
│   │   ├── Reports.jsx           # Listar reportes
│   │   ├── NewReport.jsx         # Crear nuevo reporte
│   │   ├── ReportDetail.jsx      # Detalle de reporte
│   │   ├── Profile.jsx           # Perfil de usuario
│   │   ├── Settings.jsx          # Configuración de usuario
│   │   └── NotFound.jsx          # Página 404
│   │
│   └── services/                 # Servicios HTTP
│       └── api.js                # Configuración de Axios
│
└── dist/                         # Build de producción (gitignored)
```

---

## 🧩 Componentes Principales

### Layout

Componente principal que envuelve todas las páginas con Navbar y estructura común.

### ProtectedRoute

Wrapper que valida si el usuario está autenticado antes de mostrar la página:

```jsx
<Route element={<ProtectedRoute />}>
  <Route path="dashboard" element={<Dashboard />} />
</Route>
```

### FormularioReporte

Formulario completo para crear/editar reportes con validaciones.

### LocationPicker

Componente interactivo para seleccionar ubicación en mapa.

### ReportsMap

Mapa que muestra todos los reportes con markers.

---

## 📄 Páginas Disponibles

| Ruta | Componente | Protegida | Descripción |
|------|-----------|-----------|------------|
| `/` | Home | ❌ | Página principal |
| `/login` | Login | ❌ | Iniciar sesión |
| `/register` | Register | ❌ | Crear cuenta |
| `/dashboard` | Dashboard | ✅ | Panel del usuario |
| `/reports` | Reports | ✅ | Listar reportes |
| `/reports/new` | NewReport | ✅ | Crear reporte |
| `/reports/:id` | ReportDetail | ✅ | Ver detalle de reporte |
| `/profile` | Profile | ✅ | Perfil de usuario |
| `/settings` | Settings | ✅ | Configuración |
| `*` | NotFound | ❌ | Página no encontrada |

---

## 🔐 Autenticación

### Flow de Autenticación

1. Usuario se registra o inicia sesión
2. Backend retorna JWT token válido por 7 días
3. Token se guarda en `localStorage` bajo la clave `ga_token`
4. Axios interceptor añade token a cada petición: `Authorization: Bearer <token>`
5. Si token expira (401), se limpia la sesión

### AuthContext

Estado global que gestiona:
- Usuario autenticado
- Token JWT
- Login/Logout
- Protección de rutas

---

## 🎨 Estilos

### TailwindCSS

Se utiliza TailwindCSS v3 para estilos. El tema incluye:
- Colores personalizados
- Componentes prefabricados
- Responsive design (mobile-first)

### Estructura de CSS

- `index.css` - Estilos globales y utilidades custom
- Componentes tienen estilos inline con clases de Tailwind
- Archivo `tailwind.config.js` personaliza el tema

---

## 🌐 Consumo de API

### Ejemplo de llamada HTTP

```javascript
import { loginUser } from '@/services/api';

const handleLogin = async (email, password) => {
  try {
    const { data } = await loginUser(email, password);
    localStorage.setItem('ga_token', data.token);
  } catch (error) {
    console.error('Error:', error.response?.data?.message);
  }
};
```

### Interceptores Axios

Los interceptores en `api.js` automáticamente:
- ✅ Añaden token JWT a cada request
- ✅ Limpian sesión si token expira (401)
- ✅ Manejan errores de red

---

## 🏗️ Build & Deploy

### Build para Producción

```bash
npm run build
```

Genera carpeta `dist/` optimizada con:
- Bundling y minificación
- Tree-shaking de código no usado
- Optimización de assets

### Servir Localmente

```bash
npm run preview
```

### Deploy a Hosting

#### Vercel (Recomendado para React/Vite)

1. Push a GitHub
2. Conectar repositorio a Vercel
3. Configurar variable `VITE_API_URL`
4. Deploy automático

#### Netlify

Similar a Vercel, soporta Vite nativamente.

#### Servidor tradicional (Apache, Nginx)

1. Subir contenido de `dist/` a servidor
2. Configurar `index.html` como fallback (SPA)
3. Configurar proxy para `/api` al backend

**Ejemplo Nginx:**

```nginx
server {
  listen 80;
  server_name example.com;
  
  root /var/www/greenalert/dist;
  
  location / {
    try_files $uri /index.html;
  }
  
  location /api {
    proxy_pass http://backend:3000;
  }
}
```

---

## 🧪 Testing

Actualmente no hay suite de tests. Para futuro se sugiere:
- **Vitest** para unit tests
- **React Testing Library** para tests de componentes
- **Cypress** o **Playwright** para tests end-to-end

---

## 🐛 Troubleshooting

### Error: `Cannot find module`

```bash
npm install
```

### Error: `CORS policy`

Verifica que el backend permita CORS o que Vite esté configurado correctamente.

### Puerto 5173 ya en uso

Vite automáticamente usa el siguiente puerto disponible. O especifica:

```bash
npm run dev -- --port 5174
```

### Cambios no se reflejan

Limpia el cache del navegador (Ctrl+Shift+Delete) o abre en incógnito.

---

## 📚 Documentación Adicional

- [Endpoints del Backend](../backend/docs/ENDPOINTS_PERFIL.md)
- [Categorías de Riesgo](./src/constants/categorias.js)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)

---

## 📧 Contacto y Soporte

Para reportar bugs o sugerencias, abre un **Issue** en GitHub.

---

## 📄 Licencia

Este proyecto es parte de un trabajo académico. Ver licencia en el repositorio principal.

---

## 🔄 Cambios Recientes

### v2.0

- ✅ Agregar páginas de Perfil y Configuración
- ✅ Implementar cambio de contraseña
- ✅ Mejorar validaciones de formularios

### v1.0

- ✅ Setup inicial del proyecto con Vite
- ✅ Autenticación JWT
- ✅ Interfaz de reportes
- ✅ Mapa de reportes

---

**Última actualización**: March 28, 2026
- El token y usuario se guardan en `localStorage` (`ga_token` y `ga_user`).
- `ProtectedRoute` protege vistas privadas.
- Axios agrega `Authorization: Bearer <token>` automaticamente.

## Notificaciones toast

- Sistema centralizado en `ToastContext` (proveedor global en `App.jsx`).
- Uso: `const { showToast } = useToast()` → `showToast(mensaje, tipo, duracion)`.
- Tipos disponibles: `success`, `error`, `warning`, `info`.
- Duración por defecto: 3000 ms. Se puede personalizar por llamada.
- Animaciones con `motion` (spring physics): deslizamiento desde la derecha y barra de progreso.
- Componente visual: `ToastContainer` (se monta en `App.jsx`, esquina inferior derecha).

## Flujo basico de uso

1. Registrar o iniciar sesion.
2. Crear reportes desde la vista de nuevo reporte.
3. Consultar reportes y detalle en mapa/listado.
