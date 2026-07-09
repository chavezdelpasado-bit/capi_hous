// ======================================
// CAPI HOUSE - DASHBOARD
// ======================================

// Verificar si el usuario inició sesión
const token = localStorage.getItem("token");
const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!token) {
    window.location.href = "/";
}

// Mostrar usuario
document.getElementById("usuario").textContent = usuario.login;


// ======================================
// Cargar módulo Inicio al abrir
// ======================================

window.addEventListener("DOMContentLoaded", () => {

    cargarModulo("inicio");

});


// ======================================
// Navegación del menú lateral
// ======================================

const menuItems = document.querySelectorAll(".menu-item");

menuItems.forEach(item => {

    item.addEventListener("click", () => {

        // Quitar selección anterior
        menuItems.forEach(i => i.classList.remove("active"));

        // Activar actual
        item.classList.add("active");

        const modulo = item.dataset.module;

        // Cambiar título
        document.getElementById("tituloModulo").textContent =
            item.textContent.trim();

        // Cargar módulo
        cargarModulo(modulo);

    });

});


// ======================================
// Logout
// ======================================

document.getElementById("logout").addEventListener("click", () => {

    localStorage.removeItem("token");

    localStorage.removeItem("usuario");

    window.location.href = "/";

});



