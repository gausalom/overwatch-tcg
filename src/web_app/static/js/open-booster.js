document.querySelectorAll(".card-slot-booster").forEach(card => {
    card.addEventListener("click", function () {
        this.classList.toggle("flipped");
    });
});