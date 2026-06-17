document.addEventListener("DOMContentLoaded", function () {
    // Selecciona todos los elementos con la clase 'event-card'
    const eventCards = document.querySelectorAll(".card");

    // Añade el evento 'click' a cada elemento
    eventCards.forEach(function (card) {
        card.addEventListener("click", function () {
            // Obtiene el ID del evento desde el atributo 'data-event-id'
            const deckId = card.getAttribute("deck-id");
            // Redirige a la página del evento usando el ID
            if (deckId) {
                window.location.href = `/deck-youtube/${deckId}`;
            }
        });
    });
});

/***********************************************************************/
const cards = document.querySelectorAll(".card");
const filterTags = document.querySelectorAll(".filter-tag");

const activeFilters = {
  creator: null,
  set: null,
  status: null
};

filterTags.forEach(tag => {
  tag.addEventListener("click", () => {
    const type = tag.dataset.filterType;
    const value = tag.dataset.filterValue;

    // Toggle
    if (activeFilters[type] === value) {
      activeFilters[type] = null;
      tag.classList.remove("active");
      localStorage.removeItem(`filter_${type}`);
    } else {
      activeFilters[type] = value;

        localStorage.setItem(`filter_${type}`, value);

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
    const creator = card.dataset.creator;
    const set = card.dataset.set;
    const status = card.dataset.status;

    let visible = true;

    if (activeFilters.creator && creator !== activeFilters.creator)
      visible = false;

    if (activeFilters.set && set !== activeFilters.set && creator!='system')
      visible = false;

      if (activeFilters.status && status !== activeFilters.status && creator!='system')
      visible = false;

    card.style.display = visible ? "" : "none";
  });
}

document.addEventListener("DOMContentLoaded", () => {

  const hardDefaults = {
    creator: null,
    set: null,
    status: null
  };

  const defaultFilters = {};

  Object.keys(hardDefaults).forEach(type => {
    const saved = localStorage.getItem(`filter_${type}`);
    defaultFilters[type] = saved !== null ? saved : hardDefaults[type];
  });

  Object.keys(defaultFilters).forEach(type => {
    const value = defaultFilters[type];
    if (!value) return;

    const tag = document.querySelector(
      `.filter-tag[data-filter-type="${type}"][data-filter-value="${value}"]`
    );

    if (tag) {
      tag.classList.add("active");
      activeFilters[type] = value;
    }
  });

  applyFilters();
});


