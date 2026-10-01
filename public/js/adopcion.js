/**
 * adopcion.js — Catálogo con filtros (adoptar.html)
 */

let todosLosPerros = [];
let filtroActual   = 'todos';

document.addEventListener('DOMContentLoaded', async () => {
    await cargarPerros();
    initFiltros();
});

async function cargarPerros() {
    const grid = document.getElementById('catalogoPerros');
    try {
        const res = await fetch('/api/perros');
        todosLosPerros = await res.json();
        renderizar(todosLosPerros);
    } catch (_) {
        grid.innerHTML = '<p class="empty-msg">Error al cargar el catálogo.</p>';
    }
}

function initFiltros() {
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroActual = btn.dataset.filter;
            aplicarFiltro();
        });
    });
}

function aplicarFiltro() {
    let resultado = [...todosLosPerros];

    switch (filtroActual) {
        case 'cachorros':   resultado = resultado.filter(p => p.edad_meses < 12); break;
        case 'adultos':     resultado = resultado.filter(p => p.edad_meses >= 12); break;
        case 'macho':       resultado = resultado.filter(p => p.sexo === 'macho'); break;
        case 'hembra':      resultado = resultado.filter(p => p.sexo === 'hembra'); break;
        case 'disponibles': resultado = resultado.filter(p => p.estado === 'disponible'); break;
    }

    renderizar(resultado);
}

function renderizar(perros) {
    const grid     = document.getElementById('catalogoPerros');
    const emptyMsg = document.getElementById('emptyMsg');

    if (perros.length === 0) {
        grid.innerHTML = '';
        emptyMsg.classList.remove('hidden');
        return;
    }

    emptyMsg.classList.add('hidden');
    grid.innerHTML = perros.map(tarjetaPerro).join('');
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
