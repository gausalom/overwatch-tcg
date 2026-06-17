


let deck = {};
let inkChart = null;
const deck_id = document.getElementById("deck_id").value;

document.addEventListener("DOMContentLoaded", () => {



  const rawData = document.getElementById("cardData").value;

  const cards = JSON.parse(rawData);

  const rawDeckListDataDeckList = document.getElementById("deckListData").value;
  const deckListData = JSON.parse(rawDeckListDataDeckList);

  const searchInput = document.getElementById("searchInput");
  const cardList = document.getElementById("cardList");

  let filteredCards = cards;
  let batchSize = 20;        // cuántas cartas cargar por lote
  let loadedCount = 0;       // cuántas llevamos cargadas

  const deckList = document.getElementById("deckList");


    deckListData.forEach((card) => {
        for (let step = 0; step < card[1]; step++) {
            addToDeck_initial(card[0]);
        }
    });



    // --- GRAFICA DE CURVA DE TINTA (Chart.js) ---

    function updateDeckStats() {
        let total = 0;
        let notInkable = 0;

        Object.values(deck).forEach(entry => {
            total += entry.qty;

            // Si el campo "inkable" o "tintable" es false
            if (entry.card.inkwell == false) {
                notInkable += entry.qty;
            }
        });

        document.getElementById("totalCards").textContent = total;
    }


    function updateInkCurve() {
        const costCounts = {};

        // Recorre cada carta del deck
        Object.values(deck).forEach(entry => {
            let cost = entry.card.cost || 0;
            if (!costCounts[cost]) costCounts[cost] = 0;

            costCounts[cost] += entry.qty;  // sumamos unidades
        });

        // Determinar el coste mínimo y máximo
        const costs = Object.keys(costCounts).map(Number);
        const minCost = Math.min(...costs, 0); // por si no hay cartas, que arranque en 0
        const maxCost = Math.max(...costs, 0);

        // Generar labels completos con todos los costes intermedios
        const labels = [];
        const values = [];
        for (let i = minCost+1; i <= maxCost; i++) {
            labels.push(i);
            values.push(costCounts[i] || 0); // si no hay cartas de ese coste, ponemos 0
        }

        const ctx = document.getElementById("inkCurveChart").getContext("2d");

        // Si ya existe la gráfica, la destruimos antes de regenerarla
        if (inkChart) inkChart.destroy();

        inkChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Número de Cartas",
                    data: values,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Coste de tinta"
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: "Número de cartas"
                        },
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }


    // Se ejecuta cada vez que hay un cambio
  function renderDeck() {
    deckList.innerHTML = "";

    let status = "";
    Object.values(deck).sort((a, b) => {
            // Primero comparo por type
            if (a.card.type < b.card.type) return -1;
            if (a.card.type > b.card.type) return 1;
            // Si el type es igual, comparo por cost
            return (a.card.cost || 0) - (b.card.cost || 0);
        }).forEach(entry => {

         const row = document.createElement("div");

        if (status!=entry.card.type){
            status = entry.card.type;
            const br = document.createElement("br");

            const textTypeCardP = document.createElement("p");
            textTypeCardP.textContent = status;

            deckList.appendChild(br);
            deckList.appendChild(textTypeCardP);

        }

        if(entry.card.faction=='vanguard'){
            row.className = "deck-row card-sapphire";
        }else if(entry.card.faction=='dominion'){
            row.className = "deck-row card-emerald";
        }else if(entry.card.faction=='omnic'){
            row.className = "deck-row card-steel";
        }else if(entry.card.faction=='outlander'){
            row.className = "deck-row card-amethyst";
        }else{
            row.className = "deck-row"
        }

        const title = document.createElement("span");
        title.textContent = entry.card.name;
        title.className = "deck-title-lab";

        const controls = document.createElement("div");
        controls.className = "deck-controls";


        const btnMinus = document.createElement("button");
        btnMinus.textContent = "-";
        btnMinus.className = "deck-btn";
        btnMinus.onclick = () => {
            if (entry.qty > 1) entry.qty--;
            else delete deck[entry.card.id];
            renderDeck();
        };


        const qty = document.createElement("span");
        qty.textContent = entry.qty;
        qty.className = "deck-qty";


        const btnPlus = document.createElement("button");
        btnPlus.textContent = "+";
        btnPlus.className = "deck-btn";
        btnPlus.onclick = () => {
            if (entry.qty>3) return;
            entry.qty++;
            renderDeck();
        };

        const preview = document.createElement("img");
        preview.className = "deck-preview";
        preview.src = `/static/img/card_images/${entry.card.image}`;

        const ink_img = document.createElement("img");
        ink_img.className = "card-img-ink";
        if(entry.card.faction=='vanguard'){
            ink_img.src = `/static/img/ink/1.webp`;
        }else if(entry.card.faction=='dominion'){
            ink_img.src = `/static/img/ink/2.webp`;
        }else if(entry.card.faction=='omnic'){
            ink_img.src = `/static/img/ink/3.webp`;
        }else if(entry.card.faction=='outlander'){
            ink_img.src = `/static/img/ink/4.webp`;
        }else{
            ink_img.src = `/static/img/ink/1.webp`;
        }

        // Coste + tintable
        const costInkDiv = document.createElement("div");
        costInkDiv.className = "cost-ink-container";

        const costInkImg = document.createElement("img");
        costInkImg.className = "card-img-ink";
        if(entry.card.inkwell){
            costInkImg.src = `/static/img/ink/inkwell.svg`;
        }else {
            costInkImg.src = `/static/img/ink/inkcost.svg`;
        }

        const costInkP = document.createElement("p");
        costInkP.textContent = entry.card.cost;
        costInkP.className = "cost-ink-p";

        costInkDiv.appendChild(costInkImg);
        costInkDiv.appendChild(costInkP);

        const ink_card_title = document.createElement("div");
        ink_card_title.className = "ink_card_title";

        controls.appendChild(btnMinus);
        controls.appendChild(qty);
        controls.appendChild(btnPlus);

        ink_card_title.appendChild(ink_img);
        ink_card_title.appendChild(costInkDiv);
        ink_card_title.appendChild(title);
        row.appendChild(ink_card_title);
        row.appendChild(controls);
        row.appendChild(preview);

        deckList.appendChild(row);

        }
    );
    updateInkCurve();
    updateDeckStats();
  }

  function resetAndRender(filter_name) {


    const activeSets = [...document.querySelectorAll(".filter-set:checked")].map(c => Number(c.value));

    const activeTypes = [...document.querySelectorAll(".filter-type:checked")].map(c => c.value);

    const activeCost = [...document.querySelectorAll(".filter-cost:checked")].map(c => Number(c.value));

    const activeColors = [...document.querySelectorAll(".filter-color:checked")].map(c => c.value);

    filteredCards = cards.filter(c => {
      const textMatch = filter_name === "" || (() => {
          // Convertir a minúsculas
          const filterWords = filter_name.toLowerCase().split(/\s+/);
          const cardName = c.name.toLowerCase();

          // Comprobar que **todas las palabras** estén presentes en el nombre
          return filterWords.every(word => cardName.includes(word));
        })();

      const setMatch = activeSets.length === 0 || activeSets.includes(c.set);

      const typeMatch = activeTypes.length === 0 || activeTypes.includes(c.type);

      const colorMatch = activeColors.length === 0 ||
          activeColors.some(color => c.faction.includes(color));

      const costMatch = activeCost.length === 0 || activeCost.includes(c.cost);

      return textMatch && setMatch && typeMatch && costMatch && colorMatch;
    });


    cardList.innerHTML = "";
    loadedCount = 0;
    loadMoreCards();
    updateInkCurve();
    updateDeckStats();

    const modal = document.getElementById("cardModal");
    const modalImg = document.getElementById("modalImg");
    const closeBtn = document.querySelector(".close");

    const cards_img = document.querySelectorAll(".card-img");

    cards_img.forEach(card => {
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
  }

    // cuando cambian los checkboxes
    document.querySelectorAll('.filter-set').forEach(cb =>
      cb.addEventListener('change', () => resetAndRender(searchInput.value))
    );

    document.querySelectorAll('.filter-type').forEach(cb =>
      cb.addEventListener('change', () => resetAndRender(searchInput.value))
    );

    document.querySelectorAll('.filter-cost').forEach(cb =>
      cb.addEventListener('change', () => resetAndRender(searchInput.value))
    );

    document.querySelectorAll('.filter-color').forEach(cb =>
      cb.addEventListener('change', () => resetAndRender(searchInput.value))
    );


    // cuando el usuario escribe
    searchInput.addEventListener('input', () => resetAndRender(searchInput.value));


  // Carga un lote de X cartas
  function loadMoreCards() {
    const nextBatch = filteredCards.slice(loadedCount, loadedCount + batchSize);

    nextBatch.forEach(card => {
      const cardDiv = document.createElement("div");
      cardDiv.className = "card-item";

      const img = document.createElement("img");
      img.src = `/static/img/card_images/${card.image}`;   // tu formato
      img.alt = card.name;
      img.className = "card-img";

      cardDiv.appendChild(img);
      cardList.appendChild(cardDiv);

      // tu acción de añadir al deck:
      cardDiv.onclick = () => addToDeck(card);
    });

    loadedCount += nextBatch.length;

    // regenerar trigger
    const old = document.getElementById("loadMoreTrigger");
    if (old) old.remove();

    if (loadedCount < filteredCards.length) {
        const trigger = document.createElement("div");
        trigger.id = "loadMoreTrigger";
        trigger.style.height = "1px";
        trigger.style.width = "100%";
        cardList.appendChild(trigger);

        observer.observe(trigger);
    }
    updateInkCurve();
    updateDeckStats();

  }

  // IntersectionObserver para scroll infinito
  const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            loadMoreCards();
        }
    }, {
        root: cardList,   // 👈 MUY IMPORTANTE
        threshold: 0.5
    });



  function addToDeck_initial(card) {
    if (!deck[card.id]) deck[card.id] = { card, qty: 1 };
    else deck[card.id].qty++;
  }

  function addToDeck(card) {
    if(deck[card.id]){
        if (deck[card.id].qty>3) {
            return;
        }
    }
    if (!deck[card.id]){
        deck[card.id] = { card, qty: 1 };
    }
    else {
        deck[card.id].qty++;
    }
    renderDeck();
  }

  // Primera carga
  resetAndRender("");
  renderDeck();

  observer.observe(document.getElementById("loadMoreTrigger"));
});



const deckRows = document.querySelectorAll('.deck-row');

deckRows.forEach(row => {
  const preview = row.querySelector('.deck-preview');

  row.addEventListener('mouseenter', () => {
    preview.style.display = 'block';

    // obtener posición del row y tamaño de la ventana
    const rect = row.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const previewHeight = preview.offsetHeight;

    // si no hay espacio debajo, mostrar arriba
    if (rect.bottom + previewHeight > windowHeight) {
      preview.style.top = `-${previewHeight}px`; // arriba del row
    } else {
      preview.style.top = `${row.offsetHeight}px`; // debajo del row
    }
  });

  row.addEventListener('mouseleave', () => {
    preview.style.display = 'none';
  });
});



const form = document.getElementById('saveDeckForm');


document.getElementById('saveDeckBtn').addEventListener('click', () => {
  // Crear formulario dinámico
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `/save-deck-lab/${deck_id}`;

  // Agregar un input oculto con JSON
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'deck';            // nombre del campo que recibirá el backend
  input.value = JSON.stringify(deck);
  form.appendChild(input);

  document.body.appendChild(form);
  form.submit();  // esto hará el POST y el navegador seguirá el redirect
});



