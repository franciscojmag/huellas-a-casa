/**
 * dash-reportes.js — Revisión de reportes ciudadanos
 */
let todosLosReportes = [];

document.addEventListener('DOMContentLoaded', async () => {
    await verificarSesion();
    await cargarReportes();
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

async function cargarReportes() {
    const lista = document.getElementById('reportesList');
    try {
        const res = await fetch('/api/admin/reportes', {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        todosLosReportes = await res.json();
        renderLista(todosLosReportes);
    } catch (_) {
        lista.innerHTML = '<p class="table-loading">Error al cargar los reportes.</p>';
    }
}

function initFiltros() {
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const estado = btn.dataset.estado;
            const filtrados = estado === 'todos'
                ? todosLosReportes
                : todosLosReportes.filter(r => r.estado_reporte === estado);
            renderLista(filtrados);
        });
    });
}

const etiquetaEstadoAnimal = {
    herido:   '🤕 Herido',
    asustado: '😨 Asustado',
    enfermo:  '🤒 Enfermo',
    solo:     '😔 Solo',
    otro:     '❓ Otro'
};

function renderLista(reportes) {
    const lista = document.getElementById('reportesList');

    if (reportes.length === 0) {
        lista.innerHTML = '<p class="table-loading">No hay reportes en esta categoría.</p>';
        return;
    }

    lista.innerHTML = reportes.map(r => `
        <div class="reporte-card">
            <img src="${r.foto_url ? r.foto_url : '/img/dog-placeholder.svg'}"
                 onerror="this.src='/img/dog-placeholder.svg'"
                 class="reporte-foto" alt="Foto del reporte">
            <div class="reporte-info">
                <h3>📍 ${r.ubicacion}</h3>
                <p><strong>Estado del animal:</strong>
                   ${etiquetaEstadoAnimal[r.estado_animal] || r.estado_animal}</p>
                ${r.descripcion ? `<p style="margin-top:.3rem">${r.descripcion}</p>` : ''}
                <p style="margin-top:.5rem;font-size:.78rem;color:var(--gray-500)">
                    Reportado por: ${r.ciudadano_nombre || 'Anónimo'} ·
                    ${new Date(r.fecha).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                </p>
            </div>
            <div class="reporte-actions">
                <span class="estado-badge estado-${r.estado_reporte}">
                    ${r.estado_reporte}
                </span>
                ${r.estado_reporte === 'pendiente' ? `
                    <button class="btn btn-primary btn-sm"
                            onclick="cambiarEstado(${r.id}, 'atendido')">
                        ✓ Marcar atendido
                    </button>
                ` : ''}
                ${r.estado_reporte !== 'cerrado' ? `
                    <button class="btn btn-secondary btn-sm"
                            onclick="cambiarEstado(${r.id}, 'cerrado')">
                        Cerrar caso
                    </button>
                ` : ''}
            </div>
        </div>`).join('');
}

async function cambiarEstado(id, estado) {
    try {
        const res = await fetch(`/api/admin/reportes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ estado_reporte: estado })
        });

        if (res.ok) {
            await cargarReportes();
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
