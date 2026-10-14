/**
 * Rutas del panel de administración (solo organizaciones)
 *
 * Perros:
 *   GET    /api/admin/perros              — listar perros de la org
 *   POST   /api/admin/perros              — agregar perro
 *   PUT    /api/admin/perros/:id          — editar perro
 *   DELETE /api/admin/perros/:id          — eliminar perro
 *
 * Solicitudes:
 *   GET    /api/admin/solicitudes         — listar solicitudes de la org
 *   PUT    /api/admin/solicitudes/:id     — aprobar/rechazar solicitud
 *
 * Reportes:
 *   GET    /api/admin/reportes            — listar todos los reportes
 *   PUT    /api/admin/reportes/:id        — cambiar estado del reporte
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const { all, get, run } = require('../database/db');
const { requireOrg } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren rol org
router.use(requireOrg);

// Multer para fotos de perros
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `perro_${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

// ================================================================
// PERROS
// ================================================================

// GET /api/admin/perros
router.get('/perros', async (req, res) => {
    try {
        const perros = await all(
            'SELECT * FROM perros WHERE org_id = ? ORDER BY fecha_registro DESC',
            [req.session.usuario.org_id]
        );
        return res.json(perros);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al obtener perros.' });
    }
});

// POST /api/admin/perros
router.post('/perros', upload.single('foto'), async (req, res) => {
    const { nombre, edad_meses, sexo, raza, descripcion, estado } = req.body;

    if (!nombre || !sexo) {
        return res.status(400).json({ error: 'Nombre y sexo son obligatorios.' });
    }

    const foto_url = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const result = await run(
            `INSERT INTO perros (org_id, nombre, edad_meses, sexo, raza, descripcion, foto_url, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.session.usuario.org_id,
                nombre.trim(),
                parseInt(edad_meses) || 0,
                sexo,
                raza || 'Mestizo',
                descripcion || null,
                foto_url,
                estado || 'disponible'
            ]
        );
        return res.status(201).json({ ok: true, id: result.lastID });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al agregar el perro.' });
    }
});

// PUT /api/admin/perros/:id
// También acepta POST con campo _method=PUT (multer v1 no parsea body en PUT)
const editarPerroHandler = async (req, res) => {
    const { nombre, edad_meses, sexo, raza, descripcion, estado } = req.body;

    try {
        // Verifica que el perro pertenezca a la org
        const perro = await get('SELECT * FROM perros WHERE id = ? AND org_id = ?',
            [req.params.id, req.session.usuario.org_id]);
        if (!perro) return res.status(404).json({ error: 'Perro no encontrado.' });

        const foto_url = req.file ? `/uploads/${req.file.filename}` : perro.foto_url;

        await run(
            `UPDATE perros
             SET nombre = ?, edad_meses = ?, sexo = ?, raza = ?,
                 descripcion = ?, foto_url = ?, estado = ?
             WHERE id = ? AND org_id = ?`,
            [
                nombre || perro.nombre,
                parseInt(edad_meses) >= 0 ? parseInt(edad_meses) : perro.edad_meses,
                sexo || perro.sexo,
                raza || perro.raza,
                descripcion !== undefined ? descripcion : perro.descripcion,
                foto_url,
                estado || perro.estado,
                req.params.id,
                req.session.usuario.org_id
            ]
        );
        return res.json({ ok: true });
    } catch (err) {
        console.error('Error al actualizar perro:', err);
        return res.status(500).json({ error: 'Error al actualizar el perro.' });
    }
};

router.put('/perros/:id', upload.single('foto'), editarPerroHandler);
router.post('/perros/:id', upload.single('foto'), editarPerroHandler);

// DELETE /api/admin/perros/:id
router.delete('/perros/:id', async (req, res) => {
    try {
        const result = await run(
            'DELETE FROM perros WHERE id = ? AND org_id = ?',
            [req.params.id, req.session.usuario.org_id]
        );
        if (result.changes === 0) return res.status(404).json({ error: 'Perro no encontrado.' });
        return res.json({ ok: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al eliminar el perro.' });
    }
});

// ================================================================
// SOLICITUDES DE ADOPCIÓN
// ================================================================

// GET /api/admin/solicitudes
router.get('/solicitudes', async (req, res) => {
    try {
        const solicitudes = await all(`
            SELECT sa.*, p.nombre AS perro_nombre, p.foto_url AS perro_foto,
                   u.nombre AS ciudadano_nombre, u.email AS ciudadano_email,
                   u.telefono AS ciudadano_telefono
            FROM solicitudes_adopcion sa
            JOIN perros p        ON sa.perro_id = p.id
            JOIN usuarios u      ON sa.ciudadano_id = u.id
            WHERE p.org_id = ?
            ORDER BY sa.fecha DESC
        `, [req.session.usuario.org_id]);
        return res.json(solicitudes);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al obtener solicitudes.' });
    }
});

// PUT /api/admin/solicitudes/:id
// Body: { estado: 'aprobada' | 'rechazada' }
router.put('/solicitudes/:id', async (req, res) => {
    const { estado } = req.body;

    if (!['aprobada', 'rechazada'].includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido.' });
    }

    try {
        // Obtiene la solicitud con datos del perro y del ciudadano
        const solicitud = await get(`
            SELECT sa.*,
                   p.id     AS pid,
                   p.nombre AS perro_nombre,
                   o.nombre AS org_nombre,
                   u.email  AS ciudadano_email
            FROM solicitudes_adopcion sa
            JOIN perros        p ON sa.perro_id    = p.id
            JOIN organizaciones o ON p.org_id      = o.id
            JOIN usuarios       u ON sa.ciudadano_id = u.id
            WHERE sa.id = ? AND p.org_id = ?
        `, [req.params.id, req.session.usuario.org_id]);

        if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada.' });

        await run('UPDATE solicitudes_adopcion SET estado = ? WHERE id = ?', [estado, req.params.id]);

        // ── Lógica de estado del perro ───────────────────────────────
        if (estado === 'aprobada') {
            await run("UPDATE perros SET estado = 'adoptado' WHERE id = ?", [solicitud.perro_id]);

            // Rechaza las demás solicitudes pendientes del mismo perro
            const otrasSolicitudes = await all(
                "SELECT id, ciudadano_id FROM solicitudes_adopcion WHERE perro_id = ? AND id != ? AND estado = 'pendiente'",
                [solicitud.perro_id, req.params.id]
            );

            for (const otra of otrasSolicitudes) {
                await run("UPDATE solicitudes_adopcion SET estado = 'rechazada' WHERE id = ?", [otra.id]);

                // Notifica a los demás ciudadanos que su solicitud fue rechazada
                await run(
                    `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje)
                     VALUES (?, 'solicitud_rechazada', ?, ?)`,
                    [
                        otra.ciudadano_id,
                        `Solicitud no aprobada — ${solicitud.perro_nombre}`,
                        `Lamentamos informarte que tu solicitud de adopción para ${solicitud.perro_nombre} no fue aprobada porque otro adoptante fue seleccionado. Te invitamos a explorar otros perritos disponibles.`
                    ]
                );
            }

            // Notifica al ciudadano aprobado
            await run(
                `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje)
                 VALUES (?, 'solicitud_aprobada', ?, ?)`,
                [
                    solicitud.ciudadano_id,
                    `¡Tu solicitud fue aprobada! 🎉 — ${solicitud.perro_nombre}`,
                    `¡Felicidades! La organización ${solicitud.org_nombre} aprobó tu solicitud de adopción para ${solicitud.perro_nombre}. Pronto se pondrán en contacto contigo al correo ${solicitud.ciudadano_email} para coordinar la entrega. ¡Bienvenido a tu nueva familia!`
                ]
            );
        }

        if (estado === 'rechazada') {
            const pendientes = await get(
                "SELECT COUNT(*) AS total FROM solicitudes_adopcion WHERE perro_id = ? AND estado = 'pendiente'",
                [solicitud.perro_id]
            );
            if (pendientes.total === 0) {
                await run("UPDATE perros SET estado = 'disponible' WHERE id = ?", [solicitud.perro_id]);
            }

            // Notifica al ciudadano rechazado
            await run(
                `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje)
                 VALUES (?, 'solicitud_rechazada', ?, ?)`,
                [
                    solicitud.ciudadano_id,
                    `Solicitud no aprobada — ${solicitud.perro_nombre}`,
                    `Lamentamos informarte que tu solicitud de adopción para ${solicitud.perro_nombre} no fue aprobada en esta ocasión. Te invitamos a explorar otros perritos disponibles en Adoptify.`
                ]
            );
        }

        return res.json({ ok: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al actualizar solicitud.' });
    }
});

// ================================================================
// REPORTES CIUDADANOS
// ================================================================

// GET /api/admin/reportes
router.get('/reportes', async (req, res) => {
    try {
        const reportes = await all(`
            SELECT r.*,
                   u.nombre AS ciudadano_nombre,
                   u.email  AS ciudadano_email
            FROM reportes r
            LEFT JOIN usuarios u ON r.ciudadano_id = u.id
            ORDER BY r.fecha DESC
        `);
        return res.json(reportes);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al obtener reportes.' });
    }
});

// PUT /api/admin/reportes/:id
// Body: { estado_reporte: 'pendiente' | 'atendido' | 'cerrado' }
router.put('/reportes/:id', async (req, res) => {
    const { estado_reporte } = req.body;

    if (!['pendiente', 'atendido', 'cerrado'].includes(estado_reporte)) {
        return res.status(400).json({ error: 'Estado inválido.' });
    }

    try {
        const result = await run(
            'UPDATE reportes SET estado_reporte = ? WHERE id = ?',
            [estado_reporte, req.params.id]
        );
        if (result.changes === 0) return res.status(404).json({ error: 'Reporte no encontrado.' });
        return res.json({ ok: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al actualizar el reporte.' });
    }
});

module.exports = router;
