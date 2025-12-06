# 📋 BIDXAAGUI Workspace - Plan de Implementación

## 🏗️ Arquitectura Final

```
bidxaagui.com (Cloudflare)
│
├── bidxaagui.com/              → Landing Page (público)
├── bidxaagui.com/lector        → Revista Digital Reader (público)
├── admin.bidxaagui.com         → Admin Portal (privado/protegido) ✅ DEPLOYED
└── api.bidxaagui.com           → Worker API (backend)
```

## 📁 Estructura de Workspace (4 Repositorios)

```
bidxaagui-portfolio/
│
├── landing-page/                  # Repo 1: Frontend público principal
│   ├── GitHub: bidxaagui/landing-page
│   ├── Deploy: Cloudflare Pages
│   └── URL: bidxaagui.com/
│
├── revista-lector/                # Repo 2: 🆕 Flipbook Reader
│   ├── GitHub: bidxaagui/revista-lector
│   ├── Deploy: Cloudflare Pages
│   ├── URL: bidxaagui.com/lector
│   └── Stack: HTML + CSS + JS (flipbook custom)
│
├── admin-portal/                  # Repo 3: ✅ Admin Dashboard (CREADO)
│   ├── GitHub: bidxaagui/admin-portal
│   ├── Deploy: Cloudflare Pages ✅
│   ├── URL: admin.bidxaagui.com ✅
│   └── Stack: React + Vite + TypeScript
│
└── bidxaagui-backend-worker/      # Repo 4: API Backend (existente)
    ├── GitHub: bidxaagui/backend-worker
    ├── Deploy: Cloudflare Workers
    ├── URL: api.bidxaagui.com
    └── Stack: TypeScript + Wrangler
```

## 🔧 Servicios Externos Requeridos

### Cloudflare Services
- ✅ **Cloudflare Pages** - Hosting de frontends
- ✅ **Cloudflare Workers** - API Backend
- 🔄 **Cloudflare D1** - Base de datos SQL (SQLite en edge)
- 🔄 **Cloudflare R2** - Object storage para imágenes

### Third-Party Services
- 🔄 **Resend** - Servicio de envío de emails
  - Magic link authentication
  - Newsletters a suscriptores
  - Notificaciones de convocatorias

---

## 🎯 USE CASES PRINCIPALES

### 1. 🔐 Autenticación Admin (Magic Link)
**Flujo**:
1. Admin ingresa su email en `/login`
2. Worker valida que email existe en `admin_users` table
3. Worker genera magic link token con expiración (15 min)
4. Worker envía email vía Resend con link mágico
5. Admin hace click en link
6. Worker valida token y genera JWT de sesión
7. Admin es redirigido al dashboard

**Endpoints requeridos**:
- `POST /api/auth/magic-link/request` - Solicitar magic link
- `GET /api/auth/magic-link/verify?token=xxx` - Verificar token y login

### 2. 📧 Suscripción a Newsletter (Landing Page)
**Flujo**:
1. Usuario completa formulario en landing page (nombre + email)
2. Landing page hace POST a Worker
3. Worker valida email y guarda en `subscribers` table
4. Worker envía email de bienvenida vía Resend (opcional)
5. Usuario recibe confirmación

**Endpoints requeridos**:
- `POST /api/newsletter/subscribe` - Registrar suscriptor
- `POST /api/newsletter/unsubscribe` - Dar de baja (con token)

### 3. 👥 Gestión de Suscriptores (Admin Portal)
**Funcionalidades**:
- Listar todos los suscriptores (tabla paginada)
- Buscar y filtrar suscriptores
- Ver estadísticas (total, nuevos este mes, crecimiento)
- Exportar lista a CSV
- Eliminar suscriptores manualmente

**Endpoints requeridos**:
- `GET /api/admin/subscribers` - Listar suscriptores (paginado)
- `DELETE /api/admin/subscribers/:id` - Eliminar suscriptor
- `GET /api/admin/subscribers/stats` - Estadísticas

### 4. ✉️ Editor de Emails (Admin Portal)
**Funcionalidades**:
- Crear plantillas de email (WYSIWYG editor)
- Preview del email antes de enviar
- Enviar email a todos los suscriptores
- Enviar email de prueba a admin
- Ver historial de emails enviados
- Scheduler para envíos programados (futuro)

**Endpoints requeridos**:
- `POST /api/admin/emails/send` - Enviar email masivo
- `POST /api/admin/emails/preview` - Enviar email de prueba
- `GET /api/admin/emails/history` - Historial de envíos

### 5. 📚 Gestión de Ediciones (Admin Portal)
**Funcionalidades**:
- Listar todas las ediciones
- Crear nueva edición (título, descripción, fecha)
- Upload de cover image
- Upload múltiple de páginas (ZIP o individual)
- Reordenar páginas (drag & drop)
- Publicar/despublicar edición
- Eliminar edición

**Endpoints requeridos**:
- `GET /api/ediciones` - Listar ediciones públicas
- `GET /api/admin/ediciones` - Listar todas (incluye no publicadas)
- `POST /api/admin/ediciones` - Crear edición
- `PUT /api/admin/ediciones/:id` - Actualizar edición
- `DELETE /api/admin/ediciones/:id` - Eliminar edición
- `POST /api/admin/ediciones/:id/pages` - Upload de páginas
- `PUT /api/admin/ediciones/:id/pages/reorder` - Reordenar

### 6. 🎨 Otras Funcionalidades (Por Implementar)
- [ ] **Lector Landing Page** - Página de entrada al lector de revista
- [ ] **Upload ZIP y procesamiento** - Subir ZIP con imágenes, extraer y procesar
- [ ] **Convocatorias** - Sistema para gestionar convocatorias
- [ ] **Emails de convocatorias** - Notificar sobre nuevas convocatorias
- [ ] **Analytics** - Visualización de métricas de uso
- [ ] **Multi-idioma** - Soporte para español/zapoteco/inglés

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### 📦 FASE 0: Setup Inicial (COMPLETADO ✅)

#### Admin Portal - Setup
- [x] Crear proyecto con Vite + React + TypeScript
- [x] Limpiar código default
- [x] Inicializar Git
- [x] Primer commit
- [x] Crear repositorio en GitHub
- [x] Push a GitHub
- [x] Conectar a Cloudflare Pages
- [x] Configurar custom domain: `admin.bidxaagui.com`
- [x] Verificar deploy exitoso

---

### 🎯 FASE 1: Backend Worker - Core & Database

**Objetivo**: Configurar Worker con D1, Resend y endpoints básicos

#### 1.1 Setup de Servicios Externos

**Cloudflare D1**:
- [ ] Crear database D1: `bidxaagui-db`
  ```bash
  wrangler d1 create bidxaagui-db
  ```
- [ ] Conectar D1 en `wrangler.toml`:
  ```toml
  [[d1_databases]]
  binding = "DB"
  database_name = "bidxaagui-db"
  database_id = "xxx-xxx-xxx"
  ```
- [ ] Crear schema de base de datos (ver sección Database Schema)
- [ ] Aplicar migraciones:
  ```bash
  wrangler d1 execute bidxaagui-db --file=./schema.sql
  ```
- [ ] Seedear datos iniciales (crear primer admin user)

**Cloudflare R2**:
- [ ] Crear bucket: `bidxaagui-images`
  ```bash
  wrangler r2 bucket create bidxaagui-images
  ```
- [ ] Conectar R2 en `wrangler.toml`:
  ```toml
  [[r2_buckets]]
  binding = "R2"
  bucket_name = "bidxaagui-images"
  ```
- [ ] Configurar CORS para R2
- [ ] Configurar public access URLs

**Resend**:
- [ ] Crear cuenta en Resend.com
- [ ] Verificar dominio `bidxaagui.com` en Resend
- [ ] Obtener API Key
- [ ] Agregar API Key como secret en Cloudflare:
  ```bash
  wrangler secret put RESEND_API_KEY
  ```
- [ ] Configurar variables en `wrangler.toml`:
  ```toml
  [vars]
  RESEND_FROM_EMAIL = "noreply@bidxaagui.com"
  ```

#### 1.2 Worker - Core Setup
- [ ] Actualizar tipos TypeScript en `Env` interface
- [ ] Implementar CORS middleware para todas las respuestas
- [ ] Implementar error handling global
- [ ] Implementar logging/debugging utilities
- [ ] Configurar rate limiting básico

#### 1.3 Worker - Autenticación con Magic Link
- [ ] Instalar dependencias para JWT:
  ```bash
  npm install @tsndr/cloudflare-worker-jwt
  ```
- [ ] `POST /api/auth/magic-link/request`
  - [ ] Validar email existe en `admin_users`
  - [ ] Generar token único (UUID + timestamp)
  - [ ] Guardar token en D1 con expiración (15 min)
  - [ ] Enviar email con magic link vía Resend
  - [ ] Template de email con diseño BIDXAAGUI
- [ ] `GET /api/auth/magic-link/verify`
  - [ ] Validar token en D1
  - [ ] Verificar que no ha expirado
  - [ ] Generar JWT token de sesión (exp: 7 días)
  - [ ] Invalidar magic link (single use)
  - [ ] Retornar JWT + datos de usuario
- [ ] Middleware de autenticación para rutas `/api/admin/*`
  - [ ] Verificar JWT en header `Authorization: Bearer <token>`
  - [ ] Validar firma y expiración
  - [ ] Inyectar usuario en request context

#### 1.4 Worker - Newsletter Endpoints
- [ ] `POST /api/newsletter/subscribe`
  - [ ] Validar email format
  - [ ] Check duplicados en D1
  - [ ] Insertar en `subscribers` table
  - [ ] (Opcional) Enviar email de bienvenida
  - [ ] Retornar confirmación
- [ ] `POST /api/newsletter/unsubscribe`
  - [ ] Recibir token de unsubscribe
  - [ ] Marcar como unsubscribed en D1 (soft delete)
  - [ ] Confirmar baja
- [ ] `GET /api/admin/subscribers` (protegido)
  - [ ] Paginación (page, limit)
  - [ ] Búsqueda por email/nombre
  - [ ] Ordenamiento
  - [ ] Retornar lista + metadata (total, pages)
- [ ] `DELETE /api/admin/subscribers/:id` (protegido)
  - [ ] Eliminar de D1 (hard delete)
  - [ ] Retornar confirmación
- [ ] `GET /api/admin/subscribers/stats` (protegido)
  - [ ] Total suscriptores
  - [ ] Nuevos este mes
  - [ ] Crecimiento (graph data)

#### 1.5 Worker - Ediciones Endpoints
- [ ] `GET /api/ediciones`
  - [ ] Listar solo ediciones publicadas
  - [ ] Incluir cover_url
  - [ ] Ordenar por fecha DESC
- [ ] `GET /api/ediciones/:id`
  - [ ] Retornar edición específica
  - [ ] Solo si está publicada (o si es admin)
- [ ] `GET /api/ediciones/:id/pages`
  - [ ] Listar páginas de una edición
  - [ ] Ordenadas por número
  - [ ] URLs de imágenes desde R2
- [ ] `GET /api/admin/ediciones` (protegido)
  - [ ] Listar TODAS las ediciones (publicadas + draft)
  - [ ] Incluir metadata completa
- [ ] `POST /api/admin/ediciones` (protegido)
  - [ ] Crear nueva edición
  - [ ] Upload cover image a R2
  - [ ] Insertar en D1
  - [ ] Retornar ID de nueva edición
- [ ] `PUT /api/admin/ediciones/:id` (protegido)
  - [ ] Actualizar metadata (título, descripción, fecha)
  - [ ] Toggle publicada/draft
  - [ ] Actualizar cover si se proporciona
- [ ] `DELETE /api/admin/ediciones/:id` (protegido)
  - [ ] Eliminar páginas asociadas de D1
  - [ ] Eliminar imágenes de R2
  - [ ] Eliminar edición de D1
- [ ] `POST /api/admin/ediciones/:id/pages` (protegido)
  - [ ] Upload de páginas (múltiples imágenes)
  - [ ] Procesar y subir a R2
  - [ ] Insertar referencias en D1
  - [ ] Detectar número de página automáticamente
- [ ] `PUT /api/admin/ediciones/:id/pages/reorder` (protegido)
  - [ ] Recibir nuevo orden de páginas
  - [ ] Actualizar números en D1
- [ ] `POST /api/admin/ediciones/:id/upload-zip` (protegido)
  - [ ] Recibir archivo ZIP
  - [ ] Extraer imágenes
  - [ ] Procesar y subir a R2
  - [ ] Crear páginas en D1

#### 1.6 Worker - Email Campaigns
- [ ] `POST /api/admin/emails/send` (protegido)
  - [ ] Recibir HTML template + subject
  - [ ] Obtener todos los suscriptores activos
  - [ ] Enviar emails en batch vía Resend
  - [ ] Rate limiting (evitar spam)
  - [ ] Guardar en historial (`email_campaigns` table)
  - [ ] Retornar status
- [ ] `POST /api/admin/emails/preview` (protegido)
  - [ ] Enviar email de prueba al admin
  - [ ] No guarda en historial
- [ ] `GET /api/admin/emails/history` (protegido)
  - [ ] Listar campañas enviadas
  - [ ] Incluir stats (enviados, errores)

#### 1.7 Worker - Deploy
- [ ] Probar todos los endpoints localmente con `wrangler dev`
- [ ] Crear tests básicos (opcional)
- [ ] Deploy a producción:
  ```bash
  wrangler deploy --env production
  ```
- [ ] Verificar routes en Cloudflare Dashboard
- [ ] Probar endpoints en producción

---

### 🔐 FASE 2: Admin Portal - Frontend Development

**Objetivo**: Construir UI completo del admin portal

#### 2.1 Setup de Dependencias
- [ ] Instalar React Router:
  ```bash
  npm install react-router-dom
  ```
- [ ] Instalar TanStack Query (data fetching):
  ```bash
  npm install @tanstack/react-query
  ```
- [ ] Instalar Zustand (state management):
  ```bash
  npm install zustand
  ```
- [ ] Instalar React Hook Form:
  ```bash
  npm install react-hook-form
  ```
- [ ] Instalar utilidades:
  ```bash
  npm install axios date-fns clsx
  ```
- [ ] (Opcional) UI library - Shadcn/ui o similar:
  ```bash
  # O cualquier componente library que prefieras
  ```

#### 2.2 Estructura de Carpetas
- [ ] Crear estructura:
  ```
  src/
  ├── components/
  │   ├── ui/              # Componentes base (Button, Input, etc.)
  │   ├── layout/          # Layout components (Sidebar, Header)
  │   └── features/        # Componentes por feature
  ├── pages/
  │   ├── Login.tsx
  │   ├── Dashboard.tsx
  │   ├── Subscribers.tsx
  │   ├── Ediciones.tsx
  │   ├── EmailEditor.tsx
  │   └── Settings.tsx
  ├── services/
  │   └── api.ts           # Axios instance + endpoints
  ├── hooks/
  │   └── useAuth.ts       # Custom hooks
  ├── store/
  │   └── authStore.ts     # Zustand stores
  ├── utils/
  │   └── helpers.ts
  ├── types/
  │   └── index.ts         # TypeScript types
  └── App.tsx
  ```

#### 2.3 Autenticación
- [ ] **Login Page** (`/login`)
  - [ ] Form con input de email
  - [ ] Validación de email
  - [ ] Loading state durante request
  - [ ] Mensaje de "Check your email"
  - [ ] Error handling
- [ ] **Magic Link Verification** (`/auth/verify?token=xxx`)
  - [ ] Capturar token de URL
  - [ ] Hacer request a Worker para verificar
  - [ ] Guardar JWT en localStorage
  - [ ] Redirigir a dashboard
  - [ ] Manejo de errores (token inválido/expirado)
- [ ] **Auth Store** (Zustand)
  - [ ] Estado: `user`, `token`, `isAuthenticated`
  - [ ] Actions: `login`, `logout`, `checkAuth`
  - [ ] Persistencia en localStorage
- [ ] **Protected Routes**
  - [ ] Higher-order component o Route wrapper
  - [ ] Verificar token antes de acceder
  - [ ] Redirigir a `/login` si no autenticado
- [ ] **API Service**
  - [ ] Axios instance con interceptors
  - [ ] Auto-attach JWT en headers
  - [ ] Handle 401 (logout automático)

#### 2.4 Dashboard
- [ ] Layout principal con sidebar y header
- [ ] Sidebar con navegación:
  - [ ] Dashboard
  - [ ] Suscriptores
  - [ ] Ediciones
  - [ ] Email Editor
  - [ ] Configuración
  - [ ] Logout
- [ ] Dashboard widgets:
  - [ ] Total suscriptores (card)
  - [ ] Total ediciones (card)
  - [ ] Última edición publicada (card)
  - [ ] Gráfico de crecimiento (opcional)

#### 2.5 Gestión de Suscriptores
- [ ] **Lista de Suscriptores**
  - [ ] Tabla con: email, nombre, fecha suscripción
  - [ ] Paginación
  - [ ] Búsqueda en tiempo real
  - [ ] Ordenamiento por columnas
  - [ ] Botón eliminar (con confirmación)
  - [ ] Loading states
- [ ] **Estadísticas**
  - [ ] Mostrar stats en cards superiores
  - [ ] Gráfico de crecimiento (opcional)
- [ ] **Export CSV**
  - [ ] Botón para descargar CSV
  - [ ] Incluir todos los suscriptores

#### 2.6 Gestión de Ediciones
- [ ] **Lista de Ediciones**
  - [ ] Grid o tabla con ediciones
  - [ ] Mostrar: cover, título, fecha, status (publicada/draft)
  - [ ] Botones: Editar, Eliminar, Ver páginas
  - [ ] Toggle publicar/despublicar
- [ ] **Crear Edición**
  - [ ] Modal o página dedicada
  - [ ] Form: título, descripción, fecha
  - [ ] Upload cover image (drag & drop)
  - [ ] Preview de cover
  - [ ] Botón guardar
- [ ] **Editar Edición**
  - [ ] Pre-cargar datos en form
  - [ ] Actualizar metadata
  - [ ] Cambiar cover (opcional)
  - [ ] Guardar cambios
- [ ] **Gestión de Páginas**
  - [ ] Vista de grid con todas las páginas
  - [ ] Upload múltiple de imágenes
  - [ ] Drag & drop para reordenar
  - [ ] Eliminar página individual
  - [ ] Preview de imagen
- [ ] **Upload ZIP**
  - [ ] Input para seleccionar ZIP
  - [ ] Progress bar de upload
  - [ ] Auto-procesamiento en backend
  - [ ] Notificación de éxito/error

#### 2.7 Editor de Emails
- [ ] **Email Template Editor**
  - [ ] Rich text editor (WYSIWYG)
  - [ ] Opciones: bold, italic, links, images
  - [ ] Campo de Subject
  - [ ] Preview en tiempo real
- [ ] **Enviar Email**
  - [ ] Botón "Send Test Email" (envía a admin)
  - [ ] Botón "Send to All Subscribers"
  - [ ] Confirmación antes de enviar masivo
  - [ ] Progress indicator
  - [ ] Notificación de éxito
- [ ] **Historial de Emails**
  - [ ] Tabla con emails enviados
  - [ ] Mostrar: subject, fecha, número de destinatarios
  - [ ] Ver contenido HTML (read-only)

#### 2.8 UI/UX Polish
- [ ] Sistema de diseño consistente
  - [ ] Paleta de colores
  - [ ] Tipografía
  - [ ] Espaciado
- [ ] Componentes reutilizables:
  - [ ] Button (variants: primary, secondary, danger)
  - [ ] Input, Textarea
  - [ ] Card, Modal, Dropdown
  - [ ] Loading spinner
  - [ ] Toast notifications
- [ ] Responsive design (mobile + desktop)
- [ ] Dark mode (opcional)
- [ ] Animaciones suaves (transitions)
- [ ] Error boundaries

#### 2.9 Deploy & Environment
- [ ] Crear `.env.example`:
  ```env
  VITE_API_URL=https://api.bidxaagui.com
  ```
- [ ] Configurar variables en Cloudflare Pages
- [ ] Build de producción: `npm run build`
- [ ] Deploy automático en push a `main`
- [ ] Verificar funcionamiento en `admin.bidxaagui.com`

---

### 🎨 FASE 3: Revista Lector (Flipbook Reader)

**Objetivo**: Crear lector de revista público e interactivo

#### 3.1 Estructura del Proyecto
- [ ] Crear carpeta `revista-lector/`
- [ ] Inicializar Git
- [ ] Estructura de archivos:
  ```
  revista-lector/
  ├── index.html          # Listado de ediciones
  ├── reader.html         # Visor flipbook
  ├── css/
  │   ├── styles.css
  │   └── flipbook.css
  ├── js/
  │   ├── app.js          # Lógica de listado
  │   ├── reader.js       # Lógica de flipbook
  │   └── api.js          # API calls
  ├── assets/
  └── README.md
  ```

#### 3.2 Listado de Ediciones (index.html)
- [ ] Fetch ediciones desde `/api/ediciones`
- [ ] Mostrar grid de covers
- [ ] Card por edición:
  - [ ] Cover image
  - [ ] Título
  - [ ] Fecha
  - [ ] Botón "Leer"
- [ ] Click → redirige a `reader.html?id=xxx`
- [ ] Loading state
- [ ] Empty state (sin ediciones)

#### 3.3 Flipbook Reader (reader.html)
- [ ] Capturar `id` de query params
- [ ] Fetch páginas desde `/api/ediciones/:id/pages`
- [ ] Implementar flipbook:
  - [ ] Usar turn.js o similar
  - [ ] O crear custom con CSS 3D transforms
  - [ ] Navegación: flechas, click en bordes
  - [ ] Swipe en mobile
- [ ] Controles:
  - [ ] Previous / Next page
  - [ ] Thumbnails sidebar (mini previews)
  - [ ] Fullscreen toggle
  - [ ] Zoom in/out
  - [ ] Share buttons (WhatsApp, Facebook, Copy Link)
  - [ ] Back to editions
- [ ] Loading state mientras carga páginas
- [ ] Error handling (edición no encontrada)

#### 3.4 Estética
- [ ] Diseño minimalista y elegante
- [ ] Modo oscuro/claro (toggle)
- [ ] Animaciones suaves de páginas
- [ ] Responsive (mobile-first)
- [ ] Prefetching de páginas adyacentes

#### 3.5 SEO
- [ ] Meta tags dinámicos por edición
- [ ] Open Graph images (usar cover)
- [ ] Structured data (Article schema)
- [ ] Sitemap con todas las ediciones

#### 3.6 Deploy
- [ ] Push a GitHub: `bidxaagui/revista-lector`
- [ ] Conectar a Cloudflare Pages
- [ ] Configurar path routing: `/lector`
- [ ] Verificar en `bidxaagui.com/lector`

---

### 🌐 FASE 4: Landing Page - Actualización

**Objetivo**: Integrar newsletter y link a revista

#### 4.1 Integración Newsletter
- [ ] Actualizar formulario de newsletter
- [ ] Cambiar endpoint a `/api/newsletter/subscribe`
- [ ] Validación de email en cliente
- [ ] Mensajes de éxito/error
- [ ] Loading state en botón
- [ ] (Opcional) Double opt-in con email de confirmación

#### 4.2 Navegación
- [ ] Agregar link "Ediciones" o "Revista" en nav
- [ ] Link apunta a `/lector`
- [ ] (Opcional) Mostrar última edición en homepage
  - [ ] Fetch desde `/api/ediciones?limit=1`
  - [ ] Mostrar cover + botón "Leer Ahora"

#### 4.3 Deploy
- [ ] Push cambios
- [ ] Verificar auto-deploy en Cloudflare Pages
- [ ] Probar formulario end-to-end

---

### ☁️ FASE 5: Cloudflare Final Configuration

**Objetivo**: Asegurar routing, DNS y seguridad

#### 5.1 DNS Records
- [x] `bidxaagui.com` → Cloudflare Pages (landing-page)
- [x] `admin.bidxaagui.com` → Cloudflare Pages (admin-portal) ✅
- [ ] `api.bidxaagui.com` → Worker route
- [ ] Verificar propagación DNS

#### 5.2 Cloudflare Pages Configuration
- [ ] **Landing Page**
  - [ ] Verificar build settings
  - [ ] Configurar redirects si es necesario
- [ ] **Revista Lector**
  - [ ] Path-based routing: `/lector/*`
  - [ ] Fallback a index.html
- [x] **Admin Portal** ✅
  - [x] Custom domain configurado
  - [ ] Variables de entorno correctas
  - [ ] (Opcional) Cloudflare Access para protección extra

#### 5.3 Cloudflare R2
- [ ] Verificar public URLs funcionan
- [ ] Configurar cache headers
- [ ] (Opcional) CDN custom domain

#### 5.4 Security
- [x] SSL/TLS activo en todos los dominios
- [ ] WAF rules (rate limiting en API)
- [ ] Bot protection en formularios
- [ ] (Opcional) Cloudflare Access para admin

---

### 🧪 FASE 6: Testing & QA

#### 6.1 Testing Funcional
- [ ] **Auth Flow**
  - [ ] Solicitar magic link
  - [ ] Recibir email
  - [ ] Click en link y login exitoso
  - [ ] Token expira correctamente
- [ ] **Newsletter**
  - [ ] Suscribirse desde landing page
  - [ ] Ver suscriptor en admin
  - [ ] Enviar email de prueba
  - [ ] Enviar email masivo
  - [ ] Dar de baja (unsubscribe)
- [ ] **Ediciones**
  - [ ] Crear edición
  - [ ] Upload páginas
  - [ ] Publicar edición
  - [ ] Ver en lector público
  - [ ] Editar edición
  - [ ] Eliminar edición

#### 6.2 Testing Cross-Browser
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Android)

#### 6.3 Performance
- [ ] Lighthouse score > 90
- [ ] Optimizar imágenes (WebP)
- [ ] Lazy loading de imágenes
- [ ] Code splitting en React

---

### 📚 FASE 7: Documentación

#### 7.1 README por Proyecto
- [x] Admin Portal ✅
- [ ] Backend Worker
- [ ] Revista Lector
- [ ] Landing Page (actualizar)

#### 7.2 Documentación General
- [ ] `ARCHITECTURE.md` - Diagrama de arquitectura
- [ ] `API.md` - Documentación de endpoints
- [ ] `DEPLOYMENT.md` - Guía de deploy
- [ ] Actualizar `workspace-plan.md` con progreso

---

## 📊 Database Schema (Cloudflare D1)

```sql
-- Admin Users
CREATE TABLE admin_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Magic Link Tokens
CREATE TABLE magic_link_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES admin_users(id)
);

-- Newsletter Subscribers
CREATE TABLE subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscribed BOOLEAN DEFAULT 1,
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at DATETIME,
  unsubscribe_token TEXT UNIQUE
);

-- Ediciones (Revista)
CREATE TABLE ediciones (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  cover_url TEXT,
  fecha DATE,
  publicada BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Páginas de Ediciones
CREATE TABLE paginas (
  id TEXT PRIMARY KEY,
  edicion_id TEXT NOT NULL,
  numero INTEGER NOT NULL,
  imagen_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(edicion_id) REFERENCES ediciones(id) ON DELETE CASCADE,
  UNIQUE(edicion_id, numero)
);

-- Email Campaigns (Historial)
CREATE TABLE email_campaigns (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  recipients_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  sent_by TEXT NOT NULL,
  FOREIGN KEY(sent_by) REFERENCES admin_users(id)
);

-- Índices para performance
CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_subscribed ON subscribers(subscribed);
CREATE INDEX idx_ediciones_publicada ON ediciones(publicada);
CREATE INDEX idx_ediciones_fecha ON ediciones(fecha DESC);
CREATE INDEX idx_paginas_edicion ON paginas(edicion_id);
CREATE INDEX idx_magic_tokens_expires ON magic_link_tokens(expires_at);
```

---

## 🔐 Environment Variables

### Backend Worker (`wrangler.toml` + secrets)
```toml
[vars]
ENVIRONMENT = "production"
RESEND_FROM_EMAIL = "noreply@bidxaagui.com"
FRONTEND_URL = "https://bidxaagui.com"
ADMIN_URL = "https://admin.bidxaagui.com"
JWT_SECRET_KEY = "xxx" # O usar wrangler secret
MAGIC_LINK_EXPIRATION_MINUTES = "15"

# Secrets (usar wrangler secret put)
# RESEND_API_KEY
# JWT_SECRET
```

### Admin Portal (`.env`)
```env
VITE_API_URL=https://api.bidxaagui.com
```

---

## 🚀 Orden Recomendado de Implementación

### Sprint 1: Backend Foundation (FASE 1.1 - 1.3)
1. Configurar D1, R2, Resend
2. Implementar autenticación con magic link
3. Seedear primer admin user
4. Probar login flow

### Sprint 2: Newsletter & API (FASE 1.4)
1. Endpoints de newsletter
2. Integrar con landing page
3. Probar suscripción end-to-end

### Sprint 3: Admin Portal Auth (FASE 2.1 - 2.3)
1. Setup admin portal dependencies
2. Implementar login UI
3. Protected routes
4. Probar auth flow completo

### Sprint 4: Admin - Subscribers (FASE 2.5)
1. UI de lista de suscriptores
2. Gestión de suscriptores
3. Estadísticas

### Sprint 5: Ediciones Backend (FASE 1.5)
1. Endpoints de ediciones
2. Upload de imágenes a R2
3. Gestión de páginas

### Sprint 6: Admin - Ediciones (FASE 2.6)
1. UI de gestión de ediciones
2. Upload de páginas
3. Reordenamiento

### Sprint 7: Email Campaigns (FASE 1.6 + 2.7)
1. Backend de email campaigns
2. UI de email editor
3. Envío de emails

### Sprint 8: Revista Lector (FASE 3)
1. Crear lector de revista
2. Flipbook implementation
3. Deploy y testing

### Sprint 9: Polish & Deploy (FASE 4, 5, 6)
1. Integración landing page
2. Configuración final Cloudflare
3. Testing completo
4. Performance optimization

### Sprint 10: Documentación (FASE 7)
1. README de todos los proyectos
2. Documentación de API
3. Guías de deploy

---

## 🔗 GitHub Repositories

```bash
# 1. Landing Page
gh repo create bidxaagui/landing-page --public

# 2. Revista Lector
gh repo create bidxaagui/revista-lector --public

# 3. Admin Portal ✅
gh repo create bidxaagui/admin-portal --private  # CREADO

# 4. Backend Worker
gh repo create bidxaagui/backend-worker --private
```

---

## 📝 Notas Importantes

### CORS Configuration
El Worker debe permitir CORS desde:
- `https://bidxaagui.com`
- `https://admin.bidxaagui.com`
- `http://localhost:*` (desarrollo)

### Rate Limiting
- Magic link: 3 requests / 15 min por IP
- Newsletter subscribe: 5 requests / hour por IP
- Email campaigns: Solo admins, manual approval

### Resend Limits
- Plan gratuito: 100 emails/día
- Plan Pro: 50,000 emails/mes
- Considerar upgrade según necesidades

### Backup Strategy
- D1: Snapshots automáticos por Cloudflare
- R2: Versioning habilitado
- Exports regulares de subscribers (CSV)

---

## 🎯 Próximas Funcionalidades (Futuro)

### Fase 2.0: Advanced Features
- [ ] **Convocatorias**
  - [ ] Tabla `convocatorias` en D1
  - [ ] CRUD en admin portal
  - [ ] Página pública de convocatorias
  - [ ] Emails automáticos de nuevas convocatorias
  
- [ ] **Analytics**
  - [ ] Integrar Cloudflare Analytics
  - [ ] Dashboard de métricas en admin
  - [ ] Tracking de ediciones más leídas
  
- [ ] **Multi-idioma**
  - [ ] i18n en admin portal y lector
  - [ ] Soporte para español/zapoteco/inglés
  
- [ ] **Comments**
  - [ ] Sistema de comentarios en ediciones
  - [ ] Moderación en admin
  
- [ ] **PWA**
  - [ ] Service worker para offline
  - [ ] Install prompt
  
- [ ] **PDF Export**
  - [ ] Generar PDF de ediciones
  - [ ] Download desde lector

---

## ✅ Progress Tracker

**Última actualización**: 2025-12-05 17:52

### Status General
- ✅ Admin Portal: Creado y deployado
- 🔄 Backend Worker: En desarrollo
- ⏳ Revista Lector: Pendiente
- ⏳ Landing Page: Integración pendiente

### Completado
- [x] Admin portal setup
- [x] Admin portal deploy to Cloudflare Pages
- [x] Custom domain `admin.bidxaagui.com`
- [x] GitHub repository para admin-portal

### En Progreso
- [ ] Configuración de D1
- [ ] Configuración de Resend
- [ ] Worker endpoints

### Pendiente
- Todo lo demás según checklist

---

**Status**: 🚧 En desarrollo activo  
**Progreso**: ~10% completado
