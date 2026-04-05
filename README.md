# GreenAlert - Frontend

Cliente web de GreenAlert, construido con React + Vite.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- Backend corriendo en http://localhost:3000

## Instalacion y ejecucion

```bash
npm install
npm run dev
```

La aplicacion queda disponible en http://localhost:5173.

## Scripts

- `npm run dev`: inicia entorno de desarrollo
- `npm run build`: genera build de produccion
- `npm run preview`: sirve la build localmente

## Conexion con el backend

- El frontend consume rutas bajo `/api/*`.
- Vite redirige esas rutas al backend (`http://localhost:3000`) y elimina el prefijo `/api`.
- Ejemplo: `/api/auth/login` se envia a `http://localhost:3000/auth/login`.

Configurado en `vite.config.js`.

## Estructura principal

```
frontend/
  src/
    components/   # Componentes reutilizables
      FormSection.jsx               # Contenedor de sección con título e ícono
      FormularioReporte.jsx         # Formulario completo de nuevo reporte
      Layout.jsx                    # Shell con Navbar + <Outlet>
      LocationPicker.jsx            # Selector de ubicación en mapa
      Navbar.jsx                    # Barra de navegación con dropdown de usuario
      PasswordStrengthIndicator.jsx # Barra de fortaleza de contraseña (5 criterios)
      ProtectedRoute.jsx            # Redirige a /login si no hay sesión
      ReportsMap.jsx                # Mapa con marcadores de reportes
      ToastContainer.jsx            # Contenedor de notificaciones toast
    constants/    # Enumeraciones y configuración de categorías
    context/      # Estado global (AuthContext, ToastContext)
    pages/        # Vistas por ruta
      Dashboard.jsx     # Panel con estadísticas y mapa resumen
      Home.jsx          # Landing page pública
      Login.jsx         # Inicio de sesión
      NewReport.jsx     # Crear nuevo reporte
      NotFound.jsx      # Página 404
      Profile.jsx       # Perfil del usuario autenticado
      Register.jsx      # Registro de cuenta
      ReportDetail.jsx  # Detalle de un reporte con evidencias
      Reports.jsx       # Listado y filtrado de reportes
      Settings.jsx      # Configuración de cuenta y preferencias
    services/     # Axios y llamadas HTTP
    App.jsx       # Rutas y providers principales
    main.jsx      # Punto de entrada
```

## Autenticacion

- Se usa JWT.
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

## Perfil de usuario (`/profile`)

- Layout con sidebar de navegación: **Perfil**, **Seguridad**, **Actividad**.
- **Hero card** con avatar degradado, badge de rol y barra de completitud del perfil.
- **Edición inline** de nombre, apellido y teléfono con validación en tiempo real.
- **Seguridad** (acordeón colapsable): cambio de contraseña con `PasswordStrengthIndicator`.
- Fallback al contexto de auth si el endpoint `/auth/perfil` no está disponible.

### Endpoints que consume (pendientes de backend)
| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/auth/perfil` | Cargar datos del perfil |
| `PATCH` | `/auth/perfil` | Actualizar nombre / apellido / teléfono |
| `PATCH` | `/auth/cambiar-contrasena` | Cambiar contraseña |

## Configuracion de cuenta (`/settings`)

- Mismo patrón de sidebar: **Notificaciones**, **Privacidad**, **Cuenta**, **Zona peligrosa**.
- **Notificaciones**: toggles por categoría con ícono propio y pill buttons de frecuencia.
- **Privacidad**: política de privacidad y descarga de datos (próximamente).
- **Cuenta**: mini tarjeta del usuario, estado de email verificado, cerrar sesión global.
- **Zona peligrosa**: desactivar cuenta via modal; eliminar cuenta requiere escribir `ELIMINAR` para habilitar el botón (patrón GitHub/Vercel).

## Componentes reutilizables

### `FormSection`
Contenedor de sección con título, ícono y soporte de modo peligro (borde rojo).

```jsx
<FormSection title="Mi sección" icon={User}>
  ...contenido...
</FormSection>

<FormSection title="Zona peligrosa" icon={AlertTriangle} danger>
  ...contenido...
</FormSection>
```

### `PasswordStrengthIndicator`
Barra segmentada de 5 criterios: longitud ≥ 8, mayúscula, minúscula, número, carácter especial.

```jsx
<PasswordStrengthIndicator password={value} />
<PasswordStrengthIndicator password={value} showRequirements={false} />
```

Colores: rojo (1/5) → naranja (2/5) → amarillo (3/5) → verde claro (4/5) → verde (5/5).
