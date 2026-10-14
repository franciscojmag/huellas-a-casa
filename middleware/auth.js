/**
 * Middleware de autenticación y autorización
 * Adoptify
 */

/** Verifica que el usuario haya iniciado sesión */
function requireLogin(req, res, next) {
    if (req.session && req.session.usuario) {
        return next();
    }
    // Solicitudes AJAX devuelven JSON, navegador redirige
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.status(401).json({ error: 'Debes iniciar sesión.' });
    }
    return res.redirect('/login.html');
}

/** Verifica que el usuario sea una organización */
function requireOrg(req, res, next) {
    if (req.session && req.session.usuario && req.session.usuario.rol === 'org') {
        return next();
    }
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.status(403).json({ error: 'Acceso restringido a organizaciones.' });
    }
    return res.redirect('/login.html');
}

/** Verifica que el usuario sea ciudadano */
function requireCiudadano(req, res, next) {
    if (req.session && req.session.usuario && req.session.usuario.rol === 'ciudadano') {
        return next();
    }
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.status(403).json({ error: 'Acceso restringido a ciudadanos registrados.' });
    }
    return res.redirect('/login.html');
}

module.exports = { requireLogin, requireOrg, requireCiudadano };
