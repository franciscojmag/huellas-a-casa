/**
 * dash-solicitudes.js — Gestión de solicitudes de adopción
 */
let todasLasSolicitudes = [];

document.addEventListener('DOMContentLoaded', async () => {
    await verificarSesion();
    await cargarSolicitudes();
    initFiltros();
    initLogout();
});

async function verificarSesion() {
    const res  = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.ok || data.usuario.rol !== 'org') {
        window.location.href = '/login';
    }
}

async function cargarSolicitudes() {
    const lista = document.getElementById('solicitudesList');
    try {
        const res = await fetch('/api/admin/solicitudes', {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        todasLasSolicitudes = await res.json();
        renderLista(todasLasSolicitudes);
    } catch (_) {
        lista.innerHTML = '<p class="table-loading">Error al cargar las solicitudes.</p>';
    }
}

function initFiltros() {
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const estado = btn.dataset.estado;
            const filtradas = estado === 'todas'
                ? todasLasSolicitudes
                : todasLasSolicitudes.filter(s => s.estado === estado);
            renderLista(filtradas);
        });
    });
}

function renderLista(solicitudes) {
    const lista = document.getElementById('solicitudesList');

    if (solicitudes.length === 0) {
        lista.innerHTML = '<p class="table-loading">No hay solicitudes en esta categoría.</p>';
        return;
    }

    lista.innerHTML = solicitudes.map(s => `
        <div class="solicitud-card">
            <img src="${window.HuellaUtils.fotoUrl(s.perro_foto)}"
                 onerror="this.src='/img/dog-placeholder.svg'"
                 class="solicitud-foto" alt="${s.perro_nombre}">
            <div class="solicitud-info">
                <h3>${s.perro_nombre}</h3>
                <p><strong>Solicitante:</strong> ${s.ciudadano_nombre}</p>
                <p><strong>Contacto:</strong> ${s.ciudadano_email}
                   ${s.ciudadano_telefono ? ' · ' + s.ciudadano_telefono : ''}</p>
                ${s.mensaje ? `<p style="margin-top:.5rem;font-style:italic;color:var(--gray-700)">"${s.mensaje}"</p>` : ''}
                <p style="margin-top:.4rem;font-size:.78rem;color:var(--gray-500)">
                    ${new Date(s.fecha).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                </p>
            </div>
            <div class="solicitud-actions">
                <span class="estado-badge estado-${s.estado}">${s.estado}</span>
                ${s.estado === 'pendiente' ? `
                    <button class="btn btn-primary btn-sm" onclick="cambiarEstado(${s.id}, 'aprobada')">
                        ✓ Aprobar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="cambiarEstado(${s.id}, 'rechazada')">
                        ✗ Rechazar
                    </button>
                ` : ''}
            </div>
        </div>`).join('');
}

async function cambiarEstado(id, estado) {
    const accion = estado === 'aprobada' ? 'aprobar' : 'rechazar';
    if (!confirm(`¿Confirmas ${accion} esta solicitud?`)) return;

    try {
        const res = await fetch(`/api/admin/solicitudes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ estado })
        });

        if (res.ok) {
            await cargarSolicitudes();
        } else {
            const data = await res.json();
            alert(data.error || 'Error al actualizar.');
        }
    } catch (_) {
        alert('Error de conexión.');
    }
}

function initLogout() {
    document.getElementById('btnLogout')?.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    });
}
