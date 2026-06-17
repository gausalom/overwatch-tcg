
const deck = JSON.parse(document.getElementById("deck_cards").value);

const mulliganBtn = document.getElementById("mulliganBtn");
const handDiv = document.getElementById("hand");

const preHandDiv = document.getElementById("pre-hand");

let currentHand = [];
let previousHand = [];
let remainingDeck = [];
let phase = "start"; // start | mulligan | done

// 🔀 Barajar array
function shuffle(array) {
    return array
        .map(v => ({ v, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .map(o => o.v);
}

// 🎴 Renderizar mano
function renderHand() {
    handDiv.innerHTML = "";

    currentHand.forEach((card, index) => {
        const img = document.createElement("img");
        img.src = `/static/img/card_images/${card}`;
        img.classList.add("card-img-mulligan");
        img.dataset.index = index;

        img.addEventListener("click", () => {
            img.classList.toggle("selected");
        });

        handDiv.appendChild(img);
    });


}

// 🃏 Robar 7 cartas
function drawInitialHand() {
    const shuffled = shuffle([...deck]);
    currentHand = shuffled.slice(0, 7);
    remainingDeck = shuffled.slice(7);
    renderHand();
    console.log(currentHand);
}

// 🔁 Mulligan
function doMulligan() {
    previousHand = currentHand.slice();
    // Prehand
    preHandDiv.innerHTML = "";

    currentHand.forEach((card, index) => {
        const img = document.createElement("img");
        img.src = `/static/img/card_images/${card}`;
        img.classList.add("card-img-mulligan");
        img.classList.add("card-img-pre-mulligan");
        img.dataset.index = index;

        preHandDiv.appendChild(img);
    });

    // Do Mulligan
    const selectedIndexes = [...document.querySelectorAll(".card-img-mulligan.selected")]
        .map(el => Number(el.dataset.index));

    selectedIndexes.forEach(index => {
        if (remainingDeck.length > 0) {
            currentHand[index] = remainingDeck.shift();
        }
    });

    renderHand();



}

// 🔘 Botón principal
mulliganBtn.addEventListener("click", () => {
    if (phase === "start") {
        drawInitialHand();
        mulliganBtn.textContent = "Hacer mulligan";
        phase = "mulligan";

    } else if (phase === "mulligan") {
        doMulligan();
        mulliganBtn.textContent = "Nuevo mulligan";
        phase = "done";

    } else if (phase === "done") {
        currentHand = [];
        remainingDeck = [];
        previousHand = [];
        handDiv.innerHTML = "";
        preHandDiv.innerHTML = "";
        mulliganBtn.textContent = "Robar mano";
        phase = "start";
    }
});



document.getElementById("copyCardsBtn").onclick = async () => {

    const boton = document.getElementById("copyCardsBtn");

    const post = currentHand
        .map(card => `[${card.replace(".webp", "")}]`)
        .join("");

    const pre = previousHand
        .map(card => `[${card.replace(".webp", "")}]`)
        .join("");

    const textToCopy = `Pre-Mulligan\n${pre}\nPost Mulligan\n${post}`;

    try {
        await navigator.clipboard.writeText(textToCopy);

        // ✅ Feedback visual
        boton.textContent = "✅ ¡Copiado!";
        boton.disabled = true;

        setTimeout(() => {
            boton.textContent = "📋 Copiar para la Guía";
            boton.disabled = false;
        }, 1500);

    } catch (err) {
        console.error("Error al copiar:", err);
        alert("No se pudo copiar");
    }
};

