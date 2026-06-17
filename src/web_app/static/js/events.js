document.addEventListener("DOMContentLoaded", function () {
    // Selecciona todos los elementos con la clase 'event-card'
    const eventCards = document.querySelectorAll(".card");

    // Añade el evento 'click' a cada elemento
    eventCards.forEach(function (card) {
        card.addEventListener("click", function () {
            // Obtiene el ID del evento desde el atributo 'data-event-id'
            const deckId = card.getAttribute("tournament-id");
            // Redirige a la página del evento usando el ID
            if (deckId) {
                window.location.href = `/event/${deckId}`;
            }
        });
    });
});


/***********************************************************************/
const cards = document.querySelectorAll(".card");
const filterTags = document.querySelectorAll(".filter-tag");

const activeFilters = {
  creator: null,
  set: null
};

filterTags.forEach(tag => {
  tag.addEventListener("click", () => {
    const type = tag.dataset.filterType;
    const value = tag.dataset.filterValue;

    // Toggle
    if (activeFilters[type] === value) {
      activeFilters[type] = null;
      tag.classList.remove("active");
    } else {
      activeFilters[type] = value;

      // desactivar otros del mismo grupo
      document.querySelectorAll(`.filter-tag[data-filter-type="${type}"]`)
        .forEach(t => t.classList.remove("active"));

      tag.classList.add("active");
    }

    applyFilters();
  });
});

function applyFilters() {
  cards.forEach(card => {
    const set = card.dataset.set;

    let visible = true;

    if (activeFilters.set && set !== activeFilters.set)
      visible = false;

    card.style.display = visible ? "" : "none";
  });
}

