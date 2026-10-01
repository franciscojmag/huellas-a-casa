/**
 * organizaciones.js — Página de organizaciones afiliadas
 */
document.addEventListener('DOMContentLoaded', cargarOrganizaciones);

async function cargarOrganizaciones() {
    const grid = document.getElementById('orgGrid');
    try {
        const res  = await fetch('/api/organizaciones');
        const orgs = await res.json();

        if (orgs.length === 0) {
            grid.innerHTML = '<p class="empty-msg">No hay organizaciones registradas todavía.</p>';
            return;
        }

        grid.innerHTML = orgs.map(orgCard).join('');
    } catch (_) {
        grid.innerHTML = '<p class="empty-msg">Error al cargar las organizaciones.</p>';
    }
}

function orgCard(org) {
    return `
    <div class="org-card">
        <div class="org-logo">🏠</div>
        <h2 class="org-name">${org.nombre}</h2>
        <p class="org-desc">${org.descripcion || 'Organización dedicada al rescate y adopción canina.'}</p>
        <div class="org-meta">
            ${org.direccion ? `<p>📍 ${org.direccion}</p>` : ''}
            ${org.telefono  ? `<p>📞 ${org.telefono}</p>`  : ''}
        </div>
        <span class="org-perros">
            🐕 ${org.perros_activos || 0} perro${org.perros_activos !== 1 ? 's' : ''} activos
        </span>
    </div>`;
}
