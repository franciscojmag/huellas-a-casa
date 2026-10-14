/**
 * Rutas de notificaciones
 * GET /api/notificaciones          — obtener notificaciones del usuario activo
 * GET /api/notificaciones/conteo   — número de notificaciones no leídas
 * PUT /api/notificaciones/:id/leer — marcar una como leída
 * PUT /api/notificaciones/leer-todas — marcar todas como leídas
 */
const express = require('express');
const { all, get, run } = require('../database/db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren login
router.use(requireLogin);

// ---------------------------------------------------------------
// GET /api/notificaciones
// ---------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const notificaciones = await all(
            `SELECT * FROM notificaciones
             WHERE usuario_id = ?
             ORDER BY fecha DESC
             LIMIT 50`,
            [req.session.usuario.id]
        );
        return res.json(notificaciones);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al obtener notificaciones.' });
    }
});

// ---------------------------------------------------------------
// GET /api/notificaciones/conteo
// Devuelve solo el número de no leídas — se llama frecuentemente
// ---------------------------------------------------------------
router.get('/conteo', async (req, res) => {
    try {
        const result = await get(
            'SELECT COUNT(*) AS total FROM notificaciones WHERE usuario_id = ? AND leida = 0',
            [req.session.usuario.id]
        );
        return res.json({ total: result.total });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al obtener conteo.' });
    }
});

// ---------------------------------------------------------------
// PUT /api/notificaciones/:id/leer
// ---------------------------------------------------------------
router.put('/:id/leer', async (req, res) => {
    try {
        await run(
            'UPDATE notificaciones SET leida = 1 WHERE id = ? AND usuario_id = ?',
            [req.params.id, req.session.usuario.id]
        );
        return res.json({ ok: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al marcar notificación.' });
    }
});

// ---------------------------------------------------------------
// PUT /api/notificaciones/leer-todas
// ---------------------------------------------------------------
router.put('/leer-todas', async (req, res) => {
    try {
        await run(
            'UPDATE notificaciones SET leida = 1 WHERE usuario_id = ?',
            [req.session.usuario.id]
        );
        return res.json({ ok: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al marcar notificaciones.' });
    }
});

module.exports = router;
