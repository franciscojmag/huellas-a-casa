/**
 * main.js — Scripts globales cargados en todas las páginas.
 * Maneja: navbar, sesión, campana de notificaciones, menú móvil.
 */

// ---------------------------------------------------------------
// Utilidades globales
// ---------------------------------------------------------------
function formatEdad(meses) {
    if (meses < 1)  return 'Recién nacido';
    if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    const años  = Math.floor(meses / 12);
    const resto = meses % 12;
    let txt = `${años} ${años === 1 ? 'año' : 'años'}`;
    if (resto > 0) txt += ` y ${resto} ${resto === 1 ? 'mes' : 'meses'}`;
    return txt;
}

function showMsg(el, texto, tipo = 'error') {
    el.textContent = texto;
    el.className   = `form-msg ${tipo}`;
    el.classList.remove('hidden');
}

function fotoUrl(url) {
    return url ? url : '/img/dog-placeholder.svg';
}

function estadoLabel(estado) {
    const map = { disponible: '✓ Disponible', en_proceso: '⏳ En proceso', adoptado: '🏠 Adoptado' };
    return map[estado] || estado;
}

function formatFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    const ahora = new Date();
    const diff  = Math.floor((ahora - fecha) / 1000); // segundos

    if (diff < 60)     return 'hace un momento';
    if (diff < 3600)   return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400)  return `hace ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `hace ${Math.floor(diff / 86400)} días`;
    return fecha.toLocaleDateString('es-MX', { dateStyle: 'medium' });
}

window.HuellaUtils = { formatEdad, showMsg, fotoUrl, estadoLabel, formatFecha };

// ---------------------------------------------------------------
// Navbar — estado de sesión y campana
// ---------------------------------------------------------------
let usuarioSesion    = null;
let intervaloNotif   = null;

async function actualizarNavbar() {
    const navAuth = document.getElementById('navAuth');
    if (!navAuth) return;

    try {
        const res  = await fetch('/api/auth/me');
        const data = await res.json();

        if (data.ok && data.usuario) {
            usuarioSesion = data.usuario;
            const u = data.usuario;

            if (u.rol === 'org') {
                navAuth.innerHTML = `
                    <a href="/dashboard" class="btn btn-outline">Panel</a>
                    <button id="btnNavLogout" class="btn btn-primary">Cerrar sesión</button>
                `;
            } else {
                // Ciudadano: muestra campana + nombre
                navAuth.innerHTML = `
                    <div class="notif-wrapper" id="notifWrapper">
                        <button class="notif-btn" id="notifBtn" aria-label="Notificaciones">
                            🔔
                            <span class="notif-badge hidden" id="notifBadge">0</span>
                        </button>

                        <div class="notif-panel hidden" id="notifPanel">
                            <div class="notif-panel-header">
                                <span>Notificaciones</span>
                                <button id="btnLeerTodas">Marcar todas como leídas</button>
                            </div>
                            <div class="notif-list" id="notifList">
                                <p class="notif-empty">Cargando...</p>
                            </div>
                            <div class="notif-panel-footer">
                                <a href="/perfil">Ver mi perfil y solicitudes</a>
                            </div>
                        </div>
                    </div>
                    <a href="/perfil" class="nav-user">Hola, ${u.nombre.split(' ')[0]}</a>
                    <button id="btnNavLogout" class="btn btn-outline">Cerrar sesión</button>
                `;

                initCampana();
            }

            document.getElementById('btnNavLogout')
                ?.addEventListener('click', logout);

        }
    } catch (_) { /* sin sesión */ }
}

// ---------------------------------------------------------------
// Campana de notificaciones
// ---------------------------------------------------------------
function initCampana() {
    const btn   = document.getElementById('notifBtn');
    const panel = document.getElementById('notifPanel');

    if (!btn || !panel) return;

    // Abre/cierra el panel
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const abierto = !panel.classList.contains('hidden');
        if (abierto) {
            cerrarPanel();
        } else {
            abrirPanel();
        }
    });

    // Cierra al hacer clic fuera
    document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('notifWrapper');
        if (wrapper && !wrapper.contains(e.target)) {
            cerrarPanel();
        }
    });

    // Botón "marcar todas como leídas"
    document.getElementById('btnLeerTodas')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        await fetch('/api/notificaciones/leer-todas', { method: 'PUT' });
        await cargarNotificaciones();
        actualizarBadge(0);
    });

    // Carga inicial
    cargarConteo();

    // Refresca el conteo cada 30 segundos
    intervaloNotif = setInterval(cargarConteo, 30000);
}

async function abrirPanel() {
    const panel = document.getElementById('notifPanel');
    if (!panel) return;
    panel.classList.remove('hidden');
    await cargarNotificaciones();
}

function cerrarPanel() {
    document.getElementById('notifPanel')?.classList.add('hidden');
}

async function cargarConteo() {
    try {
        const res  = await fetch('/api/notificaciones/conteo');
        if (!res.ok) return;
        const data = await res.json();
        actualizarBadge(data.total);
    } catch (_) { /* silencioso */ }
}

function actualizarBadge(total) {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;

    if (total > 0) {
        badge.textContent = total > 99 ? '99+' : total;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

async function cargarNotificaciones() {
    const lista = document.getElementById('notifList');
    if (!lista) return;

    try {
        const res   = await fetch('/api/notificaciones');
        const items = await res.json();

        if (!Array.isArray(items) || items.length === 0) {
            lista.innerHTML = '<p class="notif-empty">No tienes notificaciones.</p>';
            actualizarBadge(0);
            return;
        }

        lista.innerHTML = items.map(n => `
            <div class="notif-item ${n.leida ? 'leida' : 'no-leida'}"
                 data-id="${n.id}" onclick="marcarLeida(${n.id}, this)">
                <span class="notif-icono">${iconoNotif(n.tipo)}</span>
                <div class="notif-contenido">
                    <p class="notif-titulo">${n.titulo}</p>
                    <p class="notif-mensaje">${n.mensaje}</p>
                    <p class="notif-fecha">${formatFecha(n.fecha)}</p>
                </div>
                <span class="notif-dot"></span>
            </div>
        `).join('');

        // Actualiza el badge con las no leídas
        const noLeidas = items.filter(n => !n.leida).length;
        actualizarBadge(noLeidas);

    } catch (_) {
        lista.innerHTML = '<p class="notif-empty">Error al cargar.</p>';
    }
}

function iconoNotif(tipo) {
    const iconos = {
        solicitud_aprobada:  '🎉',
        solicitud_rechazada: '😔',
        default:             '🔔'
    };
    return iconos[tipo] || iconos.default;
}

async function marcarLeida(id, el) {
    if (el.classList.contains('leida')) return; // ya leída

    try {
        await fetch(`/api/notificaciones/${id}/leer`, { method: 'PUT' });
        el.classList.remove('no-leida');
        el.classList.add('leida');
        el.querySelector('.notif-dot').style.visibility = 'hidden';

        // Baja el conteo del badge
        const badge = document.getElementById('notifBadge');
        if (badge && !badge.classList.contains('hidden')) {
            const actual = parseInt(badge.textContent) || 0;
            actualizarBadge(Math.max(0, actual - 1));
        }
    } catch (_) { /* silencioso */ }
}

// Expone marcarLeida globalmente (se llama desde onclick en el HTML dinámico)
window.marcarLeida = marcarLeida;

// ---------------------------------------------------------------
// Logout
// ---------------------------------------------------------------
async function logout() {
    if (intervaloNotif) clearInterval(intervaloNotif);
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

    function cerrar() {
        links?.classList.remove('open');
        auth?.classList.remove('open');
        toggle.textContent = '☰';
    }

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        links?.classList.contains('open') ? cerrar() : (() => {
            links?.classList.add('open');
            auth?.classList.add('open');
            toggle.textContent = '✕';
        })();
    });

    // Cierra al hacer clic fuera del navbar
    document.addEventListener('click', (e) => {
        if (!document.querySelector('.navbar')?.contains(e.target)) cerrar();
    });

    // Cierra al navegar
    links?.querySelectorAll('a').forEach(a => a.addEventListener('click', cerrar));
}

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    actualizarNavbar();
    initNavToggle();
});
