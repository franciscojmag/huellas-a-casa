/**
 * Rutas de solicitudes de adopción
 * POST /api/adopciones            — enviar solicitud (ciudadano)
 * GET  /api/adopciones/mis        — ver mis solicitudes (ciudadano)
 */
const express = require('express');
const { get, run, all } = require('../database/db');
const { requireLogin, requireCiudadano } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------
// POST /api/adopciones
// Body: { perro_id, mensaje }
// Solo ciudadanos registrados
// ---------------------------------------------------------------
router.post('/', requireLogin, requireCiudadano, async (req, res) => {
    const { perro_id, mensaje } = req.body;
    const ciudadano_id = req.session.usuario.id;

    if (!perro_id) {
        return res.status(400).json({ error: 'El ID del perro es obligatorio.' });
    }

    try {
        // Verifica que el perro exista y esté disponible
        const perro = await get("SELECT * FROM perros WHERE id = ? AND estado = 'disponible'", [perro_id]);
        if (!perro) {
            return res.status(404).json({ error: 'El perro no está disponible para adopción.' });
        }

        // Verifica que no exista ya una solicitud pendiente del mismo usuario
        const yaExiste = await get(
            "SELECT id FROM solicitudes_adopcion WHERE perro_id = ? AND ciudadano_id = ? AND estado = 'pendiente'",
            [perro_id, ciudadano_id]
        );
        if (yaExiste) {
            return res.status(409).json({ error: 'Ya tienes una solicitud pendiente para este perro.' });
        }

        const result = await run(
            'INSERT INTO solicitudes_adopcion (perro_id, ciudadano_id, mensaje) VALUES (?, ?, ?)',
            [perro_id, ciudadano_id, mensaje || null]
        );

        // Cambia estado del perro a en_proceso
        await run("UPDATE perros SET estado = 'en_proceso' WHERE id = ?", [perro_id]);

        return res.status(201).json({ ok: true, id: result.lastID });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al enviar la solicitud.' });
    }
});

// ---------------------------------------------------------------
// GET /api/adopciones/mis
// Solicitudes del ciudadano autenticado
// ---------------------------------------------------------------
router.get('/mis', requireLogin, requireCiudadano, async (req, res) => {
    try {
        const solicitudes = await all(`
            SELECT sa.*, p.nombre AS perro_nombre, p.foto_url, p.raza,
                   o.nombre AS org_nombre
            FROM solicitudes_adopcion sa
            JOIN perros p ON sa.perro_id = p.id
            JOIN organizaciones o ON p.org_id = o.id
            WHERE sa.ciudadano_id = ?
            ORDER BY sa.fecha DESC
        `, [req.session.usuario.id]);

        return res.json(solicitudes);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al obtener solicitudes.' });
    }
});

module.exports = router;
