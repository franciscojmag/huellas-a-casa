/**
 * migrate_notificaciones.js
 * Crea la tabla notificaciones si no existe.
 * Ejecutar: node database/migrate_notificaciones.js
 */
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'huellas.db'), (err) => {
    if (err) { console.error('No se pudo abrir la BD:', err.message); process.exit(1); }
    console.log('BD conectada. Ejecutando migración de notificaciones...');
});

db.run(`
    CREATE TABLE IF NOT EXISTS notificaciones (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo        TEXT    NOT NULL,
        titulo      TEXT    NOT NULL,
        mensaje     TEXT    NOT NULL,
        leida       INTEGER NOT NULL DEFAULT 0,
        fecha       TEXT    NOT NULL DEFAULT (datetime('now'))
    )
`, (err) => {
    if (err) {
        console.error('Error al crear tabla:', err.message);
    } else {
        console.log('✓ Tabla notificaciones creada (o ya existía).');
    }
    db.close(() => console.log('Migración completada.'));
});
