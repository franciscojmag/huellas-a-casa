/**
 * dash-perros.js — Gestión de perros (dashboard/perros.html)
 */
let perrosOrg = [];
let guardando  = false; // bandera para evitar doble envío

document.addEventListener('DOMContentLoaded', async () => {
    await verificarSesion();
    await cargarPerros();
    initModal();
    initLogout();
});

async function verificarSesion() {
    const res  = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.ok || data.usuario.rol !== 'org') {
        window.location.href = '/login';
    }
}

async function cargarPerros() {
    const tbody = document.getElementById('tbodyPerros');
    try {
        const res = await fetch('/api/admin/perros', {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        perrosOrg = await res.json();
        renderTabla(perrosOrg);
    } catch (_) {
        tbody.innerHTML = '<tr><td colspan="7" class="table-loading">Error al cargar.</td></tr>';
    }
}

function renderTabla(perros) {
    const tbody = document.getElementById('tbodyPerros');

    if (perros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="table-loading">No hay perros registrados. Agrega el primero.</td></tr>';
        return;
    }

    tbody.innerHTML = perros.map(p => `
        <tr>
            <td><img src="${window.HuellaUtils.fotoUrl(p.foto_url)}"
                     onerror="this.src='/img/dog-placeholder.svg'"
                     class="thumb" alt="${p.nombre}"></td>
            <td><strong>${p.nombre}</strong></td>
            <td>${p.sexo === 'macho' ? '♂ Macho' : '♀ Hembra'}</td>
            <td>${window.HuellaUtils.formatEdad(p.edad_meses)}</td>
            <td>${p.raza}</td>
            <td><span class="estado-badge estado-${p.estado}">${p.estado.replace('_', ' ')}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-outline btn-sm" onclick="abrirEditar(${p.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarPerro(${p.id})">Eliminar</button>
                </div>
            </td>
        </tr>`).join('');
}

// ---- Modal agregar/editar ----
function initModal() {
    document.getElementById('btnAgregarPerro').addEventListener('click', () => abrirModal());
    document.getElementById('modalPerroClose').addEventListener('click', cerrarModal);
    document.getElementById('modalPerro').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) cerrarModal();
    });

    // submit del formulario
    document.getElementById('formPerro').addEventListener('submit', guardarPerro);

    // Preview de foto — se registra una sola vez aquí, nunca dentro de abrirModal
    document.getElementById('pFoto').addEventListener('change', function (e) {
        // Detiene cualquier propagación que pudiera llegar al form
        e.stopPropagation();

        const preview = document.getElementById('fotoActualPreview');
        const file    = this.files && this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            preview.src = ev.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    });
}

function abrirModal(perro = null) {
    const title   = document.getElementById('modalPerroTitle');
    const preview = document.getElementById('fotoActualPreview');
    const msgEl   = document.getElementById('perroFormMsg');

    // Limpia campos manualmente — NO usar form.reset() porque en Chrome/Edge
    // puede disparar el evento change del input file y en cascada el submit
    document.getElementById('perroId').value      = '';
    document.getElementById('pNombre').value      = '';
    document.getElementById('pSexo').value        = '';
    document.getElementById('pEdad').value        = '';
    document.getElementById('pRaza').value        = '';
    document.getElementById('pDescripcion').value = '';
    document.getElementById('pEstado').value      = 'disponible';

    // Limpia el input file reemplazando el elemento para evitar eventos residuales
    const inputFile = document.getElementById('pFoto');
    inputFile.value = '';

    // Oculta preview y mensaje
    preview.classList.add('hidden');
    preview.src = '';
    msgEl.classList.add('hidden');

    // Resetea bandera y botón
    guardando = false;
    const btn = document.getElementById('btnGuardarPerro');
    btn.disabled = false;
    btn.textContent = 'Guardar';

    if (perro) {
        title.textContent = 'Editar perro';
        document.getElementById('perroId').value      = perro.id;
        document.getElementById('pNombre').value      = perro.nombre;
        document.getElementById('pSexo').value        = perro.sexo;
        document.getElementById('pEdad').value        = perro.edad_meses;
        document.getElementById('pRaza').value        = perro.raza;
        document.getElementById('pDescripcion').value = perro.descripcion || '';
        document.getElementById('pEstado').value      = perro.estado;

        if (perro.foto_url) {
            preview.src = perro.foto_url;
            preview.classList.remove('hidden');
        }
    } else {
        title.textContent = 'Agregar perro';
    }

    document.getElementById('modalPerro').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function abrirEditar(id) {
    const perro = perrosOrg.find(p => p.id === id);
    if (perro) abrirModal(perro);
}

function cerrarModal() {
    document.getElementById('modalPerro').classList.add('hidden');
    document.body.style.overflow = '';
    guardando = false;
}

async function guardarPerro(e) {
    e.preventDefault();
    e.stopPropagation();

    // Evita doble envío
    if (guardando) return;
    guardando = true;

    const msgEl = document.getElementById('perroFormMsg');
    const btn   = document.getElementById('btnGuardarPerro');
    const id    = document.getElementById('perroId').value;

    btn.disabled = true;
    btn.textContent = 'Guardando...';
    msgEl.classList.add('hidden');

    const formData = new FormData(document.getElementById('formPerro'));

    try {
        const url = id ? `/api/admin/perros/${id}` : '/api/admin/perros';
        const res  = await fetch(url, { method: 'POST', body: formData });
        const data = await res.json();

        if (res.ok) {
            cerrarModal();
            await cargarPerros();
        } else {
            window.HuellaUtils.showMsg(msgEl, data.error || 'Error al guardar.', 'error');
            guardando = false;
            btn.disabled = false;
            btn.textContent = 'Guardar';
        }
    } catch (_) {
        window.HuellaUtils.showMsg(msgEl, 'Error de conexión.', 'error');
        guardando = false;
        btn.disabled = false;
        btn.textContent = 'Guardar';
    }
}

async function eliminarPerro(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este perro? Esta acción no se puede deshacer.')) return;

    try {
        const res = await fetch(`/api/admin/perros/${id}`, {
            method: 'DELETE',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (res.ok) {
            await cargarPerros();
        } else {
            alert('No se pudo eliminar el perro.');
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
