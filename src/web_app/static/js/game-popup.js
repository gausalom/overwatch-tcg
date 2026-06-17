function openCardPopup(cards, zone="deck", is_mine=true, faceUp = true) {
    console.log(is_mine);
  const popup = document.getElementById("card-popup");
  const cardsContainer = popup.querySelector(".popup-cards");

  // Limpiar cartas previas
  cardsContainer.innerHTML = "";

  // Crear cartas
  for (const card of cards) {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";

    const cardId = Array.isArray(card) ? card[0] : card; // soporte tuplas [id, uuid] o solo id
    if (faceUp) {
      cardDiv.style.backgroundImage = `url('/static/img/card_images/${cardId}.webp')`;
      cardDiv.style.backgroundSize = 'cover';
      cardDiv.style.backgroundPosition = 'center';
      cardDiv.innerText = "";
    }
    if (zone=="deck"){
        if (is_mine && !state.game.read_only){
            cardDiv.onclick = (e) => onCardClickDeck(cardId, e)
        }

    }else if (zone=="discard"){
        if (is_mine && !state.game.read_only){
            cardDiv.onclick = (e) => onCardClickDiscard(cardId, e)
        }
    }
    cardsContainer.appendChild(cardDiv);
  }

  // Mostrar popup
  popup.classList.remove("hidden");

  // Cerrar al pulsar botón
  const closeBtn = popup.querySelector(".popup-close");
  closeBtn.onclick = () => popup.classList.add("hidden");

  // Cerrar al pulsar overlay
  popup.querySelector(".popup-overlay").onclick = () => popup.classList.add("hidden");
}


function onCardClickDiscard(cardId, event) {
  showCardMenuDiscard(event.currentTarget, cardId);
}

function onCardClickDeck(cardId, event) {
  showCardMenuDeck(event.currentTarget, cardId);
}

/****************************** MENU EN VISTAS DE DESCARTE *********************/

let currentCardMenuDiscard = null


function showCardMenuDiscard(cardElement, cardId) {
  // Eliminar menú previo
  if (currentCardMenuDiscard) currentCardMenuDiscard.remove()

  const menu = document.createElement("div")
  menu.className = "card-menu"

  const actions = []
  actions.push("Mano");
  actions.push("Top Deck");
  actions.push("Bottom Deck");


  actions.forEach(actionName => {
    const btn = document.createElement("button")
    btn.innerText = actionName
    btn.onclick = () => {
      handleCardActionFromDiscard(cardId, actionName)
      menu.remove()
      currentCardMenuDiscard = null

        // En lugar de cerrar la ventana, quitamos la carta porque ya se ha actuado sobre ella
      cardElement.remove();
      //document.getElementById("card-popup").classList.add("hidden");

    }
    menu.appendChild(btn)
  })

  cardElement.appendChild(menu)
  currentCardMenuDiscard = menu;
}

// Ocultar menú si haces clic fuera de la carta que lo contiene
document.addEventListener("click", (e) => {
  if (!currentCardMenuDiscard) return;

  // La carta contenedora del menú
  const cardElement = currentCardMenuDiscard.parentElement;

  // Si el click NO fue ni en la carta ni en el menú
  if (!cardElement.contains(e.target) && !currentCardMenuDiscard.contains(e.target)) {
    currentCardMenuDiscard.remove();
    currentCardMenuDiscard = null;
  }
});



/****************************** MENU EN VISTAS DE MAZO *********************/

let currentCardMenuDeck = null


function showCardMenuDeck(cardElement, cardId) {
  // Eliminar menú previo
  if (currentCardMenuDeck) currentCardMenuDeck.remove()

  const menu = document.createElement("div")
  menu.className = "card-menu"

  const actions = []
  actions.push("Mano");
  actions.push("Bottom");


  actions.forEach(actionName => {
    const btn = document.createElement("button")
    btn.innerText = actionName
    btn.onclick = () => {
      handleCardActionFromDeck(cardId, actionName)
      menu.remove()
      currentCardMenuDeck = null

      // En lugar de cerrar la ventana, quitamos la carta porque ya se ha actuado sobre ella
      cardElement.remove();
      //document.getElementById("card-popup").classList.add("hidden");

    }
    menu.appendChild(btn)
  })

  cardElement.appendChild(menu)
  currentCardMenuDeck = menu;
}

// Ocultar menú si haces clic fuera de la carta que lo contiene
document.addEventListener("click", (e) => {
  if (!currentCardMenuDeck) return;

  // La carta contenedora del menú
  const cardElement = currentCardMenuDeck.parentElement;

  // Si el click NO fue ni en la carta ni en el menú
  if (!cardElement.contains(e.target) && !currentCardMenuDeck.contains(e.target)) {
    currentCardMenuDeck.remove();
    currentCardMenuDeck = null;
  }
});