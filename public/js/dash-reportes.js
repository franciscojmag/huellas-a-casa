/**
 * dash-reportes.js — Revisión de reportes ciudadanos con mapa
 */
let todosLosReportes = [];
let mapaModal        = null; // instancia Leaflet del modal
let marcadorModal    = null;

document.addEventListener('DOMContentLoaded', async () => {
    await verificarSesion();
    await cargarReportes();
    initFiltros();
    initModalMapa();
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
            const estado    = btn.dataset.estado;
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

// ---------------------------------------------------------------
// Renderiza la lista de reportes
// ---------------------------------------------------------------
function renderLista(reportes) {
    const lista = document.getElementById('reportesList');

    if (reportes.length === 0) {
        lista.innerHTML = '<p class="table-loading">No hay reportes en esta categoría.</p>';
        return;
    }

    lista.innerHTML = reportes.map(r => {
        const tieneMapa = r.lat && r.lng;

        return `
        <div class="reporte-card">
            <img src="${r.foto_url ? r.foto_url : '/img/dog-placeholder.svg'}"
                 onerror="this.src='/img/dog-placeholder.svg'"
                 class="reporte-foto" alt="Foto del reporte">

            <div class="reporte-info">
                <h3>📍 ${r.ubicacion}</h3>
                <p><strong>Estado del animal:</strong>
                   ${etiquetaEstadoAnimal[r.estado_animal] || r.estado_animal}</p>
                ${r.descripcion
                    ? `<p style="margin-top:.3rem">${r.descripcion}</p>`
                    : ''}
                <p style="margin-top:.5rem;font-size:.78rem;color:var(--gray-500)">
                    Reportado por: ${r.ciudadano_nombre || 'Anónimo'} ·
                    ${new Date(r.fecha).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                </p>
                ${tieneMapa
                    ? `<button class="btn btn-outline btn-sm btn-ver-mapa reporte-card-mapa"
                               onclick="abrirMapa(${r.id})">
                           🗺 Ver en mapa
                       </button>`
                    : `<span style="font-size:.75rem;color:var(--gray-500);margin-top:.5rem;display:block">
                           Sin coordenadas registradas
                       </span>`
                }
            </div>

            <div class="reporte-actions">
                <span class="estado-badge estado-${r.estado_reporte}">
                    ${r.estado_reporte}
                </span>
                ${r.estado_reporte === 'pendiente' ? `
                    <button class="btn btn-primary btn-sm"
                            onclick="cambiarEstado(${r.id}, 'atendido')">
                        ✓ Atendido
                    </button>
                ` : ''}
                ${r.estado_reporte !== 'cerrado' ? `
                    <button class="btn btn-secondary btn-sm"
                            onclick="cambiarEstado(${r.id}, 'cerrado')">
                        Cerrar
                    </button>
                ` : ''}
            </div>
        </div>`;
    }).join('');
}

// ---------------------------------------------------------------
// Modal del mapa
// ---------------------------------------------------------------
function initModalMapa() {
    document.getElementById('modalMapaClose').addEventListener('click', cerrarModalMapa);
    document.getElementById('modalMapa').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) cerrarModalMapa();
    });
}

function abrirMapa(reporteId) {
    const r = todosLosReportes.find(x => x.id === reporteId);
    if (!r || !r.lat || !r.lng) return;

    // Rellena la info del reporte
    document.getElementById('modalMapaInfo').innerHTML = `
        <strong>📍 ${r.ubicacion}</strong><br>
        ${etiquetaEstadoAnimal[r.estado_animal] || r.estado_animal} ·
        Reportado por: ${r.ciudadano_nombre || 'Anónimo'} ·
        ${new Date(r.fecha).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
    `;

    // Link a Google Maps
    const linkGM = document.getElementById('linkGoogleMaps');
    linkGM.href  = `https://www.google.com/maps?q=${r.lat},${r.lng}`;
    linkGM.style.display = 'inline-block';

    // Muestra el modal antes de inicializar el mapa
    // (Leaflet necesita que el div tenga dimensiones reales)
    document.getElementById('modalMapa').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Pequeño delay para que el modal termine de renderizarse
    setTimeout(() => inicializarMapaModal(r), 80);
}

function inicializarMapaModal(r) {
    if (!mapaModal) {
        // Primera vez: crea el mapa
        mapaModal = L.map('mapaModal').setView([r.lat, r.lng], 16);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(mapaModal);

    } else {
        // Reutiliza el mapa — actualiza la vista y fuerza re-render
        mapaModal.invalidateSize();
        mapaModal.setView([r.lat, r.lng], 16);

        // Elimina el marcador anterior
        if (marcadorModal) {
            mapaModal.removeLayer(marcadorModal);
            marcadorModal = null;
        }
    }

    // Icono personalizado
    const icono = L.divIcon({
        html: `<div style="
            background:#1a9e8f;
            width:26px;height:26px;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:3px solid #fff;
            box-shadow:0 2px 8px rgba(0,0,0,.4)">
        </div>`,
        iconSize:   [26, 26],
        iconAnchor: [13, 26],
        className:  ''
    });

    // Coloca el marcador con popup
    marcadorModal = L.marker([r.lat, r.lng], { icon: icono })
        .addTo(mapaModal)
        .bindPopup(`
            <strong>${r.ubicacion}</strong><br>
            ${etiquetaEstadoAnimal[r.estado_animal] || r.estado_animal}
        `)
        .openPopup();

    // Fuerza re-render por si el modal tenía dimensiones cero al crearse
    mapaModal.invalidateSize();
}

function cerrarModalMapa() {
    document.getElementById('modalMapa').classList.add('hidden');
    document.body.style.overflow = '';
}

// ---------------------------------------------------------------
// Cambiar estado de un reporte
// ---------------------------------------------------------------
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
