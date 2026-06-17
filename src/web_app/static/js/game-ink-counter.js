function updateInkCounter(playerState, selector) {
  const inkZone = document.querySelector(selector);
  if (!inkZone) return;

  // Crear el div si no existe
  let counterDiv = inkZone.querySelector('.ink-counter');
  if (!counterDiv) {
    counterDiv = document.createElement('div');
    counterDiv.className = 'ink-counter';
    inkZone.appendChild(counterDiv);
  }

  // Contar cartas exerted y no exerted
  const exertedCount = playerState.ink.filter(c => c[4]).length;
  const normalCount = playerState.ink.length;

  counterDiv.textContent = `${normalCount-exertedCount} / ${normalCount}`;
}
