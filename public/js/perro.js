/**
 * perro.js — Detalle de un perro (perro.html)
 * Obtiene el ID de la URL: /perro/3
 */

let perroActual = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Extrae el ID del path: /perro/5
    const partes = window.location.pathname.split('/');
    const id = partes[partes.length - 1];

    if (!id || isNaN(id)) {
        mostrarError('ID de perro no válido.');
        return;
    }

    await cargarPerro(id);
    initModal();
});

async function cargarPerro(id) {
    const contenedor = document.getElementById('perroDetalle');
    try {
        const res = await fetch(`/api/perros/${id}`);
        if (!res.ok) { mostrarError('Perro no encontrado.'); return; }

        perroActual = await res.json();
        document.title = `${perroActual.nombre} — Adoptify`;
        renderDetalle(perroActual);
    } catch (_) {
        mostrarError('Error al cargar la información.');
    }
}

function renderDetalle(p) {
    const { formatEdad, fotoUrl } = window.HuellaUtils;
    const contenedor = document.getElementById('perroDetalle');
    const disponible = p.estado === 'disponible';

    contenedor.innerHTML = `
        <div class="detail-img">
            <img src="${fotoUrl(p.foto_url)}" alt="Foto de ${p.nombre}"
                 onerror="this.src='/img/dog-placeholder.svg'">
        </div>
        <div class="detail-info">
            <h1 class="detail-name">${p.nombre}</h1>
            <div class="detail-tags">
                <span class="card-tag">${p.sexo === 'macho' ? '♂ Macho' : '♀ Hembra'}</span>
                <span class="card-tag">🗓 ${formatEdad(p.edad_meses)}</span>
                <span class="card-tag">🐾 ${p.raza}</span>
                <span class="card-badge badge-${p.estado} card-tag"
                      style="position:static;color:#fff">
                    ${window.HuellaUtils.estadoLabel(p.estado)}
                </span>
            </div>
            <p class="detail-desc">${p.descripcion || 'Sin descripción disponible.'}</p>
            <div class="detail-org">
                <strong>${p.org_nombre}</strong>
                ${p.org_direccion ? `<p>📍 ${p.org_direccion}</p>` : ''}
                ${p.org_telefono  ? `<p>📞 ${p.org_telefono}</p>`  : ''}
            </div>
            ${disponible
                ? `<button class="btn btn-primary btn-lg" id="btnSolicitar">
                       Solicitar adopción
                   </button>`
                : `<p style="color:var(--gray-500);font-weight:600;">
                       Este perro ya no está disponible para adopción.
                   </p>`
            }
        </div>`;

    if (disponible) {
        document.getElementById('btnSolicitar')?.addEventListener('click', abrirModal);
    }
}

function mostrarError(msg) {
    document.getElementById('perroDetalle').innerHTML =
        `<p class="empty-msg" style="grid-column:1/-1">${msg}</p>`;
}

// ---- Modal de solicitud ----
function initModal() {
    document.getElementById('modalClose')?.addEventListener('click', cerrarModal);
    document.getElementById('modalSolicitud')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) cerrarModal();
    });
    document.getElementById('formSolicitud')?.addEventListener('submit', enviarSolicitud);
}

function abrirModal() {
    document.getElementById('modalPerroNombre').textContent =
        `Para: ${perroActual?.nombre || ''}`;
    const overlay = document.getElementById('modalSolicitud');
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    document.getElementById('modalSolicitud').classList.add('hidden');
    document.body.style.overflow = '';
    document.getElementById('solicitudMsg').classList.add('hidden');
    document.getElementById('formSolicitud').reset();
}

async function enviarSolicitud(e) {
    e.preventDefault();
    const msgEl = document.getElementById('solicitudMsg');
    const btn   = e.target.querySelector('button[type="submit"]');

    // Verifica sesión
    const sesion = await fetch('/api/auth/me').then(r => r.json());
    if (!sesion.ok) {
        window.HuellaUtils.showMsg(msgEl, 'Debes iniciar sesión para solicitar una adopción.', 'error');
        return;
    }
    if (sesion.usuario.rol !== 'ciudadano') {
        window.HuellaUtils.showMsg(msgEl, 'Solo ciudadanos pueden solicitar adopciones.', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
        const res = await fetch('/api/adopciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                perro_id: perroActual.id,
                mensaje: document.getElementById('mensajeSolicitud').value
            })
        });
        const data = await res.json();

        if (res.ok) {
            window.HuellaUtils.showMsg(msgEl,
                '¡Solicitud enviada con éxito! La organización se pondrá en contacto contigo.', 'success');
            btn.textContent = '¡Enviado!';
        } else {
            window.HuellaUtils.showMsg(msgEl, data.error || 'Error al enviar la solicitud.', 'error');
            btn.disabled = false;
            btn.textContent = 'Enviar solicitud';
        }
    } catch (_) {
        window.HuellaUtils.showMsg(msgEl, 'Error de conexión. Intenta de nuevo.', 'error');
        btn.disabled = false;
        btn.textContent = 'Enviar solicitud';
    }
}
