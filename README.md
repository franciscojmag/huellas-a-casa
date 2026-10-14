# 🐾 Adoptify

Plataforma web para la gestión de adopción y rescate canino en San Pedro de las Colonias, Coahuila.

Desarrollada como proyecto de investigación para la materia **Taller de Investigación I** del Instituto Tecnológico Superior de San Pedro de las Colonias — Ingeniería en Sistemas Computacionales.

**Autores:**
- Francisco Javier Martínez García — 231000109
- Jorge Humberto Esquivel Cuellar — 231000116

**Asesor:** M.C. Rubén Hernández Rodríguez

---

## ¿Qué hace la plataforma?

Conecta a organizaciones de rescate animal con ciudadanos responsables para:

- Consultar y filtrar perros disponibles para adopción
- Enviar solicitudes de adopción
- Reportar perros en situación de calle (con foto y ubicación)
- Gestionar el proceso completo desde el panel de organizaciones

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript puro |
| Backend | Node.js + Express |
| Base de datos | SQLite (`sqlite3`) |
| Sesiones | `express-session` |
| Contraseñas | `bcrypt` |
| Subida de archivos | `multer` |
| Desarrollo | `nodemon` |

---

## Requisitos previos

Antes de clonar el proyecto necesitas tener instalado:

- [Node.js](https://nodejs.org/) versión 18 o superior
- npm (viene incluido con Node.js)
- Git

Verifica que los tienes con:

```bash
node -v
npm -v
git --version
```

---

## Instalación y ejecución

### 1. Clona el repositorio

```bash
git clone https://github.com/TU_USUARIO/adoptify.git
cd adoptify
```

### 2. Instala las dependencias

```bash
npm install
```

Esto descarga todas las librerías listadas en `package.json` dentro de la carpeta `node_modules`.

### 3. Inicia el servidor

```bash
npm run dev
```

### 4. Abre el navegador

```
http://localhost:3000
```

La base de datos se crea automáticamente con datos de prueba en el primer arranque.

---

## Cuentas de prueba

La contraseña para todas las cuentas de prueba es: **`password`**

| Rol | Correo |
|---|---|
| Organización | `rescate@sanpedro.com` |
| Organización | `patitas@felices.com` |
| Ciudadano | `ana@email.com` |
| Ciudadano | `carlos@email.com` |

---

## Estructura del proyecto

```
adoptify/
│
├── server.js              # Punto de entrada — configura Express y rutas
├── package.json           # Dependencias y scripts
│
├── database/
│   ├── schema.sql         # Tablas e inserts de datos de prueba
│   └── db.js              # Conexión SQLite con helpers async
│
├── middleware/
│   └── auth.js            # Verificación de sesión y roles
│
├── routes/
│   ├── auth.js            # POST /api/auth/login|registro|logout
│   ├── perros.js          # GET  /api/perros (público)
│   ├── adopciones.js      # POST /api/adopciones (ciudadano)
│   ├── reportes.js        # POST /api/reportes (login requerido)
│   └── admin.js           # /api/admin/* (solo organizaciones)
│
├── public/
│   ├── css/
│   │   ├── styles.css     # Estilos globales
│   │   └── dashboard.css  # Estilos del panel de organización
│   ├── js/                # Scripts del frontend (fetch + DOM)
│   ├── img/               # Imágenes estáticas
│   └── uploads/           # Fotos subidas por usuarios (generado en runtime)
│
└── views/
    ├── index.html         # Página principal
    ├── adoptar.html       # Catálogo con filtros
    ├── perro.html         # Detalle de un perro
    ├── reportar.html      # Formulario de reporte ciudadano
    ├── login.html         # Iniciar sesión
    ├── registro.html      # Crear cuenta
    ├── contacto.html      # Información del proyecto
    ├── organizaciones.html# Lista de organizaciones afiliadas
    └── dashboard/
        ├── index.html     # Resumen del panel
        ├── perros.html    # Gestionar perros
        ├── solicitudes.html # Revisar solicitudes de adopción
        └── reportes.html  # Revisar reportes ciudadanos
```

---

## Endpoints de la API

### Públicos (sin login)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/perros` | Lista perros con filtros opcionales (`?sexo=macho&edad=cachorros`) |
| GET | `/api/perros/stats` | Estadísticas generales (rescatados, adoptados, orgs) |
| GET | `/api/perros/:id` | Detalle de un perro |
| GET | `/api/organizaciones` | Lista de organizaciones afiliadas |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/registro` | Crear cuenta |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Usuario de la sesión activa |

### Ciudadano (requiere login)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/adopciones` | Enviar solicitud de adopción |
| GET | `/api/adopciones/mis` | Mis solicitudes |
| POST | `/api/reportes` | Registrar reporte ciudadano |
| GET | `/api/reportes/mis` | Mis reportes |

### Organización (requiere rol `org`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/perros` | Listar perros de la org |
| POST | `/api/admin/perros` | Agregar perro |
| PUT | `/api/admin/perros/:id` | Editar perro |
| DELETE | `/api/admin/perros/:id` | Eliminar perro |
| GET | `/api/admin/solicitudes` | Ver solicitudes recibidas |
| PUT | `/api/admin/solicitudes/:id` | Aprobar o rechazar solicitud |
| GET | `/api/admin/reportes` | Ver todos los reportes |
| PUT | `/api/admin/reportes/:id` | Actualizar estado de reporte |

---

## Base de datos

La base de datos es un archivo SQLite (`database/huellas.db`) que se genera automáticamente al arrancar el servidor por primera vez, ejecutando `database/schema.sql`.

Si quieres empezar con datos limpios, borra el archivo `huellas.db` y reinicia el servidor.

Para explorar la base de datos visualmente puedes usar [DB Browser for SQLite](https://sqlitebrowser.org/).

---

## Scripts disponibles

```bash
npm run dev    # Inicia con nodemon (reinicio automático al editar)
npm start      # Inicia con node directamente (producción)
```

---

## Notas

- Las fotos subidas se guardan en `public/uploads/` y no se incluyen en el repositorio.
- La carpeta `node_modules/` tampoco se sube — se regenera con `npm install`.
- El secreto de sesión está hardcodeado para desarrollo. En producción se debe mover a una variable de entorno `.env`.
