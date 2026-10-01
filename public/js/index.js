/**
 * index.js — Página principal
 * Carga estadísticas y los primeros 3 perros destacados.
 */

document.addEventListener('DOMContentLoaded', async () => {
    await cargarStats();
    await cargarDestacados();
});

async function cargarStats() {
    try {
        const res  = await fetch('/api/perros/stats');
        const data = await res.json();

        document.getElementById('statRescatados').textContent = '+' + data.rescatados;
        document.getElementById('statAdoptados').textContent  = '+' + data.adoptados;
        document.getElementById('statOrgs').textContent       = data.orgs;
    } catch (_) { /* silencioso */ }
}

async function cargarDestacados() {
    const grid = document.getElementById('perrosDestacados');
    if (!grid) return;

    try {
        const res    = await fetch('/api/perros?estado=disponible');
        const perros = await res.json();
        const top3   = perros.slice(0, 3);

        grid.innerHTML = '';

        if (top3.length === 0) {
            grid.innerHTML = '<p class="empty-msg">No hay perros disponibles en este momento.</p>';
            return;
        }

        top3.forEach(p => grid.insertAdjacentHTML('beforeend', tarjetaPerro(p)));
    } catch (_) {
        grid.innerHTML = '<p class="empty-msg">No se pudo cargar la información.</p>';
    }
}

function tarjetaPerro(p) {
    const { formatEdad, fotoUrl, estadoLabel } = window.HuellaUtils;
    return `
    <div class="perro-card">
        <div class="card-img-wrap">
            <img src="${fotoUrl(p.foto_url)}" alt="Foto de ${p.nombre}"
                 onerror="this.src='/img/dog-placeholder.svg'">
            <span class="card-badge badge-${p.estado}">${estadoLabel(p.estado)}</span>
        </div>
        <div class="card-body">
            <h3 class="card-name">${p.nombre}</h3>
            <div class="card-tags">
                <span class="card-tag">${p.sexo === 'macho' ? '♂' : '♀'} ${p.sexo.charAt(0).toUpperCase() + p.sexo.slice(1)}</span>
                <span class="card-tag">🗓 ${formatEdad(p.edad_meses)}</span>
                <span class="card-tag">🐾 ${p.raza}</span>
            </div>
            <p class="card-desc">${p.descripcion || ''}</p>
            <div class="card-actions">
                <a href="/perro/${p.id}" class="btn btn-primary btn-sm">Solicitar adopción</a>
                <a href="/perro/${p.id}" class="btn btn-outline btn-sm">Ver más</a>
            </div>
        </div>
    </div>`;
}
