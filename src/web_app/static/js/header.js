// Espera a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function() {
    // Selecciona el elemento del menú móvil
    const mobileMenu = document.getElementById("mobile-menu");

    // Añade un event listener para el evento 'change'
    mobileMenu.addEventListener("change", function() {
        // Cambia la ubicación de la ventana al valor seleccionado
        const selectedValue = this.value;
        if (selectedValue) { // Asegúrate de que el valor no esté vacío
            window.location.href = selectedValue;
        }
    });
});
