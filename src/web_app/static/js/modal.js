document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("cardModal");
    const modalImg = document.getElementById("modalImg");
    const closeBtn = document.querySelector(".close");

    // Seleccionamos todas las miniaturas
    const cards = document.querySelectorAll(".card-img");

    cards.forEach(card => {
        card.addEventListener("click", () => {
            modal.style.display = "flex"; // Mostrar modal
            modalImg.src = card.src;      // Poner la imagen grande
        });
    });

    // Cerrar al pulsar la X
    if(closeBtn){
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }


    modal.addEventListener("click", (e) => {
        // Si el click es sobre el modal (fondo) o sobre la imagen
        if (e.target === modal || e.target === modalImg) {
            modal.style.display = "none";  // Cerrar modal
        }
    });
});
