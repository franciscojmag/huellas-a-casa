/**
 * Rutas de reportes ciudadanos
 * POST /api/reportes     — crear reporte (requiere login)
 * GET  /api/reportes/mis — mis reportes (ciudadano autenticado)
 */
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { run, all } = require('../database/db');
const { requireLogin, requireCiudadano } = require('../middleware/auth');

const router = express.Router();

// Configuración de multer para subida de fotos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        const ext   = path.extname(file.originalname).toLowerCase();
        const nombre = `reporte_${Date.now()}${ext}`;
        cb(null, nombre);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // max 5 MB

// ---------------------------------------------------------------
// POST /api/reportes
// Form-data: { ubicacion, lat?, lng?, estado_animal, descripcion, foto? }
// Requiere sesión activa (ciudadano o org)
// ---------------------------------------------------------------
router.post('/', requireLogin, upload.single('foto'), async (req, res) => {
    const { ubicacion, estado_animal, descripcion, lat, lng } = req.body;

    if (!ubicacion || !estado_animal) {
        return res.status(400).json({ error: 'Ubicación y estado del animal son obligatorios.' });
    }

    const estadosValidos = ['herido', 'asustado', 'enfermo', 'solo', 'otro'];
    if (!estadosValidos.includes(estado_animal)) {
        return res.status(400).json({ error: 'Estado del animal no válido.' });
    }

    const ciudadano_id = req.session.usuario.id;
    const foto_url     = req.file ? `/uploads/${req.file.filename}` : null;

    // Convierte coordenadas a número si vienen como string del FormData
    const latNum = lat ? parseFloat(lat) : null;
    const lngNum = lng ? parseFloat(lng) : null;

    try {
        const result = await run(
            `INSERT INTO reportes
                (ciudadano_id, ubicacion, lat, lng, estado_animal, descripcion, foto_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [ciudadano_id, ubicacion.trim(), latNum, lngNum, estado_animal, descripcion || null, foto_url]
        );

        return res.status(201).json({ ok: true, id: result.lastID });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al registrar el reporte.' });
    }
});

// ---------------------------------------------------------------
// GET /api/reportes/mis
// Reportes del ciudadano autenticado
// ---------------------------------------------------------------
router.get('/mis', requireLogin, requireCiudadano, async (req, res) => {
    try {
        const reportes = await all(
            'SELECT * FROM reportes WHERE ciudadano_id = ? ORDER BY fecha DESC',
            [req.session.usuario.id]
        );
        return res.json(reportes);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al obtener reportes.' });
    }
});

module.exports = router;
