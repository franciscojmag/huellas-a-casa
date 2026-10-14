/**
 * Adoptify — Servidor principal
 * Node.js + Express
 */
const express       = require('express');
const session       = require('express-session');
const path          = require('path');

// Importa rutas
const authRoutes           = require('./routes/auth');
const perrosRoutes         = require('./routes/perros');
const adopcionesRoutes     = require('./routes/adopciones');
const reportesRoutes       = require('./routes/reportes');
const adminRoutes          = require('./routes/admin');
const notificacionesRoutes = require('./routes/notificaciones');

const app  = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------
// Middleware global
// ---------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos: CSS, JS, imágenes y uploads
app.use(express.static(path.join(__dirname, 'public')));

// Sesiones
app.use(session({
    secret: 'adoptify_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 horas
        httpOnly: true
    }
}));

// ---------------------------------------------------------------
// Rutas API
// ---------------------------------------------------------------
// Ruta pública: lista de organizaciones con conteo de perros
app.get('/api/organizaciones', async (req, res) => {
    const { all } = require('./database/db');
    try {
        const orgs = await all(`
            SELECT o.*,
                   COUNT(CASE WHEN p.estado != 'adoptado' THEN 1 END) AS perros_activos
            FROM organizaciones o
            LEFT JOIN perros p ON p.org_id = o.id
            GROUP BY o.id
            ORDER BY o.nombre
        `);
        res.json(orgs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener organizaciones.' });
    }
});

app.use('/api/auth',            authRoutes);
app.use('/api/perros',          perrosRoutes);
app.use('/api/adopciones',      adopcionesRoutes);
app.use('/api/reportes',        reportesRoutes);
app.use('/api/admin',           adminRoutes);
app.use('/api/notificaciones',  notificacionesRoutes);

// ---------------------------------------------------------------
// Rutas HTML — sirve las vistas
// ---------------------------------------------------------------
const VIEWS = path.join(__dirname, 'views');

app.get('/',                (req, res) => res.sendFile(path.join(VIEWS, 'index.html')));
app.get('/adoptar',         (req, res) => res.sendFile(path.join(VIEWS, 'adoptar.html')));
app.get('/perro/:id',       (req, res) => res.sendFile(path.join(VIEWS, 'perro.html')));
app.get('/reportar',        (req, res) => res.sendFile(path.join(VIEWS, 'reportar.html')));
app.get('/login',           (req, res) => res.sendFile(path.join(VIEWS, 'login.html')));
app.get('/registro',        (req, res) => res.sendFile(path.join(VIEWS, 'registro.html')));
app.get('/perfil',          (req, res) => res.sendFile(path.join(VIEWS, 'perfil.html')));
app.get('/contacto',        (req, res) => res.sendFile(path.join(VIEWS, 'contacto.html')));
app.get('/organizaciones',  (req, res) => res.sendFile(path.join(VIEWS, 'organizaciones.html')));
app.get('/dashboard',       (req, res) => res.sendFile(path.join(VIEWS, 'dashboard', 'index.html')));
app.get('/dashboard/perros',       (req, res) => res.sendFile(path.join(VIEWS, 'dashboard', 'perros.html')));
app.get('/dashboard/solicitudes',  (req, res) => res.sendFile(path.join(VIEWS, 'dashboard', 'solicitudes.html')));
app.get('/dashboard/reportes',     (req, res) => res.sendFile(path.join(VIEWS, 'dashboard', 'reportes.html')));

// Rutas que Express no reconoce → 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(VIEWS, 'index.html'));
});

// ---------------------------------------------------------------
// Manejador global de errores
// ---------------------------------------------------------------
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor.' });
});

// ---------------------------------------------------------------
// Inicia el servidor
// ---------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`\n🐾 Adoptify corriendo en http://localhost:${PORT}\n`);
});
