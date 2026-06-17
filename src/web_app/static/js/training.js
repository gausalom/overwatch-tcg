const gameData = document.getElementById("game-data");
const deckNumbers = gameData.dataset.cards.split(",");

const IMG_BASE = "{{ url_for('static', filename='img/decks/') }}";
const BACK_IMG = "{{ url_for('static', filename='img/decks/back.webp') }}";

const state = {
    deck: [],
    hand: [],
    discard: [],
    ink: [],
    play: []
};

let draggedCard = null;

function createCard(number) {
    return {
        id: crypto.randomUUID(),
        value: number,
        rotated: false
    };
}

// Inicializar mazo
state.deck = deckNumbers.map(n => createCard(n));

function renderAll() {
    renderZone("deck-area", state.deck, true);
    renderZone("hand-area", state.hand);
    renderZone("discard-area", state.discard);
    renderZone("ink-area", state.ink);
    renderZone("play-area", state.play);
}

function renderZone(zoneId, cards, hideCards = false) {
    const zone = document.querySelector(`#${zoneId} .cards-container`);
    zone.innerHTML = "";

    if (zoneId === "deck-area") {
        if (cards.length > 0) {
            const deckCard = document.createElement("div");
            deckCard.style.backgroundImage = `url('/static/img/card_images/back.webp')`;
            deckCard.className = "card back";
            deckCard.innerHTML= cards.length;

            deckCard.addEventListener("click", (e) => {
                e.stopPropagation();
                const rect = deckCard.getBoundingClientRect();
                openDeckMenu(
                    rect.left-20,
                    rect.top
                );
            });

            zone.appendChild(deckCard);
        }
        return;
    }

    if (zoneId === "discard-area") {

        const counter = document.createElement("div");
        counter.className = "discard-counter";
        counter.textContent = cards.length;

        zone.appendChild(counter);
    }

    cards.forEach(card => {
        const el = document.createElement("div");
        el.className = "card";

        if (card.rotated) {
            el.classList.add("rotated");
        }

        el.style.backgroundImage = `url('/static/img/card_images/${card.value}.webp')`;

        el.draggable = true;

        el.addEventListener("dragstart", () => {
            draggedCard = card;
        });

        el.addEventListener("dragend", () => {
            draggedCard = null;
        });

        el.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            openCardMenu(e.pageX, e.pageY, card, cards);
        });

        el.addEventListener("mouseenter", () => {
            showPreview(card);
        });

        el.addEventListener("mouseleave", () => {
            hidePreview();
        });

        zone.appendChild(el);
    });
}

function moveCard(card, targetArray) {

    // buscar en TODAS las zonas
    const zones = [
        state.hand,
        state.discard,
        state.ink,
        state.play,
        state.deck
    ];

    for (const zone of zones) {

        const index = zone.findIndex(c => c.id === card.id);

        if (index !== -1) {

            const [found] = zone.splice(index, 1);
            targetArray.push(found);

            return true;
        }
    }

    return false;
}

function setupDropZones() {
    const mappings = {
        "hand-area": state.hand,
        "discard-area": state.discard,
        "ink-area": state.ink,
        "play-area": state.play
    };

    Object.entries(mappings).forEach(([zoneId, targetArray]) => {
        const zone = document.getElementById(zoneId);

        zone.addEventListener("dragover", (e) => {
            e.preventDefault();
            zone.classList.add("drop-hover");
        });

        zone.addEventListener("dragleave", () => {
            zone.classList.remove("drop-hover");
        });

        zone.addEventListener("drop", (e) => {

            e.preventDefault();
            zone.classList.remove("drop-hover");

            if (!draggedCard) return;

            const targetMap = {
                "hand-area": state.hand,
                "discard-area": state.discard,
                "ink-area": state.ink,
                "play-area": state.play,
                "deck-area": state.deck
            };

            const targetArray = targetMap[zone.id];
            if (!targetArray) return;

            const ok = moveCard(draggedCard, targetArray);

            draggedCard = null;

            renderAll();

            if (!ok) {
                console.warn("Carta no encontrada al mover:", draggedCard);
            }
        });
    });
}

const menuActions = {
    draw: drawCard,
    shuffle: shuffleDeck,
    peek: peekTopCard
};

function openDeckMenu(x, y) {

    const menu = document.getElementById("context-menu");

    menu.innerHTML = ""; // limpiar

    const items = [
        { label: "Robar", action: "draw" },
        { label: "Barajar", action: "shuffle" },
        { label: "Ver primera carta", action: "peek" }
    ];

    items.forEach(item => {

        const div = document.createElement("div");
        div.className = "menu-item";
        div.textContent = item.label;

        div.addEventListener("click", () => {
            menuActions[item.action]?.();
            hideMenu();
        });

        menu.appendChild(div);
    });

    menu.style.left = x + "px";
    menu.style.top = y + "px";
    menu.style.display = "block";
}

const cardMenuActions = {
    rotate: rotateCard,
    top: moveToTop,
    bottom: moveToBottom
};

function openCardMenu(x, y, card, array) {

    const menu = document.getElementById("context-menu");

    menu.innerHTML = "";

    const items = [
        { label: "Girar", action: "rotate" },
        { label: "Colocar en Top", action: "top" },
        { label: "Colocar en Bottom", action: "bottom" }
    ];

    items.forEach(item => {

        const div = document.createElement("div");
        div.className = "menu-item";
        div.textContent = item.label;

        div.addEventListener("click", () => {

            // IMPORTANTE: pasar contexto de carta
            cardMenuActions[item.action]?.(card.id, array);

            hideMenu();
        });

        menu.appendChild(div);
    });

    menu.style.left = x + "px";
    menu.style.top = y + "px";
    menu.style.display = "block";
}

document.addEventListener("click", () => {
    document.getElementById("context-menu").style.display = "none";
});

function drawCard() {
    if (state.deck.length === 0) return;

    const card = state.deck.shift();
    state.hand.push(card);

    renderAll();
}

function shuffleDeck() {
    for (let i = state.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
    }

    renderAll();
}

function peekTopCard() {
    if (state.deck.length === 0) {
        alert("El mazo está vacío");
        return;
    }

    alert("Primera carta: " + state.deck[0].value);
}

function rotateCard(cardId) {
    const card = findCard(cardId);

    if (card) {
        card.rotated = !card.rotated;
    }

    renderAll();
}

function removeCardFromAllZones(cardId) {

    const zones = [
        state.hand,
        state.discard,
        state.ink,
        state.play,
        state.deck
    ];

    for (const zone of zones) {

        const index = zone.findIndex(c => c.id === cardId);

        if (index !== -1) {
            return zone.splice(index, 1)[0];
        }
    }

    return null;
}

function moveToTop(cardId) {
    const card = removeCardFromAllZones(cardId);
    if (!card) return;

    state.deck.unshift(card);
    renderAll();
}

function moveToBottom(cardId) {
    const card = removeCardFromAllZones(cardId);
    if (!card) return;

    state.deck.push(card);
    renderAll();
}

function moveInsideArray(cardId, toTop) {
    const arrays = [
        state.hand,
        state.discard,
        state.ink,
        state.play
    ];

    arrays.forEach(arr => {
        const index = arr.findIndex(c => c.id === cardId);

        if (index >= 0) {
            const card = arr.splice(index, 1)[0];

            if (toTop) {
                arr.unshift(card);
            } else {
                arr.push(card);
            }
        }
    });

    renderAll();
}

function findCard(cardId) {
    const arrays = [
        state.hand,
        state.discard,
        state.ink,
        state.play,
        state.deck
    ];

    for (const arr of arrays) {
        const card = arr.find(c => c.id === cardId);
        if (card) return card;
    }

    return null;
}

function resetGame() {

    // 1. recoger todas las cartas de todas las zonas
    const allCards = [
        ...state.hand,
        ...state.discard,
        ...state.ink,
        ...state.play,
        ...state.deck
    ];

    // 2. limpiar todas las zonas
    state.hand = [];
    state.discard = [];
    state.ink = [];
    state.play = [];
    state.deck = [];

    // 3. devolver TODO al deck
    state.deck = allCards.map(card => ({
        ...card,
        rotated: false
    }));

    // 4. barajar
    shuffleDeck();

    // 5. forzar render limpio
    renderAll();
}

function draw7() {

    for (let i = 0; i < 7; i++) {

        if (state.deck.length === 0) break;

        const card = state.deck.shift();
        state.hand.push(card);
    }

    renderAll();
}

function goBack() {
    window.history.back();
}

function bindUI() {

    document.getElementById("btn-reset")
        .addEventListener("click", resetGame);

    document.getElementById("btn-draw7")
        .addEventListener("click", draw7);

    document.getElementById("btn-draw")
        .addEventListener("click", drawCard);

    document.getElementById("btn-back").addEventListener("click", goBack);
}

function showPreview(card) {
    const container = document.getElementById("card-preview");

    container.innerHTML = `
        <img src="/static/img/card_images/${card.value}.webp">
    `;
}

function hidePreview() {
    const container = document.getElementById("card-preview");
    container.innerHTML = "";
}

bindUI();

setupDropZones();
shuffleDeck();
renderAll();