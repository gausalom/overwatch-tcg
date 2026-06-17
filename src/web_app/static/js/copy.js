document.addEventListener("DOMContentLoaded", () => {
    const boton = document.getElementById("btnCopiar");

    boton.addEventListener("click", () => {
            const texto = boton.getAttribute("data-text"); // Obtenemos el texto del atributo

            navigator.clipboard.writeText(texto)
                .then(() => {
                    // Feedback visual
                    boton.textContent = "¡Copiado!";
                    setTimeout(() => {
                        boton.textContent = "Exportar"; // Restauramos el texto
                    }, 1500);
                })
                .catch(err => {
                    console.error("Error al copiar: ", err);
                });
    });
});
