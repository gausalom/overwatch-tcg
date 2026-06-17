function addLogMessage(text) {
  const log = document.querySelector(".log");
  if (!log) return;

    // Detectar cartas en el texto (formato 3 dígitos-set-num 010-129)
  // Esto convierte "010-129" en un span con data-card-id
    let html = text.replace(/\[([^\]]+)\]/g, (match, p1) => {
      return `<span class="log-user">[${p1}]</span>`;
    });

  // Detectar cartas en el texto (formato 3 dígitos-set-num 010-129)
  // Esto convierte "010-129" en un span con data-card-id
  html = html.replace(/(\d{3}-\d{3})/g, (match) => {
    return `<span class="log-card" data-card-id="${match}">${match}</span>`;
  });

  const div = document.createElement("div");
  div.innerHTML = html;
  log.appendChild(div);

  // Hacer scroll automático al final
  log.scrollTop = log.scrollHeight;

  // Añadir hover para mostrar la carta en la previsualización
  div.querySelectorAll(".log-card").forEach(span => {
    span.addEventListener("mouseenter", () => {
      const cardId = span.dataset.cardId;
      // Aquí usamos tu función de preview
      showPreview(cardId, true, 1, false); // cara arriba, estado normal
    });
    span.addEventListener("mouseleave", () => {
      clearPreview();
    });
  });
}
