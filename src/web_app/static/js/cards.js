document.addEventListener("DOMContentLoaded", function () {

    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");
    const closeBtn = document.querySelector(".close");

    if (!modal || !modalImg) return;

    const cardImages = document.querySelectorAll(".card-image img");

    // FUNCIÓN ABRIR MODAL
    function openModal(src) {
        modal.style.display = "flex";
        modalImg.src = src;
        document.body.style.overflow = "hidden"; // Bloquear scroll
    }

    // FUNCIÓN CERRAR MODAL
    function closeModal() {
        modal.style.display = "none";
        modalImg.src = "";
        document.body.style.overflow = "auto"; // Restaurar scroll
    }

    // Click en imagen
    cardImages.forEach(img => {
        img.addEventListener("click", function () {
            openModal(this.src);
        });
    });

    // Click en botón X
    if (closeBtn) {
        closeBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            closeModal();
        });
    }

    // Click fuera de la imagen
    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Cerrar con ESC
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && modal.style.display === "flex") {
            closeModal();
        }
    });

});