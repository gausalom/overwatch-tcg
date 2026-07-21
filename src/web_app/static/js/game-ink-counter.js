function updateEnergyCounter(playerState, selector) {
  const inkZone = document.querySelector(selector);
  if (!inkZone) return;

  // Contar cartas exerted y no exerted
  const normalCount = playerState.energy;
  const zone = document.querySelector(selector || " .energy")

  for (let i = 0; i< normalCount; i++) {
    const div = document.createElement("div")
    div.className = "card"

    div.classList.add('face-down')
    div.innerText = ''
    div.style.backgroundImage = `url('/static/img/card_images/orb.webp')`
    div.style.backgroundSize = 'cover'
    div.style.backgroundPosition = 'center'

    zone.appendChild(div)
  }
}


function setLocations(location_1, location_2, location_3){
    // Location 1
    const zone = document.querySelector(".location-1")
    const div = document.createElement("div")
    div.className = "card"

    div.classList.add('face-down')
    div.innerText = ''
    div.style.backgroundImage = `url('/static/img/card_images/${location_1}.webp')`
    div.style.backgroundSize = 'cover'
    div.style.backgroundPosition = 'center'

    div.onmouseenter = () => showPreview(location_1, true, 1, state.game.guest)
    div.onmouseleave = () => clearPreview()

    // añadir vista modal
  div.addEventListener("contextmenu", (e) => {
    e.preventDefault(); // evita menú del navegador

    const imgPath = `/static/img/card_images/${location_1}.webp`;

    modalImg.src = imgPath;
    modal.style.display = "flex";
  });

    zone.appendChild(div)

    // Location 2
    const zone2 = document.querySelector(".location-2")
    const div2 = document.createElement("div")
    div2.className = "card"

    div2.classList.add('face-down')
    div2.innerText = ''
    div2.style.backgroundImage = `url('/static/img/card_images/${location_2}.webp')`
    div2.style.backgroundSize = 'cover'
    div2.style.backgroundPosition = 'center'

    div2.onmouseenter = () => showPreview(location_2, true, 1, state.game.guest)
    div2.onmouseleave = () => clearPreview()

    div2.addEventListener("contextmenu", (e) => {
    e.preventDefault(); // evita menú del navegador

    const imgPath = `/static/img/card_images/${location_2}.webp`;

    modalImg.src = imgPath;
    modal.style.display = "flex";
  });

    zone2.appendChild(div2)

    // Location 2
    const zone3 = document.querySelector(".location-3")
    const div3 = document.createElement("div")
    div3.className = "card"

    div3.classList.add('face-down')
    div3.innerText = ''
    div3.style.backgroundImage = `url('/static/img/card_images/${location_3}.webp')`
    div3.style.backgroundSize = 'cover'
    div3.style.backgroundPosition = 'center'

    div3.onmouseenter = () => showPreview(location_3, true, 1, state.game.guest)
    div3.onmouseleave = () => clearPreview()

    div3.addEventListener("contextmenu", (e) => {
    e.preventDefault(); // evita menú del navegador

    const imgPath = `/static/img/card_images/${location_3}.webp`;

    modalImg.src = imgPath;
    modal.style.display = "flex";
  });

    zone3.appendChild(div3)


}
