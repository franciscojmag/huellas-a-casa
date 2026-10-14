-- ============================================================
-- Adoptify - Schema de base de datos
-- Ejecutar este archivo en DB Browser for SQLite
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- Tabla: usuarios
-- Roles: 'ciudadano' | 'org'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre          TEXT    NOT NULL,
    email           TEXT    NOT NULL UNIQUE,
    password_hash   TEXT    NOT NULL,
    telefono        TEXT,
    rol             TEXT    NOT NULL DEFAULT 'ciudadano' CHECK(rol IN ('ciudadano', 'org')),
    fecha_registro  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
-- Tabla: organizaciones
-- Una organización está vinculada a un usuario con rol='org'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizaciones (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id  INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre      TEXT    NOT NULL,
    descripcion TEXT,
    direccion   TEXT,
    telefono    TEXT,
    logo_url    TEXT
);

-- ------------------------------------------------------------
-- Tabla: perros
-- Estado: 'disponible' | 'en_proceso' | 'adoptado'
-- Sexo:   'macho' | 'hembra'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perros (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id          INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    nombre          TEXT    NOT NULL,
    edad_meses      INTEGER NOT NULL DEFAULT 0,
    sexo            TEXT    NOT NULL CHECK(sexo IN ('macho', 'hembra')),
    raza            TEXT    NOT NULL DEFAULT 'Mestizo',
    descripcion     TEXT,
    foto_url        TEXT,
    estado          TEXT    NOT NULL DEFAULT 'disponible' CHECK(estado IN ('disponible', 'en_proceso', 'adoptado')),
    fecha_registro  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
-- Tabla: solicitudes_adopcion
-- Estado: 'pendiente' | 'aprobada' | 'rechazada'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS solicitudes_adopcion (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    perro_id        INTEGER NOT NULL REFERENCES perros(id) ON DELETE CASCADE,
    ciudadano_id    INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mensaje         TEXT,
    estado          TEXT    NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'aprobada', 'rechazada')),
    fecha           TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
-- Tabla: reportes
-- Estado animal: 'herido' | 'asustado' | 'enfermo' | 'solo' | 'otro'
-- Estado reporte: 'pendiente' | 'atendido' | 'cerrado'
-- ciudadano_id puede ser NULL si el reporte es anónimo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reportes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ciudadano_id    INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    ubicacion       TEXT    NOT NULL,
    lat             REAL,
    lng             REAL,
    estado_animal   TEXT    NOT NULL CHECK(estado_animal IN ('herido', 'asustado', 'enfermo', 'solo', 'otro')),
    descripcion     TEXT,
    foto_url        TEXT,
    estado_reporte  TEXT    NOT NULL DEFAULT 'pendiente' CHECK(estado_reporte IN ('pendiente', 'atendido', 'cerrado')),
    fecha           TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Tabla: notificaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS notificaciones (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo        TEXT    NOT NULL,
    titulo      TEXT    NOT NULL,
    mensaje     TEXT    NOT NULL,
    leida       INTEGER NOT NULL DEFAULT 0,
    fecha       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- DATOS DE PRUEBA
-- ============================================================

-- Contraseña para todos los usuarios de prueba: "huellas123"
-- Hash generado con bcrypt rounds=10
-- Si quieres cambiarla, genera el hash con Node:
--   node -e "const b=require('bcrypt'); b.hash('tu_password',10).then(console.log)"

INSERT OR IGNORE INTO usuarios (id, nombre, email, password_hash, telefono, rol) VALUES
(1, 'Rescate San Pedro AC', 'rescate@sanpedro.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '8444001122', 'org'),
(2, 'Patitas Felices', 'patitas@felices.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '8444003344', 'org'),
(3, 'Ana García', 'ana@email.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '8441112233', 'ciudadano'),
(4, 'Carlos López', 'carlos@email.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '8442223344', 'ciudadano');

INSERT OR IGNORE INTO organizaciones (id, usuario_id, nombre, descripcion, direccion, telefono) VALUES
(1, 1, 'Rescate San Pedro AC',
 'Organización dedicada al rescate y adopción de perros en San Pedro de las Colonias desde 2018.',
 'Calle Zaragoza 210, Col. Centro, San Pedro, Coah.', '8444001122'),
(2, 2, 'Patitas Felices',
 'Asociación civil que trabaja por el bienestar animal en la región lagunera.',
 'Av. Juárez 450, San Pedro, Coah.', '8444003344');

INSERT OR IGNORE INTO perros (id, org_id, nombre, edad_meses, sexo, raza, descripcion, foto_url, estado) VALUES
(1, 1, 'Max',   5,  'macho',   'Mestizo',
 'Max es muy juguetón y amigable. Fue rescatado hace 3 meses y ya cuenta con todas sus vacunas. Ideal para familias activas.',
 NULL, 'disponible'),
(2, 1, 'Luna',  8,  'hembra',  'Golden Mix',
 'Una cachorra llena de energía y amor. Ideal para familias con niños y espacio para correr. Completamente vacunada.',
 NULL, 'disponible'),
(3, 1, 'Rocky', 24, 'macho',   'Labrador Mix',
 'Rocky es tranquilo y leal. Perfecto para personas que buscan un compañero de vida sereno y cariñoso.',
 NULL, 'disponible'),
(4, 2, 'Bella', 14, 'hembra',  'Mestiza',
 'Bella fue rescatada de la calle hace 6 meses. Es muy sociable con personas y otros perros.',
 NULL, 'disponible'),
(5, 2, 'Thor',  36, 'macho',   'Pastor Mix',
 'Thor es inteligente y activo. Responde bien a comandos básicos. Necesita espacio para ejercitarse.',
 NULL, 'en_proceso'),
(6, 1, 'Nala',  3,  'hembra',  'Mestiza',
 'Pequeña cachorra encontrada en la carretera. Muy juguetona, ya tiene sus primeras vacunas.',
 NULL, 'disponible');

INSERT OR IGNORE INTO reportes (id, ciudadano_id, ubicacion, estado_animal, descripcion, estado_reporte) VALUES
(1, 3, 'Calle Hidalgo esq. Zaragoza, Col. Centro, San Pedro', 'herido',
 'Perro con pata trasera lastimada, no puede caminar bien. Color café con manchas blancas.', 'pendiente'),
(2, 4, 'Av. Juárez frente a la plaza, San Pedro', 'solo',
 'Perro pequeño, negro, lleva varios días en el mismo lugar. Parece asustado.', 'atendido'),
(3, NULL, 'Calle Morelos 312, San Pedro, Coah.', 'asustado',
 'Perro mediano, blanco, se esconde debajo de un carro. Parece no tener dueño.', 'pendiente');
