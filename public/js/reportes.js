/**
 * reportes.js — Formulario de reporte ciudadano (reportar.html)
 * Requiere sesión activa para enviar. Si no hay sesión, muestra
 * el bloque de login en lugar del formulario.
 */

document.addEventListener('DOMContentLoaded', async () => {
    await verificarSesionYMostrar();
    initUpload();
    document.getElementById('formReporte')?.addEventListener('submit', enviarReporte);
});

// ---------------------------------------------------------------
// Verifica sesión y decide qué mostrar
// ---------------------------------------------------------------
async function verificarSesionYMostrar() {
    const bloqueNoSesion = document.getElementById('bloqueNoSesion');
    const formReporte    = document.getElementById('formReporte');
    const reporterBadge  = document.getElementById('reporterBadge');

    try {
        const res  = await fetch('/api/auth/me');
        const data = await res.json();

        if (data.ok && data.usuario) {
            // Tiene sesión → muestra el formulario
            formReporte.classList.remove('hidden');
            bloqueNoSesion.classList.add('hidden');

            // Muestra quién está reportando
            if (reporterBadge) {
                reporterBadge.textContent =
                    `👤 Reportando como: ${data.usuario.nombre} (${data.usuario.email})`;
            }
        } else {
            // Sin sesión → muestra el bloque de aviso
            bloqueNoSesion.classList.remove('hidden');
            formReporte.classList.add('hidden');
        }
    } catch (_) {
        // Error de red → muestra el aviso por seguridad
        bloqueNoSesion.classList.remove('hidden');
        formReporte.classList.add('hidden');
    }
}

// ---------------------------------------------------------------
// Preview de foto (drag & drop + click)
// ---------------------------------------------------------------
function initUpload() {
    const area        = document.getElementById('uploadArea');
    const input       = document.getElementById('fotoReporte');
    const preview     = document.getElementById('fotoPreview');
    const placeholder = document.getElementById('uploadPlaceholder');

    if (!area) return;

    area.addEventListener('click', () => input.click());

    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('drag-over');
    });
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) mostrarPreview(file);
    });

    input.addEventListener('change', () => {
        if (input.files[0]) mostrarPreview(input.files[0]);
    });

    function mostrarPreview(file) {
        if (input.files.length === 0) {
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
            placeholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
}

// ---------------------------------------------------------------
// Envío del formulario
// ---------------------------------------------------------------
async function enviarReporte(e) {
    e.preventDefault();
    const form  = e.target;
    const msgEl = document.getElementById('reporteMsg');
    const btn   = form.querySelector('button[type="submit"]');

    btn.disabled = true;
    btn.textContent = 'Enviando...';
    msgEl.classList.add('hidden');

    try {
        const res  = await fetch('/api/reportes', {
            method: 'POST',
            body: new FormData(form)
        });
        const data = await res.json();

        if (res.ok) {
            window.HuellaUtils.showMsg(msgEl,
                '✅ ¡Reporte registrado exitosamente! Las organizaciones afiliadas serán notificadas.',
                'success');
            form.reset();
            document.getElementById('fotoPreview').classList.add('hidden');
            document.getElementById('uploadPlaceholder').classList.remove('hidden');
            btn.textContent = 'Registrar reporte ciudadano';
            btn.disabled = false;
        } else if (res.status === 401) {
            // La sesión expiró mientras llenaba el formulario
            window.HuellaUtils.showMsg(msgEl,
                'Tu sesión expiró. Por favor inicia sesión de nuevo.', 'error');
            setTimeout(() => { window.location.href = '/login'; }, 2000);
        } else {
            window.HuellaUtils.showMsg(msgEl, data.error || 'Error al enviar el reporte.', 'error');
            btn.disabled = false;
            btn.textContent = 'Registrar reporte ciudadano';
        }
    } catch (_) {
        window.HuellaUtils.showMsg(msgEl, 'Error de conexión. Intenta de nuevo.', 'error');
        btn.disabled = false;
        btn.textContent = 'Registrar reporte ciudadano';
    }
}
