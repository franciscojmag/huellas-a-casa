/**
 * registro.js — Página de registro
 */
document.addEventListener('DOMContentLoaded', () => {
    initRolTabs();
    document.getElementById('formRegistro')?.addEventListener('submit', enviarRegistro);
});

function initRolTabs() {
    const tabs     = document.querySelectorAll('.role-tab');
    const orgFields = document.getElementById('orgFields');
    const rolInput  = document.getElementById('rolInput');
    const nombreOrgInput = document.getElementById('nombre_org');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const rol = tab.dataset.rol;
            rolInput.value = rol;

            if (rol === 'org') {
                orgFields.classList.remove('hidden');
                nombreOrgInput.required = true;
            } else {
                orgFields.classList.add('hidden');
                nombreOrgInput.required = false;
            }
        });
    });
}

async function enviarRegistro(e) {
    e.preventDefault();
    const msgEl = document.getElementById('registroMsg');
    const btn   = e.target.querySelector('button[type="submit"]');

    btn.disabled = true;
    btn.textContent = 'Creando cuenta...';
    msgEl.classList.add('hidden');

    const body = {
        nombre:          document.getElementById('nombre').value.trim(),
        email:           document.getElementById('email').value.trim(),
        telefono:        document.getElementById('telefono').value.trim() || undefined,
        password:        document.getElementById('password').value,
        rol:             document.getElementById('rolInput').value,
        nombre_org:      document.getElementById('nombre_org')?.value.trim() || undefined,
        direccion_org:   document.getElementById('direccion_org')?.value.trim() || undefined,
        descripcion_org: document.getElementById('descripcion_org')?.value.trim() || undefined
    };

    try {
        const res  = await fetch('/api/auth/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (res.ok) {
            window.location.href = data.usuario.rol === 'org' ? '/dashboard' : '/';
        } else {
            window.HuellaUtils.showMsg(msgEl, data.error || 'Error al crear la cuenta.', 'error');
            btn.disabled = false;
            btn.textContent = 'Crear cuenta';
        }
    } catch (_) {
        window.HuellaUtils.showMsg(msgEl, 'Error de conexión.', 'error');
        btn.disabled = false;
        btn.textContent = 'Crear cuenta';
    }
}
