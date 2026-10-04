/* ==========================================================================
   MUNICIPIO DE SERRANOBLE - LÓGICA DE INTERACCIÓN Y AUTENTICACIÓN (SPRINT 2)
   ========================================================================== */

// --- ESTADO GLOBAL Y PERSISTENCIA DE SESIÓN ---
// Recupera la sesión activa desde localStorage si existe
let usuarioActivo = JSON.parse(localStorage.getItem('usuarioSerranoble')) || null;

/**
 * Inicialización al cargar la página
 */
document.addEventListener('DOMContentLoaded', () => {
    actualizarInterfazUsuario();
});


/* ==========================================================================
   1. CONTROL DE NAVEGACIÓN Y MENÚ MOBILE
   ========================================================================== */

/**
 * Alterna la visibilidad del menú desplegable en dispositivos móviles
 */
function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

/**
 * Cierra el menú desplegable en móviles al seleccionar una opción
 */
function closeMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.remove('active');
    }
}


/* ==========================================================================
   2. CONTROL DE MODALES Y PESTAÑAS (AUTH TABS)
   ========================================================================== */

/**
 * Abre la ventana modal de inicio de sesión / registro
 */
function openLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Cierra la ventana modal y limpia los mensajes de alerta
 */
function closeLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
        limpiarAlertas();
    }
}

/**
 * Alterna entre los formularios de Iniciar Sesión y Registro
 * @param {'login' | 'register'} tab 
 */
function switchAuthTab(tab) {
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));

    limpiarAlertas();

    if (tab === 'login') {
        if (tabs[0]) tabs[0].classList.add('active');
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.classList.add('active');
    } else {
        if (tabs[1]) tabs[1].classList.add('active');
        const registerForm = document.getElementById('registerForm');
        if (registerForm) registerForm.classList.add('active');
    }
}

/**
 * Oculta y limpia las alertas de error de los formularios
 */
function limpiarAlertas() {
    const alertLogin = document.getElementById('errorAlertLogin');
    const alertRegister = document.getElementById('errorAlertRegister');

    if (alertLogin) alertLogin.style.display = 'none';
    if (alertRegister) alertRegister.style.display = 'none';
}


/* ==========================================================================
   3. VALIDACIÓN DE FORMULARIOS DE AUTENTICACIÓN Y REGISTRO
   ========================================================================== */

/**
 * Valida los datos y registra un nuevo ciudadano en el almacenamiento local
 * @param {Event} event 
 */
function validarRegistro(event) {
    event.preventDefault();

    const nombre = document.getElementById('regNombre').value.trim();
    const dni = document.getElementById('regDni').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    const alert = document.getElementById('errorAlertRegister');

    const soloNumeros = /^[0-9]+$/;

    // 1. Campos obligatorios
    if (nombre === '' || dni === '' || email === '' || pass === '') {
        mostrarError(alert, 'Por favor, completá todos los datos para crear tu cuenta.');
        return;
    }

    // 2. Validación de formato de DNI
    if (!soloNumeros.test(dni)) {
        mostrarError(alert, 'El DNI/CUIL debe contener únicamente números sin puntos ni espacios.');
        return;
    }

    // 3. Longitud de contraseña
    if (pass.length < 6) {
        mostrarError(alert, 'La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    // Obtener lista previa de usuarios registrados o inicializar array
    const usuariosRegistrados = JSON.parse(localStorage.getItem('usuariosRegistrados')) || [];

    // Verificar si el DNI o Email ya fueron registrados previamente
    const usuarioExistente = usuariosRegistrados.find(
        u => u.dni === dni || u.email.toLowerCase() === email.toLowerCase()
    );
    
    if (usuarioExistente) {
        mostrarError(alert, 'El DNI o correo electrónico ya se encuentra registrado.');
        return;
    }

    // Guardar nuevo usuario en la "base de datos" local
    const nuevoUsuario = { nombre, dni, email, pass };
    usuariosRegistrados.push(nuevoUsuario);
    localStorage.setItem('usuariosRegistrados', JSON.stringify(usuariosRegistrados));

    // Establecer la sesión activa directamente
    usuarioActivo = {
        nombre: nombre,
        dni: dni,
        email: email
    };

    localStorage.setItem('usuarioSerranoble', JSON.stringify(usuarioActivo));
    actualizarInterfazUsuario();

    closeLogin();
    document.getElementById('registerForm').reset();
    alert(`¡Registro completado con éxito! Bienvenido/a ${nombre}`);
}

/**
 * Valida e inicia sesión verificando estrictamente que el usuario esté registrado
 * @param {Event} event 
 */
function validarLogin(event) {
    event.preventDefault();
    
    const usuarioInput = document.getElementById('usuario').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const alert = document.getElementById('errorAlertLogin');

    // 1. Validar que los campos no estén vacíos
    if (usuarioInput === '' || passwordInput === '') {
        mostrarError(alert, 'Por favor, completá todos los campos para ingresar.');
        return;
    }

    // 2. Obtener lista de usuarios registrados
    const usuariosRegistrados = JSON.parse(localStorage.getItem('usuariosRegistrados')) || [];

    // 3. Buscar coincidencia por DNI o Email
    const encontrado = usuariosRegistrados.find(
        u => u.dni === usuarioInput || u.email.toLowerCase() === usuarioInput.toLowerCase()
    );

    // 4. Si NO existe el registro, bloquear ingreso
    if (!encontrado) {
        mostrarError(alert, 'El DNI o correo ingresado no se encuentra registrado.');
        return;
    }

    // 5. Validar contraseña
    if (encontrado.pass !== passwordInput) {
        mostrarError(alert, 'La contraseña ingresada es incorrecta.');
        return;
    }

    // 6. Si coincide todo, iniciar sesión con su nombre real
    usuarioActivo = {
        nombre: encontrado.nombre,
        dni: encontrado.dni,
        email: encontrado.email
    };

    localStorage.setItem('usuarioSerranoble', JSON.stringify(usuarioActivo));
    actualizarInterfazUsuario();
    
    closeLogin();
    document.getElementById('loginForm').reset();
}

/**
 * Muestra un mensaje de error dentro de un contenedor de alerta
 */
function mostrarError(elementoAlert, mensaje) {
    if (elementoAlert) {
        elementoAlert.innerText = mensaje;
        elementoAlert.style.display = 'block';
    }
}


/* ==========================================================================
   4. GESTIÓN DE SESIÓN Y ACTUALIZACIÓN DINÁMICA DE LA UI
   ========================================================================== */

/**
 * Actualiza la barra de navegación para mostrar los botones de login o la bienvenida al usuario activo
 */
function actualizarInterfazUsuario() {
    const desktopContainer = document.getElementById('desktopAuthContainer');
    const mobileContainer = document.getElementById('mobileAuthContainer');

    if (usuarioActivo) {
        const userHTML = `
            <div class="user-logged-info" style="display: flex; align-items: center; gap: 12px;">
                <span style="color: #FFFFFF; font-weight: 600;">👋 Hola, ${usuarioActivo.nombre}</span>
                <button class="btn-primary" style="background-color: #E53E3E; color: #FFF;" onclick="cerrarSesion()">Salir</button>
            </div>
        `;

        if (desktopContainer) desktopContainer.innerHTML = userHTML;
        if (mobileContainer) mobileContainer.innerHTML = userHTML;
    } else {
        if (desktopContainer) {
            desktopContainer.innerHTML = `<button class="btn-primary desktop-btn" onclick="openLogin()">Acceder</button>`;
        }
        if (mobileContainer) {
            mobileContainer.innerHTML = `<button class="btn-primary" onclick="openLogin(); closeMenu()">Acceder</button>`;
        }
    }
}

/**
 * Cierra la sesión activa y limpia el almacenamiento local del usuario activo
 */
function cerrarSesion() {
    usuarioActivo = null;
    localStorage.removeItem('usuarioSerranoble');
    actualizarInterfazUsuario();
}


/* ==========================================================================
   5. EVENTOS GLOBALES DE CIERRE (CLICK FUERA Y TECLA ESC)
   ========================================================================== */

// Cierra la modal al hacer click en el fondo oscuro
window.addEventListener('click', (event) => {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        closeLogin();
    }
});

// Cierra la modal al presionar la tecla Esc
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeLogin();
    }
});