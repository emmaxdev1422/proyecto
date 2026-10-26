/* ==========================================================================
   MUNICIPIO DE SERRANOBLE - LÓGICA DE INTERACCIÓN, CLIMA Y AUTENTICACIÓN
   ========================================================================== */

let usuarioActivo = JSON.parse(localStorage.getItem('usuarioSerranoble')) || null;

document.addEventListener('DOMContentLoaded', () => {
    actualizarRelojYClima();
    setInterval(actualizarRelojYClima, 1000);
    actualizarInterfazUsuario();
    actualizarPanelTramites();
});

/* ==========================================================================
   0. RELOJ Y CLIMA EN TIEMPO REAL
   ========================================================================== */
function actualizarRelojYClima() {
    const contenedorReloj = document.getElementById('relojCiudadano');
    if (!contenedorReloj) return;

    const ahora = new Date();
    
    // Formato de fecha en español
    const opcionesFecha = { weekday: 'short', day: 'numeric', month: 'short' };
    let fechaStr = ahora.toLocaleDateString('es-AR', opcionesFecha);
    fechaStr = fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);

    // Formato de hora (HH:MM:SS)
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');

    // Datos de clima en vivo
    const climaTemp = "20°C";
    const climaIcono = "⛅";

    contenedorReloj.innerHTML = `
        <span>📅 ${fechaStr} &nbsp;|&nbsp; 🕒 ${horas}:${minutos}:${segundos} hs</span>
        <span class="clima-badge">
            ${climaIcono} ${climaTemp} (Serranoble)
        </span>
    `;
}

/* ==========================================================================
   1. FUNCIÓN DE SEGURIDAD: HASH SHA-256 (RNF-01)
   ========================================================================== */
async function generarHashSHA256(textoPlano) {
    const encoder = new TextEncoder();
    const data = encoder.encode(textoPlano);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ==========================================================================
   2. CONTROL DE NAVEGACIÓN Y MENÚ MOBILE
   ========================================================================== */
function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (navMenu) {
        const isActive = navMenu.classList.toggle('active');
        if (menuBtn) {
            menuBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        }
    }
}

function closeMenu() {
    const navMenu = document.getElementById('navMenu');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (navMenu) {
        navMenu.classList.remove('active');
        if (menuBtn) {
            menuBtn.setAttribute('aria-expanded', 'false');
        }
    }
}

/* ==========================================================================
   3. CONTROL DE MODALES Y PESTAÑAS (VALIDA SESIÓN ACTIVA)
   ========================================================================== */
function openLogin() {
    if (usuarioActivo) {
        return;
    }

    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    }
}

function closeLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        limpiarAlertas();
    }
}

function switchAuthTab(tab) {
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });
    forms.forEach(f => f.classList.remove('active'));

    limpiarAlertas();

    if (tab === 'login') {
        if (tabs[0]) {
            tabs[0].classList.add('active');
            tabs[0].setAttribute('aria-selected', 'true');
        }
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.classList.add('active');
    } else {
        if (tabs[1]) {
            tabs[1].classList.add('active');
            tabs[1].setAttribute('aria-selected', 'true');
        }
        const registerForm = document.getElementById('registerForm');
        if (registerForm) registerForm.classList.add('active');
    }
}

function limpiarAlertas() {
    const alertLogin = document.getElementById('errorAlertLogin');
    const alertRegister = document.getElementById('errorAlertRegister');

    if (alertLogin) alertLogin.style.display = 'none';
    if (alertRegister) alertRegister.style.display = 'none';
}

/* ==========================================================================
   4. VALIDACIÓN Y REGISTRO / LOGIN SEGURO (CON CONTRASEÑA ROBUSTA)
   ========================================================================== */
async function validarRegistro(event) {
    event.preventDefault();

    const nombre = document.getElementById('regNombre').value.trim();
    const dni = document.getElementById('regDni').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    const alert = document.getElementById('errorAlertRegister');

    const soloNumeros = /^[0-9]+$/;
    const regexPasswordFuerte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;

    if (nombre === '' || dni === '' || email === '' || pass === '') {
        mostrarError(alert, 'Por favor, completá todos los datos para crear tu cuenta.');
        return;
    }

    if (!soloNumeros.test(dni)) {
        mostrarError(alert, 'El DNI/CUIL debe contener únicamente números sin puntos ni espacios.');
        return;
    }

    if (!regexPasswordFuerte.test(pass)) {
        mostrarError(alert, 'La contraseña debe tener al menos 6 caracteres, incluir una letra mayúscula, una minúscula, un número y un símbolo especial.');
        return;
    }

    const usuariosRegistrados = JSON.parse(localStorage.getItem('usuariosRegistrados')) || [];

    const usuarioExistente = usuariosRegistrados.find(
        u => u.dni === dni || u.email.toLowerCase() === email.toLowerCase()
    );
    
    if (usuarioExistente) {
        mostrarError(alert, 'El DNI o correo electrónico ya se encuentra registrado.');
        return;
    }

    const passHash = await generarHashSHA256(pass);

    const nuevoUsuario = { 
        nombre, 
        dni, 
        email: email.toLowerCase(), 
        passHash 
    };
    
    usuariosRegistrados.push(nuevoUsuario);
    localStorage.setItem('usuariosRegistrados', JSON.stringify(usuariosRegistrados));

    usuarioActivo = {
        nombre: nombre,
        dni: dni,
        email: email.toLowerCase()
    };

    localStorage.setItem('usuarioSerranoble', JSON.stringify(usuarioActivo));
    
    actualizarInterfazUsuario();
    actualizarPanelTramites();

    closeLogin();
    document.getElementById('registerForm').reset();
}

async function validarLogin(event) {
    event.preventDefault();
    
    const usuarioInput = document.getElementById('usuario').value.trim().toLowerCase();
    const passwordInput = document.getElementById('password').value.trim();
    const alert = document.getElementById('errorAlertLogin');

    if (usuarioInput === '' || passwordInput === '') {
        mostrarError(alert, 'Por favor, completá todos los campos para ingresar.');
        return;
    }

    const usuariosRegistrados = JSON.parse(localStorage.getItem('usuariosRegistrados')) || [];

    const encontrado = usuariosRegistrados.find(
        u => u.dni === usuarioInput || u.email.toLowerCase() === usuarioInput
    );

    if (!encontrado) {
        mostrarError(alert, 'El DNI o correo ingresado no se encuentra registrado.');
        return;
    }

    const inputHash = await generarHashSHA256(passwordInput);

    if (encontrado.passHash !== inputHash) {
        mostrarError(alert, 'La contraseña ingresada es incorrecta.');
        return;
    }

    usuarioActivo = {
        nombre: encontrado.nombre,
        dni: encontrado.dni,
        email: encontrado.email
    };

    localStorage.setItem('usuarioSerranoble', JSON.stringify(usuarioActivo));
    
    actualizarInterfazUsuario();
    actualizarPanelTramites();
    
    closeLogin();
    document.getElementById('loginForm').reset();
}

function mostrarError(elementoAlert, mensaje) {
    if (elementoAlert) {
        elementoAlert.innerText = mensaje;
        elementoAlert.style.display = 'block';
    }
}

/* ==========================================================================
   5. GESTIÓN DE SESIÓN Y ACTUALIZACIÓN DE LA UI
   ========================================================================== */
function actualizarInterfazUsuario() {
    const desktopContainer = document.getElementById('desktopAuthContainer');
    const mobileContainer = document.getElementById('mobileAuthContainer');
    const heroButtons = document.querySelector('.hero-buttons');

    if (usuarioActivo) {
        const userHTML = `
            <div class="user-logged-info" style="display: flex; align-items: center; gap: 12px;">
                <span style="color: #FFFFFF; font-weight: 600;">👋 Hola, ${usuarioActivo.nombre}</span>
                <button class="btn-primary btn-logout" onclick="cerrarSesion()">Salir</button>
            </div>
        `;

        if (desktopContainer) desktopContainer.innerHTML = userHTML;
        if (mobileContainer) mobileContainer.innerHTML = userHTML;

        if (heroButtons) {
            const btnLoginHero = heroButtons.querySelector('.btn-primary');
            if (btnLoginHero) btnLoginHero.style.display = 'none';
        }
    } else {
        if (desktopContainer) {
            desktopContainer.innerHTML = `<button class="btn-primary desktop-btn" onclick="openLogin()">Acceder</button>`;
        }
        if (mobileContainer) {
            mobileContainer.innerHTML = `<button class="btn-primary" onclick="openLogin(); closeMenu()">Acceder</button>`;
        }

        if (heroButtons) {
            const btnLoginHero = heroButtons.querySelector('.btn-primary');
            if (btnLoginHero) btnLoginHero.style.display = 'inline-block';
        }
    }
}

function cerrarSesion() {
    usuarioActivo = null;
    localStorage.removeItem('usuarioSerranoble');
    actualizarInterfazUsuario();
    actualizarPanelTramites();
}

/* ==========================================================================
   6. GESTIÓN DE TRÁMITES Y RECLAMOS (CON UBICACIÓN DESGLOSADA)
   ========================================================================== */
function actualizarPanelTramites() {
    const panelRestringido = document.getElementById('tramiteRestringido');
    const panelTramite = document.getElementById('tramitePanel');
    const historialContainer = document.getElementById('historialContainer');

    if (!panelRestringido) return;

    if (usuarioActivo) {
        panelRestringido.style.display = 'none';
        if (panelTramite) panelTramite.style.display = 'block';
        if (historialContainer) historialContainer.style.display = 'block';
        renderizarMisTramites();
    } else {
        panelRestringido.style.display = 'block';
        if (panelTramite) panelTramite.style.display = 'none';
        if (historialContainer) historialContainer.style.display = 'none';
    }
}

function enviarTramite(event) {
    event.preventDefault();

    const tipo = document.getElementById('tipoTramite').value;
    const calle = document.getElementById('tramiteCalle').value.trim();
    const barrio = document.getElementById('tramiteBarrio').value.trim();
    const referencia = document.getElementById('tramiteReferencia').value.trim();
    const detalle = document.getElementById('detalleTramite').value.trim();
    const alertExito = document.getElementById('mensajeExitoTramite');

    if (!tipo || !calle || !barrio || !usuarioActivo) return;

    const todosLosTramites = JSON.parse(localStorage.getItem('tramitesSerranoble')) || [];

    const nuevoTramite = {
        id: Date.now(),
        dniCiudadano: usuarioActivo.dni,
        nombreCiudadano: usuarioActivo.nombre,
        tipo: tipo,
        ubicacion: {
            calle: calle,
            barrio: barrio,
            referencia: referencia || 'Sin referencia'
        },
        detalle: detalle || 'Sin observaciones adicionales',
        fecha: new Date().toLocaleDateString('es-AR'),
        estado: 'En Proceso'
    };

    todosLosTramites.push(nuevoTramite);
    localStorage.setItem('tramitesSerranoble', JSON.stringify(todosLosTramites));

    if (alertExito) {
        alertExito.style.display = 'block';
        setTimeout(() => { alertExito.style.display = 'none'; }, 4000);
    }

    event.target.reset();
    renderizarMisTramites();
}

function renderizarMisTramites() {
    const listaContainer = document.getElementById('listaMisTramites');
    if (!listaContainer || !usuarioActivo) return;

    const todosLosTramites = JSON.parse(localStorage.getItem('tramitesSerranoble')) || [];
    const misTramites = todosLosTramites.filter(t => t.dniCiudadano === usuarioActivo.dni);

    if (misTramites.length === 0) {
        listaContainer.innerHTML = `<p style="color: #718096; font-size: 0.95rem; font-style: italic; background: #FFFFFF; padding: 15px; border-radius: 8px; border: 1px solid #E2E8F0;">Aún no realizaste ninguna solicitud de servicio.</p>`;
        return;
    }

    let html = '';
    misTramites.reverse().forEach(t => {
        // Compatibilidad por si existen registros previos sin ubicación desglosada
        const ubicacionStr = t.ubicacion 
            ? `📍 <b>Calle:</b> ${t.ubicacion.calle} | <b>Barrio:</b> ${t.ubicacion.barrio} ${t.ubicacion.referencia !== 'Sin referencia' ? `<br><i>(Ref: ${t.ubicacion.referencia})</i>` : ''}`
            : `📍 ${t.detalle}`;

        const detalleStr = t.ubicacion ? t.detalle : '';

        html += `
            <div style="background: #FFFFFF; padding: 18px; border-radius: 8px; border-left: 4px solid var(--dorado); box-shadow: 0 2px 5px rgba(0,0,0,0.03); border: 1px solid #E2E8F0; border-left-width: 4px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="color: var(--azul-oscuro); font-size: 1.05rem;">${t.tipo}</strong>
                    <span style="background: #FEFCBF; color: #744210; padding: 3px 10px; border-radius: 4px; font-size: 0.78rem; font-weight: 700;">${t.estado}</span>
                </div>
                <p style="font-size: 0.9rem; color: #2D3748; margin-bottom: 6px;">${ubicacionStr}</p>
                ${detalleStr && detalleStr !== 'Sin observaciones adicionales' ? `<p style="font-size: 0.85rem; color: #718096; margin-bottom: 8px;">💬 <b>Detalle:</b> ${detalleStr}</p>` : ''}
                <span style="font-size: 0.8rem; color: #A0AEC0;">Fecha de solicitud: ${t.fecha}</span>
            </div>
        `;
    });

    listaContainer.innerHTML = html;
}

/* ==========================================================================
   7. EVENTOS GLOBALES DE CIERRE DE MODAL (CORREGIDO PARA SELECCIÓN DE TEXTO)
   ========================================================================== */
let mousedownTarget = null;

window.addEventListener('mousedown', (event) => {
    mousedownTarget = event.target;
});

window.addEventListener('click', (event) => {
    const modal = document.getElementById('loginModal');
    // El modal solo se cierra si se hizo clic y soltó en el fondo oscuro
    if (modal && event.target === modal && mousedownTarget === modal) {
        closeLogin();
    }
    mousedownTarget = null;
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeLogin();
    }
});

/* ==========================================================================
   8. TRANSICIÓN SUAVE AL CAMBIAR DE PÁGINA
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const enlacesInternos = document.querySelectorAll('.nav-links a, .hero-buttons a');

    enlacesInternos.forEach(enlace => {
        enlace.addEventListener('click', function(e) {
            const destino = this.getAttribute('href');

            // Solo aplicar si es un enlace a otra página HTML local (ej: noticias.html)
            if (destino && destino.endsWith('.html') && !this.getAttribute('target')) {
                e.preventDefault(); // Detener el salto inmediato

                // Aplicar efecto de salida (fade-out)
                document.body.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                document.body.style.opacity = '0';
                document.body.style.transform = 'translateY(-6px)';

                // Redirigir a la nueva página una vez completada la animación
                setTimeout(() => {
                    window.location.href = destino;
                }, 250);
            }
        });
    });
});