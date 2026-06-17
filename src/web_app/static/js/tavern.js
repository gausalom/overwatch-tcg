document.addEventListener("DOMContentLoaded", function () {
    // Selecciona todos los elementos con la clase 'event-card'
    const eventCards = document.querySelectorAll(".card");

    // Añade el evento 'click' a cada elemento
    eventCards.forEach(function (card) {
        card.addEventListener("click", function () {
            // Obtiene el ID del evento desde el atributo 'data-event-id'
            const gameId = card.getAttribute("game-id");
            // Redirige a la página del evento usando el ID
            if (gameId) {
                window.location.href = `/tavern/game/${gameId}`;
            }
        });
    });

    // Selecciona todos los elementos con la clase 'event-card'
    const eventCardsReview = document.querySelectorAll(".card-review");

    // Añade el evento 'click' a cada elemento
    eventCardsReview.forEach(function (card) {
        card.addEventListener("click", function () {
            // Obtiene el ID del evento desde el atributo 'data-event-id'
            const gameId = card.getAttribute("review-id");
            // Redirige a la página del evento usando el ID
            if (gameId) {
                window.location.href = `/tavern/game-review/${gameId}`;
            }
        });
    });


    // Selecciona todos los elementos con la clase 'event-card'
    const eventCardsCheckpoint = document.querySelectorAll(".card-checkpoint");

    // Añade el evento 'click' a cada elemento
    eventCardsCheckpoint.forEach(function (card) {
        card.addEventListener("click", function () {
            // Obtiene el ID del evento desde el atributo 'data-event-id'
            const gameId = card.getAttribute("checkpoint-id");
            const sinceScn = card.getAttribute("since-scn");
            // Redirige a la página del evento usando el ID
            if (gameId) {
                window.location.href = `/tavern/game-review/${gameId}?scn=${sinceScn}`;
            }
        });
    });
});


