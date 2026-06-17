document.addEventListener("DOMContentLoaded", function () {
    // Selecciona todos los elementos con la clase 'event-card'
    const eventCards = document.querySelectorAll(".card");

    // Añade el evento 'click' a cada elemento
    eventCards.forEach(function (card) {
        card.addEventListener("click", function () {
            // Obtiene el ID del evento desde el atributo 'data-event-id'
            const deckId = card.getAttribute("user-id");
            // Redirige a la página del evento usando el ID
            if (deckId) {
                window.location.href = `/control-panel/${deckId}`;
            }
        });
    });
});

