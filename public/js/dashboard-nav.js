/**
 * dashboard-nav.js — Drawer lateral para el dashboard en móvil
 * Se carga en todas las páginas del dashboard.
 */
document.addEventListener('DOMContentLoaded', () => {
    const sidebar  = document.querySelector('.sidebar');
    const overlay  = document.querySelector('.sidebar-overlay');
    const toggle   = document.getElementById('dashMenuToggle');

    if (!sidebar || !overlay || !toggle) return;

    function abrirMenu() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function cerrarMenu() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    toggle.addEventListener('click', () => {
        sidebar.classList.contains('open') ? cerrarMenu() : abrirMenu();
    });

    overlay.addEventListener('click', cerrarMenu);

    // Cierra el menú al hacer clic en un link (navegación)
    sidebar.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 640) cerrarMenu();
        });
    });
});
