const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const fs      = require('fs');

const DB_PATH     = path.join(__dirname, 'huellas.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Abre (o crea) la base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error al abrir la base de datos:', err.message);
        process.exit(1);
    }
    console.log('Base de datos conectada:', DB_PATH);
});

// Activa foreign keys en cada conexión
db.run('PRAGMA foreign_keys = ON');

// Si la BD es nueva, ejecuta el schema con los datos de prueba
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'", (err, row) => {
    if (err) { console.error(err); return; }
    if (!row) {
        console.log('Inicializando base de datos con schema.sql...');
        const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
        db.exec(sql, (execErr) => {
            if (execErr) {
                console.error('Error al ejecutar schema.sql:', execErr.message);
            } else {
                console.log('Base de datos inicializada con datos de prueba.');
            }
        });
    }
});

// ---------------------------------------------------------------
// Helpers con promesas para evitar callback hell en las rutas
// ---------------------------------------------------------------

/** SELECT que devuelve múltiples filas */
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

/** SELECT que devuelve una sola fila */
function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

/** INSERT / UPDATE / DELETE — devuelve { lastID, changes } */
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

module.exports = { db, all, get, run };
