/**
 * Rutas de autenticación
 * POST /api/auth/login
 * POST /api/auth/registro
 * POST /api/auth/logout
 * GET  /api/auth/me
 */
const express = require('express');
const bcrypt  = require('bcrypt');
const { get, run } = require('../database/db');

const router = express.Router();
const SALT_ROUNDS = 10;

// ---------------------------------------------------------------
// GET /api/auth/me — devuelve el usuario de la sesión activa
// ---------------------------------------------------------------
router.get('/me', (req, res) => {
    if (req.session.usuario) {
        return res.json({ ok: true, usuario: req.session.usuario });
    }
    return res.json({ ok: false, usuario: null });
});

// ---------------------------------------------------------------
// POST /api/auth/login
// Body: { email, password }
// ---------------------------------------------------------------
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    try {
        const usuario = await get('SELECT * FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);

        if (!usuario) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
        }

        const match = await bcrypt.compare(password, usuario.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
        }

        // Guarda datos en sesión (sin el hash)
        req.session.usuario = {
            id:     usuario.id,
            nombre: usuario.nombre,
            email:  usuario.email,
            rol:    usuario.rol
        };

        // Si es org, verifica que tenga registro en organizaciones
        if (usuario.rol === 'org') {
            const org = await get('SELECT id FROM organizaciones WHERE usuario_id = ?', [usuario.id]);

            if (!org) {
                // Usuario con rol org pero sin organización vinculada — estado corrupto
                return res.status(403).json({
                    error: 'Esta cuenta de organización está incompleta o fue eliminada. Contacta al administrador.'
                });
            }

            req.session.usuario.org_id = org.id;
        }

        return res.json({ ok: true, usuario: req.session.usuario });
    } catch (err) {
        console.error('Error en login:', err);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ---------------------------------------------------------------
// POST /api/auth/registro
// Body: { nombre, email, password, telefono, rol, nombre_org?, descripcion_org?, direccion_org? }
// ---------------------------------------------------------------
router.post('/registro', async (req, res) => {
    const { nombre, email, password, telefono, rol,
            nombre_org, descripcion_org, direccion_org } = req.body;

    if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ error: 'Nombre, email, contraseña y rol son obligatorios.' });
    }

    if (!['ciudadano', 'org'].includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    if (rol === 'org' && !nombre_org) {
        return res.status(400).json({ error: 'El nombre de la organización es obligatorio.' });
    }

    try {
        // Verifica que el email no exista
        const existe = await get('SELECT id FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
        if (existe) {
            return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
        }

        const hash = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await run(
            'INSERT INTO usuarios (nombre, email, password_hash, telefono, rol) VALUES (?, ?, ?, ?, ?)',
            [nombre.trim(), email.trim().toLowerCase(), hash, telefono || null, rol]
        );

        const nuevoId = result.lastID;

        // Si es organización, crea el registro en la tabla organizaciones
        if (rol === 'org') {
            await run(
                'INSERT INTO organizaciones (usuario_id, nombre, descripcion, direccion, telefono) VALUES (?, ?, ?, ?, ?)',
                [nuevoId, nombre_org.trim(), descripcion_org || null, direccion_org || null, telefono || null]
            );
        }

        // Inicia sesión automáticamente
        req.session.usuario = { id: nuevoId, nombre: nombre.trim(), email: email.trim().toLowerCase(), rol };

        if (rol === 'org') {
            const org = await get('SELECT id FROM organizaciones WHERE usuario_id = ?', [nuevoId]);
            if (org) req.session.usuario.org_id = org.id;
        }

        return res.status(201).json({ ok: true, usuario: req.session.usuario });
    } catch (err) {
        console.error('Error en registro:', err);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ---------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'No se pudo cerrar sesión.' });
        res.clearCookie('connect.sid');
        return res.json({ ok: true });
    });
});

module.exports = router;
