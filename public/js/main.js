/**
 * main.js — Scripts globales
 * Se carga en todas las páginas.
 * Maneja: navbar auth state, menú móvil, utilidades compartidas.
 */

// ---------------------------------------------------------------
// Utilidades globales
// ---------------------------------------------------------------

/** Formatea edad en meses a texto legible */
function formatEdad(meses) {
    if (meses < 1)  return 'Recién nacido';
    if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    const años = Math.floor(meses / 12);
    const resto = meses % 12;
    let txt = `${años} ${años === 1 ? 'año' : 'años'}`;
    if (resto > 0) txt += ` y ${resto} ${resto === 1 ? 'mes' : 'meses'}`;
    return txt;
}

/** Muestra un mensaje de éxito o error en un elemento */
function showMsg(el, texto, tipo = 'error') {
    el.textContent = texto;
    el.className = `form-msg ${tipo}`;
    el.classList.remove('hidden');
}

/** Genera la URL de la foto del perro (o placeholder SVG) */
function fotoUrl(url) {
    return url ? url : '/img/dog-placeholder.svg';
}

/** Devuelve el label del estado del perro */
function estadoLabel(estado) {
    const map = { disponible: '✓ Disponible', en_proceso: '⏳ En proceso', adoptado: '🏠 Adoptado' };
    return map[estado] || estado;
}

// Expone utilidades globalmente
window.HuellaUtils = { formatEdad, showMsg, fotoUrl, estadoLabel };

// ---------------------------------------------------------------
// Estado de sesión en el navbar
// ---------------------------------------------------------------
async function actualizarNavbar() {
    const navAuth = document.getElementById('navAuth');
    if (!navAuth) return;

    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (data.ok && data.usuario) {
            const u = data.usuario;
            if (u.rol === 'org') {
                navAuth.innerHTML = `
                    <a href="/dashboard" class="btn btn-outline">Panel</a>
                    <button id="btnNavLogout" class="btn btn-primary">Cerrar sesión</button>
                `;
            } else {
                navAuth.innerHTML = `
                    <span class="nav-user">Hola, ${u.nombre.split(' ')[0]}</span>
                    <button id="btnNavLogout" class="btn btn-outline">Cerrar sesión</button>
                `;
            }

            document.getElementById('btnNavLogout')?.addEventListener('click', logout);
        }
    } catch (_) { /* sin sesión, muestra botones por defecto */ }
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
}

// ---------------------------------------------------------------
// Menú móvil
// ---------------------------------------------------------------
function initNavToggle() {
    const toggle = document.getElementById('navToggle');
    const links  = document.querySelector('.nav-links');
    const auth   = document.querySelector('.nav-auth');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
        links?.classList.toggle('open');
        auth?.classList.toggle('open');
    });
}

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    actualizarNavbar();
    initNavToggle();
});
