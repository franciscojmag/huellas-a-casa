/**
 * migrate.js — Agrega columnas lat/lng a la tabla reportes
 * Ejecutar UNA sola vez: node database/migrate.js
 * Es seguro correrlo varias veces (usa IF NOT EXISTS implícito con try/catch).
 */
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'huellas.db'), (err) => {
    if (err) { console.error('No se pudo abrir la BD:', err.message); process.exit(1); }
    console.log('BD conectada. Ejecutando migración...');
});

const columnas = [
    { nombre: 'lat', tipo: 'REAL' },
    { nombre: 'lng', tipo: 'REAL' }
];

let completadas = 0;

columnas.forEach(({ nombre, tipo }) => {
    db.run(`ALTER TABLE reportes ADD COLUMN ${nombre} ${tipo}`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column')) {
                console.log(`  ✓ Columna '${nombre}' ya existe — omitida.`);
            } else {
                console.error(`  ✗ Error en columna '${nombre}':`, err.message);
            }
        } else {
            console.log(`  ✓ Columna '${nombre}' agregada.`);
        }

        completadas++;
        if (completadas === columnas.length) {
            db.close(() => console.log('Migración completada.'));
        }
    });
});
