# Sistema de Votación Enterprise v3.0.0

Sistema completo de gestión de votación con backend Node.js/Express/PostgreSQL y frontend HTML/CSS/JavaScript vanilla.

## Características

### Backend
- **Autenticación JWT** con bcrypt para seguridad
- **Control de acceso basado en roles** (Admin/Contador)
- **API RESTful** completa con Express
- **Base de datos PostgreSQL** con pool de conexiones
- **WebSocket (Socket.io)** para actualizaciones en tiempo real
- **Importación/Exportación Excel** para gestión masiva de datos
- **Seguridad robusta** con Helmet, CORS y Rate Limiting
- **Registro de auditoría** completo

### Frontend
- **Dashboard administrativo** con estadísticas y gráficos interactivos
- **Panel de contador** con gestión de votantes asignados
- **Visualización de datos** con Chart.js
- **Actualizaciones en tiempo real** vía Socket.io
- **Diseño responsive** para móviles y tablets
- **Interfaz intuitiva** con HTML5/CSS3 moderno

## Requisitos Previos

- Node.js 18+ 
- PostgreSQL 13+
- npm o yarn

## Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/Ajaraba5/sistema.git
cd sistema
```

### 2. Configurar la base de datos

Crear base de datos PostgreSQL:
```sql
CREATE DATABASE votacion_db;
```

Ejecutar el script de schema:
```bash
psql -U postgres -d votacion_db -f backend/database/schema.sql
```

### 3. Configurar variables de entorno

Copiar el archivo de ejemplo:
```bash
cp .env.example .env
```

Editar `.env` con sus credenciales:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=votacion_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

CORS_ORIGIN=*
```

### 4. Instalar dependencias

```bash
cd backend
npm install
```

### 5. Iniciar el servidor

```bash
npm start
```

Para desarrollo con auto-reload:
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
sistema-votacion/
├── backend/
│   ├── server.js              # Punto de entrada del servidor
│   ├── app.js                 # Configuración de Express
│   ├── package.json           # Dependencias
│   ├── config/
│   │   ├── db.js             # Configuración PostgreSQL
│   │   └── env.js            # Variables de entorno
│   ├── models/
│   │   ├── User.js           # Modelo de usuarios
│   │   ├── Persona.js        # Modelo de votantes
│   │   └── Lider.js          # Modelo de líderes
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── contadorController.js
│   │   ├── personasController.js
│   │   └── excelController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── contador.js
│   │   ├── personas.js
│   │   └── excel.js
│   ├── middlewares/
│   │   ├── auth.js           # Verificación JWT
│   │   ├── role.js           # Control de roles
│   │   └── error.js          # Manejo de errores
│   ├── utils/
│   │   └── excelService.js   # Importar/Exportar Excel
│   └── database/
│       └── schema.sql         # Esquema de base de datos
├── frontend/
│   ├── index.html             # Página de login
│   ├── admin.html             # Dashboard administrativo
│   ├── contador.html          # Panel de contador
│   ├── css/
│   │   ├── main.css          # Estilos principales
│   │   ├── admin.css         # Estilos del admin
│   │   └── contador.css      # Estilos del contador
│   └── js/
│       ├── auth.js           # Autenticación
│       ├── admin.js          # Lógica del admin
│       ├── contador.js       # Lógica del contador
│       └── socket.js         # WebSocket client
├── .env.example              # Plantilla de variables
├── .gitignore
└── README.md
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Admin (requiere role='admin')
- `GET /api/admin/dashboard` - Estadísticas generales
- `POST /api/admin/usuarios` - Crear contador
- `GET /api/admin/usuarios` - Listar contadores
- `DELETE /api/admin/usuarios/:id` - Eliminar contador
- `PATCH /api/admin/asignar/:personaId/:counterId` - Asignar votante
- `GET /api/admin/contadores/estadisticas` - Estadísticas de contadores
- `GET /api/admin/lideres/estadisticas` - Estadísticas de líderes
- `POST /api/admin/lideres` - Crear líder
- `GET /api/admin/lideres` - Listar líderes
- `POST /api/admin/reset-db` - Reiniciar base de datos

### Contador (requiere role='contador')
- `GET /api/contador/dashboard` - Dashboard personal
- `GET /api/contador/personas` - Votantes asignados

### Personas (requiere autenticación)
- `GET /api/personas` - Listar votantes (con filtros)
- `POST /api/personas` - Crear votante
- `PATCH /api/personas/:id/voto` - Marcar votación
- `DELETE /api/personas/:id` - Eliminar votante

### Excel (requiere role='admin')
- `POST /api/excel/import` - Importar desde Excel
- `GET /api/excel/export` - Exportar a Excel

## Credenciales por Defecto

### Usuario Administrador
- **Usuario:** admin
- **Contraseña:** admin123

⚠️ **IMPORTANTE:** Cambiar estas credenciales en producción

## Uso

### 1. Inicio de Sesión
Acceder a `http://localhost:3000` e ingresar con las credenciales de admin.

### 2. Panel Administrativo
- Ver estadísticas en tiempo real
- Gestionar votantes (crear, editar, eliminar)
- Crear y gestionar contadores
- Crear y gestionar líderes
- Importar/exportar datos en Excel
- Asignar votantes a contadores
- Reiniciar base de datos (con confirmación triple)

### 3. Panel de Contador
- Ver votantes asignados
- Marcar votación en tiempo real
- Filtrar y buscar votantes
- Ver progreso de votación

## WebSocket Events

El sistema utiliza Socket.io para actualizaciones en tiempo real:

- `vote-update` - Notifica cuando se marca un voto
- `persona-updated` - Notifica cambios en votantes
- `dashboard-updated` - Solicita actualización del dashboard

## Seguridad

- ✅ Autenticación JWT
- ✅ Passwords hasheados con bcrypt
- ✅ Control de acceso basado en roles
- ✅ Helmet para headers de seguridad
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Validación de entrada
- ✅ SQL injection prevention (prepared statements)

## Desarrollo

### Ejecutar en modo desarrollo
```bash
cd backend
npm run dev
```

### Variables de entorno
Ver `.env.example` para todas las opciones de configuración disponibles.

## Tecnologías Utilizadas

### Backend
- Node.js 18+
- Express 4.18
- PostgreSQL 13+
- Socket.io 4.5
- JWT (jsonwebtoken)
- bcryptjs
- pg (node-postgres)
- XLSX
- Multer

### Frontend
- HTML5
- CSS3
- JavaScript (ES6+)
- Chart.js 4.4
- Socket.io Client

## Licencia

ISC

## Soporte

Para reportar problemas o sugerir mejoras, crear un issue en el repositorio.

---

**Versión:** 3.0.0  
**Última actualización:** 2024
