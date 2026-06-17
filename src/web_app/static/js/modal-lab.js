document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("cardModal");
    const modalImg = document.getElementById("modalImg");
    const closeBtn = document.querySelector(".close");

    const cards = document.querySelectorAll(".card-img");

    cards.forEach(card => {
        card.addEventListener("contextmenu", (e) => {
            e.preventDefault();          // evitar menú contextual
            modal.style.display = "flex";
            modalImg.src = card.src;
        });
    });

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal || e.target === modalImg) {
            modal.style.display = "none";
        }
    });
});
