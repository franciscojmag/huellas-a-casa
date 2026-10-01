/**
 * dashboard.js — Resumen del panel de organización
 */
document.addEventListener('DOMContentLoaded', async () => {
    await verificarSesionOrg();
    await cargarResumen();
    initLogout();
});

async function verificarSesionOrg() {
    const res  = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.ok || data.usuario.rol !== 'org') {
        window.location.href = '/login';
        return;
    }
    const el = document.getElementById('dashOrgNombre');
    if (el) el.textContent = data.usuario.nombre;
}

async function cargarResumen() {
    try {
        const [perros, solicitudes, reportes] = await Promise.all([
            fetch('/api/admin/perros',      { headers: { 'X-Requested-With': 'XMLHttpRequest' } }).then(r => r.json()),
            fetch('/api/admin/solicitudes', { headers: { 'X-Requested-With': 'XMLHttpRequest' } }).then(r => r.json()),
            fetch('/api/admin/reportes',    { headers: { 'X-Requested-With': 'XMLHttpRequest' } }).then(r => r.json())
        ]);

        document.getElementById('totalPerros').textContent =
            Array.isArray(perros) ? perros.length : '—';
        document.getElementById('totalDisponibles').textContent =
            Array.isArray(perros) ? perros.filter(p => p.estado === 'disponible').length : '—';
        document.getElementById('totalSolicitudes').textContent =
            Array.isArray(solicitudes) ? solicitudes.filter(s => s.estado === 'pendiente').length : '—';
        document.getElementById('totalReportes').textContent =
            Array.isArray(reportes) ? reportes.filter(r => r.estado_reporte === 'pendiente').length : '—';
    } catch (_) { /* silencioso */ }
}

function initLogout() {
    document.getElementById('btnLogout')?.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    });
}
