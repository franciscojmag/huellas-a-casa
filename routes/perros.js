/**
 * Rutas públicas de perros
 * GET /api/perros          — catálogo con filtros opcionales
 * GET /api/perros/:id      — detalle de un perro
 * GET /api/perros/stats    — estadísticas para el hero de la página
 */
const express = require('express');
const { all, get } = require('../database/db');

const router = express.Router();

// ---------------------------------------------------------------
// GET /api/perros/stats
// Devuelve contadores para la sección hero del index
// ---------------------------------------------------------------
router.get('/stats', async (req, res) => {
    try {
        const rescatados  = await get('SELECT COUNT(*) AS total FROM perros');
        const adoptados   = await get("SELECT COUNT(*) AS total FROM perros WHERE estado = 'adoptado'");
        const orgs        = await get('SELECT COUNT(*) AS total FROM organizaciones');

        return res.json({
            rescatados: rescatados.total,
            adoptados:  adoptados.total,
            orgs:       orgs.total
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al obtener estadísticas.' });
    }
});

// ---------------------------------------------------------------
// GET /api/perros
// Query params: sexo, estado, edad (cachorros=<12, adultos=>12)
// ---------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const { sexo, estado, edad } = req.query;

        let sql = `
            SELECT p.*, o.nombre AS org_nombre
            FROM perros p
            JOIN organizaciones o ON p.org_id = o.id
            WHERE 1=1
        `;
        const params = [];

        if (sexo && ['macho', 'hembra'].includes(sexo)) {
            sql += ' AND p.sexo = ?';
            params.push(sexo);
        }

        if (estado && ['disponible', 'en_proceso', 'adoptado'].includes(estado)) {
            sql += ' AND p.estado = ?';
            params.push(estado);
        } else if (!estado) {
            // Por defecto solo muestra disponibles y en proceso
            sql += " AND p.estado != 'adoptado'";
        }

        if (edad === 'cachorros') {
            sql += ' AND p.edad_meses < 12';
        } else if (edad === 'adultos') {
            sql += ' AND p.edad_meses >= 12';
        }

        sql += ' ORDER BY p.fecha_registro DESC';

        const perros = await all(sql, params);
        return res.json(perros);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al obtener perros.' });
    }
});

// ---------------------------------------------------------------
// GET /api/perros/:id
// ---------------------------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        const perro = await get(`
            SELECT p.*, o.nombre AS org_nombre, o.telefono AS org_telefono,
                   o.direccion AS org_direccion
            FROM perros p
            JOIN organizaciones o ON p.org_id = o.id
            WHERE p.id = ?
        `, [req.params.id]);

        if (!perro) {
            return res.status(404).json({ error: 'Perro no encontrado.' });
        }

        return res.json(perro);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al obtener el perro.' });
    }
});

module.exports = router;
