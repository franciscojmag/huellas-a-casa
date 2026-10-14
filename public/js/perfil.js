/**
 * perfil.js — Página de perfil del ciudadano (/perfil)
 */

document.addEventListener('DOMContentLoaded', async () => {
    await verificarSesion();
    initTabs();
    await Promise.all([
        cargarSolicitudes(),
        cargarNotificaciones(),
        cargarReportes()
    ]);
});

// ---------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------
async function verificarSesion() {
    try {
        const res  = await fetch('/api/auth/me');
        const data = await res.json();

        if (!data.ok || !data.usuario) { window.location.href = '/login'; return; }
        if (data.usuario.rol === 'org') { window.location.href = '/dashboard'; return; }

        document.getElementById('perfilNombre').textContent = data.usuario.nombre;
        document.getElementById('perfilEmail').textContent  = data.usuario.email;
        document.title = `${data.usuario.nombre.split(' ')[0]} — Adoptify`;
    } catch (_) {
        window.location.href = '/login';
    }
}

// ---------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------
function initTabs() {
    document.querySelectorAll('.perfil-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.perfil-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });
}

// ---------------------------------------------------------------
// Solicitudes
// ---------------------------------------------------------------
async function cargarSolicitudes() {
    const lista = document.getElementById('listaSolicitudes');
    try {
        const res        = await fetch('/api/adopciones/mis');
        const solicitudes = await res.json();

        if (!Array.isArray(solicitudes) || solicitudes.length === 0) {
            lista.innerHTML = emptyState('🐾', 'Sin solicitudes aún',
                'Aún no has solicitado ninguna adopción.',
                '<a href="/adoptar" class="btn btn-primary btn-sm">Ver perros disponibles</a>');
            return;
        }

        lista.innerHTML = solicitudes.map(tarjetaSolicitud).join('');
    } catch (_) {
        lista.innerHTML = errorState('solicitudes');
    }
}

function tarjetaSolicitud(s) {
    const iconoEstado = { pendiente: '⏳', aprobada: '✅', rechazada: '❌' }[s.estado] || '';
    const claseEstado = `estado-${s.estado}`;

    const aprobadaMsg = s.estado === 'aprobada' ? `
        <div class="solicitud-aprobada-msg">
            🎉 ¡Solicitud aprobada! La organización se pondrá en contacto contigo.
        </div>` : '';

    const mensajeHTML = s.mensaje ? `
        <p class="solicitud-mensaje-perfil">"${s.mensaje}"</p>` : '';

    return `
    <div class="solicitud-card-perfil">
        <img src="${window.HuellaUtils.fotoUrl(s.foto_url)}"
             onerror="this.src='/img/dog-placeholder.svg'"
             class="solicitud-foto-perfil"
             alt="${s.perro_nombre}">
        <div>
            <p class="solicitud-perro-nombre">${s.perro_nombre}</p>
            <div class="solicitud-meta">
                <span>🏠 ${s.org_nombre}</span>
                <span class="solicitud-meta-sep">·</span>
                <span>📅 ${new Date(s.fecha).toLocaleDateString('es-MX', { dateStyle: 'medium' })}</span>
            </div>
            ${aprobadaMsg}
            ${mensajeHTML}
        </div>
        <div class="solicitud-actions">
            <span class="estado-badge ${claseEstado}">
                ${iconoEstado} ${s.estado}
            </span>
            <a href="/perro/${s.perro_id}" class="btn btn-ghost btn-sm">Ver perro</a>
        </div>
    </div>`;
}

// ---------------------------------------------------------------
// Notificaciones
// ---------------------------------------------------------------
async function cargarNotificaciones() {
    const lista = document.getElementById('listaNotificaciones');
    const badge = document.getElementById('tabNotifBadge');

    try {
        const res   = await fetch('/api/notificaciones');
        const items = await res.json();

        if (!Array.isArray(items) || items.length === 0) {
            lista.innerHTML = emptyState('🔔', 'Sin notificaciones',
                'Aquí aparecerán las actualizaciones sobre tus solicitudes.');
            return;
        }

        const noLeidas = items.filter(n => !n.leida).length;
        if (noLeidas > 0 && badge) {
            badge.textContent = noLeidas;
            badge.classList.remove('hidden');
        }

        lista.innerHTML = items.map(tarjetaNotificacion).join('');
    } catch (_) {
        lista.innerHTML = errorState('notificaciones');
    }
}

function tarjetaNotificacion(n) {
    const tipo = n.tipo || 'default';
    const clase = tipo.includes('aprobada') ? 'aprobada'
                : tipo.includes('rechazada') ? 'rechazada'
                : 'default';
    const icono = tipo.includes('aprobada') ? '🎉'
                : tipo.includes('rechazada') ? '😔'
                : '🔔';

    const fecha = new Date(n.fecha);
    const fechaStr = fecha.toLocaleDateString('es-MX', { dateStyle: 'medium' }) +
                     ' · ' + fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    return `
    <div class="notif-card-perfil ${n.leida ? '' : 'no-leida'}"
         onclick="marcarLeidaPerfil(${n.id}, this)">
        <div class="notif-icono-wrap ${clase}">${icono}</div>
        <div class="notif-body-perfil">
            <p class="notif-titulo-perfil">${n.titulo}</p>
            <p class="notif-msg-perfil">${n.mensaje}</p>
            <div class="notif-footer-perfil">
                <span class="notif-fecha-perfil">${fechaStr}</span>
                ${!n.leida ? '<span style="font-size:.7rem;color:var(--teal);font-weight:600">Nuevo</span>' : ''}
            </div>
        </div>
        ${!n.leida ? '<span class="notif-dot-perfil"></span>' : ''}
    </div>`;
}

async function marcarLeidaPerfil(id, el) {
    if (!el.classList.contains('no-leida')) return;
    try {
        await fetch(`/api/notificaciones/${id}/leer`, { method: 'PUT' });
        el.classList.remove('no-leida');
        el.querySelector('.notif-dot-perfil')?.remove();
        el.querySelector('[style*="Nuevo"]')?.remove();

        const badge = document.getElementById('tabNotifBadge');
        if (badge && !badge.classList.contains('hidden')) {
            const nuevo = Math.max(0, (parseInt(badge.textContent) || 0) - 1);
            if (nuevo === 0) badge.classList.add('hidden');
            else badge.textContent = nuevo;
        }
    } catch (_) {}
}
window.marcarLeidaPerfil = marcarLeidaPerfil;

// ---------------------------------------------------------------
// Reportes
// ---------------------------------------------------------------
const etiquetaAnimal = {
    herido: '🤕 Herido', asustado: '😨 Asustado',
    enfermo: '🤒 Enfermo', solo: '😔 Solo', otro: '❓ Otro'
};
const etiquetaReporte = {
    pendiente: { label: 'Pendiente', clase: 'estado-pendiente' },
    atendido:  { label: 'Atendido',  clase: 'estado-atendido' },
    cerrado:   { label: 'Cerrado',   clase: 'estado-cerrado' }
};

async function cargarReportes() {
    const lista = document.getElementById('listaReportes');
    try {
        const res      = await fetch('/api/reportes/mis');
        const reportes = await res.json();

        if (!Array.isArray(reportes) || reportes.length === 0) {
            lista.innerHTML = emptyState('📍', 'Sin reportes aún',
                'Aún no has enviado ningún reporte ciudadano.',
                '<a href="/reportar" class="btn btn-primary btn-sm">Reportar un caso</a>');
            return;
        }

        lista.innerHTML = reportes.map(tarjetaReporte).join('');
    } catch (_) {
        lista.innerHTML = errorState('reportes');
    }
}

function tarjetaReporte(r) {
    const estadoInfo = etiquetaReporte[r.estado_reporte] || { label: r.estado_reporte, clase: '' };

    return `
    <div class="reporte-card-perfil">
        <img src="${r.foto_url || '/img/dog-placeholder.svg'}"
             onerror="this.src='/img/dog-placeholder.svg'"
             class="reporte-foto-perfil" alt="Foto del reporte">
        <div>
            <p class="reporte-ubicacion">📍 ${r.ubicacion}</p>
            <div class="reporte-meta">
                <span>${etiquetaAnimal[r.estado_animal] || r.estado_animal}</span>
                <span style="color:var(--gray-300)">·</span>
                <span>📅 ${new Date(r.fecha).toLocaleDateString('es-MX', { dateStyle: 'medium' })}</span>
            </div>
            ${r.descripcion
                ? `<p class="reporte-desc-perfil">"${r.descripcion}"</p>`
                : ''}
        </div>
        <span class="estado-badge ${estadoInfo.clase}">${estadoInfo.label}</span>
    </div>`;
}

// ---------------------------------------------------------------
// Helpers visuales
// ---------------------------------------------------------------
function emptyState(icon, titulo, texto, accion = '') {
    return `
    <div class="empty-perfil">
        <span class="empty-perfil-icon">${icon}</span>
        <h3>${titulo}</h3>
        <p>${texto}</p>
        ${accion}
    </div>`;
}

function errorState(seccion) {
    return `
    <div class="empty-perfil">
        <span class="empty-perfil-icon">⚠️</span>
        <h3>Error al cargar</h3>
        <p>No se pudieron cargar tus ${seccion}. Intenta recargar la página.</p>
    </div>`;
}
