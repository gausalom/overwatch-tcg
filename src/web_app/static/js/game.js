let controlledSide = "you";
const game_data = document.getElementById("game-data")

const GAME = {
  read_only: game_data.dataset.readOnly,
  my_id: game_data.dataset.id,
  seed: game_data.dataset.seed,
  scn: game_data.dataset.lastScn,
  since_scn: game_data.dataset.sinceScn,

  game_id: game_data.dataset.gameId,
  game_set: game_data.dataset.gameSet,
  game_name: game_data.dataset.gameName,

  player_id: game_data.dataset.playerId,
  player_name: game_data.dataset.playerName,
  player_deck: game_data.dataset.playerDeck,
  player_deck_shuffled: game_data.dataset.playerDeckShuffled,

  opponent_id: game_data.dataset.opponentId,
  opponent_name: game_data.dataset.opponentName,
  opponent_deck: game_data.dataset.opponentDeck,
  opponent_deck_shuffled: game_data.dataset.opponentDeckShuffled,

  location_1: game_data.dataset.location1,
  location_2: game_data.dataset.location2,
  location_3: game_data.dataset.location3,
}

const all_actions = []
let index_actual_action = 0

function parsePythonList(str) {
  if (!str || str === "None") return []

  return str
    .replace(/^\[|\]$/g, "")       // quita [ ]
    .split(",")                   // separa
    .map(s => s.trim())           // limpia espacios
    .map(s => s.replace(/^'|'$/g, ""))  // quita comillas simples
}

function buildInitialState() {
  return {
    game: {
      id: GAME.game_id,
      set: GAME.game_set,
      name: GAME.game_name,
      my_id: Number(GAME.my_id),
      pos: [Number(GAME.player_id), Number(GAME.opponent_id)].includes(Number(GAME.my_id)) ? Number(GAME.player_id) ===  Number(GAME.my_id) ? 'you' : 'opponent' : 'you',
      pos_opponent: [Number(GAME.player_id), Number(GAME.opponent_id)].includes(Number(GAME.my_id)) ? Number(GAME.player_id) ===  Number(GAME.my_id) ? 'opponent' : 'you' : 'opponent',
      guest: [Number(GAME.player_id), Number(GAME.opponent_id)].includes(Number(GAME.my_id)) ? false : true,
      seed: GAME.seed,
      loc_1_you: 0,
      loc_1_opp: 0,
      loc_2_you: 0,
      loc_2_opp: 0,
      loc_3_you: 0,
      loc_3_opp: 0,
      read_only: GAME.read_only === "True",
      since_scn: GAME.since_scn,
      location_1: GAME.location_1,
      location_2: GAME.location_2,
      location_3: GAME.location_3,
    },
    you: {
      id: Number(GAME.player_id),
      hand: [],
      deck: parsePythonList(GAME.player_deck_shuffled),
      discard: [],
      ink: [],
      items: [],
      field1: [],
      field2: [],
      field3: [],
      name: GAME.player_name,
      energy: 0
    },
    opponent: {
      id: Number(GAME.opponent_id),
      hand: [],
      deck: parsePythonList(GAME.opponent_deck_shuffled),
      discard: [],
      ink: [],
      items: [],
      field1: [],
      field2: [],
      field3: [],
      name: GAME.opponent_name,
      energy: 0
    }
  }
}

let state = buildInitialState()

/********************************************* PROCESAR ACCIONES ******************************************************/
const POLL_INTERVAL = 400

let lastSCN = 0

setLocations(GAME.location_1, GAME.location_2, GAME.location_3);

function onCardClick(cardId, zoneName, event) {
   // Si hay una acción pendiente y la carta está en una zona válida
  if (pendingCardSelectionForShift && pendingCardSelectionForShift.validZones.includes(zoneName)) {
    sendAction(pendingCardSelectionForShift.actionType, { info: pendingCardSelectionForShift.card, base: cardId, seat: state.game.pos  });
    // Limpiamos la acción pendiente
    pendingCardSelectionForShift = null;
    return;
  }

  // Si no hay acción pendiente, mostramos el menú normal
  showCardMenu(event.currentTarget, cardId, zoneName);
}

const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImg");
modal.addEventListener("click", () => {
  modal.style.display = "none";
});

function createCardElement(card, faceUp, zoneName, seat_card) {
  const div = document.createElement("div")
  div.className = "card"

  const cardId = card[0]   // tu ID viene como string "005-077"
  const cardUuid = card[1]   // tu ID viene como string "005-077"
  const cardStatus = card[2]   // tu ID viene como string "005-077"
  const is_mine = card[3]
  div.dataset.cardId = cardId
  div.dataset.cardUuid = cardUuid
  div.dataset.zone = zoneName

  // Si la carta está boca arriba, mostrar imagen
  if ((faceUp && cardStatus == 1) || state.game.guest || state.game.read_only) {
    div.style.backgroundImage = `url('/static/img/card_images/${cardId}.webp')`
    div.style.backgroundSize = 'cover'
    div.style.backgroundPosition = 'center'
    div.innerText = ''  // No mostrar texto
  } else {
    // Carta boca abajo
    div.classList.add('face-down')
    div.innerText = ''
    div.style.backgroundImage = `url('/static/img/card_images/back.webp')`
    div.style.backgroundSize = 'cover'
    div.style.backgroundPosition = 'center'
  }

  if (card[4]){
    div.classList.add('exerted')
  }

    if (faceUp && !state.game.guest && !state.game.read_only && seat_card == state.game.pos){
        div.onclick = (e) => onCardClick(cardUuid, zoneName, e)
      }

   // Hover para previsualizar
  div.onmouseenter = () => showPreview(cardId, faceUp, cardStatus, state.game.guest)
  div.onmouseleave = () => clearPreview()

  // añadir vista modal
  div.addEventListener("contextmenu", (e) => {
    e.preventDefault(); // evita menú del navegador
    if (div.classList.contains("face-down")) {
      return;
    }

    const id = div.dataset.cardId;
    const imgPath = `/static/img/card_images/${id}.webp`;

    modalImg.src = imgPath;
    modal.style.display = "flex";
  });

  // Añadimos los contadores
  if (card[5] !== undefined && card[5] !== null && card[5]!=0) {
      const value = document.createElement("div")
      value.className = "card-value"
      value.textContent = card[5]
      div.appendChild(value)
    }

  if (card[6] !== undefined && card[6].length > 0 ) {
      const value = document.createElement("div")
      value.className = "card-boost"
      value.textContent = card[6].length
      div.appendChild(value)
    }


    if (card[9] !== undefined && card[9] > 0 ) {
      const value = document.createElement("div")
      value.className = "card-boost"
      value.textContent = card[9]
      div.appendChild(value)
    }

   if (card[7] !== undefined && card[7].length > 0 ) {
      const value = document.createElement("div")
      value.className = "card-shift"
      value.textContent = "Shifted"
      div.appendChild(value)
    }

    if (card[8] !== undefined && card[8] ) {
      const value = document.createElement("div")
      value.className = "card-location"
      value.textContent = "L"
      div.appendChild(value)
    }

  return div
}


function renderZone(selector, cards, faceUp, zoneName) {
  const zone = document.querySelector(selector)

  const seat_card = selector.includes("you") ? "you":"opponent";

  for (const card of cards) {
    const el = createCardElement(card, faceUp, zoneName, seat_card)
    zone.appendChild(el)
  }
}

function clearZones() {

  document.querySelectorAll(".hand, .field-lane, .ink, .items, .energy").forEach(el => {
    el.innerHTML = ""
  })
}

function renderLoreValues() {
  const opponentLoreValue = document.getElementById("lore-opponent");
  const youLoreValue = document.getElementById("lore-you");

  if (opponentLoreValue) {
    opponentLoreValue.textContent = state.game.lore_opponent || 0;
  }

  if (youLoreValue) {
    youLoreValue.textContent = state.game.lore_you;
  }
}

function renderConqValues(){
    const youLoc1Value = document.getElementById("loc-1-value-you");
    youLoc1Value.textContent = state.game.loc_1_you || 0;

    const youLoc2Value = document.getElementById("loc-2-value-you");
    youLoc2Value.textContent = state.game.loc_2_you || 0;

    const youLoc3Value = document.getElementById("loc-3-value-you");
    youLoc3Value.textContent = state.game.loc_3_you || 0;

     const oppLoc1Value = document.getElementById("loc-1-value-opp");
    oppLoc1Value.textContent = state.game.loc_1_opp || 0;

    const oppLoc2Value = document.getElementById("loc-2-value-opp");
    oppLoc2Value.textContent = state.game.loc_2_opp || 0;

    const oppLoc3Value = document.getElementById("loc-3-value-opp");
    oppLoc3Value.textContent = state.game.loc_3_opp || 0;

}

function render(state) {
  clearZones()
  let faceUp = state.game.my_id != state.opponent.id;

  if (controlledSide === "you" && state.you.id===state.opponent.id){
    faceUp = true;
  }

  renderZone(".you .hand", state.you.hand, faceUp, "hand")
  renderZone(".you .field .lane-1", state.you.field1, true, "field")
  renderZone(".you .field .lane-2", state.you.field2, true, "field")
  renderZone(".you .field .lane-3", state.you.field3, true, "field")
  renderZone(".you .ink", state.you.ink, true, "ink")

  renderZone(".opponent .hand", state.opponent.hand, !faceUp, "hand")
  renderZone(".opponent .field .lane-1", state.opponent.field1, true, "field")
  renderZone(".opponent .field .lane-2", state.opponent.field2, true, "field")
  renderZone(".opponent .field .lane-3", state.opponent.field3, true, "field")
  renderZone(".opponent .ink", state.opponent.ink, true, "ink")

   // Actualizar contadores de ink
  updateEnergyCounter(state.you, ".you .energy");
  updateEnergyCounter(state.opponent, ".opponent .energy");

  renderConqValues();
}

/********************************** FUNCIONAR A APLICAR *******************************/
function handleDraw(action) {
  // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

  // Si no hay cartas en el deck, no hacer nada
  if (!target.deck || target.deck.length === 0) return

  // Sacar la primera carta del deck
  const card = target.deck.shift()

  const uuid = action.id_user +"-"+ action.scn + "-" + card

    const is_mine = (state.game.pos == targetName) ? true : false;
  // Añadir a la mano
  target.hand.push([card,uuid, 1, is_mine, false, 0, [], [], false, 0]) // Carta, Identificador Unico, Boca Arriba o Boca Abajo, es mia,  exerted, contadores, Boost, Shift, is_in_location
}

function handleShuffle(action) {
  const target = state[action.seat];
  const targetName = action.seat;
  // Usa seed como texto
  target.deck = shuffleWithTextSeed(target.deck, state.game.seed);
}

function handleToBase(action) {
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.ink.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'ink';
    } else {
      index = target.field1.findIndex(c => c[1] === cardUuid);
      if (index !== -1) {
        source = 'field1';
      }else{
            index = target.field2.findIndex(c => c[1] === cardUuid);
          if (index !== -1) {
            source = 'field2';
          }else{
                  index = target.field3.findIndex(c => c[1] === cardUuid);
              if (index !== -1) {
                source = 'field3';
              }

          }
      }
    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  // Sacar la carta de la mano
  const [card] = target[source].splice(index, 1);
  target.ink.push(card);
}

function handleMove1(action) {
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.ink.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'ink';
    } else {
      index = target.field1.findIndex(c => c[1] === cardUuid);
      if (index !== -1) {
        source = 'field1';
      }else{
            index = target.field2.findIndex(c => c[1] === cardUuid);
          if (index !== -1) {
            source = 'field2';
          }else{
                  index = target.field3.findIndex(c => c[1] === cardUuid);
              if (index !== -1) {
                source = 'field3';
              }

          }
      }
    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  // Sacar la carta de la mano
  const [card] = target[source].splice(index, 1);
  target.field1.push(card);
}

function handleMove2(action) {
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.ink.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'ink';
    } else {
      index = target.field1.findIndex(c => c[1] === cardUuid);
      if (index !== -1) {
        source = 'field1';
      }else{
            index = target.field2.findIndex(c => c[1] === cardUuid);
          if (index !== -1) {
            source = 'field2';
          }else{
                  index = target.field3.findIndex(c => c[1] === cardUuid);
              if (index !== -1) {
                source = 'field3';
              }

          }
      }
    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  // Sacar la carta de la mano
  const [card] = target[source].splice(index, 1);
  target.field2.push(card);
}

function handleMove3(action) {
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.ink.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'ink';
    } else {
      index = target.field1.findIndex(c => c[1] === cardUuid);
      if (index !== -1) {
        source = 'field1';
      }else{
            index = target.field2.findIndex(c => c[1] === cardUuid);
          if (index !== -1) {
            source = 'field2';
          }else{
                  index = target.field3.findIndex(c => c[1] === cardUuid);
              if (index !== -1) {
                source = 'field3';
              }

          }
      }
    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  // Sacar la carta de la mano
  const [card] = target[source].splice(index, 1);
  target.field3.push(card);
}

function handleInk(action) {
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.hand.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'hand';
    } else {
      index = target.field1.findIndex(c => c[1] === cardUuid);
      if (index !== -1) {
        source = 'field1';
      }else{
            index = target.field2.findIndex(c => c[1] === cardUuid);
          if (index !== -1) {
            source = 'field2';
          }else{
            index = target.field3.findIndex(c => c[1] === cardUuid);
              if (index !== -1) {
                source = 'field3';
              }
          }
      }
    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  // Sacar la carta
  const [card] = target[source].splice(index, 1);
    card[5] = 0;

  card[6].forEach((el) => {
        const card = el;

      const uuid = action.id_user +"-"+ action.scn + "-" + el;

        const is_mine = (state.game.pos == targetName) ? true : false;
      // Añadir a la mano
      target.ink.push([card,uuid, 0, is_mine, false, 0, [], []])

  });

  card[6] = [];

  card[7].forEach((el) => {
        const card = el;

      const uuid = action.id_user +"-"+ action.scn + "-" + el;

        const is_mine = (state.game.pos == targetName) ? true : false;
      // Añadir a la mano
      target.ink.push([card,uuid, 0, is_mine, false, 0, [], []])

  });

  card[7] = [];

  // Añadir la carta a la tinta
  target.ink.push(card);

}

function handleDiscard(action) {
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.hand.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'hand';
    } else {
      index = target.ink.findIndex(c => c[1] === cardUuid);
      if (index !== -1) {
        source = 'ink';
      } else {
          index = target.field1.findIndex(c => c[1] === cardUuid);
          if (index !== -1) {
            source = 'field1';
          }else{
            index = target.field2.findIndex(c => c[1] === cardUuid);
              if (index !== -1) {
                source = 'field2';
              }else{
                index = target.field3.findIndex(c => c[1] === cardUuid);
                  if (index !== -1) {
                    source = 'field3';
                  }
              }
          }
      }
    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  const [card] = target[source].splice(index, 1);

    card[6].forEach((el) => {
          target.discard.push(el)
      });

    card[7].forEach((el) => {
          target.discard.push(el)
      });

  target.discard.push(card[0]);
}

function handleBottom(action) {
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.hand.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'hand';
    } else {
      index = target.ink.findIndex(c => c[1] === cardUuid);
      if (index !== -1) {
        source = 'ink';
      } else {
          index = target.field1.findIndex(c => c[1] === cardUuid);
          if (index !== -1) {
            source = 'field1';
          }else{
            index = target.field2.findIndex(c => c[1] === cardUuid);
              if (index !== -1) {
                source = 'field2';
            }else{
                   index = target.field3.findIndex(c => c[1] === cardUuid);
              if (index !== -1) {
                source = 'field3';
            }
          }
      }
    }
    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  const [card] = target[source].splice(index, 1);

  // Añadir la carta a la tinta
  target.deck.push(card[0]);

  card[6].forEach((el) => {
      target.deck.push([el])
  });

  card[6] = [];

  card[7].forEach((el) => {
      target.deck.push([el])
  });

  card[7] = [];
}

function handleTop(action) {
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.hand.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'hand';
    } else {
      index = target.ink.findIndex(c => c[1] === cardUuid);
      if (index !== -1) {
        source = 'ink';
      } else {
          index = target.field1.findIndex(c => c[1] === cardUuid);
          if (index !== -1) {
            source = 'field1';
          }else{
               index = target.field2.findIndex(c => c[1] === cardUuid);
              if (index !== -1) {
                source = 'field2';
                } else{
               index = target.field3.findIndex(c => c[1] === cardUuid);
              if (index !== -1) {
                source = 'field3';
          }
          }
    }
    }
    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  const [card] = target[source].splice(index, 1);

    card[6].forEach((el) => {
          target.deck.unshift(el)
      });

    card[7].forEach((el) => {
          target.deck.unshift(el)
      });

  // Añadir la carta a la tinta
  target.deck.unshift(card[0]);

}

function handleFaceDown(action) {
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

      index = target.ink.findIndex(c => c[1] === cardUuid);
      if (index !== -1) {
        source = 'ink';
      } else {
          index = target.field.findIndex(c => c[1] === cardUuid);
          if (index !== -1) {
            source = 'field';
          }
      }


    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  target[source][index][2] = 0;

}

function handleFaceUp(action) {
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

      index = target.ink.findIndex(c => c[1] === cardUuid);
      if (index !== -1) {
        source = 'ink';
      } else {
          index = target.field.findIndex(c => c[1] === cardUuid);
          if (index !== -1) {
            source = 'field';
          }
      }


    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  target[source][index][2] = 1;

}

function handleHand(action) {
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.field1.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'field1';
    } else {
      index = target.field2.findIndex(c => c[1] === cardUuid);
      if (index !== -1) {
        source = 'field2';
      }else {
      index = target.field3.findIndex(c => c[1] === cardUuid);
      if (index !== -1) {
        source = 'field3';
      }else{
        index = target.ink.findIndex(c => c[1] === cardUuid);
      if (index !== -1) {
        source = 'ink';
      }
      }
      }
    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  // Sacar la carta de la mano
  const [card] = target[source].splice(index, 1);
  card[2] = 1;
  card[4] = false;
  card[5] = 0;
  card[9] = 0;


  card[6].forEach((el) => {
        const card = el;

      const uuid = action.id_user +"-"+ action.scn + "-" + el;

        const is_mine = (state.game.pos == targetName) ? true : false;
      // Añadir a la mano
      target.hand.push([card,uuid, 1, is_mine, false, 0, [], [], false, 0])

  });

  card[6] = [];

  card[7].forEach((el) => {
        const card = el;

      const uuid = action.id_user +"-"+ action.scn + "-" + el;

        const is_mine = (state.game.pos == targetName) ? true : false;
      // Añadir a la mano
      target.hand.push([card,uuid, 1, is_mine, false, 0, [], [], false , 0])

  });

  card[7] = [];

  target.hand.push(card);
}

function handleExert(action){
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.field1.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'field1';
    } else {
      index = target.field2.findIndex(c => c[1] === cardUuid);
      if (index !== -1) {
        source = 'field2';
      }else {
      index = target.field3.findIndex(c => c[1] === cardUuid);
      if (index !== -1) {
        source = 'field3';
      }else{
            index = target.ink.findIndex(c => c[1] === cardUuid);
          if (index !== -1) {
            source = 'ink';
          }
      }
      }
      }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  target[source][index][4] = !target[source][index][4];
}

function handleShieldPlus(action){

  // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.field1.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'field1';
    }else{
           index = target.field2.findIndex(c => c[1] === cardUuid);
        if (index !== -1) {
          source = 'field2';
        }else{
            index = target.field3.findIndex(c => c[1] === cardUuid);
            if (index !== -1) {
              source = 'field3';
            }else{
                index = target.ink.findIndex(c => c[1] === cardUuid);
                if (index !== -1) {
                  source = 'ink';
                }
            }
        }
    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  target[source][index][9] = target[source][index][9]+1;
}

function handleShieldMinus(action){

  // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.field1.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'field1';
    }else{
           index = target.field2.findIndex(c => c[1] === cardUuid);
        if (index !== -1) {
          source = 'field2';
        }else{
            index = target.field3.findIndex(c => c[1] === cardUuid);
            if (index !== -1) {
              source = 'field3';
            }else{
                index = target.ink.findIndex(c => c[1] === cardUuid);
                if (index !== -1) {
                  source = 'ink';
                }
            }
        }
    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  target[source][index][9] = target[source][index][9]-1;
}


function handlePlusCounter(action){
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.field1.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'field1';
    }else{
           index = target.field2.findIndex(c => c[1] === cardUuid);
        if (index !== -1) {
          source = 'field2';
        }else{
            index = target.field3.findIndex(c => c[1] === cardUuid);
            if (index !== -1) {
              source = 'field3';
            }else{
                index = target.ink.findIndex(c => c[1] === cardUuid);
                if (index !== -1) {
                  source = 'ink';
                }
            }
        }
    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  target[source][index][5] = target[source][index][5]+1;
}

function handleMinusCounter(action){
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.field1.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'field1';
    }else{
        index = target.field2.findIndex(c => c[1] === cardUuid);
        if (index !== -1) {
          source = 'field2';
        }else{
            index = target.field3.findIndex(c => c[1] === cardUuid);
                if (index !== -1) {
                  source = 'field3';
                }else{
                    index = target.ink.findIndex(c => c[1] === cardUuid);
                if (index !== -1) {
                  source = 'ink';
                }
                }
        }

    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  target[source][index][5] = target[source][index][5]-1;
}

function handleDraw7(action){

      // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

  // Si no hay cartas en el deck, no hacer nada
  if (!target.deck || target.deck.length < 7) return

  // Sacar la primera carta del deck
  for (let i = 0; i < 7; i++) {

      const card = target.deck.shift()

      const uuid = action.id_user +"-"+ action.scn + "-" + card + "-" + i

        const is_mine = (state.game.pos == targetName) ? true : false;
      // Añadir a la mano
      target.hand.push([card,uuid, 1, is_mine, false, 0, [], [], false, 0]) // Carta, Identificador Unico, Boca Arriba o Boca Abajo, es mia,  exerted, contadores, Boost
  }
}

function handleDiscardHand(action) {
  const target = state[action.seat];
  const targetName = action.seat;

  if (!target.hand.length) return;

  target.discard.push(...target.hand.map(card => card[0]));
  target.hand = [];
}

function handleBoost(action) {
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.field.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'field';
    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

    const card = target.deck.shift()
  target[source][index][6].push(card);
}

function handleShift(action) {
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

  const cardUuid = action.info.split("|")[0]; // Carta en mano que quiero jugar
  const cardBase = action.info.split("|")[1]; // Carta en el campo

  // Carta base que ya está en el campo la queremos eliminar y quedarnos con el codigo.
  let source = null;
    let index = -1;

    index = target.field.findIndex(c => c[1] === cardBase);
    if (index !== -1) {
      source = 'field';
    }

    const card_code = target[source][index][0]
    const [card] = target[source].splice(index, 1);

    // Una vez tenemos la carta, jugamos la que se quieren y se le asigna la que tiene debajo.

    source = null;
    index = -1;

    index = target.hand.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'hand';
    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  // Sacar la carta de la mano
  //TODO: añadir que si hago shift into shift se pasen al nuevo!
  const [card_shifted] = target[source].splice(index, 1);
  card_shifted[7].push(card_code)
  target.field.push(card_shifted);

}

function handleOpponentMinusLore(action){
    state.game.lore_opponent -= 1;
}

function handleOpponentPlusLore(action){
    state.game.lore_opponent += 1;
}
function handleYouMinusLore(action){
    state.game.lore_you -= 1;
}

function handleLoc1Minus(action){
    if (action.seat == "you"){
        state.game.loc_1_you -= 1;
    }
    if (action.seat == "opponent"){
        state.game.loc_1_opp -= 1;
    }

}

function handleLoc1Plus(action){
    if (action.seat == "you"){
        state.game.loc_1_you += 1;
    }
    if (action.seat == "opponent"){
        state.game.loc_1_opp += 1;
    }

}


function handleLoc2Minus(action){
    if (action.seat == "you"){
        state.game.loc_2_you -= 1;
    }
    if (action.seat == "opponent"){
        state.game.loc_2_opp -= 1;
    }

}

function handleLoc2Plus(action){
    if (action.seat == "you"){
        state.game.loc_2_you += 1;
    }
    if (action.seat == "opponent"){
        state.game.loc_2_opp += 1;
    }

}

function handleLoc3Minus(action){
    if (action.seat == "you"){
        state.game.loc_3_you -= 1;
    }
    if (action.seat == "opponent"){
        state.game.loc_3_opp -= 1;
    }

}

function handleLoc3Plus(action){
    if (action.seat == "you"){
        state.game.loc_3_you += 1;
    }
    if (action.seat == "opponent"){
        state.game.loc_3_opp += 1;
    }

}

function handleYouPlusLore(action){

    state.game.lore_you = state.game.lore_you + 1;
}

function handleReturnHandFromDiscard(action) {
  // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

  const cardId = action.info;

  // Buscar carta en el descarte
  const index = target.discard.findIndex(c => c === cardId);

  if (index === -1) {
    console.warn("Carta no encontrada en discard:", cardId);
    return;
  }

  // Sacar carta del descarte
  const [card] = target.discard.splice(index, 1);

  // Crear UUID nuevo
  const uuid = `${action.id_user}-${action.scn}-${card}`;

  const is_mine = (state.game.pos === targetName);

  // Añadir a la mano
  target.hand.push([
    card,        // cardId
    uuid,        // uuid
    1,           // face up
    is_mine,     // es mía
    false,       // exerted
    0,           // contadores
    [],          // boost
    [],           // shift
    0 // shields
  ]);
}


function handleReturnTopdeckFromDiscard(action) {
  // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

  const cardId = action.info;

  // Buscar carta en el descarte
  const index = target.discard.findIndex(c => c === cardId);

  if (index === -1) {
    console.warn("Carta no encontrada en discard:", cardId);
    return;
  }

  // Sacar carta del descarte
  const [card] = target.discard.splice(index, 1);

  // Colocar arriba del mazo
  target.deck.unshift(card);
}


function handleReturnBottomFromDiscard(action) {
  // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

  const cardId = action.info;

  // Buscar la carta en el descarte
  const index = target.discard.findIndex(c => c === cardId);

  if (index === -1) {
    console.warn("Carta no encontrada en discard:", cardId);
    return;
  }

  // Quitar del descarte
  const [card] = target.discard.splice(index, 1);

  // Colocar al fondo del mazo
  target.deck.push(card);
}

function handleGetCardToHandFromDeck(action){
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

  const cardId = action.info;

  // Buscar la carta en el descarte
  const index = target.deck.findIndex(c => c === cardId);

  if (index === -1) {
    console.warn("Carta no encontrada en discard:", cardId);
    return;
  }

  // Quitar del descarte
  const [card] = target.deck.splice(index, 1);

  const uuid = action.id_user +"-"+ action.scn + "-" + card

    const is_mine = (state.game.pos == targetName) ? true : false;
  // Añadir a la mano
  target.hand.push([card,uuid, 1, is_mine, false, 0, [], [], false, 0]) // Carta, Identificador Unico, Boca Arriba o Boca Abajo, es mia,  exerted, contadores, Boost, Shift
}

function handleSendBottomFromDeck(action){
    // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

  const cardId = action.info;

  // Buscar la carta en el descarte
  const index = target.deck.findIndex(c => c === cardId);

  if (index === -1) {
    console.warn("Carta no encontrada en discard:", cardId);
    return;
  }

  const [card] = target.deck.splice(index, 1);

  // Colocar al fondo del mazo
  target.deck.push(card);

}

function handleLocation(action){
      // Determinar si es yo o el oponente
  const target = state[action.seat];
  const targetName = action.seat;

    // UUID de la carta que llega en action.info
  const cardUuid = action.info;

  let source = null;
    let index = -1;

    index = target.field.findIndex(c => c[1] === cardUuid);
    if (index !== -1) {
      source = 'field';
    }

    if (!source) {
      console.warn("Carta no encontrada:", cardUuid);
      return;
    }

  target[source][index][9] = !target[source][index][9];
}

function handleFinishGame(action){
    const finishOverlay = document.getElementById("finish-overlay");
    finishOverlay.classList.remove("hidden")
}

function handleAddEnergy(action){
    const target = state[action.seat];
    target.energy += 1;
}

function handleRemoveEnergy(action){
    const target = state[action.seat];
    target.energy -= 1;
}


function formatActionLog(action) {
  // 1️⃣ Obtener el nombre del usuario desde el state
  const userId = Number(action.id_user);
  let userName = "Desconocido";
  if (state.you.id === userId) userName = state.you.name;
  else if (state.opponent.id === userId) userName = state.opponent.name;

  // 2️⃣ Mapear el id_action a un texto
  const actionNames = {
    1: "Roba 1 carta",
    2: "Mezcla el mazo",
    3: "Despliega",
    4: "Mueve a localización 1",
    5: "Descarta",
    6: "Coloca en el Bottom",
    7: "Coloca en el Top",
    8: "Coloca boca abajo",
    9: "Coloca boca arriba",
    10: "Devuelve a la mano",
    11: "Gira",
    12: "Recibe 1 daño",
    13: "Cura 1 daño",
    14: "Roba 7 cartas",
    15: "Descarta la mano",
    16: "Boost",
    17: "Shift",
    18: "Disminuye 1 Lore",
    19: "Aumenta 1 Lore",
    20: "Disminuye 1 Lore",
    21: "Aumenta 1 Lore",
    22: "Devuelve a la mano del descarte",
    23: "Devuelve al top del descarte",
    24: "Devuelve al bottom del descarte",
    25: "Coloca del mazo a la mano",
    26: "Coloca del mazo al fondo",
    27: "Viaja a una Localización",
    28: "Finaliza la partida",
    29: "Devuelve una Carta en el Mulligan",
    30: "Mueve a localización 2",
    31: "Mueve a localización 3",
    32: "Mueve a base",
    33: "Añade Energía",
    34: "Destruye Energía",
    35: "Retrocede en Loc 1",
    36: "Avanza en Loc 1",
    37: "Retrocede en Loc 2",
    38: "Avanza en Loc 2",
    39: "Retrocede en Loc 3",
    40: "Avanza en Loc 3",
    41: "Obtiene escudo",
    42: "Gasta escudo"
  };
  const actionText = actionNames[action.id_action] || "Acción desconocida";

  // 3️⃣ Parsear la info
  // info = "1-2026012012260405-010-129-6"
  const infoParts = action.info ? action.info.split("-") : [];

  // userId y scn ya los tenemos
  const set = infoParts[2] || "";
  const cardNum = infoParts[3] || "";
  const incremental = infoParts[4] || "";

  // 4️⃣ Construir el texto final
  let text = `[${userName}] ${actionText}`;
  if (set && cardNum && action.id_action!=29) {
    text += ` ${set}-${cardNum}`;
  }

  return text;
}


// Aplicar la función que llega desde el backend
function applyAction(action) {
  addLogMessage(formatActionLog(action));
  switch (action.id_action) {

    case 1:
        handleDraw(action)
        break

    case 2:
        handleShuffle(action)
        break

    case 3:
        handleInk(action)
        break

    case 4:
        handleMove1(action)
        break

     case 30:
        handleMove2(action)
        break

    case 31:
        handleMove3(action)
        break

    case 5:
        handleDiscard(action)
        break

    case 6:
        handleBottom(action)
        break

    case 7:
        handleTop(action)
        break

    case 8:
        handleFaceDown(action)
        break

    case 9:
        handleFaceUp(action)
        break

    case 10:
        handleHand(action)
        break

    case 11:
        handleExert(action)
        break

    case 12:
        handlePlusCounter(action)
        break

    case 13:
        handleMinusCounter(action)
        break

    case 14:
        handleDraw7(action)
        break

    case 15:
        handleDiscardHand(action)
        break

    case 16:
        handleBoost(action)
        break

    case 17:
        handleShift(action)
        break

    case 18:
        handleOpponentMinusLore(action)
        break

    case 19:
        handleOpponentPlusLore(action)
        break

    case 20:
        handleYouMinusLore(action)
        break

    case 21:
        handleYouPlusLore(action)
        break

    case 22:
        handleReturnHandFromDiscard(action)
        break

    case 23:
        handleReturnTopdeckFromDiscard(action)
        break

    case 24:
        handleReturnBottomFromDiscard(action)
        break

    case 25:
        handleGetCardToHandFromDeck(action)
        break

    case 26:
        handleSendBottomFromDeck(action)
        break

    case 27:
        handleLocation(action)
        break

    case 28:
        handleFinishGame(action)
        break

    case 29:
        handleBottom(action)
        break

    case 32:
        handleToBase(action)
        break

    case 33:
        handleAddEnergy(action)
        break

    case 34:
        handleRemoveEnergy(action)
        break

    case 35:
        handleLoc1Minus(action)
        break

    case 36:
        handleLoc1Plus(action)
        break

    case 37:
        handleLoc2Minus(action)
        break

    case 38:
        handleLoc2Plus(action)
        break

    case 39:
        handleLoc3Minus(action)
        break

    case 40:
        handleLoc3Plus(action)
        break

    case 41:
        handleShieldPlus(action)
        break

    case 42:
        handleShieldMinus(action)
        break

  }

}

// Función que va pidiendo la información al servidor
async function pollActions() {
  try {
    const res = await fetch(
      `/tavern/game/${GAME.game_id}/actions?scn=${lastSCN}`
    )

    const newActions = await res.json()
    if (newActions.length > 0) {

      // Procesamiento de las Acciones
      for (const action of newActions){
        all_actions.push(action)
        applyAction(action)
        if (Number(action.scn) > lastSCN) {
          lastSCN = Number(action.scn)
        }
      }
      render(state)
    }
  } catch (err) {
    // TODO: Hay que desarrollarlo! Debe avisar
    console.error("Polling failed", err)
  }
}

async function get_all_actions(){
    try {
    const res = await fetch(
      `/tavern/game/${GAME.game_id}/actions`
    )

    const newActions = await res.json()
    if (newActions.length > 0) {

      // Procesamiento de las Acciones
      for (const action of newActions){
        all_actions.push(action)
      }
    }
  } catch (err) {
    console.error("Polling failed", err)
  }
}


render(state)

if (!state.game.read_only){
    setInterval(pollActions, POLL_INTERVAL)
}

async function loadReadOnlyGame() {
  if (!state.game.read_only) return;

  await get_all_actions();

  if (state.game.since_scn > 0) {

    for (let i = 0; i < all_actions.length; i++) {
        index_actual_action = i+1;
      const new_action = all_actions[i];
      applyAction(new_action);
      lastSCN = new_action.scn;

      if (new_action.scn == state.game.since_scn) {
        break;
      }
    }

    render(state);
  }
}

loadReadOnlyGame();




/*************************************************** SEND ACTIONS *****************************************************/
/*
En este apartado se programa la asignación de envío de acciones según los botones

*/
let currentCardMenu = null
let pendingCardSelectionForShift = null;



function handleCardAction(cardId, actionName) {
  switch(actionName){
    case "Mover 1":
        sendAction("PLAY", { info: cardId, seat: state.game.pos })
        break
    case "Mover 2":
        sendAction("PLAY2", { info: cardId, seat: state.game.pos })
        break
    case "Mover 3":
        sendAction("PLAY3", { info: cardId, seat: state.game.pos })
        break
    case "Jugar":
        sendAction("INK", { info: cardId, seat: state.game.pos })
        break
    case "Descarte":
        sendAction("DISCARD", { info: cardId, seat: state.game.pos })
        break
    case "Bottom Deck":
        sendAction("BOTTOM", { info: cardId, seat: state.game.pos })
        break
    case "Bottom Mulligan":
        sendAction("BOTTOM_MULLIGAN", { info: cardId, seat: state.game.pos })
        break
    case "Top Deck":
        sendAction("TOP", { info: cardId, seat: state.game.pos })
        break
    case "Boca Abajo":
        sendAction("FACEDOWN", { info: cardId, seat: state.game.pos })
        break
    case "Boca Arriba":
        sendAction("FACEUP", { info: cardId, seat: state.game.pos })
        break
    case "Mano":
        sendAction("HAND", { info: cardId, seat: state.game.pos })
        break
    case "Girar":
        sendAction("EXERT", { info: cardId, seat: state.game.pos })
        break
    case "+":
        sendAction("PLUS_COUNTER", { info: cardId, seat: state.game.pos })
        break
    case "-":
        sendAction("MINUS_COUNTER", { info: cardId, seat: state.game.pos })
        break
    case "Boost":
        sendAction("BOOST", { info: cardId, seat: state.game.pos })
        break
    case "Shift":
        pendingCardSelectionForShift = {
          actionType: "SHIFT",
          validZones: ["field"], // solo del campo propio,
          card: cardId,
          seat: state.game.pos
        };
        break
    case "Location":
        sendAction("LOCATION", { info: cardId, seat: state.game.pos })
        break
    case "Base":
        sendAction("TO_BASE", { info: cardId, seat: state.game.pos })
        break
    case "+Shield":
        sendAction("SHIELD_PLUS", { info: cardId, seat: state.game.pos })
        break
    case "-Shield":
        sendAction("SHIELD_MINUS", { info: cardId, seat: state.game.pos })
        break
  }

}


function handleCardActionFromDiscard(cardId, actionName) {
  console.log("Acción sobre carta", cardId, ":", actionName)

  switch(actionName){
    case "Mano":
        sendAction("RETURN_HAND", { info: cardId, seat: state.game.pos })
        break
    case "Top Deck":
        sendAction("RETURN_TOPDECK", { info: cardId, seat: state.game.pos })
        break
    case "Bottom Deck":
        sendAction("RETURN_BOTTOM", { info: cardId, seat: state.game.pos })
        break

  }

}

function handleCardActionFromDeck(cardId, actionName) {
  console.log("Acción sobre carta", cardId, ":", actionName)

  switch(actionName){
    case "Mano":
        sendAction("GET_HAND", { info: cardId, seat: state.game.pos })
        break
    case "Bottom":
        sendAction("SEND_BOTTOM", { info: cardId, seat: state.game.pos })
        break
  }

}

function showCardMenu(cardElement, cardId, zoneName) {
  if (currentCardMenu) currentCardMenu.remove();

  const menu = document.createElement("div");
  menu.className = "card-menu";

  let actions = [];
  if (zoneName === "hand") {
    actions = ["Jugar", "Descarte", "Bottom Deck", "Top Deck", "Bottom Mulligan"];
  } else if (zoneName === "ink") {
    actions = ["Girar", "+", "-", "Mover 1", "Mover 2", "Mover 3", "+Shield", "-Shield", "Descarte", "Mano", "Bottom Deck", "Top Deck"];
  } else if (zoneName === "field") {
    actions = [
      "Girar", "+", "-", "Mover 1", "Mover 2", "Mover 3", "+Shield", "-Shield", "Base", "Descarte", "Mano", "Bottom Deck", "Top Deck"
    ];
  }

  const PAGE_SIZE = 5;
  let page = 0;

  const renderPage = () => {
    menu.innerHTML = "";

    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageActions = actions.slice(start, end);

    pageActions.forEach(actionName => {
      const btn = document.createElement("button");
      btn.innerText = actionName;
      btn.onclick = (e) => {
          e.stopPropagation();
          handleCardAction(cardId, actionName);
          menu.remove();
          currentCardMenu = null;
        };
      menu.appendChild(btn);
    });

    // Navegación
    if (actions.length > PAGE_SIZE) {
      const nav = document.createElement("div");
      nav.className = "card-menu-nav";

      if (page > 0) {
        const prev = document.createElement("button");
        prev.innerText = "←";
        prev.onclick = (e) => {
          e.stopPropagation();
          page--;
          renderPage();
        };
        nav.appendChild(prev);
      }

      if (end < actions.length) {
        const next = document.createElement("button");
        next.innerText = "→";
        next.onclick = (e) => {
          e.stopPropagation();
          page++;
          renderPage();
        };
        nav.appendChild(next);
      }

      menu.appendChild(nav);
    }
  };

  renderPage();
  cardElement.appendChild(menu);
  currentCardMenu = menu;
}



// Ocultar menú si haces clic fuera de la carta que lo contiene
document.addEventListener("click", (e) => {
  if (!currentCardMenu) return;

  // La carta contenedora del menú
  const cardElement = currentCardMenu.parentElement;

  // Si el click NO fue ni en la carta ni en el menú
  if (!cardElement.contains(e.target) && !currentCardMenu.contains(e.target)) {
    currentCardMenu.remove();
    currentCardMenu = null;
  }
});



async function sendAction(actionType, payload = {}) {
  try {
    const res = await fetch(`/tavern/game/${GAME.game_id}/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: actionType,
        user: GAME.my_id,
        payload: payload
      })
    })

    if (!res.ok) {
      console.error('Error sending action', res.status)
      return
    }

    const data = await res.json()
    return data

  } catch (err) {
    console.error('Network error sending action:', err)
  }
}


const drawButton = document.getElementById("draw");
if (drawButton) {
  drawButton.onclick = () => sendAction("DRAW_CARD", {seat: state.game.pos});
}

const shuffleButton = document.getElementById("shuffle-button");
if (shuffleButton) {
  shuffleButton.onclick = () => sendAction("SHUFFLE_DECK", {seat: state.game.pos});
}

const seeDeckButton = document.getElementById("see-deck");
if (seeDeckButton) {
  seeDeckButton.onclick = () => openCardPopup(state[state.game.pos]['deck'], "deck", true);
}

const seeOpponentDeckButton = document.getElementById("see-opponent-deck");
if (seeOpponentDeckButton) {
  seeOpponentDeckButton.onclick = () => openCardPopup(state[state.game.pos_opponent]['deck'], "deck", false);
}

const seeDiscardButton = document.getElementById("see-discard");
if (seeDiscardButton) {
  seeDiscardButton.onclick = () => openCardPopup(state[state.game.pos]['discard'], "discard", true);
}

const seeDiscardOpponentButton = document.getElementById("see-discard-opponent");
if (seeDiscardOpponentButton) {
  seeDiscardOpponentButton.onclick = () => openCardPopup(state[state.game.pos_opponent]['discard'], "discard", false);
}

const draw7Button = document.getElementById("draw-7");
if (draw7Button) {
  draw7Button.onclick = () => sendAction("DRAW7", {seat: state.game.pos});
}

const addEnergyButton = document.getElementById("add_energy");
if (addEnergyButton) {
  addEnergyButton.onclick = () => sendAction("ADD_ENERGY", {seat: state.game.pos});
}

const destroyEnergyButton = document.getElementById("remove_energy");
if (destroyEnergyButton) {
  destroyEnergyButton.onclick = () => sendAction("REMOVE_ENERGY", {seat: state.game.pos});
}

const discardAllHandButton = document.getElementById("discard-all-hand");
if (discardAllHandButton) {
  discardAllHandButton.onclick = () => sendAction("DISCARD_HAND", {seat: state.game.pos});
}


const loc1MinusButton = document.getElementById("loc-1-minus");
if (loc1MinusButton) {
  loc1MinusButton.onclick = () => sendAction("LOC_1_MINUS", {seat: state.game.pos});
}

const loc1PlusButton = document.getElementById("loc-1-plus");
if (loc1PlusButton) {
  loc1PlusButton.onclick = () => sendAction("LOC_1_PLUS", {seat: state.game.pos});
}

const loc2MinusButton = document.getElementById("loc-2-minus");
if (loc2MinusButton) {
  loc2MinusButton.onclick = () => sendAction("LOC_2_MINUS", {seat: state.game.pos});
}

const loc2PlusButton = document.getElementById("loc-2-plus");
if (loc2PlusButton) {
  loc2PlusButton.onclick = () => sendAction("LOC_2_PLUS", {seat: state.game.pos});
}

const loc3MinusButton = document.getElementById("loc-3-minus");
if (loc3MinusButton) {
  loc3MinusButton.onclick = () => sendAction("LOC_3_MINUS", {seat: state.game.pos});
}

const loc3PlusButton = document.getElementById("loc-3-plus");
if (loc3PlusButton) {
  loc3PlusButton.onclick = () => sendAction("LOC_3_PLUS", {seat: state.game.pos});
}

const seeXInput = document.getElementById("see-x-value");
const seeXCardsButton = document.getElementById("see-x");

if (seeXCardsButton){
    seeXCardsButton.onclick = () => {
      const x = parseInt(seeXInput.value, 10);

      if (isNaN(x) || x <= 0) return; // seguridad básica

      openCardPopup(
        state[state.game.pos].deck.slice(0, x), "deck", true
      );

      seeXInput.value = 0;
    };
}



const form = document.getElementById("checkpoint");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Evita que el formulario recargue la página

    // Recoger los datos del formulario
    const formData = new FormData(form);

    // Convertir a objeto plano
    const payload = {};
    formData.forEach((value, key) => {
      payload[key] = value;
    });
    payload["scn"] = lastSCN;

    try {
      // Enviar la petición POST
      const response = await fetch("/save-checkpoint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",  // enviar como JSON
        },
        body: JSON.stringify(payload),
      });

      if(response.ok){
        alert("Se ha marcado un Checkpoint en la situación actual.");
      }
    } catch (err) {
      console.error("Error de red:", err);
    }
  });
}


/*********************************** BOTONES DE LORE **************************/
// Array de botones con su id y acción
const loreButtons = [
  { id: "opponent-lore-minus", action: "OPPONENT_MINUS_LORE" },
  { id: "opponent-lore-plus",  action: "OPPONENT_PLUS_LORE"  },
  { id: "you-lore-minus",      action: "YOU_MINUS_LORE"      },
  { id: "you-lore-plus",       action: "YOU_PLUS_LORE"       }
];

// Deshabilitamos todos por defecto
loreButtons.forEach(btn => {
  const el = document.getElementById(btn.id);
  if (el) el.disabled = true;
});

//TODO: Hay que hacerle rwork para cuando juegas tu solo.
function UpdateLoreButtonsSituation(){
    // Solo si no es guest
    if (!state.game.guest && !state.game.read_only) {
      if (state.game.pos === "you") {
        ["you-lore-minus", "you-lore-plus"].forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.disabled = false;
            el.onclick = () => {
              sendAction(loreButtons.find(b => b.id === id).action, {});
            };
          }
        });
      } else {
        ["opponent-lore-minus", "opponent-lore-plus"].forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.disabled = false;
            el.onclick = () => {
              sendAction(loreButtons.find(b => b.id === id).action, {});
            };
          }
        });
      }
    }
}

UpdateLoreButtonsSituation();



/**************************** READ ONLY **********************************/
const arrowRightButton = document.getElementById("arrow-right");
if (arrowRightButton) {
  arrowRightButton.onclick = () => {
    if (index_actual_action>=all_actions.length) {
        return;
    }
    new_action = all_actions[index_actual_action];
    if(new_action.id_action!=28){
        applyAction(new_action);
    }
    index_actual_action = index_actual_action +1;
    lastSCN = new_action.scn;
    render(state);
    };
}

const goEndButton = document.getElementById("go-end");
if (goEndButton) {
  goEndButton.onclick = () => {
    if (index_actual_action>=all_actions.length) {
        return;
    }

    for(var i = index_actual_action; i < all_actions.length; i++){
        new_action = all_actions[i];
        if(new_action.id_action!=28){
            applyAction(new_action);
        }
    }
    index_actual_action = all_actions.length;
    lastSCN = new_action.scn;
    render(state);
    };
}

const arrowLeftButton = document.getElementById("arrow-left");
if (arrowLeftButton) {
  arrowLeftButton.onclick = () => {
    if (index_actual_action==0) return;
    clearZones();
    state = buildInitialState()
    index_actual_action = index_actual_action - 1;

    const log = document.querySelector(".log");
        if (log) {
          log.innerHTML = "";
        }

    for (var i = 0; i < index_actual_action; i++) {
        new_action = all_actions[i];
        applyAction(new_action);
        lastSCN = new_action.scn;
    }
    render(state);
  };
}


/************************* CREATE NEW GAME FROM SCN ***********************/
const formDuplicateGame = document.getElementById("duplicate-game");
if (formDuplicateGame) {
  formDuplicateGame.addEventListener("submit", async (e) => {
    e.preventDefault(); // Evita que el formulario recargue la página

    // Recoger los datos del formulario
    const formDataDuplicateGame = new FormData(formDuplicateGame);

    // Convertir a objeto plano
    const payload = {};
    formDataDuplicateGame.forEach((value, key) => {
      payload[key] = value;
    });
    payload["scn"] = lastSCN;

    try {
      // Enviar la petición POST
      const response = await fetch("/create-game-from-checkpoint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",  // enviar como JSON
        },
        body: JSON.stringify(payload),
      });

      if(response.ok){
        alert("Se ha generado la partida, ¡buena suerte!");
      }
    } catch (err) {
      console.error("Error de red:", err);
    }
  });
}


/*********************** SOLO GAME *********************************/


document
  .getElementById("control-side")
  .addEventListener("change", e => {

      controlledSide = e.target.value;
      state.game.pos = controlledSide;
      if (controlledSide=="you"){
        state.game.pos_opponent = "opponent";
      }
      if (controlledSide=="opponent"){
        state.game.pos_opponent = "you";
      }


      render(state);
      UpdateLoreButtonsSituation();
  });