/**
 * organizaciones.js — Página de organizaciones afiliadas
 */
document.addEventListener('DOMContentLoaded', cargarOrganizaciones);

async function cargarOrganizaciones() {
    const grid = document.getElementById('orgGrid');
    try {
        const res  = await fetch('/api/organizaciones');
        const orgs = await res.json();

        if (!Array.isArray(orgs) || orgs.length === 0) {
            grid.innerHTML = '<p class="empty-msg">No hay organizaciones registradas todavía.</p>';
            return;
        }

        grid.innerHTML = orgs.map(orgCard).join('');
    } catch (_) {
        grid.innerHTML = '<p class="empty-msg">Error al cargar las organizaciones.</p>';
    }
}

function orgCard(org) {
    const activos = org.perros_activos || 0;
    return `
    <div class="org-card">
        <div class="org-card-header">
            <div class="org-logo">🏠</div>
            <div>
                <p class="org-name">${org.nombre}</p>
                <span class="org-perros">
                    🐕 ${activos} perro${activos !== 1 ? 's' : ''} activos
                </span>
            </div>
        </div>

        <p class="org-desc">
            ${org.descripcion || 'Organización dedicada al rescate y adopción canina.'}
        </p>

        <div class="org-meta">
            ${org.direccion ? `
            <div class="org-meta-item">
                <span>📍</span>
                <span>${org.direccion}</span>
            </div>` : ''}
            ${org.telefono ? `
            <div class="org-meta-item">
                <span>📞</span>
                <span>${org.telefono}</span>
            </div>` : ''}
        </div>

        <div class="org-card-footer">
            <a href="/adoptar" class="btn btn-teal btn-sm btn-full">
                Ver perros disponibles →
            </a>
        </div>
    </div>`;
}
