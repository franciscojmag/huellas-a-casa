/**
 * reportes.js — Formulario de reporte ciudadano (reportar.html)
 * Leaflet + OpenStreetMap para selección de ubicación.
 *
 * Estrategia de visibilidad:
 * El formulario nace visible en el HTML. Si no hay sesión, se oculta
 * con display:none DESPUÉS de que Leaflet ya midió el contenedor.
 * Así el mapa siempre tiene dimensiones reales al inicializarse.
 */

const CIUDAD_LAT  = 25.7531;
const CIUDAD_LNG  = -102.9817;
const ZOOM_INICIO = 14;

let mapa        = null;
let marcador    = null;
let coordenadas = { lat: null, lng: null };

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa el mapa primero, mientras el formulario aún es visible
    initMapa();

    // Luego verifica la sesión y ajusta la visibilidad
    verificarSesionYMostrar();

    initUpload();
    document.getElementById('formReporte')?.addEventListener('submit', enviarReporte);
});

// ---------------------------------------------------------------
// Inicializa el mapa Leaflet
// ---------------------------------------------------------------
function initMapa() {
    const contenedor = document.getElementById('mapaReporte');
    if (!contenedor || mapa) return;

    mapa = L.map('mapaReporte').setView([CIUDAD_LAT, CIUDAD_LNG], ZOOM_INICIO);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(mapa);

    mapa.invalidateSize();
    window.addEventListener('resize', () => mapa && mapa.invalidateSize());
    mapa.on('click', onMapaClick);
    agregarControlUbicacion();
}

// ---------------------------------------------------------------
// Verifica sesión y ajusta visibilidad
// ---------------------------------------------------------------
async function verificarSesionYMostrar() {
    const bloqueNoSesion = document.getElementById('bloqueNoSesion');
    const formReporte    = document.getElementById('formReporte');
    const reporterBadge  = document.getElementById('reporterBadge');

    try {
        const res  = await fetch('/api/auth/me');
        const data = await res.json();

        if (data.ok && data.usuario) {
            // Hay sesión — formulario visible, bloque de aviso oculto
            bloqueNoSesion.classList.add('hidden');

            if (reporterBadge) {
                reporterBadge.textContent =
                    `👤 Reportando como: ${data.usuario.nombre} (${data.usuario.email})`;
            }

            // Refresca el mapa por si el layout cambió al ocultar el bloque
            setTimeout(() => mapa && mapa.invalidateSize(), 50);

        } else {
            // Sin sesión — oculta formulario y muestra aviso
            formReporte.classList.add('hidden');
            bloqueNoSesion.classList.remove('hidden');
        }
    } catch (_) {
        formReporte.classList.add('hidden');
        bloqueNoSesion.classList.remove('hidden');
    }
}

// ---------------------------------------------------------------
// Clic en el mapa
// ---------------------------------------------------------------
async function onMapaClick(e) {
    const { lat, lng } = e.latlng;
    colocarPin(lat, lng);
    await geocodificarInverso(lat, lng);
}

// ---------------------------------------------------------------
// Coloca o mueve el marcador
// ---------------------------------------------------------------
function colocarPin(lat, lng) {
    const icono = L.divIcon({
        html: `<div style="
            background:#1a9e8f;
            width:22px;height:22px;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:3px solid #fff;
            box-shadow:0 2px 6px rgba(0,0,0,.35)">
        </div>`,
        iconSize:   [22, 22],
        iconAnchor: [11, 22],
        className:  ''
    });

    if (marcador) {
        marcador.setLatLng([lat, lng]);
    } else {
        marcador = L.marker([lat, lng], { icon: icono, draggable: true }).addTo(mapa);

        marcador.on('dragend', async (ev) => {
            const pos = ev.target.getLatLng();
            coordenadas.lat = pos.lat;
            coordenadas.lng = pos.lng;
            actualizarCamposOcultos(pos.lat, pos.lng);
            await geocodificarInverso(pos.lat, pos.lng);
        });
    }

    coordenadas.lat = lat;
    coordenadas.lng = lng;
    actualizarCamposOcultos(lat, lng);

    const badge = document.getElementById('coordenadasBadge');
    if (badge) {
        badge.textContent  = `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        badge.style.display = 'block';
    }
}

// ---------------------------------------------------------------
// Geocodificación inversa — coordenadas → dirección
// ---------------------------------------------------------------
async function geocodificarInverso(lat, lng) {
    const input = document.getElementById('ubicacion');
    if (!input) return;
    input.placeholder = 'Obteniendo dirección...';

    try {
        const url  = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`;
        const res  = await fetch(url, { headers: { 'Accept-Language': 'es' } });
        const data = await res.json();

        if (data && data.address) {
            const a      = data.address;
            const partes = [];

            if (a.road)            partes.push(a.road);
            if (a.house_number)    partes.push(a.house_number);
            if (a.suburb || a.neighbourhood) partes.push(a.suburb || a.neighbourhood);
            if (a.city || a.town || a.village) partes.push(a.city || a.town || a.village);
            if (a.state)           partes.push(a.state);

            input.value       = partes.length > 0 ? partes.join(', ') : data.display_name;
            input.placeholder = 'Puedes editar esta dirección…';
        }
    } catch (_) {
        input.placeholder = 'Ej. Calle Hidalgo esq. Zaragoza, San Pedro, Coah.';
    }
}

// ---------------------------------------------------------------
// Actualiza inputs ocultos
// ---------------------------------------------------------------
function actualizarCamposOcultos(lat, lng) {
    const latEl = document.getElementById('latInput');
    const lngEl = document.getElementById('lngInput');
    if (latEl) latEl.value = lat;
    if (lngEl) lngEl.value = lng;
}

// ---------------------------------------------------------------
// Botón de geolocalización
// ---------------------------------------------------------------
function agregarControlUbicacion() {
    const ControlUbicacion = L.Control.extend({
        options: { position: 'topright' },
        onAdd() {
            const btn = L.DomUtil.create('button', '');
            btn.innerHTML  = '📍 Mi ubicación';
            btn.title      = 'Usar mi ubicación actual';
            btn.style.cssText = `
                background:#fff;border:2px solid #ccc;border-radius:6px;
                padding:5px 10px;font-size:12px;font-weight:600;
                cursor:pointer;box-shadow:0 1px 5px rgba(0,0,0,.2);
            `;
            L.DomEvent.on(btn, 'click', usarMiUbicacion);
            L.DomEvent.disableClickPropagation(btn);
            return btn;
        }
    });
    mapa.addControl(new ControlUbicacion());
}

function usarMiUbicacion() {
    if (!navigator.geolocation) {
        alert('Tu navegador no soporta geolocalización.');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude: lat, longitude: lng } }) => {
            mapa.setView([lat, lng], 17);
            colocarPin(lat, lng);
            await geocodificarInverso(lat, lng);
        },
        () => alert('No se pudo obtener tu ubicación. Marca el punto en el mapa manualmente.'),
        { enableHighAccuracy: true, timeout: 8000 }
    );
}

// ---------------------------------------------------------------
// Preview de foto
// ---------------------------------------------------------------
function initUpload() {
    const area        = document.getElementById('uploadArea');
    const input       = document.getElementById('fotoReporte');
    const preview     = document.getElementById('fotoPreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    if (!area) return;

    area.addEventListener('click', () => input.click());
    area.addEventListener('dragover',  (e) => { e.preventDefault(); area.classList.add('drag-over'); });
    area.addEventListener('dragleave', ()  => area.classList.remove('drag-over'));
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) mostrarPreview(file);
    });
    input.addEventListener('change', () => { if (input.files[0]) mostrarPreview(input.files[0]); });

    function mostrarPreview(file) {
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

    if (!coordenadas.lat || !coordenadas.lng) {
        window.HuellaUtils.showMsg(msgEl,
            'Por favor marca la ubicación del perro en el mapa.', 'error');
        document.getElementById('mapaReporte')
            .scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    btn.disabled    = true;
    btn.textContent = 'Enviando...';
    msgEl.classList.add('hidden');

    try {
        const res  = await fetch('/api/reportes', { method: 'POST', body: new FormData(form) });
        const data = await res.json();

        if (res.ok) {
            window.HuellaUtils.showMsg(msgEl,
                '✅ ¡Reporte registrado! Las organizaciones afiliadas serán notificadas.',
                'success');

            form.reset();
            document.getElementById('fotoPreview').classList.add('hidden');
            document.getElementById('uploadPlaceholder').classList.remove('hidden');
            const badge = document.getElementById('coordenadasBadge');
            if (badge) badge.style.display = 'none';

            if (marcador) { mapa.removeLayer(marcador); marcador = null; }
            coordenadas = { lat: null, lng: null };
            mapa.setView([CIUDAD_LAT, CIUDAD_LNG], ZOOM_INICIO);

            btn.textContent = 'Registrar reporte ciudadano';
            btn.disabled    = false;

        } else if (res.status === 401) {
            window.HuellaUtils.showMsg(msgEl, 'Tu sesión expiró. Redirigiendo...', 'error');
            setTimeout(() => { window.location.href = '/login'; }, 2000);
        } else {
            window.HuellaUtils.showMsg(msgEl, data.error || 'Error al enviar.', 'error');
            btn.disabled    = false;
            btn.textContent = 'Registrar reporte ciudadano';
        }
    } catch (_) {
        window.HuellaUtils.showMsg(msgEl, 'Error de conexión. Intenta de nuevo.', 'error');
        btn.disabled    = false;
        btn.textContent = 'Registrar reporte ciudadano';
    }
}
