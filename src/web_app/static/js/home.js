document.addEventListener("DOMContentLoaded", function () {
    // Selecciona todos los elementos con la clase 'event-card'
    const eventCards = document.querySelectorAll(".cards-news-comments");

    // Añade el evento 'click' a cada elemento
    eventCards.forEach(function (card) {
        card.addEventListener("click", function () {
            // Obtiene el ID del evento desde el atributo 'data-event-id'
            const deckId = card.getAttribute("comment-id");
            // Redirige a la página del evento usando el ID
            if (deckId) {
                window.location.href = `/deck/${deckId}`;
            }
        });
    });


});

document.addEventListener("DOMContentLoaded", () => {
        const eventCardsRuns = document.querySelectorAll(".cards-news");

        eventCardsRuns.forEach(card => {
            card.addEventListener("click", () => {
                // Usar dataset si el atributo es data-comment-id
                const deckId = card.getAttribute("comment-id");
                if (deckId) {
                    window.location.href = `/event/${deckId}`;
                }
            });
        });
    });

document.addEventListener("DOMContentLoaded", () => {
    const eventCardsRuns = document.querySelectorAll(".card");

    eventCardsRuns.forEach(card => {
        card.addEventListener("click", () => {
            // Usar dataset si el atributo es data-comment-id
            const deckId = card.getAttribute("comment-id");
            if (deckId) {
                window.location.href = `/deck/${deckId}`;
            }
        });
    });
});