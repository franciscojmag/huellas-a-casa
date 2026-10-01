/**
 * login.js — Página de inicio de sesión
 */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('formLogin')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgEl = document.getElementById('loginMsg');
        const btn   = e.target.querySelector('button[type="submit"]');

        btn.disabled = true;
        btn.textContent = 'Iniciando sesión...';
        msgEl.classList.add('hidden');

        const body = {
            email:    document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };

        try {
            const res  = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (res.ok) {
                // Redirige según rol
                if (data.usuario.rol === 'org') {
                    window.location.href = '/dashboard';
                } else {
                    window.location.href = '/';
                }
            } else {
                window.HuellaUtils.showMsg(msgEl, data.error || 'Error al iniciar sesión.', 'error');
                btn.disabled = false;
                btn.textContent = 'Iniciar sesión';
            }
        } catch (_) {
            window.HuellaUtils.showMsg(msgEl, 'Error de conexión.', 'error');
            btn.disabled = false;
            btn.textContent = 'Iniciar sesión';
        }
    });
});
